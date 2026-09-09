import PlayerRadar from "@/components/players/PlayerRadar";
import PlayersSummaryTable from "@/components/players/PlayersSummaryTable";
import SplitSelector from "@/components/SplitSelector";
import { getPlayerRoleProfiles, getSplitOptions } from "@/lib/queries";
import { getSplitLabel, resolveSplitKey, type SplitSearchParams } from "@/lib/splits";
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

const MIN_LEADERBOARD_GAMES = 30;

function sortByTeamRole(a: PlayerRoleProfile, b: PlayerRoleProfile) {
  if (a.team !== b.team) return a.team.localeCompare(b.team);

  const roleDiff =
    (ROLE_RANK.get(a.position) ?? 0) - (ROLE_RANK.get(b.position) ?? 0);
  if (roleDiff !== 0) return roleDiff;

  return a.player.localeCompare(b.player);
}

function radarScore(player: PlayerRoleProfile) {
  if (player.radar.length === 0) return 0;

  const total = player.radar.reduce((sum, metric) => sum + metric.value, 0);
  return total / player.radar.length;
}

function groupByRole(players: PlayerRoleProfile[]) {
  return ROLE_ORDER.map((role) => ({
    role,
    players: players
      .filter((player) => player.position === role)
      .sort((a, b) => {
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
      }),
  }));
}

function pickLeader(
  players: PlayerRoleProfile[],
  key:
    | "kda"
    | "first_blood_pct"
    | "avg_dpm"
    | "avg_cspm"
    | "avg_vision_score",
) {
  return [...players].sort((a, b) => {
    if (b[key] !== a[key]) return b[key] - a[key];
    return b.games_played - a.games_played;
  })[0];
}

function LeaderStat({
  label,
  player,
  value,
  detail,
}: {
  label: string;
  player?: PlayerRoleProfile;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
        {player?.player ?? "TBD"}
      </p>
      <p className="mt-1 font-stat text-sm tabular-nums text-gold">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
    </div>
  );
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

export default async function PlayersPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const splitKey = await resolveSplitKey(searchParams);
  const [splits, players] = await Promise.all([
    getSplitOptions(),
    getPlayerRoleProfiles(splitKey),
  ]);
  const currentSplit = getSplitLabel(splits, splitKey);
  const leaderboardPlayers = players.filter(
    (player) => player.games_played >= MIN_LEADERBOARD_GAMES,
  );
  const sortedPlayers = [...players].sort(sortByTeamRole);
  const roleGroups = groupByRole(players);
  const kdaLeader = pickLeader(leaderboardPlayers, "kda");
  const firstBloodLeader = pickLeader(leaderboardPlayers, "first_blood_pct");
  const damageLeader = pickLeader(leaderboardPlayers, "avg_dpm");
  const csLeader = pickLeader(leaderboardPlayers, "avg_cspm");
  const visionLeader = pickLeader(leaderboardPlayers, "avg_vision_score");

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-sm text-ink-muted">Players</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">
            LCK Player Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Player form with role-specific radar charts and team-sorted
            split-aware summaries.
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </section>

      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/players"
      />

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
        <LeaderStat
          label="KDA leader"
          player={kdaLeader}
          value={kdaLeader ? kdaLeader.kda.toFixed(2) : "0.00"}
          detail={
            kdaLeader
              ? `${kdaLeader.team} / ${ROLE_LABELS[kdaLeader.position]}`
            : "No players found"
          }
        />
        <LeaderStat
          label="First blood leader"
          player={firstBloodLeader}
          value={
            firstBloodLeader
              ? `${firstBloodLeader.first_blood_pct.toFixed(1)}%`
              : "0.0%"
          }
          detail={
            firstBloodLeader
              ? `${firstBloodLeader.team} / ${ROLE_LABELS[firstBloodLeader.position]}`
              : "No players found"
          }
        />
        <LeaderStat
          label="DPM leader"
          player={damageLeader}
          value={damageLeader ? String(damageLeader.avg_dpm) : "0"}
          detail={
            damageLeader
              ? `${damageLeader.team} / ${ROLE_LABELS[damageLeader.position]}`
            : "No players found"
          }
        />
        <LeaderStat
          label="Highest CS/min"
          player={csLeader}
          value={csLeader ? csLeader.avg_cspm.toFixed(1) : "0.0"}
          detail={
            csLeader
              ? `${csLeader.team} / ${ROLE_LABELS[csLeader.position]}`
              : "No players found"
          }
        />
        <LeaderStat
          label="Vision leader"
          player={visionLeader}
          value={visionLeader ? visionLeader.avg_vision_score.toFixed(1) : "0.0"}
          detail={
            visionLeader
              ? `${visionLeader.team} / ${ROLE_LABELS[visionLeader.position]}`
              : "No players found"
          }
        />
      </section>

      <p className="-mt-6 font-stat text-xs text-ink-muted">
        Leaderboards require {MIN_LEADERBOARD_GAMES}+ games played.
      </p>

      <section>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Role Radar Cards
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Scores are role-local percentiles, so each radar compares players
              against others in the same position.
            </p>
          </div>
          <p className="font-stat text-xs text-ink-muted">
            {sortedPlayers.length} players
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-8">
          {roleGroups.map(({ role, players: rolePlayers }) => (
            <div key={role}>
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
                <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
                  {ROLE_LABELS[role]}
                </h3>
                <p className="font-stat text-xs text-ink-muted">
                  {rolePlayers.length} players
                </p>
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

      <PlayersSummaryTable players={players} />
    </div>
  );
}
