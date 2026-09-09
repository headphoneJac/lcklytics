import type { TeamStanding, PomLeader, ChampionRate } from "@/lib/types";

export function StandingsTable({ standings }: { standings: TeamStanding[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Standings{" "}
        <span className="text-sm font-normal text-ink-muted">
          · Regular Season
        </span>
      </h2>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-ink-muted">
            <th className="py-2 font-normal">Team</th>
            <th className="py-2 text-right font-normal">Match</th>
            <th className="py-2 text-right font-normal">GP</th>
            <th className="py-2 text-right font-normal">Game</th>
            <th className="py-2 text-right font-normal">Win%</th>
          </tr>
        </thead>
        <tbody className="font-stat tabular-nums">
          {standings.map((team, i) => (
            <tr key={team.team} className="border-b border-white/5">
              <td className="py-2 font-body">
                <span className="mr-2 text-ink-muted">{i + 1}</span>
                {team.team}
              </td>
              <td className="py-2 text-right">
                {team.match_wins}-{team.match_losses}
              </td>
              <td className="py-2 text-right text-ink-muted">
                {team.games_played}
              </td>
              <td className="py-2 text-right text-ink-muted">
                {team.game_wins}-{team.game_losses}
              </td>
              <td className="py-2 text-right text-gold">
                {team.win_rate_pct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PomLeaderboard({ leaders }: { leaders: PomLeader[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Player of the Match Points
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Our own composite score — kills, assists, damage share, vision, and win
        bonus, summed across the season. Not an official Riot/OE stat.
      </p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-ink-muted">
            <th className="py-2 font-normal">Player</th>
            <th className="py-2 font-normal">Team</th>
            <th className="py-2 text-right font-normal">POM Pts</th>
          </tr>
        </thead>
        <tbody className="font-stat tabular-nums">
          {leaders.map((p) => (
            <tr key={p.player} className="border-b border-white/5">
              <td className="py-2 font-body">
                <span className="mr-2 text-ink-muted">{p.rnk}</span>
                {p.player}
              </td>
              <td className="py-2 font-body text-ink-muted">{p.team ?? "—"}</td>
              <td className="py-2 text-right text-gold">{p.pom_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChampionRateTable({
  title,
  champions,
  rateKey,
  accentClass = "text-gold",
}: {
  title: string;
  champions: ChampionRate[];
  rateKey: "pick_rate_pct" | "ban_rate_pct";
  accentClass?: string;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-ink-muted">
            <th className="py-2 font-normal">Champion</th>
            <th className="py-2 text-right font-normal">Rate</th>
          </tr>
        </thead>
        <tbody className="font-stat tabular-nums">
          {champions.map((c, i) => (
            <tr key={c.champion} className="border-b border-white/5">
              <td className="py-2 font-body">
                <span className="mr-2 text-ink-muted">{i + 1}</span>
                {c.champion}
              </td>
              <td className={`py-2 text-right ${accentClass}`}>
                {c[rateKey]}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
