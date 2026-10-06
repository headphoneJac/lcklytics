"use client";

import { useMemo, useState } from "react";

import { championRowBackgroundStyle } from "@/components/images/row-background";
import type { ChampionProfile } from "@/lib/types";

type SortDirection = "asc" | "desc";

type SortKey =
  | "champion"
  | "roles"
  | "presence_rate_pct"
  | "pick_rate_pct"
  | "ban_rate_pct"
  | "win_rate_pct"
  | "total_kills"
  | "total_deaths"
  | "total_assists"
  | "kda"
  | "avg_dpm"
  | "avg_damage_share"
  | "avg_cspm";

type ChampionColumn = {
  key: SortKey;
  label: string;
  align?: "left" | "right";
  className?: string;
  render: (champion: ChampionProfile) => string | number;
};

const COLUMNS: ChampionColumn[] = [
  {
    key: "champion",
    label: "Champion",
    render: (champion) => champion.champion,
  },
  { key: "roles", label: "Roles", render: (champion) => champion.roles },
  {
    key: "presence_rate_pct",
    label: "Presence%",
    align: "right",
    className: "text-gold",
    render: (champion) => champion.presence_rate_pct,
  },
  {
    key: "pick_rate_pct",
    label: "Pick%",
    align: "right",
    render: (champion) => champion.pick_rate_pct,
  },
  {
    key: "ban_rate_pct",
    label: "Ban%",
    align: "right",
    render: (champion) => champion.ban_rate_pct,
  },
  {
    key: "win_rate_pct",
    label: "Win%",
    align: "right",
    render: (champion) => champion.win_rate_pct,
  },
  {
    key: "total_kills",
    label: "Kills",
    align: "right",
    className: "text-ink",
    render: (champion) => champion.total_kills,
  },
  {
    key: "total_deaths",
    label: "Deaths",
    align: "right",
    render: (champion) => champion.total_deaths,
  },
  {
    key: "total_assists",
    label: "Assists",
    align: "right",
    className: "text-ink",
    render: (champion) => champion.total_assists,
  },
  {
    key: "kda",
    label: "KDA",
    align: "right",
    className: "text-gold",
    render: (champion) => champion.kda,
  },
  {
    key: "avg_dpm",
    label: "DPM",
    align: "right",
    render: (champion) => champion.avg_dpm,
  },
  {
    key: "avg_damage_share",
    label: "DMG%",
    align: "right",
    render: (champion) => champion.avg_damage_share,
  },
  {
    key: "avg_cspm",
    label: "CS/min",
    align: "right",
    render: (champion) => champion.avg_cspm,
  },
];

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatColumnValue(champion: ChampionProfile, key: SortKey) {
  if (key === "presence_rate_pct") return formatPct(champion.presence_rate_pct);
  if (key === "pick_rate_pct") return formatPct(champion.pick_rate_pct);
  if (key === "ban_rate_pct") return formatPct(champion.ban_rate_pct);
  if (key === "win_rate_pct") {
    return champion.picks ? formatPct(champion.win_rate_pct) : "-";
  }
  if (key === "kda") return champion.picks ? champion.kda.toFixed(2) : "-";
  if (key === "avg_dpm") return champion.picks ? champion.avg_dpm : "-";
  if (key === "avg_damage_share") {
    return champion.picks ? formatPct(champion.avg_damage_share) : "-";
  }
  if (key === "avg_cspm") {
    return champion.picks ? champion.avg_cspm.toFixed(1) : "-";
  }

  return String(champion[key]);
}

function getCellTitle(champion: ChampionProfile, key: SortKey) {
  if (key === "presence_rate_pct") {
    return `${champion.presence} total pick/ban presences`;
  }
  if (key === "pick_rate_pct") return `${champion.picks} picks`;
  if (key === "ban_rate_pct") return `${champion.bans} bans`;
  if (key === "win_rate_pct") {
    return champion.picks
      ? `${champion.wins}-${champion.picks - champion.wins} record`
      : "No recorded picks";
  }

  return undefined;
}

function sortValue(champion: ChampionProfile, key: SortKey) {
  if (key === "champion" || key === "roles") return champion[key];
  return Number(champion[key]);
}

function compareChampions(
  a: ChampionProfile,
  b: ChampionProfile,
  key: SortKey,
) {
  const valueA = sortValue(a, key);
  const valueB = sortValue(b, key);

  if (typeof valueA === "string" || typeof valueB === "string") {
    return String(valueA).localeCompare(String(valueB));
  }

  if (valueA !== valueB) return valueA - valueB;
  return a.champion.localeCompare(b.champion);
}

export default function ChampionStatsTable({
  champions,
}: {
  champions: ChampionProfile[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("presence_rate_pct");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const sortedChampions = useMemo(() => {
    return [...champions].sort((a, b) => {
      const result = compareChampions(a, b, sortKey);
      return sortDirection === "asc" ? result : -result;
    });
  }, [champions, sortDirection, sortKey]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "champion" || key === "roles" ? "asc" : "desc");
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[1080px] text-sm">
        <colgroup>
          <col className="w-11" />
          <col className="w-48" />
          <col className="w-28" />
          {COLUMNS.slice(2).map((column) => (
            <col key={column.key} className="w-20" />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 text-left text-ink-muted">
            <th className="pr-3"></th>
            {COLUMNS.map((column) => {
              const isActive = column.key === sortKey;
              const sortMark = isActive
                ? sortDirection === "asc"
                  ? "↑"
                  : "↓"
                : "";

              return (
                <th
                  key={column.key}
                  className={`py-2 font-normal ${
                    column.align === "right" ? "text-right" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className={`inline-flex items-center gap-1 transition-colors hover:text-ink focus:text-ink focus:outline-none ${
                      column.align === "right" ? "justify-end" : ""
                    } ${isActive ? "text-gold" : ""}`}
                    title={`Sort by ${column.label}`}
                  >
                    <span>{column.label}</span>
                    <span className="w-3 text-[10px]">{sortMark}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="font-stat tabular-nums">
          {sortedChampions.map((champion, index) => (
            <tr key={champion.champion} className="border-b border-white/5">
              <td className="w-11 pr-3 text-right text-ink-muted">
                {index + 1}
              </td>
              <td
                className="asset-bg-name-cell asset-bg-champion-cell py-2 pl-2 font-body"
                style={championRowBackgroundStyle(champion.champion)}
              >
                <span className="flex items-center gap-2">
                  <span>{champion.champion}</span>
                </span>
              </td>
              {COLUMNS.slice(1).map((column) => {
                const title = getCellTitle(champion, column.key);

                return (
                  <td
                    key={`${champion.champion}-${column.key}`}
                    title={title}
                    className={`py-2 ${
                      column.align === "right" ? "text-right" : "font-body"
                    } ${column.className ?? "text-ink-muted"} ${
                      title ? "cursor-help" : ""
                    }`}
                  >
                    {formatColumnValue(champion, column.key)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
