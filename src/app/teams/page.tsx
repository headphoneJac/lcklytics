import SplitSelector from "@/components/SplitSelector";
import { getSplitOptions, getTeamSideProfiles } from "@/lib/queries";
import { getSplitLabel, resolveSplitKey, type SplitSearchParams } from "@/lib/splits";
import type { TeamSideProfile } from "@/lib/types";

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatRecord(wins: number, games: number) {
  return `${wins}-${games - wins}`;
}

function pickBest(
  teams: TeamSideProfile[],
  key: "win_rate_pct" | "blue_win_rate_pct" | "red_win_rate_pct",
  volumeKey: "games_played" | "blue_games_played" | "red_games_played",
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
    <span className={favoredSide === "Blue" ? "text-blue-side" : "text-red-side"}>
      {favoredSide} +{Math.abs(team.side_delta_pct).toFixed(1)} pp
    </span>
  );
}

function LeaderStat({
  label,
  team,
  value,
  detail,
  colorClass = "text-gold",
}: {
  label: string;
  team?: TeamSideProfile;
  value: string;
  detail: string;
  colorClass?: string;
}) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
        {team?.team ?? "TBD"}
      </p>
      <p className={`mt-1 font-stat text-sm tabular-nums ${colorClass}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
    </div>
  );
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const splitKey = await resolveSplitKey(searchParams);
  const [splits, teams] = await Promise.all([
    getSplitOptions(),
    getTeamSideProfiles(splitKey),
  ]);
  const currentSplit = getSplitLabel(splits, splitKey);
  const bestOverall = pickBest(teams, "win_rate_pct", "games_played");
  const bestBlue = pickBest(teams, "blue_win_rate_pct", "blue_games_played");
  const bestRed = pickBest(teams, "red_win_rate_pct", "red_games_played");

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-sm text-ink-muted">Teams</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">
            LCK Team Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Regular-season standings with blue side, red side, and combined
            side win rates for every team.
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </section>

      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/teams"
      />

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <LeaderStat
          label="Best overall"
          team={bestOverall}
          value={bestOverall ? formatPct(bestOverall.win_rate_pct) : "0.0%"}
          detail={
            bestOverall
              ? `${bestOverall.game_wins}-${bestOverall.game_losses} game record`
              : "No games found"
          }
        />
        <LeaderStat
          label="Best blue side"
          team={bestBlue}
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
          value={bestRed ? formatPct(bestRed.red_win_rate_pct) : "0.0%"}
          detail={
            bestRed
              ? formatRecord(bestRed.red_wins, bestRed.red_games_played)
              : "No red-side games found"
          }
          colorClass="text-red-side"
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {teams.map((team, index) => (
          <article
            key={team.team}
            className="rounded-lg border border-white/10 bg-surface/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-stat text-xs text-ink-muted">#{index + 1}</p>
                <h2 className="mt-1 truncate font-display text-lg font-bold tracking-tight text-ink">
                  {team.team}
                </h2>
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
                <p className="font-stat tabular-nums text-ink">
                  {team.games_played}
                </p>
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
                <p className="text-xs text-ink-muted">both sides</p>
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
                label="Both sides"
                wins={team.game_wins}
                games={team.games_played}
                rate={team.win_rate_pct}
                colorClass="bg-gold"
              />
            </div>

            <p className="mt-4 text-sm">
              <SideRead team={team} />
            </p>
          </article>
        ))}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Side Win Rate Table
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-ink-muted">
                <th className="py-2 font-normal">Team</th>
                <th className="py-2 text-right font-normal">Match</th>
                <th className="py-2 text-right font-normal">Game</th>
                <th className="py-2 text-right font-normal">Blue WR</th>
                <th className="py-2 text-right font-normal">Red WR</th>
                <th className="py-2 text-right font-normal">Both WR</th>
                <th className="py-2 text-right font-normal">Side Read</th>
              </tr>
            </thead>
            <tbody className="font-stat tabular-nums">
              {teams.map((team, index) => (
                <tr key={team.team} className="border-b border-white/5">
                  <td className="py-2 font-body">
                    <span className="mr-2 text-ink-muted">{index + 1}</span>
                    {team.team}
                  </td>
                  <td className="py-2 text-right">
                    {team.match_wins}-{team.match_losses}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {team.game_wins}-{team.game_losses}
                  </td>
                  <td className="py-2 text-right text-blue-side">
                    {formatPct(team.blue_win_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-red-side">
                    {formatPct(team.red_win_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-gold">
                    {formatPct(team.win_rate_pct)}
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
