import type { PlayerRole } from "@/lib/types";

export const ROLE_LABELS: Record<PlayerRole, string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  bot: "Bot",
  sup: "Support",
};

export function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatRecord(wins: number, games: number) {
  return `${wins}-${games - wins}`;
}

export function formatMatchRecord({
  match_wins,
  match_losses,
}: {
  match_wins: number;
  match_losses: number;
}) {
  return `${match_wins}-${match_losses}`;
}

export function formatDelta(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pp`;
}

export function formatShortDate(date: string) {
  if (!date) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural: string,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}
