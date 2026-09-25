"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TeamProgressPoint } from "@/lib/types";

type TeamProgressChartPoint = TeamProgressPoint & {
  display_match_index?: number;
  is_visual_baseline?: boolean;
  is_neutral_baseline?: boolean;
};

type TeamProgressMetric = "placement" | "gameWinRate";

const TEAM_COLORS = [
  "#2e7de1",
  "#e2483b",
  "#c9a227",
  "#2fbf71",
  "#aeb7c2",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#38bdf8",
  "#facc15",
  "#fb7185",
];

const TEAM_LINE_COLORS: Record<string, string> = {
  "Gen.G": "#cfb67f",
  "Dplus Kia": "#ffffff",
  T1: "#e50026",
  "Hanwha Life Esports": "#f57220",
  KT: "#fe0806",
  "KT Rolster": "#fe0806",
  "BNK FearX": "#f5d603",
  "BNK FEARX": "#f5d603",
  "NS Redforce": "#eb1c27",
  "Nongshim RedForce": "#eb1c27",
  DRX: "#5a8dff",
  "Kiwoom DRX": "#5a8dff",
  "Hanjin Brion": "#04482a",
  "HANJIN BRION": "#04482a",
  "DN SOOPers": "#0d51eb",
};

function formatRecord(wins: number, losses: number) {
  return `${wins}-${losses}`;
}

function teamColor(team: string, index: number) {
  return TEAM_LINE_COLORS[team] ?? TEAM_COLORS[index % TEAM_COLORS.length];
}

function gameWinRateValue(point: TeamProgressChartPoint, team: string) {
  if (point.is_neutral_baseline) return 50;

  const record = point.records[team];
  const games = (record?.game_wins ?? 0) + (record?.game_losses ?? 0);

  if (!record || games === 0) return null;
  return Number(((record.game_wins / games) * 100).toFixed(1));
}

function TeamProgressTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: {
    color?: string;
    name?: string;
    value?: number;
    payload?: TeamProgressChartPoint & { chart_match_index: number };
  }[];
  label?: string | number;
  metric: TeamProgressMetric;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const rows = payload
    .filter((entry) => typeof entry.value === "number")
    .sort((a, b) =>
      metric === "placement"
        ? Number(a.value) - Number(b.value)
        : Number(b.value) - Number(a.value),
    );

  return (
    <div className="min-w-52 rounded border border-white/10 bg-surface p-3 text-xs shadow-xl">
      <p className="font-stat text-ink">
        Match {label}
        {point?.is_visual_baseline ? " / Visual start" : ""}
        {point?.is_neutral_baseline ? " / Neutral start" : ""}
        {point?.date ? ` / ${point.date}` : ""}
      </p>
      <div className="mt-2 flex max-h-52 flex-col gap-1 overflow-y-auto">
        {rows.map((entry) => {
          const record = entry.name ? point?.records[entry.name] : undefined;

          return (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex min-w-0 items-center gap-2 text-ink-muted">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate">{entry.name}</span>
              </span>
              <span className="shrink-0 text-right font-stat tabular-nums text-ink">
                {record
                  ? `${
                      metric === "placement"
                        ? `#${entry.value}`
                        : `${Number(entry.value).toFixed(1)}%`
                    } / ${formatRecord(
                      record.match_wins,
                      record.match_losses,
                    )} match / ${formatRecord(
                      record.game_wins,
                      record.game_losses,
                    )} game`
                  : `#${entry.value}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamProgressChart({
  points,
  teams,
  matchOrderTickStep,
  matchOrderMax,
  metric = "placement",
}: {
  points: TeamProgressChartPoint[];
  teams: string[];
  matchOrderTickStep?: number;
  matchOrderMax?: number;
  metric?: TeamProgressMetric;
}) {
  if (points.length === 0 || teams.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm text-ink-muted">
        No team progression data is available for this scope.
      </div>
    );
  }

  const chartPoints = points.map((point) => ({
    ...point,
    chart_match_index: point.display_match_index ?? point.match_index,
  }));
  const matchOrderTicks =
    matchOrderTickStep && matchOrderTickStep > 0
      ? Array.from(
          new Set([
            0,
            ...chartPoints
              .map((point) => point.chart_match_index)
              .filter(
                (matchIndex) =>
                  matchIndex === 1 ||
                  (matchIndex > 0 && matchIndex % matchOrderTickStep === 0),
              ),
            ...(matchOrderMax ? [matchOrderMax] : []),
          ]),
        )
      : undefined;
  const chartHeight = teams.length >= 10 ? 480 : teams.length <= 5 ? 240 : 420;

  return (
    <div className="rounded-lg border border-white/10 bg-surface/40 p-4">
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartPoints}
            margin={{ top: 12, right: 20, bottom: 10, left: 0 }}
          >
            <CartesianGrid
              stroke="#ffffff1a"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="chart_match_index"
              type="number"
              domain={
                matchOrderTicks ? [0, matchOrderMax ?? "dataMax"] : undefined
              }
              ticks={matchOrderTicks}
              stroke="#8a93a3"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#ffffff1a" }}
              label={{
                value: "Match order",
                position: "insideBottom",
                offset: -4,
                fill: "#8a93a3",
                fontSize: 12,
              }}
            />
            <YAxis
              allowDecimals={false}
              domain={metric === "placement" ? [1, teams.length] : [0, 100]}
              reversed={metric === "placement"}
              stroke="#8a93a3"
              fontSize={12}
              tickFormatter={(value) =>
                metric === "placement" ? `${value}` : `${value}%`
              }
              tickLine={false}
              axisLine={{ stroke: "#ffffff1a" }}
              label={{
                value: metric === "placement" ? "Placement" : "Game WR",
                angle: -90,
                position: "insideLeft",
                fill: "#8a93a3",
                fontSize: 12,
              }}
            />
            <Tooltip content={<TeamProgressTooltip metric={metric} />} />
            {teams.map((team, index) => (
              <Line
                key={team}
                type="monotone"
                dataKey={(point: TeamProgressChartPoint) =>
                  metric === "placement"
                    ? point.values[team]
                    : gameWinRateValue(point, team)
                }
                name={team}
                stroke={teamColor(team, index)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-x-4 gap-y-2">
        {teams.map((team, index) => (
          <span
            key={team}
            className="flex items-center gap-2 text-xs text-ink-muted"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: teamColor(team, index) }}
            />
            {team}
          </span>
        ))}
      </div>
    </div>
  );
}
