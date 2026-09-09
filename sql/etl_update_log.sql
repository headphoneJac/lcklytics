-- Update log for the Oracle's Elixir -> Supabase updater.
-- Run this once in Supabase before scheduling scripts/update_oracles_elixir.py.

create table if not exists etl_update_log (
  id bigserial primary key,
  source text not null default 'oracles_elixir',
  source_url text,
  source_file text,
  file_sha256 text not null,
  latest_game_id text,
  rows_downloaded integer,
  rows_lck integer,
  games_upserted integer,
  teams_upserted integer,
  players_upserted integer,
  game_team_stats_upserted integer,
  game_player_stats_upserted integer,
  draft_actions_upserted integer,
  game_player_timeline_upserted integer,
  status text not null,
  message text,
  updated_at timestamptz not null default now()
);

create index if not exists etl_update_log_source_updated_at_idx
  on etl_update_log (source, updated_at desc);

create index if not exists etl_update_log_file_sha256_idx
  on etl_update_log (file_sha256);
