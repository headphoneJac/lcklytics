import SplitSelector from "@/components/SplitSelector";
import TeamLogo from "@/components/images/TeamLogo";
import { teamRowBackgroundStyle } from "@/components/images/row-background";
import TournamentBracket from "@/components/TournamentBracket";
import { getLckEsportsAssets } from "@/lib/esports-assets";
import {
  CUP_GROUPS,
  DEFAULT_SPLIT_KEY,
  ROUNDS_THREE_FOUR_GROUPS,
  getTeamBracketSections,
  getTeamPageSideProfiles,
  getTeamSplitOptions,
} from "@/lib/queries";
import {
  getSplitLabel,
  resolveSplitKey,
  type SplitSearchParams,
} from "@/lib/splits";
import type { TeamSideProfile } from "@/lib/types";
import type { EsportsAssets } from "@/lib/assets";

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatRecord(wins: number, games: number) {
  return `${wins}-${games - wins}`;
}

function pickBest(
  teams: TeamSideProfile[],
  key:
    | "win_rate_pct"
    | "blue_win_rate_pct"
    | "red_win_rate_pct"
    | "first_pick_win_rate_pct"
    | "second_pick_win_rate_pct",
  volumeKey:
    | "games_played"
    | "blue_games_played"
    | "red_games_played"
    | "first_pick_games_played"
    | "second_pick_games_played",
) {
  return [...teams].sort((a, b) => {
    if (b[key] !== a[key]) return b[key] - a[key];
    return b[volumeKey] - a[volumeKey];
  })[0];
}

function SideMeter({
  label,
  wins,
  games,
  rate,
  colorClass,
}: {
  label: string;
  wins: number;
  games: number;
  rate: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="font-stat tabular-nums text-ink">
          {formatRecord(wins, games)} / {formatPct(rate)}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function SideRead({ team }: { team: TeamSideProfile }) {
  if (team.side_delta_pct === null || team.side_delta_pct === 0) {
    return <span className="text-ink-muted">Even side profile</span>;
  }

  const favoredSide = team.side_delta_pct > 0 ? "Blue" : "Red";
  return (
    <span
      className={favoredSide === "Blue" ? "text-blue-side" : "text-red-side"}
    >
      {favoredSide} +{Math.abs(team.side_delta_pct).toFixed(1)} pp
    </span>
  );
}

function LeaderStat({
  label,
  team,
  value,
  detail,
  assets,
  colorClass,
}: {
  label: string;
  team?: TeamSideProfile;
  value: string;
  detail: string;
  assets?: EsportsAssets;
  colorClass?: string;
}) {
  return (
    <div
      className="asset-bg-leader-card border-r border-white/10 py-4 pl-1 pr-1"
      style={team ? teamRowBackgroundStyle(team.team, assets) : undefined}
    >
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <TeamLogo
          team={team?.team ?? "TBD"}
          assets={assets}
          className="size-9 rounded"
        />
        <p className="min-w-0 truncate font-display text-2xl font-bold tracking-tight text-ink">
          {team?.team ?? "TBD"}
        </p>
      </div>
      <p className={`mt-1 font-stat text-sm tabular-nums ${colorClass}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
    </div>
  );
}

function TeamCard({
  team,
  index,
  assets,
}: {
  team: TeamSideProfile;
  index: number;
  assets?: EsportsAssets;
}) {
  return (
    <article
      key={team.team}
      className="rounded-lg border border-white/10 bg-surface/60 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TeamLogo
            team={team.team}
            assets={assets}
            className="size-11 rounded"
          />
          <div className="min-w-0">
            <p className="font-stat text-xs text-ink-muted">#{index + 1}</p>
            <h2 className="mt-1 truncate font-display text-lg font-bold tracking-tight text-ink">
              {team.team}
            </h2>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-stat text-sm tabular-nums text-gold">
            {team.match_wins}-{team.match_losses}
          </p>
          <p className="text-xs text-ink-muted">match record</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/5 py-3 text-xs">
        <div>
          <p className="font-stat tabular-nums text-ink">{team.games_played}</p>
          <p className="text-xs text-ink-muted">games</p>
        </div>
        <div>
          <p className="font-stat tabular-nums text-ink">
            {team.game_wins}-{team.game_losses}
          </p>
          <p className="text-xs text-ink-muted">game record</p>
        </div>
        <div>
          <p className="font-stat tabular-nums text-gold">
            {formatPct(team.win_rate_pct)}
          </p>
          <p className="text-xs text-ink-muted">win rate</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <SideMeter
          label="Blue side"
          wins={team.blue_wins}
          games={team.blue_games_played}
          rate={team.blue_win_rate_pct}
          colorClass="bg-blue-side"
        />
        <SideMeter
          label="Red side"
          wins={team.red_wins}
          games={team.red_games_played}
          rate={team.red_win_rate_pct}
          colorClass="bg-red-side"
        />
        <SideMeter
          label="First pick"
          wins={team.first_pick_wins}
          games={team.first_pick_games_played}
          rate={team.first_pick_win_rate_pct}
          colorClass="bg-gold"
        />
        <SideMeter
          label="Second pick"
          wins={team.second_pick_wins}
          games={team.second_pick_games_played}
          rate={team.second_pick_win_rate_pct}
          colorClass="bg-silver"
        />
      </div>

      <p className="mt-4 border-t border-white/5 pt-3 text-sm">
        <SideRead team={team} />
      </p>
    </article>
  );
}

function getTeamCardGroups(splitKey: string, teams: TeamSideProfile[]) {
  const groupDefinitions =
    splitKey === "Cup"
      ? CUP_GROUPS
      : splitKey === "Rounds 3-4"
        ? ROUNDS_THREE_FOUR_GROUPS
        : null;

  if (!groupDefinitions) {
    return [{ name: null, teams }];
  }

  const teamsByName = new Map(teams.map((team) => [team.team, team]));

  return groupDefinitions.map((group) => ({
    name: group.name,
    teams: group.teams
      .map((groupTeam) => {
        return (
          teamsByName.get(groupTeam.label) ?? teamsByName.get(groupTeam.dbName)
        );
      })
      .filter((team): team is TeamSideProfile => Boolean(team)),
  }));
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const requestedSplitKey = await resolveSplitKey(searchParams);
  const splits = getTeamSplitOptions();
  const splitKey = splits.some((split) => split.split_key === requestedSplitKey)
    ? requestedSplitKey
    : DEFAULT_SPLIT_KEY;
  const [teams, bracketSections, esportsAssets] = await Promise.all([
    getTeamPageSideProfiles(splitKey),
    getTeamBracketSections(splitKey),
    getLckEsportsAssets(),
  ]);
  const currentSplit = getSplitLabel(splits, splitKey);
  const bestOverall = pickBest(teams, "win_rate_pct", "games_played");
  const bestBlue = pickBest(teams, "blue_win_rate_pct", "blue_games_played");
  const bestRed = pickBest(teams, "red_win_rate_pct", "red_games_played");
  const bestFirstPick = pickBest(
    teams,
    "first_pick_win_rate_pct",
    "first_pick_games_played",
  );
  const bestSecondPick = pickBest(
    teams,
    "second_pick_win_rate_pct",
    "second_pick_games_played",
  );
  const teamCardGroups = getTeamCardGroups(splitKey, teams);

  return (
    <div className="flex flex-col gap-10">
      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/teams"
      />

      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-sm text-ink-muted">Teams</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">
            LCK Team Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Regular-season standings with side selection and pick-order win
            rates for every team.
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-5">
        <LeaderStat
          label="Best overall"
          team={bestOverall}
          assets={esportsAssets}
          value={bestOverall ? formatPct(bestOverall.win_rate_pct) : "0.0%"}
          detail={
            bestOverall
              ? `${bestOverall.game_wins}-${bestOverall.game_losses} game record`
              : "No games found"
          }
          colorClass="text-green"
        />
        <LeaderStat
          label="Best blue side"
          team={bestBlue}
          assets={esportsAssets}
          value={bestBlue ? formatPct(bestBlue.blue_win_rate_pct) : "0.0%"}
          detail={
            bestBlue
              ? formatRecord(bestBlue.blue_wins, bestBlue.blue_games_played)
              : "No blue-side games found"
          }
          colorClass="text-blue-side"
        />
        <LeaderStat
          label="Best red side"
          team={bestRed}
          assets={esportsAssets}
          value={bestRed ? formatPct(bestRed.red_win_rate_pct) : "0.0%"}
          detail={
            bestRed
              ? formatRecord(bestRed.red_wins, bestRed.red_games_played)
              : "No red-side games found"
          }
          colorClass="text-red-side"
        />
        <LeaderStat
          label="Best first pick"
          team={bestFirstPick}
          assets={esportsAssets}
          value={
            bestFirstPick
              ? formatPct(bestFirstPick.first_pick_win_rate_pct)
              : "0.0%"
          }
          detail={
            bestFirstPick
              ? formatRecord(
                  bestFirstPick.first_pick_wins,
                  bestFirstPick.first_pick_games_played,
                )
              : "No first-pick games found"
          }
          colorClass="text-gold"
        />
        <LeaderStat
          label="Best second pick"
          team={bestSecondPick}
          assets={esportsAssets}
          value={
            bestSecondPick
              ? formatPct(bestSecondPick.second_pick_win_rate_pct)
              : "0.0%"
          }
          detail={
            bestSecondPick
              ? formatRecord(
                  bestSecondPick.second_pick_wins,
                  bestSecondPick.second_pick_games_played,
                )
              : "No second-pick games found"
          }
          colorClass="text-silver"
        />
      </section>

      <section className="flex flex-col gap-8">
        {teamCardGroups.map((group) => (
          <div key={group.name ?? "all"} className="flex flex-col gap-3">
            {group.name ? (
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                  {group.name}
                </h2>
                <p className="font-stat text-xs text-ink-muted">
                  {group.teams.length} teams
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {group.teams.map((team, index) => (
                <TeamCard
                  key={team.team}
                  team={team}
                  index={index}
                  assets={esportsAssets}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {bracketSections.length > 0 ? (
        <section className="flex flex-col gap-6">
          {bracketSections.map((section) => (
            <TournamentBracket
              key={section.title}
              title={section.title}
              matches={section.matches}
              emptyText={section.emptyText}
              assets={esportsAssets}
            />
          ))}
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Teams Summary Table
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-ink-muted">
                <th className="py-2 font-normal">Team</th>
                <th className="py-2 text-right font-normal">Match</th>
                <th className="py-2 text-right font-normal">Game</th>
                <th className="py-2 text-right font-normal">Win Rate</th>
                <th className="py-2 text-right font-normal">Blue Side WR</th>
                <th className="py-2 text-right font-normal">Red Side WR</th>
                <th className="py-2 text-right font-normal">1st Pick WR</th>
                <th className="py-2 text-right font-normal">2nd Pick WR</th>
                <th className="py-2 text-right font-normal">Side Read</th>
              </tr>
            </thead>
            <tbody className="font-stat tabular-nums">
              {teams.map((team, index) => (
                <tr key={team.team} className="border-b border-white/5">
                  <td
                    className="asset-bg-name-cell py-2 font-body"
                    style={teamRowBackgroundStyle(team.team, esportsAssets)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-ink-muted">{index + 1}</span>
                      <span>{team.team}</span>
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {team.match_wins}-{team.match_losses}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {team.game_wins}-{team.game_losses}
                  </td>
                  <td className="py-2 text-right text-green">
                    {formatPct(team.win_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-blue-side">
                    {formatPct(team.blue_win_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-red-side">
                    {formatPct(team.red_win_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-gold">
                    {formatPct(team.first_pick_win_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-silver">
                    {formatPct(team.second_pick_win_rate_pct)}
                  </td>
                  <td className="py-2 text-right">
                    <SideRead team={team} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
