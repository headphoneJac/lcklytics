import {
  DEFAULT_SPLIT_KEY,
  TEAMS_CUP_POSTSEASON_SPLIT_KEY,
  TEAMS_ROAD_TO_MSI_SPLIT_KEY,
  TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
} from "@/lib/queries";
import type {
  ChampionProfile,
  DraftPressureTarget,
  PlayerRole,
  PlayerRoleProfile,
  TeamSignalContext,
  TeamProgressPoint,
  TeamSideProfile,
} from "@/lib/types";
import { formatDelta, formatPct } from "@/components/analysis/format";

export const ROLE_ORDER: PlayerRole[] = ["top", "jng", "mid", "bot", "sup"];
export const DEFAULT_MIN_LEADERBOARD_GAMES = 10;
export const COMPACT_MIN_LEADERBOARD_GAMES = 5;
export const ROUNDS_3_4_SPLIT_KEY = "Rounds 3-4";
export const ALL_SPLITS_PROGRESS_MATCH_END = 188;
const DEPENDENCY_DELTA_THRESHOLD = 10;

const ROLE_LABELS: Record<PlayerRole, string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  bot: "Bot",
  sup: "Support",
};

function formatSignedNumber(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

const ROUNDS_1_2_PLACEMENT_MATCHES = new Set([
  10, 20, 30, 40, 50, 60, 70, 80, 90,
]);
const ROUNDS_3_4_PLACEMENT_MATCHES = new Set([10, 20, 30, 40]);

export const ROUNDS_3_4_GROUPS = [
  {
    name: "Legend Group",
    teams: ["Dplus Kia", "Gen.G", "Hanwha Life Esports", "T1", "KT Rolster"],
  },
  {
    name: "Rise Group",
    teams: [
      "HANJIN BRION",
      "NS Redforce",
      "BNK FearX",
      "Kiwoom DRX",
      "DN SOOPers",
    ],
  },
] as const;

export const HIDE_PLACEMENT_CHART_SPLITS = new Set([
  TEAMS_CUP_POSTSEASON_SPLIT_KEY,
  TEAMS_ROAD_TO_MSI_SPLIT_KEY,
  TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
]);

export type AggregateWinRate = {
  label: string;
  wins: number;
  games: number;
  rate: number;
  textClass: string;
  barClass: string;
};

export type TeamFormMover = {
  team: string;
  recentGames: number;
  recentWins: number;
  recentWinRatePct: number;
  overallGames: number;
  overallWinRatePct: number;
  deltaPct: number;
};

export type TeamFormMovers = {
  risers: TeamFormMover[];
  fallers: TeamFormMover[];
  steady: TeamFormMover[];
};

export type ObjectiveIdentityLeader = {
  team: string;
  value: string;
  detail: string;
  sortValue: number;
};

export type ObjectiveIdentityRanking = {
  title: string;
  description: string;
  accentClass: string;
  leaders: ObjectiveIdentityLeader[];
};

export type DraftPayoffChampion = {
  champion: string;
  presenceRatePct: number;
  winRatePct: number;
  picks: number;
  bans: number;
  roles: string;
  detail: string;
};

export type DraftPayoffQuadrants = {
  highPressureHighPayoff: DraftPayoffChampion[];
  highPressureLowPayoff: DraftPayoffChampion[];
  lowPressureHighPayoff: DraftPayoffChampion[];
  banTraps: DraftPayoffChampion[];
};

function winRate(wins: number, games: number) {
  return games > 0 ? (wins / games) * 100 : 0;
}

function roundedWinRate(wins: number, games: number) {
  return games > 0 ? Number(((wins / games) * 100).toFixed(1)) : 0;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatWholeNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

export function objectiveLosses(summary: { games: number; wins: number }) {
  return Math.max(summary.games - summary.wins, 0);
}

export function topBy<T>(
  items: T[],
  getValue: (item: T) => number,
  limit = 5,
) {
  return [...items].sort((a, b) => getValue(b) - getValue(a)).slice(0, limit);
}

export function pickLeader<T>(
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

export function aggregateSidePickImpact(teams: TeamSideProfile[]) {
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

export function sortTeamsByMatchRecord(teams: TeamSideProfile[]) {
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

export function buildTeamFormMovers(
  teams: TeamSideProfile[],
  teamSignalContexts: TeamSignalContext[] = [],
): TeamFormMovers {
  const teamsByName = new Map(teams.map((team) => [team.team, team]));
  const movers = teamSignalContexts
    .map((context) => {
      const team = teamsByName.get(context.team);
      const recent = context.recent;

      if (!team || recent.games === 0) return null;

      return {
        team: team.team,
        recentGames: recent.games,
        recentWins: recent.wins,
        recentWinRatePct: recent.win_rate_pct,
        overallGames: team.games_played,
        overallWinRatePct: team.win_rate_pct,
        deltaPct: Number((recent.win_rate_pct - team.win_rate_pct).toFixed(1)),
      } satisfies TeamFormMover;
    })
    .filter((mover): mover is TeamFormMover => Boolean(mover));

  return {
    risers: movers
      .filter((mover) => mover.deltaPct > 0)
      .sort((a, b) => b.deltaPct - a.deltaPct || b.recentGames - a.recentGames)
      .slice(0, 4),
    fallers: movers
      .filter((mover) => mover.deltaPct < 0)
      .sort((a, b) => a.deltaPct - b.deltaPct || b.recentGames - a.recentGames)
      .slice(0, 4),
    steady: movers
      .sort(
        (a, b) =>
          Math.abs(a.deltaPct) - Math.abs(b.deltaPct) ||
          b.overallGames - a.overallGames,
      )
      .slice(0, 4),
  };
}

function objectiveLeader(
  team: TeamSideProfile,
  value: string,
  detail: string,
  sortValue: number,
): ObjectiveIdentityLeader {
  return {
    team: team.team,
    value,
    detail,
    sortValue,
  };
}

function rankedObjectiveLeaders(
  teams: TeamSideProfile[],
  buildLeader: (team: TeamSideProfile) => ObjectiveIdentityLeader,
  limit = 4,
) {
  return teams
    .filter((team) => team.games_played > 0)
    .map(buildLeader)
    .sort((a, b) => b.sortValue - a.sortValue || a.team.localeCompare(b.team))
    .slice(0, limit);
}

export function buildObjectiveIdentityRankings(
  teams: TeamSideProfile[],
): ObjectiveIdentityRanking[] {
  return [
    {
      title: "Economy Pace",
      description: "Teams generating the most total gold per game.",
      accentClass: "text-gold",
      leaders: rankedObjectiveLeaders(teams, (team) =>
        objectiveLeader(
          team,
          formatWholeNumber(team.avg_total_gold),
          `${formatPct(team.win_rate_pct)} game WR across ${team.games_played} games`,
          team.avg_total_gold,
        ),
      ),
    },
    {
      title: "Early Claims",
      description: "First tower and first blood pressure blended together.",
      accentClass: "text-green",
      leaders: rankedObjectiveLeaders(teams, (team) => {
        const earlyScore = (team.first_tower_pct + team.first_blood_pct) / 2;

        return objectiveLeader(
          team,
          formatPct(earlyScore),
          `${formatPct(team.first_tower_pct)} FT / ${formatPct(
            team.first_blood_pct,
          )} FB`,
          earlyScore,
        );
      }),
    },
    {
      title: "Neutral Control",
      description: "Dragon, grub, and Baron volume combined into one read.",
      accentClass: "text-baron",
      leaders: rankedObjectiveLeaders(teams, (team) => {
        const controlScore =
          team.avg_elemental_dragons +
          team.avg_grubs * 0.25 +
          team.avg_barons * 2;

        return objectiveLeader(
          team,
          controlScore.toFixed(1),
          `${team.avg_elemental_dragons.toFixed(1)} dragons / ${team.avg_grubs.toFixed(
            1,
          )} grubs / ${team.avg_barons.toFixed(1)} Barons`,
          controlScore,
        );
      }),
    },
    {
      title: "Siege Finish",
      description: "Tower pressure as a proxy for map conversion.",
      accentClass: "text-tower",
      leaders: rankedObjectiveLeaders(teams, (team) =>
        objectiveLeader(
          team,
          team.avg_towers.toFixed(1),
          `${formatPct(team.first_tower_pct)} first tower rate`,
          team.avg_towers,
        ),
      ),
    },
  ];
}

function toDraftPayoffChampion(
  champion: ChampionProfile,
): DraftPayoffChampion {
  return {
    champion: champion.champion,
    presenceRatePct: champion.presence_rate_pct,
    winRatePct: champion.win_rate_pct,
    picks: champion.picks,
    bans: champion.bans,
    roles: champion.roles,
    detail: `${champion.picks} picks / ${champion.bans} bans`,
  };
}

function sortDraftPayoffChampions(
  champions: ChampionProfile[],
  getScore: (champion: ChampionProfile) => number,
  limit = 5,
) {
  return champions
    .sort((a, b) => {
      const scoreDelta = getScore(b) - getScore(a);
      if (scoreDelta !== 0) return scoreDelta;
      if (b.presence_rate_pct !== a.presence_rate_pct) {
        return b.presence_rate_pct - a.presence_rate_pct;
      }
      return a.champion.localeCompare(b.champion);
    })
    .slice(0, limit)
    .map(toDraftPayoffChampion);
}

export function buildDraftPayoffQuadrants(
  champions: ChampionProfile[],
): DraftPayoffQuadrants {
  const pickedChampions = champions.filter((champion) => champion.picks > 0);
  const minimumPicks = pickedChampions.length > 0 ? 3 : 0;
  const highPressureThreshold = 50;
  const highPayoffThreshold = 52;
  const lowPayoffThreshold = 48;

  return {
    highPressureHighPayoff: sortDraftPayoffChampions(
      pickedChampions.filter(
        (champion) =>
          champion.presence_rate_pct >= highPressureThreshold &&
          champion.win_rate_pct >= highPayoffThreshold,
      ),
      (champion) => champion.presence_rate_pct + champion.win_rate_pct,
    ),
    highPressureLowPayoff: sortDraftPayoffChampions(
      pickedChampions.filter(
        (champion) =>
          champion.presence_rate_pct >= highPressureThreshold &&
          champion.win_rate_pct <= lowPayoffThreshold,
      ),
      (champion) => champion.presence_rate_pct - champion.win_rate_pct,
    ),
    lowPressureHighPayoff: sortDraftPayoffChampions(
      pickedChampions.filter(
        (champion) =>
          champion.presence_rate_pct < highPressureThreshold &&
          champion.picks >= minimumPicks &&
          champion.win_rate_pct >= 60,
      ),
      (champion) => champion.win_rate_pct + champion.picks,
    ),
    banTraps: sortDraftPayoffChampions(
      champions.filter(
        (champion) =>
          champion.bans >= Math.max(champion.picks * 1.5, 2) &&
          champion.presence_rate_pct >= 25,
      ),
      (champion) => champion.bans - champion.picks,
    ),
  };
}

export function mergeTeamSideProfiles(
  baseTeams: TeamSideProfile[],
  currentTeams: TeamSideProfile[],
) {
  const teams = new Map<string, TeamSideProfile>();

  for (const team of [...baseTeams, ...currentTeams]) {
    const current = teams.get(team.team);

    if (!current) {
      teams.set(team.team, { ...team });
      continue;
    }

    current.matches_played += team.matches_played;
    current.match_wins += team.match_wins;
    current.match_losses += team.match_losses;
    current.games_played += team.games_played;
    current.game_wins += team.game_wins;
    current.game_losses += team.game_losses;
    current.blue_games_played += team.blue_games_played;
    current.blue_wins += team.blue_wins;
    current.red_games_played += team.red_games_played;
    current.red_wins += team.red_wins;
    current.first_pick_games_played += team.first_pick_games_played;
    current.first_pick_wins += team.first_pick_wins;
    current.second_pick_games_played += team.second_pick_games_played;
    current.second_pick_wins += team.second_pick_wins;
  }

  return Array.from(teams.values()).map((team) => {
    const blueWinRate = roundedWinRate(
      team.blue_wins,
      team.blue_games_played,
    );
    const redWinRate = roundedWinRate(team.red_wins, team.red_games_played);

    return {
      ...team,
      win_rate_pct: roundedWinRate(team.game_wins, team.games_played),
      blue_win_rate_pct: blueWinRate,
      red_win_rate_pct: redWinRate,
      side_delta_pct:
        team.blue_games_played > 0 && team.red_games_played > 0
          ? Number((blueWinRate - redWinRate).toFixed(1))
          : null,
      first_pick_win_rate_pct: roundedWinRate(
        team.first_pick_wins,
        team.first_pick_games_played,
      ),
      second_pick_win_rate_pct: roundedWinRate(
        team.second_pick_wins,
        team.second_pick_games_played,
      ),
    };
  });
}

function compareProgressRecords(
  teamA: string,
  teamB: string,
  records: TeamProgressPoint["records"],
) {
  const recordA = records[teamA];
  const recordB = records[teamB];

  if (!recordA && !recordB) return teamA.localeCompare(teamB);
  if (!recordA) return 1;
  if (!recordB) return -1;

  const gameDiffA = recordA.game_wins - recordA.game_losses;
  const gameDiffB = recordB.game_wins - recordB.game_losses;

  if (recordB.match_wins !== recordA.match_wins) {
    return recordB.match_wins - recordA.match_wins;
  }
  if (recordA.match_losses !== recordB.match_losses) {
    return recordA.match_losses - recordB.match_losses;
  }
  if (gameDiffB !== gameDiffA) return gameDiffB - gameDiffA;
  if (recordB.game_wins !== recordA.game_wins) {
    return recordB.game_wins - recordA.game_wins;
  }
  if (recordA.game_losses !== recordB.game_losses) {
    return recordA.game_losses - recordB.game_losses;
  }

  return teamA.localeCompare(teamB);
}

export function buildGroupedProgressionPoints(
  points: TeamProgressPoint[],
  teamNames: string[],
) {
  return points
    .map((point) => {
      const teamsInPoint = teamNames.filter((team) => point.records[team]);
      const placements = new Map(
        [...teamsInPoint]
          .sort((teamA, teamB) =>
            compareProgressRecords(teamA, teamB, point.records),
          )
          .map((team, index) => [team, index + 1]),
      );

      return {
        ...point,
        values: Object.fromEntries(
          teamsInPoint.map((team) => [
            team,
            placements.get(team) ?? teamsInPoint.length,
          ]),
        ),
        records: Object.fromEntries(
          teamsInPoint.map((team) => [team, point.records[team]!]),
        ),
      };
    })
    .filter((point) => Object.keys(point.values).length > 0);
}

export function buildPlacementChartProgression(
  points: TeamProgressPoint[],
  splitKey: string,
  roundsOneTwoProgression: TeamProgressPoint[] = [],
) {
  if (splitKey === DEFAULT_SPLIT_KEY) {
    const checkpointPoints = points.filter(
      (point) =>
        point.match_index % 10 === 0 ||
        point.match_index === ALL_SPLITS_PROGRESS_MATCH_END,
    );
    const baselinePoint = checkpointPoints[0];

    if (!baselinePoint) return checkpointPoints;

    const teams = Object.keys(baselinePoint.records);

    return [
      {
        date: "",
        match_index: 0,
        is_neutral_baseline: true,
        values: baselinePoint.values,
        records: Object.fromEntries(
          teams.map((team) => [
            team,
            {
              match_wins: 0,
              match_losses: 0,
              game_wins: 0,
              game_losses: 0,
            },
          ]),
        ),
      },
      ...checkpointPoints,
    ];
  }

  if (splitKey === "Rounds 1-2") {
    const checkpointPoints = points.filter((point) =>
      ROUNDS_1_2_PLACEMENT_MATCHES.has(point.match_index),
    );
    const baselinePoint = checkpointPoints[0];

    if (!baselinePoint) return checkpointPoints;

    const teams = Object.keys(baselinePoint.values);

    return [
      {
        ...baselinePoint,
        date: "",
        match_index: 0,
        is_visual_baseline: true,
        records: Object.fromEntries(
          teams.map((team) => [
            team,
            {
              match_wins: 0,
              match_losses: 0,
              game_wins: 0,
              game_losses: 0,
            },
          ]),
        ),
      },
      ...checkpointPoints,
    ];
  }

  if (splitKey === ROUNDS_3_4_SPLIT_KEY) {
    const seededPoint = roundsOneTwoProgression.at(-1);
    const checkpointPoints = points.filter((point) =>
      ROUNDS_3_4_PLACEMENT_MATCHES.has(point.match_index),
    );

    if (!seededPoint) return checkpointPoints;

    const cumulativeCheckpointPoints = checkpointPoints.map((point) => {
      const teamNames = Array.from(
        new Set([
          ...Object.keys(seededPoint.records),
          ...Object.keys(point.records),
        ]),
      );

      return {
        ...point,
        records: Object.fromEntries(
          teamNames.map((team) => {
            const seededRecord = seededPoint.records[team];
            const pointRecord = point.records[team];

            return [
              team,
              {
                match_wins:
                  (seededRecord?.match_wins ?? 0) +
                  (pointRecord?.match_wins ?? 0),
                match_losses:
                  (seededRecord?.match_losses ?? 0) +
                  (pointRecord?.match_losses ?? 0),
                game_wins:
                  (seededRecord?.game_wins ?? 0) +
                  (pointRecord?.game_wins ?? 0),
                game_losses:
                  (seededRecord?.game_losses ?? 0) +
                  (pointRecord?.game_losses ?? 0),
              },
            ];
          }),
        ),
      };
    });

    return [
      {
        ...seededPoint,
        date: "",
        match_index: 0,
      },
      ...cumulativeCheckpointPoints,
    ];
  }

  return points;
}

export function buildTeamInsight(
  teams: TeamSideProfile[],
  teamSignalContexts: TeamSignalContext[] = [],
) {
  const leader = pickLeader(
    teams,
    (team) => team.win_rate_pct,
    (team) => team.games_played,
  );

  if (!leader) {
    return {
      title: "No team sample yet",
      body: "Team records will appear here once games are loaded for this scope.",
      metric: "0 games",
      team: undefined,
    };
  }

  const sideDelta = leader.side_delta_pct ?? 0;
  const pickDelta =
    leader.first_pick_games_played > 0 && leader.second_pick_games_played > 0
      ? leader.first_pick_win_rate_pct - leader.second_pick_win_rate_pct
      : 0;
  const sideDependency =
    Math.abs(sideDelta) >= DEPENDENCY_DELTA_THRESHOLD
      ? `${leader.side_delta_pct && leader.side_delta_pct > 0 ? "Blue" : "Red"} side is the only visible caveat at ${formatDelta(
          Math.abs(sideDelta),
        )}.`
      : null;
  const pickDependency =
    Math.abs(pickDelta) >= DEPENDENCY_DELTA_THRESHOLD
      ? `${pickDelta > 0 ? "First pick" : "Second pick"} is also meaningfully stronger at ${formatDelta(
          Math.abs(pickDelta),
        )}.`
      : null;
  const dependencyRead =
    [sideDependency, pickDependency].filter(Boolean).join(" ") ||
    "Stable across side and pick order.";
  const context = teamSignalContexts.find((candidate) => candidate.team === leader.team);
  const recent = context?.recent;
  const hardestOpponent = context?.hardestOpponent;

  return {
    title: `${leader.team} sets the team baseline`,
    body: `${leader.team} leads this scope at ${formatPct(
      leader.win_rate_pct,
    )} across ${leader.games_played} games. ${dependencyRead}`,
    metric: formatPct(leader.win_rate_pct),
    team: leader,
    recent:
      recent && recent.games > 0
        ? {
            label: "Recent trend",
            value: `${recent.wins}-${recent.games - recent.wins}`,
            detail: `Last ${recent.games} games / ${formatPct(
              recent.win_rate_pct,
            )}`,
          }
        : undefined,
    hardestOpponent: hardestOpponent
      ? {
          opponent: hardestOpponent.opponent,
          matchRecord: `${hardestOpponent.match_wins}-${hardestOpponent.match_losses}`,
          gameRecord: `${hardestOpponent.game_wins}-${hardestOpponent.game_losses}`,
          stats: [
            {
              label: "Avg gold",
              value: formatSignedNumber(hardestOpponent.avg_gold_diff),
            },
            {
              label: "GD@15",
              value: formatSignedNumber(hardestOpponent.avg_gd15),
            },
            {
              label: "Obj delta",
              value: formatSignedNumber(hardestOpponent.objective_control_delta),
            },
            {
              label: "Opp first tower",
              value: formatPct(hardestOpponent.opponent_first_tower_pct),
            },
            {
              label: "Opp first blood",
              value: formatPct(hardestOpponent.opponent_first_blood_pct),
            },
          ],
        }
      : undefined,
  };
}

function playerArchetype(
  player: PlayerRoleProfile,
  qualified: PlayerRoleProfile[],
) {
  const rolePeers = qualified.filter((peer) => peer.position === player.position);
  const roleAvgDpm = average(rolePeers.map((peer) => peer.avg_dpm));
  const roleAvgGd15 = average(rolePeers.map((peer) => peer.avg_gd15));

  if (player.position === "sup") {
    return {
      label: "Vision Engine",
      detail: "Support value is showing through map control and assist volume.",
      stats: [
        { label: "Vision", value: player.avg_vision_score.toFixed(1) },
        { label: "Assists", value: player.avg_assists.toFixed(1) },
        { label: "KP", value: formatPct(player.avg_kill_participation_pct) },
      ],
    };
  }

  if (player.position === "jng") {
    return {
      label: player.first_blood_pct >= 35 ? "Early Spark" : "Tempo Jungler",
      detail: "The jungle read leans on early gold and first-blood pressure.",
      stats: [
        { label: "GD@15", value: player.avg_gd15.toFixed(0) },
        { label: "First blood", value: formatPct(player.first_blood_pct) },
        { label: "DPM", value: String(player.avg_dpm) },
      ],
    };
  }

  const label =
    player.avg_gd15 - roleAvgGd15 >= 150
      ? "Lane Bully"
      : player.avg_damage_share >= 30
        ? "Damage Carry"
        : player.kda >= 5
          ? "Low-Death Stabilizer"
          : "Carry Profile";

  return {
    label,
    detail: `${ROLE_LABELS[player.position]} form is backed by damage and lane pressure indicators.`,
    stats: [
      {
        label: "DPM",
        value:
          roleAvgDpm > 0
            ? `${player.avg_dpm} vs ${Math.round(roleAvgDpm)} avg`
            : String(player.avg_dpm),
      },
      { label: "DMG share", value: formatPct(player.avg_damage_share) },
      {
        label: "GD@15",
        value:
          roleAvgGd15 !== 0
            ? `${player.avg_gd15.toFixed(0)} vs ${roleAvgGd15.toFixed(0)} avg`
            : player.avg_gd15.toFixed(0),
      },
    ],
  };
}

export function buildPlayerInsight(
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
  const archetype = playerArchetype(kdaLeader, qualified);

  return {
    title: `${kdaLeader.player} anchors the player board`,
    body: `${kdaLeader.player} leads qualified players with a ${kdaLeader.kda.toFixed(
      2,
    )} KDA over ${kdaLeader.games_played} games. ${laneRead}`,
    metric: kdaLeader.kda.toFixed(2),
    player: kdaLeader,
    archetype,
  };
}

function draftDriver(champion: ChampionProfile) {
  if (champion.bans > champion.picks) {
    return {
      label: "Ban-driven",
      value: `${champion.bans} bans / ${champion.picks} picks`,
      detail: "Teams are denying it before it becomes a playable option.",
    };
  }

  if (champion.picks > champion.bans) {
    return {
      label: "Pick-driven",
      value: `${champion.picks} picks / ${champion.bans} bans`,
      detail: `${formatPct(champion.win_rate_pct)} win rate when selected.`,
    };
  }

  return {
    label: "Balanced pressure",
    value: `${champion.picks} picks / ${champion.bans} bans`,
    detail: `${formatPct(champion.win_rate_pct)} win rate when selected.`,
  };
}

export function buildChampionInsight(
  champions: ChampionProfile[],
  draftPressureTargets: DraftPressureTarget[] = [],
) {
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

  const focusedPressure =
    draftPressureTargets.find(
      (pressure) => pressure.champion === priorityLeader.champion,
    ) ?? draftPressureTargets[0];
  const driver = draftDriver(priorityLeader);

  return {
    title: `${priorityLeader.champion} is the draft pressure point`,
    body: `${priorityLeader.champion} leads the pool at ${formatPct(
      priorityLeader.presence_rate_pct,
    )} presence. Top-ten average: ${formatPct(avgPresence)}.`,
    metric: formatPct(priorityLeader.presence_rate_pct),
    champion: priorityLeader,
    driver,
    teamPressure: focusedPressure
      ? {
          champion: focusedPressure.champion,
          team: focusedPressure.team,
          value: `${focusedPressure.bans_against}/${focusedPressure.total_bans} bans`,
          detail:
            focusedPressure.player && focusedPressure.player_games
              ? `${focusedPressure.player}: ${focusedPressure.player_games} games, ${formatPct(
                  focusedPressure.player_win_rate_pct ?? 0,
                )} WR`
              : "Most concentrated team-specific ban signal.",
        }
      : undefined,
    matchupReads: [
      {
        label: "Payoff",
        value:
          priorityLeader.picks > 0
            ? `${formatPct(priorityLeader.win_rate_pct)} WR`
            : "Not picked",
        detail: `${priorityLeader.picks} picks in the loaded pool.`,
      },
      {
        label: "Role pressure",
        value: priorityLeader.roles,
        detail: `${pickedChampions.length} champions have appeared as picks.`,
      },
    ],
  };
}

export function playerScore(player: PlayerRoleProfile) {
  const laneScore = player.avg_gd15 / 25;
  const damageScore = player.avg_dpm / 15;
  const safetyScore = player.kda * 8;
  const visionScore =
    player.position === "sup"
      ? player.avg_vision_score * 1.1
      : player.avg_vision_score * 0.45;

  return safetyScore + damageScore + laneScore + visionScore;
}
