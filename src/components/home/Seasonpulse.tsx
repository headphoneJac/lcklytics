"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { SplitGoldSwing, RecentGame, GameDraft } from "@/lib/types";

export function GoldSwingChart({ data }: { data: SplitGoldSwing[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Lane Decisiveness by Split
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Average gold swing between lane opponents at 15 minutes — higher means
        more decisive laning phases.
      </p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff1a"
              vertical={false}
            />
            <XAxis dataKey="split" stroke="#8a93a3" fontSize={12} />
            <YAxis stroke="#8a93a3" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#151c24",
                border: "1px solid #ffffff1a",
              }}
              labelStyle={{ color: "#e6e9ef" }}
            />
            <Bar
              dataKey="avg_lane_gold_swing_at_15"
              fill="#c9a227"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Both the matchup line and the draft columns below it share this exact
// grid template, so a team's picks/bans line up directly under its name
// regardless of how long either team's name is.
const MATCHUP_GRID = "grid grid-cols-[1fr_auto_1fr]";

function DraftColumn({
  draft,
  accentClass,
  align,
}: {
  draft?: GameDraft;
  accentClass: string;
  align: "left" | "right";
}) {
  if (!draft) return <div />;
  const alignClass = align === "right" ? "text-right" : "text-left";
  return (
    <div className={alignClass}>
      <p className={`font-medium ${accentClass}`}>Picks</p>
      <p className="mt-1 text-ink">{draft.picks.filter(Boolean).join(" · ")}</p>
      <p className="mt-2 font-medium text-ink-muted">Bans</p>
      <p className="mt-1 text-ink-muted">
        {draft.bans.filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}

export function RecentGames({ games }: { games: RecentGame[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Recent Games
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {games.map((game) => {
          const blue = game.sides.find((s) => s.side === "Blue");
          const red = game.sides.find((s) => s.side === "Red");
          const blueDraft = game.drafts.find((d) => d.side === "Blue");
          const redDraft = game.drafts.find((d) => d.side === "Red");

          return (
            <div
              key={game.game_id}
              className="rounded-lg border border-white/10 bg-surface/60 p-4"
            >
              <p className="text-center text-xs text-ink-muted">{game.split}</p>

              <div
                className={`mt-1 ${MATCHUP_GRID} items-center gap-3 text-sm`}
              >
                <span
                  className={`text-right ${
                    blue?.result
                      ? "font-medium text-blue-side"
                      : "text-ink-muted"
                  }`}
                >
                  {blue?.teams?.name ?? "TBD"}
                </span>
                <span className="font-stat text-xs text-ink-muted">vs</span>
                <span
                  className={
                    red?.result ? "font-medium text-red-side" : "text-ink-muted"
                  }
                >
                  {red?.teams?.name ?? "TBD"}
                </span>
              </div>

              <div
                className={`mt-3 ${MATCHUP_GRID} gap-3 border-t border-white/5 pt-3 text-xs`}
              >
                <DraftColumn
                  draft={blueDraft}
                  accentClass="text-blue-side"
                  align="right"
                />
                <div className="w-px bg-white/5" />
                <DraftColumn
                  draft={redDraft}
                  accentClass="text-red-side"
                  align="left"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
