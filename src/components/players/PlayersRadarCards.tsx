"use client";

import { useMemo, useState } from "react";
import type { PlayerRole, PlayerRoleProfile } from "@/lib/types";
import PlayerRadar from "@/components/players/PlayerRadar";

const ROLE_ORDER: PlayerRole[] = ["top", "jng", "mid", "bot", "sup"];

const ROLE_LABELS: Record<PlayerRole, string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  bot: "Bot",
  sup: "Support",
};

type RoleFilter = "all" | PlayerRole;

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "top", label: "Top" },
  { value: "jng", label: "Jungle" },
  { value: "mid", label: "Mid" },
  { value: "bot", label: "Bot" },
  { value: "sup", label: "Support" },
];

function radarScore(player: PlayerRoleProfile) {
  if (player.radar.length === 0) return 0;

  const total = player.radar.reduce((sum, metric) => sum + metric.value, 0);
  return total / player.radar.length;
}

function sortByRadarScore(a: PlayerRoleProfile, b: PlayerRoleProfile) {
  const scoreDiff = radarScore(b) - radarScore(a);
  if (scoreDiff !== 0) return scoreDiff;

  if (b.win_rate_pct !== a.win_rate_pct) {
    return b.win_rate_pct - a.win_rate_pct;
  }

  if (b.games_played !== a.games_played) {
    return b.games_played - a.games_played;
  }

  if (a.team !== b.team) return a.team.localeCompare(b.team);
  return a.player.localeCompare(b.player);
}

function groupByRole(players: PlayerRoleProfile[], activeRole: RoleFilter) {
  return ROLE_ORDER.filter(
    (role) => activeRole === "all" || activeRole === role,
  )
    .map((role) => ({
      role,
      players: players
        .filter((player) => player.position === role)
        .sort(sortByRadarScore),
    }))
    .filter(({ players: rolePlayers }) => rolePlayers.length > 0);
}

function RadarCard({ player }: { player: PlayerRoleProfile }) {
  const score = radarScore(player);

  return (
    <article className="rounded-lg border border-white/10 bg-surface/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-stat text-[11px] text-ink-muted">
            {player.team}
          </p>
          <h3 className="truncate font-display text-lg font-bold tracking-tight text-ink">
            {player.player}
          </h3>
          <p className="font-stat text-[11px] text-ink-muted">
            {ROLE_LABELS[player.position]}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-stat text-xs tabular-nums text-gold">
            {score.toFixed(0)}
          </p>
          <p className="font-stat text-[10px] tabular-nums text-ink-muted">
            score
          </p>
        </div>
      </div>

      <PlayerRadar data={player.radar} className="mt-1 h-36" />
    </article>
  );
}

export default function PlayersRadarCards({
  players,
}: {
  players: PlayerRoleProfile[];
}) {
  const [activeRole, setActiveRole] = useState<RoleFilter>("all");
  const roleGroups = useMemo(
    () => groupByRole(players, activeRole),
    [players, activeRole],
  );

  return (
    <section>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Role Radar Cards
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Scores are role-local percentiles, so each radar compares players
          against others in the same position.
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

      <div className="mt-5 flex flex-col gap-8">
        {roleGroups.map(({ role, players: rolePlayers }) => (
          <div key={role}>
            <div className="border-b border-white/10 pb-2">
              <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
                {ROLE_LABELS[role]}
              </h3>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {rolePlayers.map((player) => (
                <RadarCard
                  key={`${player.player_id}:${player.position}`}
                  player={player}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
