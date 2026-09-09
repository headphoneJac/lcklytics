import PlayerChampionMatchup from "@/components/matchups/PlayerChampionMatchup";
import SplitSelector from "@/components/SplitSelector";
import { getPlayerChampionMatchups, getSplitOptions } from "@/lib/queries";
import { getSplitLabel, resolveSplitKey, type SplitSearchParams } from "@/lib/splits";

export default async function MatchupsPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const splitKey = await resolveSplitKey(searchParams);
  const [splits, matchups] = await Promise.all([
    getSplitOptions(),
    getPlayerChampionMatchups(splitKey),
  ]);
  const currentSplit = getSplitLabel(splits, splitKey);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-sm text-ink-muted">Matchups</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">
            Player Pick Comparison
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Compare two players by selecting champions they actually played,
            then see which pick produced the stronger performance profile.
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </section>

      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/matchups"
      />

      <PlayerChampionMatchup matchups={matchups} />
    </div>
  );
}
