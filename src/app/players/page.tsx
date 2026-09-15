import PlayersRadarCards from "@/components/players/PlayersRadarCards";
import PlayersSummaryTable from "@/components/players/PlayersSummaryTable";
import SplitSelector from "@/components/SplitSelector";
import TeamLogo from "@/components/images/TeamLogo";
import { playerRowBackgroundStyle } from "@/components/images/row-background";
import { getLckEsportsAssets } from "@/lib/esports-assets";
import {
  DEFAULT_SPLIT_KEY,
  TEAMS_CUP_POSTSEASON_SPLIT_KEY,
  TEAMS_ROAD_TO_MSI_SPLIT_KEY,
  TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
  getPlayerRoleProfiles,
  getTeamSplitOptions,
} from "@/lib/queries";
import {
  getSplitLabel,
  resolveSplitKey,
  type SplitSearchParams,
} from "@/lib/splits";
import type { PlayerRole, PlayerRoleProfile } from "@/lib/types";
import type { EsportsAssets } from "@/lib/assets";

const ROLE_LABELS: Record<PlayerRole, string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  bot: "Bot",
  sup: "Support",
};

const DEFAULT_MIN_LEADERBOARD_GAMES = 10;

const NO_MINIMUM_LEADERBOARD_SPLITS = new Set([
  "Cup",
  TEAMS_CUP_POSTSEASON_SPLIT_KEY,
  TEAMS_ROAD_TO_MSI_SPLIT_KEY,
  TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
]);

function getMinimumLeaderboardGames(splitKey: string) {
  return NO_MINIMUM_LEADERBOARD_SPLITS.has(splitKey)
    ? 0
    : DEFAULT_MIN_LEADERBOARD_GAMES;
}

function pickLeader(
  players: PlayerRoleProfile[],
  key: "kda" | "first_blood_pct" | "avg_dpm" | "avg_cspm" | "avg_vision_score",
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
  assets,
}: {
  label: string;
  player?: PlayerRoleProfile;
  value: string;
  detail: string;
  assets?: EsportsAssets;
}) {
  return (
    <div
      className="asset-bg-leader-card border-r border-white/10 py-4 pl-1 pr-1"
      style={
        player
          ? playerRowBackgroundStyle(player.player, player.team, assets)
          : undefined
      }
    >
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <div className="mt-2">
        <p className="min-w-0 truncate font-display text-2xl font-bold tracking-tight text-ink">
          {player?.player ?? "TBD"}
        </p>
      </div>
      <p className="mt-1 font-stat text-sm tabular-nums text-gold">{value}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs">
        {player ? (
          <TeamLogo
            team={player.team}
            assets={assets}
            className="size-5 rounded-sm"
          />
        ) : null}
        <span>{detail}</span>
      </p>
    </div>
  );
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const requestedSplitKey = await resolveSplitKey(searchParams);
  const splits = getTeamSplitOptions();
  const splitKey = splits.some((split) => split.split_key === requestedSplitKey)
    ? requestedSplitKey
    : DEFAULT_SPLIT_KEY;
  const [players, esportsAssets] = await Promise.all([
    getPlayerRoleProfiles(splitKey),
    getLckEsportsAssets(),
  ]);
  const currentSplit = getSplitLabel(splits, splitKey);
  const minimumLeaderboardGames = getMinimumLeaderboardGames(splitKey);
  const leaderboardPlayers = players.filter(
    (player) => player.games_played >= minimumLeaderboardGames,
  );
  const kdaLeader = pickLeader(leaderboardPlayers, "kda");
  const firstBloodLeader = pickLeader(leaderboardPlayers, "first_blood_pct");
  const damageLeader = pickLeader(leaderboardPlayers, "avg_dpm");
  const csLeader = pickLeader(leaderboardPlayers, "avg_cspm");
  const visionLeader = pickLeader(leaderboardPlayers, "avg_vision_score");

  return (
    <div className="flex flex-col gap-10">
      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/players"
      />

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

      <section className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-5">
        <LeaderStat
          label="KDA leader"
          player={kdaLeader}
          assets={esportsAssets}
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
          assets={esportsAssets}
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
          assets={esportsAssets}
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
          assets={esportsAssets}
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
          assets={esportsAssets}
          value={
            visionLeader ? visionLeader.avg_vision_score.toFixed(1) : "0.0"
          }
          detail={
            visionLeader
              ? `${visionLeader.team} / ${ROLE_LABELS[visionLeader.position]}`
              : "No players found"
          }
        />
      </section>

      <p className="-mt-6 font-stat text-xs text-ink-muted">
        {minimumLeaderboardGames > 0
          ? `Leaderboards require ${minimumLeaderboardGames}+ games played.`
          : "Leaderboards include all players in this scope."}
      </p>

      <PlayersRadarCards players={players} assets={esportsAssets} />

      <PlayersSummaryTable players={players} assets={esportsAssets} />
    </div>
  );
}
