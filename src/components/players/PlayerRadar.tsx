"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PlayerRadarMetric } from "@/lib/types";

export default function PlayerRadar({
  data,
  className = "h-52",
}: {
  data: PlayerRadarMetric[];
  className?: string;
}) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#ffffff1a" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "#8a93a3", fontSize: 10 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const payload = item.payload as PlayerRadarMetric;
              const raw =
                payload.suffix === "%"
                  ? `${payload.raw.toFixed(1)}%`
                  : payload.raw.toFixed(payload.raw % 1 === 0 ? 0 : 1);

              return [`${value}/100 (${raw})`, payload.metric];
            }}
            contentStyle={{
              background: "#151c24",
              border: "1px solid #ffffff1a",
              color: "#e6e9ef",
            }}
            labelStyle={{ color: "#e6e9ef" }}
          />
          <Radar
            dataKey="value"
            stroke="#c9a227"
            fill="#c9a227"
            fillOpacity={0.28}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
