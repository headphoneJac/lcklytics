"use client";

import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type {
  PlayerChampionMatchupProfile,
  PlayerRole,
  PlayerRoleProfile,
  TeamObjectiveStat,
} from "@/lib/types";
import ChampionIcon from "@/components/images/ChampionIcon";
import { playerRowBackgroundStyle } from "@/components/images/row-background";
import type { EsportsAssets } from "@/lib/assets";

const ROLE_LABELS: Record<PlayerRole, string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  bot: "Bot",
  sup: "Support",
};

type PlayerMatchupSummary = {
  id: string;
  player_id: string;
  player: string;
  team: string;
  position: PlayerRole;
  games_played: number;
  wins: number;
  win_rate_pct: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  kda: number;
  avg_dpm: number;
  avg_damage_share: number;
  avg_cspm: number;
  avg_vision_score: number;
  avg_wards_placed: number;
  avg_wards_killed: number;
  avg_control_wards_bought: number;
  avg_grubs: number;
  avg_heralds: number;
  avg_dragons: number;
  avg_barons: number;
  avg_turrets_destroyed: number;
  has_objective_stats: boolean;
  avg_gd15: number;
  avg_xpd15: number;
  avg_csd15: number;
  first_blood_pct: number;
  first_tower_pct: number;
  performance_score: number;
  champion_pool: PlayerChampionMatchupProfile[];
  games: {
    game_id: string;
    team_id: string;
    result: boolean;
  }[];
};

const STAT_SECTIONS: {
  title: string;
  metrics: {
    label: string;
    key: keyof PlayerMatchupSummary;
    format: (value: number) => string;
    lowerIsBetter?: boolean;
  }[];
}[] = [
  {
    title: "General",
    metrics: [
      {
        label: "Performance Score",
        key: "performance_score",
        format: (value) => value.toFixed(1),
      },
      {
        label: "Win Rate",
        key: "win_rate_pct",
        format: (value) => `${value.toFixed(1)}%`,
      },
      { label: "KDA", key: "kda", format: (value) => value.toFixed(2) },
      { label: "Kills", key: "avg_kills", format: (value) => value.toFixed(1) },
      {
        label: "Deaths",
        key: "avg_deaths",
        format: (value) => value.toFixed(1),
        lowerIsBetter: true,
      },
      {
        label: "Assists",
        key: "avg_assists",
        format: (value) => value.toFixed(1),
      },
      {
        label: "Damage / min",
        key: "avg_dpm",
        format: (value) => value.toFixed(0),
      },
      {
        label: "Team Damage %",
        key: "avg_damage_share",
        format: (value) => `${value.toFixed(1)}%`,
      },
      {
        label: "CS / min",
        key: "avg_cspm",
        format: (value) => value.toFixed(1),
      },
    ],
  },
  {
    title: "Laning Phase",
    metrics: [
      {
        label: "First Blood %",
        key: "first_blood_pct",
        format: (value) => `${value.toFixed(1)}%`,
      },
      {
        label: "CS diff @15",
        key: "avg_csd15",
        format: (value) => value.toFixed(1),
      },
      {
        label: "Gold diff @15",
        key: "avg_gd15",
        format: (value) => value.toFixed(0),
      },
      {
        label: "XP diff @15",
        key: "avg_xpd15",
        format: (value) => value.toFixed(0),
      },
    ],
  },
  {
    title: "Vision",
    metrics: [
      {
        label: "Vision Score",
        key: "avg_vision_score",
        format: (value) => value.toFixed(1),
      },
      {
        label: "Wards Placed",
        key: "avg_wards_placed",
        format: (value) => value.toFixed(1),
      },
      {
        label: "Wards Cleared",
        key: "avg_wards_killed",
        format: (value) => value.toFixed(1),
      },
      {
        label: "Control Wards",
        key: "avg_control_wards_bought",
        format: (value) => value.toFixed(1),
      },
    ],
  },
];

const OBJECTIVE_SECTION: (typeof STAT_SECTIONS)[number] = {
  title: "Objectives",
  metrics: [
    {
      label: "Grubs",
      key: "avg_grubs",
      format: (value) => value.toFixed(1),
    },
    {
      label: "Heralds",
      key: "avg_heralds",
      format: (value) => value.toFixed(1),
    },
    {
      label: "Dragons",
      key: "avg_dragons",
      format: (value) => value.toFixed(1),
    },
    {
      label: "Barons",
      key: "avg_barons",
      format: (value) => value.toFixed(1),
    },
    {
      label: "Turrets Destroyed",
      key: "avg_turrets_destroyed",
      format: (value) => value.toFixed(1),
    },
  ],
};

type Winner = "left" | "right" | "tie";

type PlayerOption = {
  key: string;
  label: string;
};

type RadarMetricDefinition = {
  metric: string;
  key: keyof PlayerMatchupSummary;
  suffix?: string;
  lowerIsBetter?: boolean;
};

type PairRadarDatum = {
  metric: string;
  left: number;
  right: number;
  leftRaw: number;
  rightRaw: number;
  suffix?: string;
};

function playerKey(profile: PlayerChampionMatchupProfile) {
  return `${profile.player_id}:${profile.position}`;
}

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function compareValues(
  left: number,
  right: number,
  lowerIsBetter = false,
): Winner {
  if (left === right) return "tie";
  if (lowerIsBetter) return left < right ? "left" : "right";
  return left > right ? "left" : "right";
}

function valueClass(winner: Winner, side: "left" | "right") {
  if (winner === "tie") return "text-ink";
  return winner === side
    ? "rounded bg-indigo-300 px-2 py-0.5 text-bg"
    : "text-ink";
}

function formatRawRadarValue(value: number, suffix?: string) {
  if (suffix === "%") return `${value.toFixed(1)}%`;
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

function radarMetricsForRole(role: PlayerRole): RadarMetricDefinition[] {
  if (role === "sup") {
    return [
      { metric: "KDA", key: "kda" },
      { metric: "Vision", key: "avg_vision_score" },
      { metric: "Team DMG", key: "avg_damage_share", suffix: "%" },
      { metric: "FB %", key: "first_blood_pct", suffix: "%" },
      { metric: "FT %", key: "first_tower_pct", suffix: "%" },
      { metric: "GD@15", key: "avg_gd15" },
      { metric: "XP Diff @ 15", key: "avg_xpd15" },
      { metric: "CSD@15", key: "avg_csd15" },
    ];
  }

  return [
    { metric: "KDA", key: "kda" },
    { metric: "DMG/min", key: "avg_dpm" },
    { metric: "Team DMG", key: "avg_damage_share", suffix: "%" },
    { metric: "CS/min", key: "avg_cspm" },
    { metric: "FB %", key: "first_blood_pct", suffix: "%" },
    { metric: "FT %", key: "first_tower_pct", suffix: "%" },
    { metric: "GD@15", key: "avg_gd15" },
    { metric: "CSD@15", key: "avg_csd15" },
  ];
}

function normalizeSummaryMetric(
  players: PlayerMatchupSummary[],
  player: PlayerMatchupSummary,
  key: keyof PlayerMatchupSummary,
  lowerIsBetter = false,
) {
  const values = players
    .map((candidate) => Number(candidate[key]))
    .filter((value) => Number.isFinite(value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const value = Number(player[key]);

  if (
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return 0;
  }

  if (max === min) return 50;

  const normalized = lowerIsBetter
    ? ((max - value) / (max - min)) * 100
    : ((value - min) / (max - min)) * 100;

  return Math.round(Math.min(Math.max(normalized, 0), 100));
}

function headToHeadRecord(
  left: PlayerMatchupSummary,
  right: PlayerMatchupSummary,
) {
  const rightGames = new Map(right.games.map((game) => [game.game_id, game]));
  let leftWins = 0;
  let rightWins = 0;

  for (const leftGame of left.games) {
    const rightGame = rightGames.get(leftGame.game_id);
    if (!rightGame || rightGame.team_id === leftGame.team_id) continue;

    if (leftGame.result) leftWins += 1;
    if (rightGame.result) rightWins += 1;
  }

  return {
    leftWins,
    rightWins,
    games: leftWins + rightWins,
  };
}

function HeadToHeadWins({
  left,
  right,
  record,
}: {
  left: PlayerMatchupSummary;
  right: PlayerMatchupSummary;
  record: ReturnType<typeof headToHeadRecord>;
}) {
  const leftShare =
    record.games === 0 ? 50 : (record.leftWins / record.games) * 100;
  const rightShare = 100 - leftShare;
  const leftClass =
    record.leftWins >= record.rightWins
      ? "rounded bg-gold px-2 py-0.5 text-bg"
      : "text-ink";
  const rightClass =
    record.rightWins >= record.leftWins
      ? "rounded bg-indigo-300 px-2 py-0.5 text-bg"
      : "text-ink";

  return (
    <div className="grid grid-cols-[1fr_160px_1fr] items-center gap-4 px-4 py-5 text-sm">
      <div className="text-right">
        <p className="font-display text-xl font-bold text-ink">{left.player}</p>
      </div>

      <div className="text-center">
        <p className="font-stat text-[11px] uppercase text-ink-muted">
          Games Win
        </p>
        <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span
            className={`font-stat text-sm font-bold tabular-nums ${leftClass}`}
          >
            {record.leftWins}
          </span>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-gold shadow-[0_0_10px_rgba(201,162,39,0.65)]"
              style={{ width: `${leftShare}%` }}
            />
            <div
              className="h-full bg-indigo-300/60"
              style={{ width: `${rightShare}%` }}
            />
          </div>
          <span
            className={`font-stat text-sm font-bold tabular-nums ${rightClass}`}
          >
            {record.rightWins}
          </span>
        </div>
      </div>

      <div>
        <p className="font-display text-xl font-bold text-ink">
          {right.player}
        </p>
      </div>
    </div>
  );
}

function summarizePlayer(
  key: string,
  picks: PlayerChampionMatchupProfile[],
): PlayerMatchupSummary {
  const first = picks[0];
  const games = picks.reduce((sum, pick) => sum + pick.games_played, 0);
  const wins = picks.reduce((sum, pick) => sum + pick.wins, 0);
  const kills = picks.reduce((sum, pick) => sum + pick.total_kills, 0);
  const deaths = picks.reduce((sum, pick) => sum + pick.total_deaths, 0);
  const assists = picks.reduce((sum, pick) => sum + pick.total_assists, 0);
  const weighted = (metric: keyof PlayerChampionMatchupProfile, decimals = 1) =>
    round(
      picks.reduce(
        (sum, pick) => sum + Number(pick[metric]) * pick.games_played,
        0,
      ) / games,
      decimals,
    );

  return {
    id: key,
    player_id: first.player_id,
    player: first.player,
    team: first.team,
    position: first.position,
    games_played: games,
    wins,
    win_rate_pct: round((wins / games) * 100),
    total_kills: kills,
    total_deaths: deaths,
    total_assists: assists,
    avg_kills: round(kills / games),
    avg_deaths: round(deaths / games),
    avg_assists: round(assists / games),
    kda: round((kills + assists) / (deaths || 1), 2),
    avg_dpm: Math.round(weighted("avg_dpm")),
    avg_damage_share: weighted("avg_damage_share"),
    avg_cspm: weighted("avg_cspm"),
    avg_vision_score: weighted("avg_vision_score"),
    avg_wards_placed: 0,
    avg_wards_killed: 0,
    avg_control_wards_bought: 0,
    avg_grubs: 0,
    avg_heralds: 0,
    avg_dragons: 0,
    avg_barons: 0,
    avg_turrets_destroyed: 0,
    has_objective_stats: false,
    avg_gd15: Math.round(weighted("avg_gd15")),
    avg_xpd15: Math.round(weighted("avg_xpd15")),
    avg_csd15: weighted("avg_csd15"),
    first_blood_pct: weighted("first_blood_pct"),
    first_tower_pct: weighted("first_tower_pct"),
    performance_score: weighted("performance_score"),
    champion_pool: [...picks].sort((a, b) => {
      if (b.games_played !== a.games_played)
        return b.games_played - a.games_played;
      if (b.performance_score !== a.performance_score) {
        return b.performance_score - a.performance_score;
      }
      return a.champion.localeCompare(b.champion);
    }),
    games: picks.flatMap((pick) => pick.games),
  };
}

function PlayerHeader({
  side,
  selected,
  playerValue,
  playerOptions,
  assets,
  onPlayerChange,
  onClear,
}: {
  side: "left" | "right";
  selected?: PlayerMatchupSummary;
  playerValue: string;
  playerOptions: PlayerOption[];
  assets?: EsportsAssets;
  onPlayerChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      className={`asset-bg-matchup-player relative isolate overflow-hidden rounded-lg border border-white/10 bg-surface/80 p-4 ${
        side === "right" ? "asset-bg-matchup-player-right" : ""
      }`}
      style={
        selected
          ? playerRowBackgroundStyle(selected.player, selected.team, assets)
          : undefined
      }
    >
      <div
        className={`absolute inset-y-0 w-28 opacity-25 ${
          side === "left" ? "right-0 bg-blue-side" : "left-0 bg-red-side"
        }`}
      />
      <div className="absolute left-4 top-4 z-10 w-24 rounded border border-white/10 bg-bg/45 px-3 py-2 text-right backdrop-blur-sm">
        <p className="font-stat text-2xl tabular-nums leading-none text-gold">
          {selected?.performance_score.toFixed(1) ?? "0.0"}
        </p>
        <p className="text-xs text-ink-muted">score</p>
      </div>
      {selected ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove ${selected.player}`}
          className="matchup-player-clear absolute right-3 top-3 z-20 flex size-7 items-center justify-center rounded border border-white/10 bg-bg/80 font-stat text-xs text-ink-muted shadow-lg shadow-bg/30 transition-colors hover:border-red-side/60 hover:text-ink focus:border-gold focus:outline-none"
        >
          X
        </button>
      ) : null}
      <div className="matchup-player-content min-h-20" />

      {selected ? (
        <div className="matchup-player-content mt-4">
          <p className="text-xs text-ink-muted">Player</p>
          <div className="mt-2 rounded border border-white/10 bg-bg/70 px-4 py-3 backdrop-blur-sm">
            <h2 className="truncate font-display text-xl font-bold tracking-tight text-ink">
              {selected.player}
            </h2>
            <p className="mt-1 truncate text-xs text-ink-muted">
              {selected.team} / {ROLE_LABELS[selected.position]}
            </p>
          </div>
        </div>
      ) : (
        <label className="matchup-player-content mt-4 block text-xs text-ink-muted">
          Player
          <div className="relative mt-2">
            <select
              value={playerValue}
              onChange={(event) => onPlayerChange(event.target.value)}
              className="w-full appearance-none rounded border border-white/10 bg-bg py-2.5 pl-4 pr-12 text-sm text-ink outline-none transition-colors hover:border-white/20 focus:border-gold"
            >
              <option value="">
                {playerOptions.length > 0
                  ? "Select a player"
                  : "No same-role players"}
              </option>
              {playerOptions.map((player) => (
                <option key={player.key} value={player.key}>
                  {player.label}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 size-2 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-ink-muted"
            />
          </div>
        </label>
      )}
    </div>
  );
}

function ChampionPool({
  side,
  selected,
}: {
  side: "left" | "right";
  selected?: PlayerMatchupSummary;
}) {
  const championRates =
    selected?.champion_pool
      .map((pick) => ({
        ...pick,
        pick_rate_pct:
          selected.games_played > 0
            ? (pick.games_played / selected.games_played) * 100
            : 0,
      }))
      .sort((a, b) => {
        if (b.pick_rate_pct !== a.pick_rate_pct) {
          return b.pick_rate_pct - a.pick_rate_pct;
        }
        if (b.performance_score !== a.performance_score) {
          return b.performance_score - a.performance_score;
        }
        return a.champion.localeCompare(b.champion);
      })
      .slice(0, 5) ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-stat text-xs text-ink-muted">
          {selected?.player ?? "Player"} champion pool
        </p>
        <p className="font-stat text-xs text-ink-muted">Top 5 pick rates</p>
      </div>
      <div className="flex flex-col gap-2">
        {championRates.map((pick) => (
          <div key={pick.id}>
            <div
              className={`mb-1 flex items-center justify-between gap-3 text-xs ${
                side === "right" ? "flex-row-reverse text-right" : ""
              }`}
            >
              <p
                className={`flex min-w-0 items-center gap-2 text-ink ${
                  side === "right" ? "flex-row-reverse" : ""
                }`}
              >
                <ChampionIcon
                  champion={pick.champion}
                  className="size-6 rounded"
                />
                <span className="truncate">{pick.champion}</span>
              </p>
              <p className="shrink-0 font-stat tabular-nums text-gold">
                {pick.pick_rate_pct.toFixed(1)}%
              </p>
            </div>
            <div
              className={`h-2 overflow-hidden rounded-full bg-white/10 ${
                side === "right" ? "rotate-180" : ""
              }`}
            >
              <div
                className={`h-full rounded-full ${
                  side === "left" ? "bg-blue-side" : "bg-red-side"
                }`}
                style={{ width: `${pick.pick_rate_pct}%` }}
              />
            </div>
            <p
              className={`mt-1 font-stat text-[10px] tabular-nums text-ink-muted ${
                side === "right" ? "text-right" : ""
              }`}
            >
              {pick.games_played} games / {pick.win_rate_pct.toFixed(1)}% win
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PairRadar({
  left,
  right,
  rolePlayers,
}: {
  left: PlayerMatchupSummary;
  right: PlayerMatchupSummary;
  rolePlayers: PlayerMatchupSummary[];
}) {
  const data = radarMetricsForRole(left.position).map((definition) => ({
    metric: definition.metric,
    left: normalizeSummaryMetric(
      rolePlayers,
      left,
      definition.key,
      definition.lowerIsBetter,
    ),
    right: normalizeSummaryMetric(
      rolePlayers,
      right,
      definition.key,
      definition.lowerIsBetter,
    ),
    leftRaw: Number(left[definition.key]),
    rightRaw: Number(right[definition.key]),
    suffix: definition.suffix,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#ffffff1a" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#8a93a3", fontSize: 11 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            formatter={(value, name, item) => {
              const payload = item.payload as PairRadarDatum;
              const raw =
                name === left.player ? payload.leftRaw : payload.rightRaw;

              return [
                `${value}/100 (${formatRawRadarValue(raw, payload.suffix)})`,
                name,
              ];
            }}
            contentStyle={{
              background: "#151c24",
              border: "1px solid #ffffff1a",
              color: "#e6e9ef",
            }}
          />
          <Radar
            name={left.player}
            dataKey="left"
            stroke="#19a7ff"
            fill="#19a7ff"
            fillOpacity={0.2}
          />
          <Radar
            name={right.player}
            dataKey="right"
            stroke="#ff4655"
            fill="#ff4655"
            fillOpacity={0.18}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatRow({
  label,
  left,
  right,
  format,
  lowerIsBetter,
}: {
  label: string;
  left: number;
  right: number;
  format: (value: number) => string;
  lowerIsBetter?: boolean;
}) {
  const winner = compareValues(left, right, lowerIsBetter);

  return (
    <div className="grid grid-cols-[1fr_1.3fr_1fr] items-center border-b border-white/5 py-2 text-sm">
      <p className="text-right font-stat tabular-nums">
        <span className={valueClass(winner, "left")}>{format(left)}</span>
      </p>
      <p className="text-center text-ink-muted">{label}</p>
      <p className="font-stat tabular-nums">
        <span className={valueClass(winner, "right")}>{format(right)}</span>
      </p>
    </div>
  );
}

function EmptyComparison({ selected }: { selected?: PlayerMatchupSummary }) {
  return (
    <div className="border-t border-white/10 px-4 py-10 text-center">
      <p className="font-display text-2xl font-bold tracking-tight text-ink">
        {selected
          ? `Select another ${ROLE_LABELS[selected.position]} player`
          : "Select players to compare"}
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted">
        {selected
          ? "The comparison list is limited to players in the same role."
          : "Start with either side. Once a player is selected, the other list will narrow to matching-role players."}
      </p>
    </div>
  );
}

function toPlayerOptions(players: PlayerMatchupSummary[]): PlayerOption[] {
  return players.map((player) => ({
    key: player.id,
    label: `${player.player}`,
  }));
}

export default function PlayerChampionMatchup({
  matchups,
  playerProfiles,
  teamObjectiveStats,
  assets,
}: {
  matchups: PlayerChampionMatchupProfile[];
  playerProfiles?: PlayerRoleProfile[];
  teamObjectiveStats?: TeamObjectiveStat[];
  assets?: EsportsAssets;
}) {
  const playerSummaries = useMemo(() => {
    const grouped = new Map<string, PlayerChampionMatchupProfile[]>();

    for (const profile of matchups) {
      const key = playerKey(profile);
      const current = grouped.get(key) ?? [];
      current.push(profile);
      grouped.set(key, current);
    }

    const profileByPlayerRole = new Map(
      (playerProfiles ?? []).map((profile) => [
        `${profile.player_id}:${profile.position}`,
        profile,
      ]),
    );
    const objectivesByGameTeam = new Map(
      (teamObjectiveStats ?? []).map((row) => [
        `${row.game_id}:${row.team_id}`,
        row,
      ]),
    );

    return Array.from(grouped.entries())
      .map(([key, picks]) => summarizePlayer(key, picks))
      .map((summary) => {
        const profile = profileByPlayerRole.get(summary.id);
        const objectiveRows = summary.games
          .map((game) =>
            objectivesByGameTeam.get(`${game.game_id}:${game.team_id}`),
          )
          .filter(
            (row): row is TeamObjectiveStat => Boolean(row?.has_objective_stats),
          );
        const objectiveGames = objectiveRows.length;
        const objectiveAverage = (key: keyof TeamObjectiveStat) =>
          objectiveGames > 0
            ? round(
                objectiveRows.reduce(
                  (sum, row) => sum + Number(row[key]),
                  0,
                ) / objectiveGames,
              )
            : 0;

        return {
          ...summary,
          avg_wards_placed: profile?.avg_wards_placed ?? 0,
          avg_wards_killed: profile?.avg_wards_killed ?? 0,
          avg_control_wards_bought: profile?.avg_control_wards_bought ?? 0,
          avg_grubs: objectiveAverage("grubs"),
          avg_heralds: objectiveAverage("heralds"),
          avg_dragons: objectiveAverage("dragons"),
          avg_barons: objectiveAverage("barons"),
          avg_turrets_destroyed: objectiveAverage("turrets_destroyed"),
          has_objective_stats: objectiveGames > 0,
        };
      })
      .sort((a, b) => a.player.localeCompare(b.player));
  }, [matchups, playerProfiles, teamObjectiveStats]);

  const [leftPlayer, setLeftPlayer] = useState("");
  const [rightPlayer, setRightPlayer] = useState("");

  const selectedLeft = playerSummaries.find(
    (profile) => profile.id === leftPlayer,
  );
  const selectedRight = playerSummaries.find(
    (profile) => profile.id === rightPlayer,
  );

  const leftPlayerOptions = useMemo(
    () =>
      toPlayerOptions(
        playerSummaries.filter(
          (player) =>
            player.id !== rightPlayer &&
            (!selectedRight || player.position === selectedRight.position),
        ),
      ),
    [playerSummaries, rightPlayer, selectedRight],
  );
  const rightPlayerOptions = useMemo(
    () =>
      toPlayerOptions(
        playerSummaries.filter(
          (player) =>
            player.id !== leftPlayer &&
            (!selectedLeft || player.position === selectedLeft.position),
        ),
      ),
    [playerSummaries, leftPlayer, selectedLeft],
  );

  const handleLeftPlayerChange = (value: string) => {
    setLeftPlayer(value);

    const nextLeft = playerSummaries.find((player) => player.id === value);
    if (
      value &&
      selectedRight &&
      (!nextLeft ||
        nextLeft.id === selectedRight.id ||
        nextLeft.position !== selectedRight.position)
    ) {
      setRightPlayer("");
    }
  };

  const handleRightPlayerChange = (value: string) => {
    setRightPlayer(value);

    const nextRight = playerSummaries.find((player) => player.id === value);
    if (
      value &&
      selectedLeft &&
      (!nextRight ||
        nextRight.id === selectedLeft.id ||
        nextRight.position !== selectedLeft.position)
    ) {
      setLeftPlayer("");
    }
  };

  if (playerSummaries.length === 0) {
    return (
      <section className="rounded-lg border border-white/10 bg-surface/60 p-5">
        <p className="text-sm text-ink-muted">
          Add player champion data to compare matchup performance.
        </p>
      </section>
    );
  }

  const hasComparison =
    selectedLeft &&
    selectedRight &&
    selectedLeft.id !== selectedRight.id &&
    selectedLeft.position === selectedRight.position;
  const rolePlayers = selectedLeft
    ? playerSummaries.filter(
        (player) => player.position === selectedLeft.position,
      )
    : [];
  const headToHead =
    hasComparison && selectedLeft && selectedRight
      ? headToHeadRecord(selectedLeft, selectedRight)
      : null;
  const statSections =
    selectedLeft?.has_objective_stats || selectedRight?.has_objective_stats
      ? [...STAT_SECTIONS, OBJECTIVE_SECTION]
      : STAT_SECTIONS;

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#11161d]">
      <div className="border-b border-white/10 p-4">
        <p className="font-stat text-xs uppercase text-indigo-300">
          Compare Players
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-white/10 p-4 xl:grid-cols-2">
        <PlayerHeader
          side="left"
          selected={selectedLeft}
          playerValue={leftPlayer}
          playerOptions={leftPlayerOptions}
          assets={assets}
          onPlayerChange={handleLeftPlayerChange}
          onClear={() => setLeftPlayer("")}
        />
        <PlayerHeader
          side="right"
          selected={selectedRight}
          playerValue={rightPlayer}
          playerOptions={rightPlayerOptions}
          assets={assets}
          onPlayerChange={handleRightPlayerChange}
          onClear={() => setRightPlayer("")}
        />
      </div>

      {hasComparison && selectedLeft && selectedRight && headToHead ? (
        <>
          <div className="border-b border-white/10 px-4 py-3 text-center text-sm">
            <div className="rounded border border-indigo-300/40 bg-indigo-300/10 py-2 font-semibold text-ink">
              Head to Head
            </div>
          </div>

          <HeadToHeadWins
            left={selectedLeft}
            right={selectedRight}
            record={headToHead}
          />

          <div className="border-t border-white/10 px-4 py-5">
            <p className="mb-4 rounded bg-white/5 py-2 text-center font-stat text-xs uppercase text-indigo-300">
              Champions Played
            </p>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px_1fr]">
              <ChampionPool side="left" selected={selectedLeft} />
              <div>
                <p className="mb-2 rounded bg-white/5 py-2 text-center font-stat text-xs uppercase text-indigo-300">
                  Role Radar
                </p>
                <PairRadar
                  left={selectedLeft}
                  right={selectedRight}
                  rolePlayers={rolePlayers}
                />
                <div className="mt-2 flex items-center justify-center gap-5 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    <span className="size-2 rounded-sm bg-[#19a7ff]" />
                    {selectedLeft.player}
                  </span>
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    <span className="size-2 rounded-sm bg-[#ff4655]" />
                    {selectedRight.player}
                  </span>
                </div>
              </div>
              <ChampionPool side="right" selected={selectedRight} />
            </div>
          </div>

          <div className="px-4 pb-5">
            {statSections.map((section) => (
              <div key={section.title} className="mt-5">
                <p className="rounded bg-white/5 py-2 text-center font-stat text-xs uppercase text-indigo-300">
                  {section.title}
                </p>
                <div className="mt-2">
                  {section.metrics.map((metric) => (
                    <StatRow
                      key={metric.label}
                      label={metric.label}
                      left={Number(selectedLeft[metric.key])}
                      right={Number(selectedRight[metric.key])}
                      format={metric.format}
                      lowerIsBetter={metric.lowerIsBetter}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyComparison selected={selectedLeft ?? selectedRight} />
      )}
    </section>
  );
}
