import SplitSelector from "@/components/SplitSelector";
import TeamProgressChart from "@/components/analysis/TeamProgressChart";
import ChampionIcon from "@/components/images/ChampionIcon";
import TeamLogo from "@/components/images/TeamLogo";
import {
  championRowBackgroundStyle,
  playerRowBackgroundStyle,
  teamRowBackgroundStyle,
} from "@/components/images/row-background";
import { getLckEsportsAssets } from "@/lib/esports-assets";
import {
  DEFAULT_SPLIT_KEY,
  TEAMS_CUP_POSTSEASON_SPLIT_KEY,
  TEAMS_ROAD_TO_MSI_SPLIT_KEY,
  TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
  getChampionProfiles,
  getPlayerRoleProfiles,
  getTeamPageSideProfiles,
  getTeamProgression,
  getTeamSplitOptions,
} from "@/lib/queries";
import {
  getSplitLabel,
  resolveSplitKey,
  type SplitSearchParams,
} from "@/lib/splits";
import type { EsportsAssets } from "@/lib/assets";
import type {
  ChampionProfile,
  PlayerRole,
  PlayerRoleProfile,
  TeamSideProfile,
} from "@/lib/types";

const ROLE_LABELS: Record<PlayerRole, string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  bot: "Bot",
  sup: "Support",
};

const ROLE_ORDER: PlayerRole[] = ["top", "jng", "mid", "bot", "sup"];
const DEFAULT_MIN_LEADERBOARD_GAMES = 10;
const COMPACT_MIN_LEADERBOARD_GAMES = 5;
const HIDE_PLACEMENT_CHART_SPLITS = new Set([
  TEAMS_CUP_POSTSEASON_SPLIT_KEY,
  TEAMS_ROAD_TO_MSI_SPLIT_KEY,
  TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
]);

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatRecord(wins: number, games: number) {
  return `${wins}-${games - wins}`;
}

function winRate(wins: number, games: number) {
  return games > 0 ? (wins / games) * 100 : 0;
}

function formatMatchRecord(team: TeamSideProfile) {
  return `${team.match_wins}-${team.match_losses}`;
}

function formatDelta(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pp`;
}

function topBy<T>(items: T[], getValue: (item: T) => number, limit = 5) {
  return [...items].sort((a, b) => getValue(b) - getValue(a)).slice(0, limit);
}

function pickLeader<T>(
  items: T[],
  getValue: (item: T) => number,
  getVolume: (item: T) => number,
) {
  return [...items].sort((a, b) => {
    const valueDelta = getValue(b) - getValue(a);
    if (valueDelta !== 0) return valueDelta;
    return getVolume(b) - getVolume(a);
  })[0];
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function SectionHeader({
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

function StatTile({
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

function PlayerInsightMeta({
  player,
  assets,
}: {
  player?: PlayerRoleProfile;
  assets?: EsportsAssets;
}) {
  if (!player) return <span>No qualified player found</span>;

  return (
    <span className="flex items-center gap-2">
      <TeamLogo
        team={player.team}
        assets={assets}
        className="size-5 rounded-sm"
      />
      <span>
        {player.team} / {ROLE_LABELS[player.position]}
      </span>
    </span>
  );
}

function NewspaperInsights({
  currentSplit,
  teamInsight,
  playerInsight,
  championInsight,
  assets,
}: {
  currentSplit: string;
  teamInsight: {
    title: string;
    body: string;
    metric: string;
    team?: TeamSideProfile;
  };
  playerInsight: {
    title: string;
    body: string;
    metric: string;
    player?: PlayerRoleProfile;
  };
  championInsight: {
    title: string;
    body: string;
    metric: string;
    champion?: ChampionProfile;
  };
  assets?: EsportsAssets;
}) {
  const team = teamInsight.team;
  const player = playerInsight.player;
  const champion = championInsight.champion;

  return (
    <section className="border-y border-white/15 py-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-xs uppercase tracking-[0.22em] text-ink-muted">
            Insight Snapshot
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-ink md:text-5xl">
            What The Numbers Are Saying
          </h2>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <article className="relative isolate overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-14 z-0 opacity-[0.07]"
          >
            <TeamLogo
              team={team?.team ?? "TBD"}
              assets={assets}
              className="size-80 rounded"
              sizes="320px"
              loading="eager"
            />
          </div>
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div>
              <p className="font-stat text-xs uppercase tracking-[0.2em] text-gold">
                Team Signal
              </p>
              <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
                {teamInsight.title}
              </h3>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-ink">
                {teamInsight.body}
              </p>
            </div>
            <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-center gap-4 lg:justify-end">
                <div className="lg:text-right">
                  <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                    Win Rate
                  </p>
                  <p className="mt-1 font-stat text-5xl tabular-nums text-gold">
                    {teamInsight.metric}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-xs text-ink-muted lg:text-right">
                <TeamInsightMeta team={team} />
              </div>
            </div>
          </div>
        </article>

        <article
          className="asset-bg-snapshot-player relative isolate overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6"
          style={
            player
              ? playerRowBackgroundStyle(player.player, player.team, assets)
              : undefined
          }
        >
          <div className="relative z-10 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-center">
            <div className="flex min-h-36 flex-col justify-center border-b border-white/10 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
              <div className="min-w-0">
                <p className="font-stat text-xs uppercase tracking-[0.2em] text-green">
                  Player Form
                </p>
                <p className="mt-2 truncate font-display text-3xl font-bold text-ink">
                  {player?.player ?? "TBD"}
                </p>
                <div className="mt-2 text-xs text-ink-muted">
                  <PlayerInsightMeta player={player} assets={assets} />
                </div>
              </div>
              <div className="mt-5">
                <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                  KDA
                </p>
                <p className="mt-1 font-stat text-5xl tabular-nums text-green">
                  {playerInsight.metric}
                </p>
              </div>
            </div>
            <div>
              <p className="font-stat text-xs uppercase tracking-[0.2em] text-ink-muted">
                Featured Read
              </p>
              <h3 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
                {playerInsight.title}
              </h3>
              <p className="mt-5 max-w-4xl text-sm leading-7 text-ink-muted">
                {playerInsight.body}
              </p>
            </div>
          </div>
        </article>

        <article className="relative isolate overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-10 z-0 opacity-[0.08]"
          >
            <ChampionIcon
              champion={champion?.champion ?? "Aatrox"}
              className="size-80 rounded"
              sizes="320px"
            />
          </div>
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div>
              <p className="font-stat text-xs uppercase tracking-[0.2em] text-red-side">
                Draft Pressure
              </p>
              <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
                {championInsight.title}
              </h3>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-ink">
                {championInsight.body}
              </p>
            </div>
            <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-center gap-4 lg:justify-end">
                <div className="lg:text-right">
                  <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                    Presence
                  </p>
                  <p className="mt-1 font-stat text-5xl tabular-nums text-red-side">
                    {championInsight.metric}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-xs text-ink-muted lg:text-right">
                <ChampionInsightMeta champion={champion} />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function TeamInsightMeta({ team }: { team?: TeamSideProfile }) {
  if (!team) return <span>No team sample found</span>;

  return (
    <span>
      {team.match_wins}-{team.match_losses} match record / {team.game_wins}-
      {team.game_losses} game record
    </span>
  );
}

function ChampionInsightMeta({ champion }: { champion?: ChampionProfile }) {
  if (!champion) return <span>No champion sample found</span>;

  return (
    <span>
      {champion.presence} presence / {champion.picks} picks / {champion.bans}{" "}
      bans
    </span>
  );
}

type AggregateWinRate = {
  label: string;
  wins: number;
  games: number;
  rate: number;
  textClass: string;
  barClass: string;
};

function aggregateSidePickImpact(teams: TeamSideProfile[]) {
  const blueGames = teams.reduce(
    (sum, team) => sum + team.blue_games_played,
    0,
  );
  const blueWins = teams.reduce((sum, team) => sum + team.blue_wins, 0);
  const redGames = teams.reduce((sum, team) => sum + team.red_games_played, 0);
  const redWins = teams.reduce((sum, team) => sum + team.red_wins, 0);
  const firstPickGames = teams.reduce(
    (sum, team) => sum + team.first_pick_games_played,
    0,
  );
  const firstPickWins = teams.reduce(
    (sum, team) => sum + team.first_pick_wins,
    0,
  );
  const secondPickGames = teams.reduce(
    (sum, team) => sum + team.second_pick_games_played,
    0,
  );
  const secondPickWins = teams.reduce(
    (sum, team) => sum + team.second_pick_wins,
    0,
  );

  return {
    blue: {
      label: "Blue side",
      wins: blueWins,
      games: blueGames,
      rate: winRate(blueWins, blueGames),
      textClass: "text-blue-side",
      barClass: "bg-blue-side",
    },
    red: {
      label: "Red side",
      wins: redWins,
      games: redGames,
      rate: winRate(redWins, redGames),
      textClass: "text-red-side",
      barClass: "bg-red-side",
    },
    firstPick: {
      label: "First pick",
      wins: firstPickWins,
      games: firstPickGames,
      rate: winRate(firstPickWins, firstPickGames),
      textClass: "text-gold",
      barClass: "bg-gold",
    },
    secondPick: {
      label: "Second pick",
      wins: secondPickWins,
      games: secondPickGames,
      rate: winRate(secondPickWins, secondPickGames),
      textClass: "text-silver",
      barClass: "bg-silver",
    },
  };
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

function WinRateBar({ profile }: { profile: AggregateWinRate }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-ink-muted">{profile.label}</span>
        <span className={`font-stat tabular-nums ${profile.textClass}`}>
          {formatRecord(profile.wins, profile.games)} /{" "}
          {formatPct(profile.rate)}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${profile.barClass}`}
          style={{ width: `${Math.min(Math.max(profile.rate, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function AggregateImpactCard({
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
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <WinRateBar profile={primary} />
        <WinRateBar profile={secondary} />
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

function sortTeamsByMatchRecord(teams: TeamSideProfile[]) {
  return [...teams].sort((a, b) => {
    if (b.match_wins !== a.match_wins) return b.match_wins - a.match_wins;
    if (a.match_losses !== b.match_losses)
      return a.match_losses - b.match_losses;

    const gameDiffA = a.game_wins - a.game_losses;
    const gameDiffB = b.game_wins - b.game_losses;
    if (gameDiffB !== gameDiffA) return gameDiffB - gameDiffA;
    if (b.game_wins !== a.game_wins) return b.game_wins - a.game_wins;
    if (a.game_losses !== b.game_losses) return a.game_losses - b.game_losses;

    return a.team.localeCompare(b.team);
  });
}

function TeamFormPickOrderTable({
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

function RolePlayerBoards({
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
              <table className="w-full min-w-[500px] text-sm">
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
                        <span className="flex items-center gap-2">
                          {player.player}
                        </span>
                      </td>
                      <td
                        className="asset-bg-name-cell py-2 font-body"
                        style={teamRowBackgroundStyle(player.team, assets)}
                      >
                        <span className="flex items-center gap-2">
                          <TeamLogo
                            team={player.team}
                            assets={assets}
                            className="size-5 rounded-sm"
                          />
                          <span>{player.team}</span>
                        </span>
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

function ChampionPressureTable({
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

function buildTeamInsight(teams: TeamSideProfile[]) {
  const leader = pickLeader(
    teams,
    (team) => team.win_rate_pct,
    (team) => team.games_played,
  );
  const sideSpecialist = [...teams]
    .filter((team) => team.side_delta_pct !== null)
    .sort(
      (a, b) =>
        Math.abs(b.side_delta_pct ?? 0) - Math.abs(a.side_delta_pct ?? 0),
    )[0];

  if (!leader) {
    return {
      title: "No team sample yet",
      body: "Team records will appear here once games are loaded for this scope.",
      metric: "0 games",
      team: undefined,
    };
  }

  const sideRead =
    sideSpecialist?.side_delta_pct && sideSpecialist.side_delta_pct !== 0
      ? `${sideSpecialist.team} has the sharpest side split at ${formatDelta(
          Math.abs(sideSpecialist.side_delta_pct),
        )}.`
      : "Side performance is relatively even across the loaded teams.";

  return {
    title: `${leader.team} sets the team baseline`,
    body: `${leader.team} leads this scope at ${formatPct(
      leader.win_rate_pct,
    )} across ${leader.games_played} games. ${sideRead}`,
    metric: formatPct(leader.win_rate_pct),
    team: leader,
  };
}

function buildPlayerInsight(
  players: PlayerRoleProfile[],
  minimumGames: number,
) {
  const qualified = players.filter(
    (player) => player.games_played >= minimumGames,
  );
  const kdaLeader = pickLeader(
    qualified,
    (player) => player.kda,
    (player) => player.games_played,
  );
  const laneLeader = pickLeader(
    qualified,
    (player) => player.avg_gd15,
    (player) => player.games_played,
  );

  if (!kdaLeader) {
    return {
      title: "No qualified player sample yet",
      body: "Player notes will appear when enough games are loaded for this scope.",
      metric: `${minimumGames}+ games`,
      player: undefined,
    };
  }

  const laneRead = laneLeader
    ? `${laneLeader.player} has the best early gold profile at ${laneLeader.avg_gd15.toFixed(
        0,
      )} GD@15.`
    : "Early-game leader data is still settling.";

  return {
    title: `${kdaLeader.player} anchors the player board`,
    body: `${kdaLeader.player} leads qualified players with a ${kdaLeader.kda.toFixed(
      2,
    )} KDA over ${kdaLeader.games_played} games. ${laneRead}`,
    metric: kdaLeader.kda.toFixed(2),
    player: kdaLeader,
  };
}

function buildChampionInsight(champions: ChampionProfile[]) {
  const priorityLeader = pickLeader(
    champions,
    (champion) => champion.presence_rate_pct,
    (champion) => champion.presence,
  );
  const pickedChampions = champions.filter((champion) => champion.picks > 0);
  const avgPresence = average(
    champions.slice(0, 10).map((champion) => champion.presence_rate_pct),
  );

  if (!priorityLeader) {
    return {
      title: "No champion sample yet",
      body: "Draft notes will appear here once pick and ban data is available.",
      metric: "0 picks",
      champion: undefined,
    };
  }

  return {
    title: `${priorityLeader.champion} is the draft pressure point`,
    body: `${priorityLeader.champion} leads the pool at ${formatPct(
      priorityLeader.presence_rate_pct,
    )} presence. The top ten champions average ${formatPct(
      avgPresence,
    )} presence, with ${pickedChampions.length} champions actually picked.`,
    metric: formatPct(priorityLeader.presence_rate_pct),
    champion: priorityLeader,
  };
}

function playerScore(player: PlayerRoleProfile) {
  const laneScore = player.avg_gd15 / 25;
  const damageScore = player.avg_dpm / 15;
  const safetyScore = player.kda * 8;
  const visionScore =
    player.position === "sup"
      ? player.avg_vision_score * 1.1
      : player.avg_vision_score * 0.45;

  return safetyScore + damageScore + laneScore + visionScore;
}

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const requestedSplitKey = await resolveSplitKey(searchParams);
  const splits = getTeamSplitOptions();
  const splitKey = splits.some((split) => split.split_key === requestedSplitKey)
    ? requestedSplitKey
    : DEFAULT_SPLIT_KEY;
  const [teams, players, champions, teamProgression, esportsAssets] =
    await Promise.all([
      getTeamPageSideProfiles(splitKey),
      getPlayerRoleProfiles(splitKey),
      getChampionProfiles(splitKey),
      getTeamProgression(splitKey),
      getLckEsportsAssets(),
    ]);
  const currentSplit = getSplitLabel(splits, splitKey);
  const minimumPlayerGames =
    teams.length > 0 && Math.max(...teams.map((team) => team.games_played)) < 20
      ? COMPACT_MIN_LEADERBOARD_GAMES
      : DEFAULT_MIN_LEADERBOARD_GAMES;
  const qualifiedPlayers = players.filter(
    (player) => player.games_played >= minimumPlayerGames,
  );
  const teamInsight = buildTeamInsight(teams);
  const playerInsight = buildPlayerInsight(players, minimumPlayerGames);
  const championInsight = buildChampionInsight(champions);
  const sidePickImpact = aggregateSidePickImpact(teams);
  const matchOrderedTeams = sortTeamsByMatchRecord(teams);
  const matchOrderedTeamNames = matchOrderedTeams.map((team) => team.team);
  const progressionTeams = Array.from(
    new Set(teamProgression.flatMap((point) => Object.keys(point.values))),
  ).sort((a, b) => {
    const indexA = matchOrderedTeamNames.indexOf(a);
    const indexB = matchOrderedTeamNames.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
  const rolePlayerGroups = ROLE_ORDER.map((role) => ({
    role,
    players: topBy(
      qualifiedPlayers.filter((player) => player.position === role),
      playerScore,
      4,
    ),
  }));
  const topChampionPressure = topBy(
    champions,
    (champion) => champion.presence_rate_pct,
    8,
  );
  const strongestBlue = pickLeader(
    teams,
    (team) => team.blue_win_rate_pct,
    (team) => team.blue_games_played,
  );
  const strongestRed = pickLeader(
    teams,
    (team) => team.red_win_rate_pct,
    (team) => team.red_games_played,
  );
  const strongestFirstPick = pickLeader(
    teams,
    (team) => team.first_pick_win_rate_pct,
    (team) => team.first_pick_games_played,
  );
  const strongestSecondPick = pickLeader(
    teams,
    (team) => team.second_pick_win_rate_pct,
    (team) => team.second_pick_games_played,
  );
  const priorityPool = champions.filter(
    (champion) => champion.presence_rate_pct >= 50,
  );
  const showPlacementChart = !HIDE_PLACEMENT_CHART_SPLITS.has(splitKey);
  const placementChartTickStep =
    splitKey === "Rounds 1-2" || splitKey === "Rounds 3-4" ? 10 : undefined;

  return (
    <div className="flex flex-col gap-10">
      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/analysis"
      />

      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-sm text-ink-muted">Analysis</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">
            LCK Analysis Desk
          </h1>
          <p className="mt-2 max-w-3xl text-ink-muted">
            A first-pass analyst view for team form, player standouts, and
            champion priority. It turns the dashboard tables into quick reads
            for the selected scope.
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </section>

      <NewspaperInsights
        currentSplit={currentSplit}
        teamInsight={teamInsight}
        playerInsight={playerInsight}
        championInsight={championInsight}
        assets={esportsAssets}
      />

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Game-wide tendencies"
          title="Side And Pick-Order Impact"
          description="A scope-level look at whether blue side, red side, first pick, or second pick is converting into wins across all loaded games."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AggregateImpactCard
            title="Blue Side vs Red Side"
            description="Compares all games by map side, independent of team strength."
            primary={sidePickImpact.blue}
            secondary={sidePickImpact.red}
          />
          <AggregateImpactCard
            title="First Pick vs Second Pick"
            description="Compares draft order across the same game pool."
            primary={sidePickImpact.firstPick}
            secondary={sidePickImpact.secondPick}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatTile
          label="Teams tracked"
          value={String(teams.length)}
          detail={`${teams.reduce((sum, team) => sum + team.games_played, 0) / 2} games in scope.`}
        />
        <StatTile
          label="Qualified players"
          value={String(qualifiedPlayers.length)}
          detail={`Minimum ${minimumPlayerGames} games for this board.`}
          accentClass="text-green"
        />
        <StatTile
          label="High-priority champions"
          value={String(priorityPool.length)}
          detail="Champions at 50%+ draft presence."
          accentClass="text-red-side"
        />
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Teams"
          title="Form, Side, And Pick Order"
          description="Use this for power ranking notes: who is winning matches most often, where side choice may matter, and whether first pick or second pick is converting better."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Best blue-side profile"
            value={strongestBlue ? strongestBlue.team : "TBD"}
            detail={
              strongestBlue
                ? `${formatRecord(
                    strongestBlue.blue_wins,
                    strongestBlue.blue_games_played,
                  )} on blue side / ${formatPct(strongestBlue.blue_win_rate_pct)}`
                : "No blue-side games found."
            }
            accentClass="text-blue-side"
          />
          <StatTile
            label="Best red-side profile"
            value={strongestRed ? strongestRed.team : "TBD"}
            detail={
              strongestRed
                ? `${formatRecord(
                    strongestRed.red_wins,
                    strongestRed.red_games_played,
                  )} on red side / ${formatPct(strongestRed.red_win_rate_pct)}`
                : "No red-side games found."
            }
            accentClass="text-red-side"
          />
          <StatTile
            label="Best first-pick profile"
            value={strongestFirstPick ? strongestFirstPick.team : "TBD"}
            detail={
              strongestFirstPick
                ? `${formatRecord(
                    strongestFirstPick.first_pick_wins,
                    strongestFirstPick.first_pick_games_played,
                  )} with first pick / ${formatPct(strongestFirstPick.first_pick_win_rate_pct)}`
                : "No first-pick games found."
            }
            accentClass="text-gold"
          />
          <StatTile
            label="Best second-pick profile"
            value={strongestSecondPick ? strongestSecondPick.team : "TBD"}
            detail={
              strongestSecondPick
                ? `${formatRecord(
                    strongestSecondPick.second_pick_wins,
                    strongestSecondPick.second_pick_games_played,
                  )} with second pick / ${formatPct(strongestSecondPick.second_pick_win_rate_pct)}`
                : "No second-pick games found."
            }
            accentClass="text-silver"
          />
        </div>
        <TeamFormPickOrderTable
          teams={matchOrderedTeams}
          assets={esportsAssets}
        />
      </section>

      {showPlacementChart ? (
        <section className="flex flex-col gap-5">
          <SectionHeader
            eyebrow="Teams"
            title="Team Placement Over Time"
            description="Standings placement after each loaded match in the selected scope, ranked by match record first and game record second."
          />
          <TeamProgressChart
            points={teamProgression}
            teams={progressionTeams}
            matchOrderTickStep={placementChartTickStep}
          />
        </section>
      ) : null}

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Players"
          title="Standout Player Profiles"
          description="Role-separated boards showing the top four qualified players in each position, using a blended profile of KDA, damage, early lane gold, and vision contribution."
        />
        <RolePlayerBoards
          roleGroups={rolePlayerGroups}
          assets={esportsAssets}
        />
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Champions"
          title="Draft Pressure And Payoff"
          description="A priority table for the champions opponents are forced to answer through picks, bans, or both."
        />
        <ChampionPressureTable champions={topChampionPressure} />
      </section>
    </div>
  );
}
