import Link from "next/link";
import { DEFAULT_SPLIT_KEY } from "@/lib/queries";
import type { DashboardSplitOption } from "@/lib/types";

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
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-full grid-flow-col auto-cols-fr items-stretch rounded-md border border-white/10 bg-surface/60 p-1">
        {splits.map((split) => {
          const isActive = split.split_key === activeSplitKey;

          return (
            <Link
              key={split.split_key}
              href={hrefFor(basePath, split.split_key)}
              className={`flex h-full min-h-10 items-center justify-center rounded px-4 py-2 text-center font-stat text-xs leading-tight transition-colors ${
                isActive
                  ? "bg-gold text-background"
                  : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              {split.split_label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
