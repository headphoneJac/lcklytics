import {
  DEFAULT_SPLIT_KEY,
  TEAMS_CUP_POSTSEASON_SPLIT_KEY,
  TEAMS_ROAD_TO_MSI_SPLIT_KEY,
  TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
} from "@/lib/queries";
import type {
  ChampionProfile,
  PlayerRole,
  PlayerRoleProfile,
  TeamProgressPoint,
  TeamSideProfile,
} from "@/lib/types";
import { formatDelta, formatPct } from "@/components/analysis/format";

export const ROLE_ORDER: PlayerRole[] = ["top", "jng", "mid", "bot", "sup"];
export const DEFAULT_MIN_LEADERBOARD_GAMES = 10;
export const COMPACT_MIN_LEADERBOARD_GAMES = 5;
export const ROUNDS_3_4_SPLIT_KEY = "Rounds 3-4";
export const ALL_SPLITS_PROGRESS_MATCH_END = 188;

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

export function buildTeamInsight(teams: TeamSideProfile[]) {
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

  return {
    title: `${kdaLeader.player} anchors the player board`,
    body: `${kdaLeader.player} leads qualified players with a ${kdaLeader.kda.toFixed(
      2,
    )} KDA over ${kdaLeader.games_played} games. ${laneRead}`,
    metric: kdaLeader.kda.toFixed(2),
    player: kdaLeader,
  };
}

export function buildChampionInsight(champions: ChampionProfile[]) {
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
