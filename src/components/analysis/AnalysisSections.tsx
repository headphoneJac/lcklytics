import {
  championRowBackgroundStyle,
  teamRowBackgroundStyle,
} from "@/components/images/row-background";
import type { EsportsAssets } from "@/lib/assets";
import type {
  ChampionProfile,
  PlayerRole,
  PlayerRoleProfile,
  TeamSideProfile,
} from "@/lib/types";
import type { AggregateWinRate } from "@/lib/analysis";
import {
  formatDelta,
  formatMatchRecord,
  formatPct,
  ROLE_LABELS,
} from "@/components/analysis/format";

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-stat text-sm text-ink-muted">{eyebrow}</p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">{description}</p>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  detail,
  accentClass = "text-gold",
}: {
  label: string;
  value: string;
  detail: string;
  accentClass?: string;
}) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <p className={`mt-2 font-stat text-2xl tabular-nums ${accentClass}`}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">{detail}</p>
    </div>
  );
}

function impactRead(primary: AggregateWinRate, secondary: AggregateWinRate) {
  const delta = primary.rate - secondary.rate;

  if (primary.games === 0 && secondary.games === 0) {
    return "No games found for this scope.";
  }

  if (delta === 0) {
    return "No win-rate edge in the loaded games.";
  }

  const leader = delta > 0 ? primary : secondary;

  return `${leader.label} is ahead by ${formatDelta(Math.abs(delta))}.`;
}

function WinShareComparisonBar({
  primary,
  secondary,
}: {
  primary: AggregateWinRate;
  secondary: AggregateWinRate;
}) {
  const totalWins = primary.wins + secondary.wins;
  const primaryShare = totalWins > 0 ? (primary.wins / totalWins) * 100 : 50;
  const secondaryShare =
    totalWins > 0 ? (secondary.wins / totalWins) * 100 : 50;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 text-xs">
        <div>
          <p className="text-ink-muted">{primary.label}</p>
          <p className={`mt-1 font-stat tabular-nums ${primary.textClass}`}>
            {primary.wins} wins / {formatPct(primary.rate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-ink-muted">{secondary.label}</p>
          <p className={`mt-1 font-stat tabular-nums ${secondary.textClass}`}>
            {secondary.wins} wins / {formatPct(secondary.rate)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full ${primary.barClass}`}
          style={{ width: `${primaryShare}%` }}
          title={`${primary.label}: ${primary.wins} wins`}
        />
        <div
          className={`h-full ${secondary.barClass}`}
          style={{ width: `${secondaryShare}%` }}
          title={`${secondary.label}: ${secondary.wins} wins`}
        />
      </div>
    </div>
  );
}

export function AggregateImpactCard({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: AggregateWinRate;
  secondary: AggregateWinRate;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-surface/40 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
        </div>
        <p className="shrink-0 font-stat text-sm tabular-nums text-gold">
          {impactRead(primary, secondary)}
        </p>
      </div>
      <div className="mt-4">
        <WinShareComparisonBar primary={primary} secondary={secondary} />
      </div>
    </article>
  );
}

function TeamIdentity({ team }: { team?: TeamSideProfile }) {
  if (!team || team.side_delta_pct === null || team.side_delta_pct === 0) {
    return <span className="text-ink-muted">Balanced profile</span>;
  }

  const side = team.side_delta_pct > 0 ? "Blue" : "Red";

  return (
    <span className={side === "Blue" ? "text-blue-side" : "text-red-side"}>
      {side} side {formatDelta(Math.abs(team.side_delta_pct))}
    </span>
  );
}

function PickOrderIdentity({ team }: { team?: TeamSideProfile }) {
  if (!team) {
    return <span className="text-ink-muted">No pick-order sample</span>;
  }

  const delta = team.first_pick_win_rate_pct - team.second_pick_win_rate_pct;

  if (delta === 0) {
    return <span className="text-ink-muted">Even pick order</span>;
  }

  const favoredOrder = delta > 0 ? "First pick" : "Second pick";

  return (
    <span className={delta > 0 ? "text-gold" : "text-silver"}>
      {favoredOrder} {formatDelta(Math.abs(delta))}
    </span>
  );
}

export function TeamFormPickOrderTable({
  teams,
  assets,
}: {
  teams: TeamSideProfile[];
  assets?: EsportsAssets;
}) {
  return (
    <div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-ink-muted">
              <th></th>
              <th className="py-2 font-normal">Team</th>
              <th className="py-2 text-right font-normal">Match Record</th>
              <th className="py-2 text-right font-normal">Game Record</th>
              <th className="py-2 text-right font-normal">Game WR</th>
              <th className="py-2 text-right font-normal">Blue</th>
              <th className="py-2 text-right font-normal">Red</th>
              <th className="py-2 text-right font-normal">First Pick</th>
              <th className="py-2 text-right font-normal">Second Pick</th>
              <th className="py-2 text-right font-normal">Side Read</th>
              <th className="py-2 text-right font-normal">Pick Read</th>
            </tr>
          </thead>
          <tbody className="font-stat tabular-nums">
            {teams.map((team, index) => (
              <tr key={team.team} className="border-b border-white/5">
                <td className="w-5 text-ink-muted">{index + 1}</td>
                <td
                  className="asset-bg-name-cell py-2 font-body"
                  style={teamRowBackgroundStyle(team.team, assets)}
                >
                  <span className="flex items-center gap-2">{team.team}</span>
                </td>
                <td className="py-2 text-right text-gold">
                  {formatMatchRecord(team)}
                </td>
                <td className="py-2 text-right">
                  {team.game_wins}-{team.game_losses}
                </td>
                <td className="py-2 text-right text-ink-muted">
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
                  <TeamIdentity team={team} />
                </td>
                <td className="py-2 text-right">
                  <PickOrderIdentity team={team} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RolePlayerBoards({
  roleGroups,
  assets,
}: {
  roleGroups: { role: PlayerRole; players: PlayerRoleProfile[] }[];
  assets?: EsportsAssets;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {roleGroups.map(({ role, players }) => (
        <article
          key={role}
          className="rounded-lg border border-white/10 bg-surface/40 p-4"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">
              {ROLE_LABELS[role]}
            </h3>
          </div>

          {players.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              No qualified players in this role for the selected scope.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] table-fixed text-sm">
                <colgroup>
                  <col className="w-5" />
                  <col className="w-[4.5rem]" />
                  <col className="w-[13rem]" />
                  <col className="w-14" />
                  <col className="w-12" />
                  <col className="w-12" />
                  <col className="w-16" />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/10 text-left text-ink-muted">
                    <th></th>
                    <th className="py-2 font-normal">Player</th>
                    <th className="py-2 font-normal">Team</th>
                    <th className="py-2 text-right font-normal">Games</th>
                    <th className="py-2 text-right font-normal">KDA</th>
                    <th className="py-2 text-right font-normal">DPM</th>
                    <th className="py-2 text-right font-normal">GD@15</th>
                  </tr>
                </thead>
                <tbody className="font-stat tabular-nums">
                  {players.map((player, index) => (
                    <tr
                      key={`${player.player_id}-${player.position}`}
                      className="border-b border-white/5"
                    >
                      <td className="w-5 text-ink-muted">{index + 1}</td>
                      <td className="py-2 font-body">
                        <span className="block truncate">{player.player}</span>
                      </td>
                      <td
                        className="asset-bg-name-cell py-2 font-body"
                        style={teamRowBackgroundStyle(player.team, assets)}
                      >
                        <span className="block truncate">{player.team}</span>
                      </td>
                      <td className="py-2 text-right">{player.games_played}</td>
                      <td className="py-2 text-right text-gold">
                        {player.kda.toFixed(2)}
                      </td>
                      <td className="py-2 text-right text-ink-muted">
                        {player.avg_dpm}
                      </td>
                      <td className="py-2 text-right text-ink-muted">
                        {player.avg_gd15.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export function ChampionPressureTable({
  champions,
}: {
  champions: ChampionProfile[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-ink-muted">
            <th></th>
            <th className="py-2 font-normal">Champion</th>
            <th className="py-2 font-normal">Roles</th>
            <th className="py-2 text-right font-normal">Presence</th>
            <th className="py-2 text-right font-normal">Pick%</th>
            <th className="py-2 text-right font-normal">Ban%</th>
            <th className="py-2 text-right font-normal">Win%</th>
            <th className="py-2 text-right font-normal">DPM</th>
          </tr>
        </thead>
        <tbody className="font-stat tabular-nums">
          {champions.map((champion, index) => (
            <tr key={champion.champion} className="border-b border-white/5">
              <td className="w-5 text-ink-muted">{index + 1}</td>
              <td
                className="asset-bg-name-cell py-2 font-body"
                style={championRowBackgroundStyle(champion.champion)}
              >
                <span className="flex items-center gap-2">
                  {champion.champion}
                </span>
              </td>
              <td className="py-2 font-body text-ink-muted">
                {champion.roles}
              </td>
              <td className="py-2 text-right text-gold">
                {champion.presence} / {formatPct(champion.presence_rate_pct)}
              </td>
              <td className="py-2 text-right text-blue-side">
                {formatPct(champion.pick_rate_pct)}
              </td>
              <td className="py-2 text-right text-red-side">
                {formatPct(champion.ban_rate_pct)}
              </td>
              <td className="py-2 text-right text-ink-muted">
                {champion.picks > 0 ? formatPct(champion.win_rate_pct) : "-"}
              </td>
              <td className="py-2 text-right text-ink-muted">
                {champion.picks > 0 ? champion.avg_dpm : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
