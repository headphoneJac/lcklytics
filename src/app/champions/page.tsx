import SplitSelector from "@/components/SplitSelector";
import {
  DEFAULT_SPLIT_KEY,
  getChampionProfiles,
  getTeamSplitOptions,
} from "@/lib/queries";
import {
  getSplitLabel,
  resolveSplitKey,
  type SplitSearchParams,
} from "@/lib/splits";
import type { ChampionProfile } from "@/lib/types";

type ChampionStatKey = "picks" | "bans" | "presence" | "avg_dpm";

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatValue(champion: ChampionProfile, statKey: ChampionStatKey) {
  if (statKey === "presence") {
    return `${champion.presence} / ${formatPct(champion.presence_rate_pct)}`;
  }

  if (statKey === "picks") {
    return `${champion.picks} / ${formatPct(champion.pick_rate_pct)}`;
  }

  if (statKey === "bans") {
    return `${champion.bans} / ${formatPct(champion.ban_rate_pct)}`;
  }

  return String(champion.avg_dpm);
}

function pickTop(
  champions: ChampionProfile[],
  statKey: ChampionStatKey,
  limit = 5,
) {
  return [...champions]
    .filter((champion) => statKey !== "avg_dpm" || champion.picks > 0)
    .sort((a, b) => {
      if (b[statKey] !== a[statKey]) return b[statKey] - a[statKey];
      if (b.presence !== a.presence) return b.presence - a.presence;
      if (b.picks !== a.picks) return b.picks - a.picks;
      return a.champion.localeCompare(b.champion);
    })
    .slice(0, limit);
}

function Leaderboard({
  title,
  champions,
  statKey,
  accentClass = "text-gold",
}: {
  title: string;
  champions: ChampionProfile[];
  statKey: ChampionStatKey;
  accentClass?: string;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-ink-muted">
            <th className="py-2 font-normal">Champion</th>
            <th className="py-2 text-right font-normal">Value</th>
          </tr>
        </thead>
        <tbody className="font-stat tabular-nums">
          {champions.map((champion, index) => (
            <tr key={champion.champion} className="border-b border-white/5">
              <td className="py-2 font-body">
                <span className="mr-2 text-ink-muted">{index + 1}</span>
                {champion.champion}
              </td>
              <td className={`py-2 text-right ${accentClass}`}>
                {formatValue(champion, statKey)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ChampionsPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const requestedSplitKey = await resolveSplitKey(searchParams);
  const splits = getTeamSplitOptions();
  const splitKey = splits.some((split) => split.split_key === requestedSplitKey)
    ? requestedSplitKey
    : DEFAULT_SPLIT_KEY;
  const champions = await getChampionProfiles(splitKey);
  const currentSplit = getSplitLabel(splits, splitKey);
  const picked = champions.filter((champion) => champion.picks > 0).length;
  const banned = champions.filter((champion) => champion.bans > 0).length;

  return (
    <div className="flex flex-col gap-10">
      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/champions"
      />

      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-sm text-ink-muted">Champions</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">
            LCK Champion Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Pick, ban, presence, and performance stats for every champion seen
            in draft or on the Rift.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="border-l border-white/10 pl-4">
          <p className="text-xs uppercase text-ink-muted">Champions picked</p>
          <p className="mt-2 font-stat text-2xl tabular-nums text-gold">
            {picked}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            At least one recorded pick.
          </p>
        </div>
        <div className="border-l border-white/10 pl-4">
          <p className="text-xs uppercase text-ink-muted">Champions banned</p>
          <p className="mt-2 font-stat text-2xl tabular-nums text-red-side">
            {banned}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            At least one recorded ban.
          </p>
        </div>
        <div className="border-l border-white/10 pl-4">
          <p className="text-xs uppercase text-ink-muted">Draft pool</p>
          <p className="mt-2 font-stat text-2xl tabular-nums text-ink">
            {champions.length}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Picked or banned champions.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Leaderboard
          title="Most Picked"
          champions={pickTop(champions, "picks")}
          statKey="picks"
          accentClass="text-blue-side"
        />
        <Leaderboard
          title="Most Banned"
          champions={pickTop(champions, "bans")}
          statKey="bans"
          accentClass="text-red-side"
        />
        <Leaderboard
          title="Highest Presence"
          champions={pickTop(champions, "presence")}
          statKey="presence"
        />
        <Leaderboard
          title="Highest DPM"
          champions={pickTop(champions, "avg_dpm")}
          statKey="avg_dpm"
        />
      </section>

      <section>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              All Champion Stats
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Includes champions that were picked, banned, or both.
            </p>
          </div>
          <p className="font-stat text-xs text-ink-muted">
            {champions.length} champions
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1160px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-ink-muted">
                <th className="py-2 font-normal">Champion</th>
                <th className="py-2 font-normal">Roles</th>
                <th className="py-2 text-right font-normal">Picks</th>
                <th className="py-2 text-right font-normal">Bans</th>
                <th className="py-2 text-right font-normal">Presence</th>
                <th className="py-2 text-right font-normal">Pick%</th>
                <th className="py-2 text-right font-normal">Ban%</th>
                <th className="py-2 text-right font-normal">Presence%</th>
                <th className="py-2 text-right font-normal">Win%</th>
                <th className="py-2 text-right font-normal">Kills</th>
                <th className="py-2 text-right font-normal">Deaths</th>
                <th className="py-2 text-right font-normal">Assists</th>
                <th className="py-2 text-right font-normal">KDA</th>
                <th className="py-2 text-right font-normal">DPM</th>
                <th className="py-2 text-right font-normal">DMG%</th>
                <th className="py-2 text-right font-normal">CS/min</th>
              </tr>
            </thead>
            <tbody className="font-stat tabular-nums">
              {champions.map((champion, index) => (
                <tr key={champion.champion} className="border-b border-white/5">
                  <td className="py-2 font-body">
                    <span className="mr-2 text-ink-muted">{index + 1}</span>
                    {champion.champion}
                  </td>
                  <td className="py-2 font-body text-ink-muted">
                    {champion.roles}
                  </td>
                  <td className="py-2 text-right text-blue-side">
                    {champion.picks}
                  </td>
                  <td className="py-2 text-right text-red-side">
                    {champion.bans}
                  </td>
                  <td className="py-2 text-right text-gold">
                    {champion.presence}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {formatPct(champion.pick_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {formatPct(champion.ban_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-gold">
                    {formatPct(champion.presence_rate_pct)}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {champion.picks ? formatPct(champion.win_rate_pct) : "—"}
                  </td>
                  <td className="py-2 text-right">{champion.total_kills}</td>
                  <td className="py-2 text-right text-ink-muted">
                    {champion.total_deaths}
                  </td>
                  <td className="py-2 text-right">{champion.total_assists}</td>
                  <td className="py-2 text-right text-gold">
                    {champion.picks ? champion.kda.toFixed(2) : "—"}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {champion.picks ? champion.avg_dpm : "—"}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {champion.picks
                      ? formatPct(champion.avg_damage_share)
                      : "—"}
                  </td>
                  <td className="py-2 text-right text-ink-muted">
                    {champion.picks ? champion.avg_cspm.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
