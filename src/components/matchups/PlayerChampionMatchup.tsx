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
import type { PlayerChampionMatchupProfile, PlayerRole } from "@/lib/types";

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
      {
        label: "Vision Score",
        key: "avg_vision_score",
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
        label: "First Tower %",
        key: "first_tower_pct",
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
];

type Winner = "left" | "right" | "tie";

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  onPlayerChange,
}: {
  side: "left" | "right";
  selected?: PlayerMatchupSummary;
  playerValue: string;
  playerOptions: { key: string; label: string }[];
  onPlayerChange: (value: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-surface/80 p-4">
      <div
        className={`absolute inset-y-0 w-24 opacity-20 ${
          side === "left" ? "right-0 bg-blue-side" : "left-0 bg-red-side"
        }`}
      />
      <div className="relative flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded bg-white/10 font-display text-xl font-bold text-ink">
          {selected ? initials(selected.player) : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl font-bold tracking-tight text-ink">
            {selected?.player ?? "Select player"}
          </h2>
          <p className="text-xs text-ink-muted">
            {selected
              ? `${selected.team} / ${ROLE_LABELS[selected.position]}`
              : "Choose a player"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-stat text-2xl tabular-nums text-gold">
            {selected?.performance_score.toFixed(1) ?? "0.0"}
          </p>
          <p className="text-xs text-ink-muted">score</p>
        </div>
      </div>

      <label className="relative mt-4 block text-xs text-ink-muted">
        Player
        <select
          value={playerValue}
          onChange={(event) => onPlayerChange(event.target.value)}
          className="mt-2 w-full rounded border border-white/10 bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        >
          {playerOptions.map((player) => (
            <option key={player.key} value={player.key}>
              {player.label}
            </option>
          ))}
        </select>
      </label>
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
  const topPicks = selected?.champion_pool.slice(0, 6) ?? [];
  const maxGames = Math.max(...topPicks.map((pick) => pick.games_played), 1);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-stat text-xs text-ink-muted">
          {selected?.player ?? "Player"} champion pool
        </p>
        <p className="font-stat text-xs text-ink-muted">Top picks</p>
      </div>
      <div
        className={`flex h-32 items-end gap-2 ${
          side === "right" ? "justify-end" : ""
        }`}
      >
        {topPicks.map((pick) => (
          <div key={pick.id} className="flex w-12 flex-col items-center gap-2">
            <p className="font-stat text-xs text-ink">{pick.games_played}</p>
            <div
              className={`w-full rounded-t border ${
                side === "left"
                  ? "border-blue-side/40 bg-blue-side/25"
                  : "border-red-side/40 bg-red-side/25"
              }`}
              style={{
                height: `${36 + (pick.games_played / maxGames) * 58}px`,
              }}
            />
            <p className="w-full truncate text-center text-[10px] text-ink-muted">
              {pick.champion}
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
}: {
  left: PlayerMatchupSummary;
  right: PlayerMatchupSummary;
}) {
  const data = [
    ["Score", "performance_score"],
    ["KDA", "kda"],
    ["DPM", "avg_dpm"],
    ["CSM", "avg_cspm"],
    ["GD15", "avg_gd15"],
    ["Vision", "avg_vision_score"],
  ].map(([metric, key]) => {
    const leftValue = Number(left[key as keyof PlayerMatchupSummary]);
    const rightValue = Number(right[key as keyof PlayerMatchupSummary]);
    const max = Math.max(leftValue, rightValue, 1);

    return {
      metric,
      left: Math.max((leftValue / max) * 100, 0),
      right: Math.max((rightValue / max) * 100, 0),
    };
  });

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

export default function PlayerChampionMatchup({
  matchups,
}: {
  matchups: PlayerChampionMatchupProfile[];
}) {
  const playerSummaries = useMemo(() => {
    const grouped = new Map<string, PlayerChampionMatchupProfile[]>();

    for (const profile of matchups) {
      const key = playerKey(profile);
      const current = grouped.get(key) ?? [];
      current.push(profile);
      grouped.set(key, current);
    }

    return Array.from(grouped.entries())
      .map(([key, picks]) => summarizePlayer(key, picks))
      .sort((a, b) => a.player.localeCompare(b.player));
  }, [matchups]);

  const playerOptions = useMemo(
    () =>
      playerSummaries.map((player) => ({
        key: player.id,
        label: player.player,
      })),
    [playerSummaries],
  );

  const initialLeftPlayer = playerOptions[0]?.key ?? "";
  const initialRightPlayer =
    playerOptions.find((player) => player.key !== initialLeftPlayer)?.key ??
    initialLeftPlayer;

  const [leftPlayer, setLeftPlayer] = useState(initialLeftPlayer);
  const [rightPlayer, setRightPlayer] = useState(initialRightPlayer);

  const selectedLeft =
    playerSummaries.find((profile) => profile.id === leftPlayer) ??
    playerSummaries[0];
  const selectedRight =
    playerSummaries.find((profile) => profile.id === rightPlayer) ??
    playerSummaries[1] ??
    playerSummaries[0];

  if (!selectedLeft || !selectedRight) {
    return (
      <section className="rounded-lg border border-white/10 bg-surface/60 p-5">
        <p className="text-sm text-ink-muted">
          Add player champion data to compare matchup performance.
        </p>
      </section>
    );
  }

  const headToHead = headToHeadRecord(selectedLeft, selectedRight);

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
          playerOptions={playerOptions}
          onPlayerChange={setLeftPlayer}
        />
        <PlayerHeader
          side="right"
          selected={selectedRight}
          playerValue={rightPlayer}
          playerOptions={playerOptions}
          onPlayerChange={setRightPlayer}
        />
      </div>

      <div className="grid grid-cols-2 border-b border-white/10 px-4 py-3 text-center text-sm">
        <div className="rounded border border-indigo-300/40 bg-indigo-300/10 py-2 font-semibold text-ink">
          Head to Head
        </div>
        <div className="py-2 text-ink-muted">Overall</div>
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
              General
            </p>
            <PairRadar left={selectedLeft} right={selectedRight} />
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
        {STAT_SECTIONS.map((section) => (
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
    </section>
  );
}
