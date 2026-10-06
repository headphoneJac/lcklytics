"use client";

import { useRouter } from "next/navigation";
import type { DashboardSplitOption } from "@/lib/types";

const DEFAULT_SPLIT_KEY = "__all__";

function hrefFor(basePath: string, splitKey: string) {
  if (splitKey === DEFAULT_SPLIT_KEY) return basePath;
  return `${basePath}?split=${encodeURIComponent(splitKey)}`;
}

export default function SplitSelector({
  splits,
  activeSplitKey,
  basePath,
}: {
  splits: DashboardSplitOption[];
  activeSplitKey: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <label className="flex w-full flex-col gap-2 sm:w-60 md:items-end">
      <span className="font-stat text-[0.65rem] uppercase tracking-normal text-ink-muted md:text-right">
        Split
      </span>
      <select
        value={activeSplitKey}
        onChange={(event) => {
          router.push(hrefFor(basePath, event.target.value));
        }}
        className="h-10 w-full rounded-md border border-white/10 bg-surface px-3 font-stat text-xs text-ink outline-none transition-colors hover:border-white/20 focus:border-gold"
      >
        {splits.map((split) => (
          <option key={split.split_key} value={split.split_key}>
            {split.split_label}
          </option>
        ))}
      </select>
    </label>
  );
}
