"use client";

import { useMemo, useState } from "react";
import type { PlayerRole, PlayerRoleProfile } from "@/lib/types";

const ROLE_ORDER: PlayerRole[] = ["top", "jng", "mid", "bot", "sup"];

const ROLE_LABELS: Record<PlayerRole, string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  bot: "Bot",
  sup: "Support",
};

const ROLE_RANK = new Map<PlayerRole, number>(
  ROLE_ORDER.map((role, index) => [role, index]),
);

type RoleFilter = "all" | PlayerRole;

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "top", label: "Top" },
  { value: "jng", label: "Jungle" },
  { value: "mid", label: "Mid" },
  { value: "bot", label: "Bot" },
  { value: "sup", label: "Support" },
];

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatRecord(wins: number, games: number) {
  return `${wins}-${games - wins}`;
}

function sortByTeamRole(a: PlayerRoleProfile, b: PlayerRoleProfile) {
  if (a.team !== b.team) return a.team.localeCompare(b.team);

  const roleDiff =
    (ROLE_RANK.get(a.position) ?? 0) - (ROLE_RANK.get(b.position) ?? 0);
  if (roleDiff !== 0) return roleDiff;

  return a.player.localeCompare(b.player);
}

export default function PlayersSummaryTable({
  players,
}: {
  players: PlayerRoleProfile[];
}) {
  const [activeRole, setActiveRole] = useState<RoleFilter>("all");

  const visiblePlayers = useMemo(
    () =>
      players
        .filter(
          (player) => activeRole === "all" || player.position === activeRole,
        )
        .sort(sortByTeamRole),
    [players, activeRole],
  );

  return (
    <section>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Players Summary
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Sorted by team, then Top, Jungle, Mid, Bot, Support.
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          {visiblePlayers.length} shown
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 overflow-hidden rounded border border-white/10 bg-surface/60 text-sm sm:grid-cols-3 lg:grid-cols-6">
        {FILTERS.map((filter) => {
          const isActive = activeRole === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveRole(filter.value)}
              className={`border-white/10 px-4 py-3 text-center transition-colors not-last:border-r ${
                isActive
                  ? "bg-red-side font-semibold text-white"
                  : "text-ink hover:bg-white/5"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-ink-muted">
              <th className="py-2 font-normal">Player</th>
              <th className="py-2 font-normal">Team</th>
              <th className="py-2 font-normal">Role</th>
              <th className="py-2 text-right font-normal">Games</th>
              <th className="py-2 text-right font-normal">Record</th>
              <th className="py-2 text-right font-normal">Win%</th>
              <th className="py-2 text-right font-normal">Kills</th>
              <th className="py-2 text-right font-normal">Deaths</th>
              <th className="py-2 text-right font-normal">Assists</th>
              <th className="py-2 text-right font-normal">KDA</th>
              <th className="py-2 text-right font-normal">DPM</th>
              <th className="py-2 text-right font-normal">GD@15</th>
              <th className="py-2 text-right font-normal">FB%</th>
              <th className="py-2 text-right font-normal">FT%</th>
            </tr>
          </thead>
          <tbody className="font-stat tabular-nums">
            {visiblePlayers.map((player) => (
              <tr
                key={`${player.player_id}:${player.position}`}
                className="border-b border-white/5"
              >
                <td className="py-2 font-body">{player.player}</td>
                <td className="py-2 font-body text-ink">{player.team}</td>
                <td className="py-2 font-body text-ink-muted">
                  {ROLE_LABELS[player.position]}
                </td>
                <td className="py-2 text-right">{player.games_played}</td>
                <td className="py-2 text-right text-ink-muted">
                  {formatRecord(player.wins, player.games_played)}
                </td>
                <td className="py-2 text-right text-gold">
                  {formatPct(player.win_rate_pct)}
                </td>
                <td className="py-2 text-right">{player.total_kills}</td>
                <td className="py-2 text-right text-ink-muted">
                  {player.total_deaths}
                </td>
                <td className="py-2 text-right">{player.total_assists}</td>
                <td className="py-2 text-right text-gold">
                  {player.kda.toFixed(2)}
                </td>
                <td className="py-2 text-right text-ink-muted">
                  {player.avg_dpm}
                </td>
                <td className="py-2 text-right text-ink-muted">
                  {player.avg_gd15}
                </td>
                <td className="py-2 text-right text-blue-side">
                  {formatPct(player.first_blood_pct)}
                </td>
                <td className="py-2 text-right text-red-side">
                  {formatPct(player.first_tower_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
