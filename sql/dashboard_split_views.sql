-- ============================================================
-- Split-aware dashboard views for lcklytics
--
-- Run this in Supabase before wiring the frontend split selector.
-- These views keep the app on domestic LCK data and expose both:
--   1. one row per actual split
--   2. one "__all__" scope combining every included split
--
-- Important: this script updates dashboard views only. It does not
-- alter base tables or reload Oracle's Elixir data.
-- ============================================================

drop view if exists dashboard_player_champion_matchups_by_split;
drop view if exists dashboard_champion_stats_by_split;
drop view if exists dashboard_player_stats_by_split;
drop view if exists dashboard_team_standings_by_split;
drop view if exists dashboard_team_side_win_rates_by_split;
drop view if exists dashboard_game_scopes;
drop view if exists dashboard_split_options;
drop view if exists dashboard_lck_games;

-- Domestic LCK game scope. International events should be excluded by
-- league = 'LCK'. If future ETL loads international stages with league
-- still set to LCK, add their split/event labels to this predicate.
create view dashboard_lck_games as
select *
from games
where league = 'LCK'
  and split is not null
  and split <> '';

create view dashboard_split_options as
select
  '__all__'::text as split_key,
  'All Splits'::text as split_label,
  null::text as source_split,
  0::integer as sort_order,
  count(*)::integer as games_played,
  min(game_date) as first_game_date,
  max(game_date) as last_game_date
from dashboard_lck_games
union all
select
  split as split_key,
  split as split_label,
  split as source_split,
  dense_rank() over (order by min(game_date), split)::integer as sort_order,
  count(*)::integer as games_played,
  min(game_date) as first_game_date,
  max(game_date) as last_game_date
from dashboard_lck_games
group by split;

create view dashboard_game_scopes as
select
  '__all__'::text as split_key,
  'All Splits'::text as split_label,
  g.game_id,
  g.split as source_split,
  g.game_date,
  g.game_number,
  g.playoffs
from dashboard_lck_games g
union all
select
  g.split as split_key,
  g.split as split_label,
  g.game_id,
  g.split as source_split,
  g.game_date,
  g.game_number,
  g.playoffs
from dashboard_lck_games g;

create view dashboard_team_side_win_rates_by_split as
select
  gs.split_key,
  gs.split_label,
  t.name as team,
  gts.side,
  count(*)::integer as games_played,
  count(*) filter (where gts.result)::integer as wins,
  round(100.0 * count(*) filter (where gts.result) / nullif(count(*), 0), 1) as win_rate_pct
from dashboard_game_scopes gs
join game_team_stats gts on gts.game_id = gs.game_id
join teams t on t.team_id = gts.team_id
group by gs.split_key, gs.split_label, t.name, gts.side;

create view dashboard_team_standings_by_split as
with games_in_scope as (
  select distinct
    gs.split_key,
    gs.split_label,
    gs.game_id,
    gs.game_number,
    gs.game_date,
    least(gts1.team_id, gts2.team_id) || '_' || greatest(gts1.team_id, gts2.team_id) as pairing_key
  from dashboard_game_scopes gs
  join game_team_stats gts1 on gts1.game_id = gs.game_id
  join game_team_stats gts2 on gts2.game_id = gs.game_id and gts2.team_id <> gts1.team_id
),
series_tagged as (
  select
    *,
    sum(case when coalesce(game_number, 1) = 1 then 1 else 0 end)
      over (
        partition by split_key, pairing_key
        order by game_date, game_id
        rows between unbounded preceding and current row
      ) as series_number
  from games_in_scope
),
series_results as (
  select
    st.split_key,
    st.split_label,
    st.pairing_key,
    st.series_number,
    gts.team_id,
    count(*) filter (where gts.result)::integer as games_won
  from series_tagged st
  join game_team_stats gts on gts.game_id = st.game_id
  group by st.split_key, st.split_label, st.pairing_key, st.series_number, gts.team_id
),
series_winners as (
  select split_key, pairing_key, series_number, team_id as winner_team_id
  from (
    select
      split_key,
      pairing_key,
      series_number,
      team_id,
      games_won,
      row_number() over (
        partition by split_key, pairing_key, series_number
        order by games_won desc, team_id
      ) as rn
    from series_results
  ) ranked
  where rn = 1
),
match_records as (
  select
    sr.split_key,
    sr.split_label,
    sr.team_id,
    count(*)::integer as matches_played,
    count(*) filter (where sw.winner_team_id = sr.team_id)::integer as match_wins,
    (count(*) - count(*) filter (where sw.winner_team_id = sr.team_id))::integer as match_losses
  from series_results sr
  join series_winners sw
    on sw.split_key = sr.split_key
   and sw.pairing_key = sr.pairing_key
   and sw.series_number = sr.series_number
  group by sr.split_key, sr.split_label, sr.team_id
),
game_records as (
  select
    gs.split_key,
    gs.split_label,
    gts.team_id,
    count(*)::integer as games_played,
    count(*) filter (where gts.result)::integer as game_wins,
    (count(*) - count(*) filter (where gts.result))::integer as game_losses,
    round(100.0 * count(*) filter (where gts.result) / nullif(count(*), 0), 1) as win_rate_pct
  from dashboard_game_scopes gs
  join game_team_stats gts on gts.game_id = gs.game_id
  group by gs.split_key, gs.split_label, gts.team_id
)
select
  gr.split_key,
  gr.split_label,
  t.name as team,
  m.matches_played,
  m.match_wins,
  m.match_losses,
  gr.games_played,
  gr.game_wins,
  gr.game_losses,
  gr.win_rate_pct
from game_records gr
join match_records m on m.split_key = gr.split_key and m.team_id = gr.team_id
join teams t on t.team_id = gr.team_id;

create view dashboard_player_stats_by_split as
with timeline_15 as (
  select
    game_id,
    player_id,
    gold_diff,
    xp_diff,
    cs_diff
  from game_player_timeline
  where minute = 15
)
select
  gs.split_key,
  gs.split_label,
  gps.player_id,
  p.name as player,
  string_agg(distinct t.name, ' / ' order by t.name) as team,
  gps.position,
  count(*)::integer as games_played,
  count(*) filter (where gps.result)::integer as wins,
  round(100.0 * count(*) filter (where gps.result) / nullif(count(*), 0), 1) as win_rate_pct,
  coalesce(sum(gps.kills), 0)::integer as total_kills,
  coalesce(sum(gps.deaths), 0)::integer as total_deaths,
  coalesce(sum(gps.assists), 0)::integer as total_assists,
  round(avg(gps.kills), 1) as avg_kills,
  round(avg(gps.deaths), 1) as avg_deaths,
  round(avg(gps.assists), 1) as avg_assists,
  round((coalesce(sum(gps.kills), 0) + coalesce(sum(gps.assists), 0)) / nullif(coalesce(sum(gps.deaths), 0), 0)::numeric, 2) as kda,
  round(100.0 * (coalesce(sum(gps.kills), 0) + coalesce(sum(gps.assists), 0)) / nullif(coalesce(sum(gts.team_kills), 0), 0), 1) as avg_kill_participation_pct,
  round(avg(gps.dpm)) as avg_dpm,
  round(sum(gps.earned_gold) / nullif(sum(g.game_length_seconds) / 60.0, 0), 1) as avg_gold_per_min,
  round(100.0 * avg(gps.damage_share), 1) as avg_damage_share,
  round(avg(gps.vision_score), 1) as avg_vision_score,
  round(avg(gps.wards_placed), 1) as avg_wards_placed,
  round(avg(gps.wards_killed), 1) as avg_wards_killed,
  round(avg(gps.control_wards_bought), 1) as avg_control_wards_bought,
  round(avg(gps.cspm), 1) as avg_cspm,
  round(avg(tl.gold_diff)) as avg_gd15,
  round(avg(tl.xp_diff)) as avg_xpd15,
  round(avg(tl.cs_diff), 1) as avg_csd15,
  round(100.0 * count(*) filter (where gts.first_blood) / nullif(count(*), 0), 1) as first_blood_pct,
  round(100.0 * count(*) filter (where gts.first_tower) / nullif(count(*), 0), 1) as first_tower_pct
from dashboard_game_scopes gs
join games g on g.game_id = gs.game_id
join game_player_stats gps on gps.game_id = gs.game_id
join players p on p.player_id = gps.player_id
join teams t on t.team_id = gps.team_id
left join game_team_stats gts on gts.game_id = gps.game_id and gts.team_id = gps.team_id
left join timeline_15 tl on tl.game_id = gps.game_id and tl.player_id = gps.player_id
where gps.position in ('top', 'jng', 'mid', 'bot', 'sup')
group by gs.split_key, gs.split_label, gps.player_id, p.name, gps.position;

create view dashboard_champion_stats_by_split as
with total_games as (
  select split_key, count(*)::integer as games_played
  from dashboard_game_scopes
  group by split_key
),
picks as (
  select
    gs.split_key,
    gs.split_label,
    gps.champion,
    count(*)::integer as picks,
    count(*) filter (where gps.result)::integer as wins,
    coalesce(sum(gps.kills), 0)::integer as total_kills,
    coalesce(sum(gps.deaths), 0)::integer as total_deaths,
    coalesce(sum(gps.assists), 0)::integer as total_assists,
    round((coalesce(sum(gps.kills), 0) + coalesce(sum(gps.assists), 0)) / nullif(coalesce(sum(gps.deaths), 0), 0)::numeric, 2) as kda,
    round(avg(gps.dpm)) as avg_dpm,
    round(100.0 * avg(gps.damage_share), 1) as avg_damage_share,
    round(avg(gps.cspm), 1) as avg_cspm,
    string_agg(distinct gps.position, ' / ' order by gps.position) filter (where gps.position is not null) as roles
  from dashboard_game_scopes gs
  join game_player_stats gps on gps.game_id = gs.game_id
  where gps.champion is not null
  group by gs.split_key, gs.split_label, gps.champion
),
bans as (
  select
    gs.split_key,
    gs.split_label,
    da.champion,
    count(*)::integer as bans
  from dashboard_game_scopes gs
  join draft_actions da on da.game_id = gs.game_id
  where da.action_type = 'ban'
    and da.champion is not null
  group by gs.split_key, gs.split_label, da.champion
),
champions as (
  select split_key, split_label, champion from picks
  union
  select split_key, split_label, champion from bans
)
select
  c.split_key,
  c.split_label,
  c.champion,
  coalesce(p.picks, 0) as picks,
  coalesce(b.bans, 0) as bans,
  coalesce(p.picks, 0) + coalesce(b.bans, 0) as presence,
  round(100.0 * coalesce(p.picks, 0) / nullif(tg.games_played, 0), 1) as pick_rate_pct,
  round(100.0 * coalesce(b.bans, 0) / nullif(tg.games_played, 0), 1) as ban_rate_pct,
  round(100.0 * (coalesce(p.picks, 0) + coalesce(b.bans, 0)) / nullif(tg.games_played, 0), 1) as presence_rate_pct,
  coalesce(p.wins, 0) as wins,
  round(100.0 * coalesce(p.wins, 0) / nullif(p.picks, 0), 1) as win_rate_pct,
  coalesce(p.total_kills, 0) as total_kills,
  coalesce(p.total_deaths, 0) as total_deaths,
  coalesce(p.total_assists, 0) as total_assists,
  p.kda,
  coalesce(p.avg_dpm, 0) as avg_dpm,
  coalesce(p.avg_damage_share, 0) as avg_damage_share,
  coalesce(p.avg_cspm, 0) as avg_cspm,
  coalesce(p.roles, 'Not picked') as roles
from champions c
join total_games tg on tg.split_key = c.split_key
left join picks p on p.split_key = c.split_key and p.champion = c.champion
left join bans b on b.split_key = c.split_key and b.champion = c.champion;

create view dashboard_player_champion_matchups_by_split as
with timeline_15 as (
  select
    game_id,
    player_id,
    gold_diff,
    xp_diff,
    cs_diff
  from game_player_timeline
  where minute = 15
)
select
  gs.split_key,
  gs.split_label,
  gps.player_id,
  p.name as player,
  string_agg(distinct t.name, ' / ' order by t.name) as team,
  gps.position,
  gps.champion,
  count(*)::integer as games_played,
  count(*) filter (where gps.result)::integer as wins,
  round(100.0 * count(*) filter (where gps.result) / nullif(count(*), 0), 1) as win_rate_pct,
  coalesce(sum(gps.kills), 0)::integer as total_kills,
  coalesce(sum(gps.deaths), 0)::integer as total_deaths,
  coalesce(sum(gps.assists), 0)::integer as total_assists,
  round(avg(gps.kills), 1) as avg_kills,
  round(avg(gps.deaths), 1) as avg_deaths,
  round(avg(gps.assists), 1) as avg_assists,
  round((coalesce(sum(gps.kills), 0) + coalesce(sum(gps.assists), 0)) / nullif(coalesce(sum(gps.deaths), 0), 0)::numeric, 2) as kda,
  round(avg(gps.dpm)) as avg_dpm,
  round(100.0 * avg(gps.damage_share), 1) as avg_damage_share,
  round(avg(gps.cspm), 1) as avg_cspm,
  round(avg(gps.vision_score), 1) as avg_vision_score,
  round(avg(tl.gold_diff)) as avg_gd15,
  round(avg(tl.xp_diff)) as avg_xpd15,
  round(avg(tl.cs_diff), 1) as avg_csd15,
  round(100.0 * count(*) filter (where gts.first_blood) / nullif(count(*), 0), 1) as first_blood_pct,
  round(100.0 * count(*) filter (where gts.first_tower) / nullif(count(*), 0), 1) as first_tower_pct,
  jsonb_agg(
    jsonb_build_object(
      'game_id', gps.game_id,
      'team_id', gps.team_id,
      'result', gps.result
    )
    order by gs.game_date, gps.game_id
  ) as games
from dashboard_game_scopes gs
join game_player_stats gps on gps.game_id = gs.game_id
join players p on p.player_id = gps.player_id
join teams t on t.team_id = gps.team_id
left join game_team_stats gts on gts.game_id = gps.game_id and gts.team_id = gps.team_id
left join timeline_15 tl on tl.game_id = gps.game_id and tl.player_id = gps.player_id
where gps.champion is not null
  and gps.position in ('top', 'jng', 'mid', 'bot', 'sup')
group by gs.split_key, gs.split_label, gps.player_id, p.name, gps.position, gps.champion;
