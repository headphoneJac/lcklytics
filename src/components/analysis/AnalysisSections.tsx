"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  championRowBackgroundStyle,
  teamRowBackgroundStyle,
} from "@/components/images/row-background";
import type { EsportsAssets } from "@/lib/assets";
import type {
  ChampionProfile,
  PlayerRole,
  PlayerRoleProfile,
  TeamSideProfile,
} from "@/lib/types";
import type {
  AggregateWinRate,
  DraftPayoffChampion,
  DraftPayoffQuadrants as DraftPayoffQuadrantsData,
  ObjectiveIdentityRanking,
  TeamFormMover,
  TeamFormMovers as TeamFormMoversData,
} from "@/lib/analysis";
import {
  formatDelta,
  formatMatchRecord,
  formatPct,
  formatRecord,
  ROLE_LABELS,
} from "@/components/analysis/format";

const TAB_FADE_MS = 180;

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-stat text-sm text-ink-muted">{eyebrow}</p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">{description}</p>
      </div>
    </div>
  );
}

function useFadingTab(initialId: string) {
  const [activeId, setActiveId] = useState(initialId);
  const [isVisible, setIsVisible] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const selectTab = useCallback(
    (nextId: string) => {
      if (nextId === activeId) return;

      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }

      setIsVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setActiveId(nextId);
        requestAnimationFrame(() => setIsVisible(true));
      }, TAB_FADE_MS);
    },
    [activeId],
  );

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  return { activeId, isVisible, selectTab };
}

function FadingTabPanel({
  isVisible,
  children,
}: {
  isVisible: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`transition-opacity duration-[180ms] motion-reduce:transition-none ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  detail,
  accentClass = "text-gold",
}: {
  label: string;
  value: string;
  detail: string;
  accentClass?: string;
}) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <p className={`mt-2 font-stat text-2xl tabular-nums ${accentClass}`}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">{detail}</p>
    </div>
  );
}

function impactRead(primary: AggregateWinRate, secondary: AggregateWinRate) {
  const delta = primary.rate - secondary.rate;

  if (primary.games === 0 && secondary.games === 0) {
    return "No games found for this scope.";
  }

  if (delta === 0) {
    return "No win-rate edge in the loaded games.";
  }

  const leader = delta > 0 ? primary : secondary;

  return `${leader.label} is ahead by ${formatDelta(Math.abs(delta))}.`;
}

function WinShareComparisonBar({
  primary,
  secondary,
}: {
  primary: AggregateWinRate;
  secondary: AggregateWinRate;
}) {
  const totalWins = primary.wins + secondary.wins;
  const primaryShare = totalWins > 0 ? (primary.wins / totalWins) * 100 : 50;
  const secondaryShare =
    totalWins > 0 ? (secondary.wins / totalWins) * 100 : 50;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 text-xs">
        <div>
          <p className="text-ink-muted">{primary.label}</p>
          <p className={`mt-1 font-stat tabular-nums ${primary.textClass}`}>
            {primary.wins} wins / {formatPct(primary.rate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-ink-muted">{secondary.label}</p>
          <p className={`mt-1 font-stat tabular-nums ${secondary.textClass}`}>
            {secondary.wins} wins / {formatPct(secondary.rate)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full ${primary.barClass}`}
          style={{ width: `${primaryShare}%` }}
          title={`${primary.label}: ${primary.wins} wins`}
        />
        <div
          className={`h-full ${secondary.barClass}`}
          style={{ width: `${secondaryShare}%` }}
          title={`${secondary.label}: ${secondary.wins} wins`}
        />
      </div>
    </div>
  );
}

export function AggregateImpactCard({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: AggregateWinRate;
  secondary: AggregateWinRate;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-surface/40 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
        </div>
        <p className="shrink-0 font-stat text-sm tabular-nums text-gold">
          {impactRead(primary, secondary)}
        </p>
      </div>
      <div className="mt-4">
        <WinShareComparisonBar primary={primary} secondary={secondary} />
      </div>
    </article>
  );
}

function TeamMovementRow({
  mover,
  rank,
  assets,
}: {
  mover: TeamFormMover;
  rank: number;
  assets?: EsportsAssets;
}) {
  const deltaClass =
    mover.deltaPct > 0
      ? "text-green"
      : mover.deltaPct < 0
        ? "text-red-side"
        : "text-ink-muted";
  const deltaLabel =
    mover.deltaPct === 0 ? "Even" : formatDelta(mover.deltaPct);

  return (
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 border-b border-white/5 py-3 last:border-b-0 md:grid-cols-[1.5rem_minmax(0,1fr)_minmax(18rem,0.9fr)] md:items-center">
      <p className="font-stat text-sm text-ink-muted">{rank}</p>
      <div
        className="asset-bg-name-cell min-w-0 py-1 font-body"
        style={teamRowBackgroundStyle(mover.team, assets)}
      >
        <p className="truncate text-sm font-semibold text-ink">{mover.team}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {formatRecord(mover.recentWins, mover.recentGames)} recent over{" "}
          {mover.recentGames} games
        </p>
      </div>
      <div className="col-start-2 grid grid-cols-3 gap-3 md:col-start-auto">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Recent
          </p>
          <p className="mt-1 font-stat text-sm tabular-nums text-ink">
            {formatPct(mover.recentWinRatePct)}
          </p>
        </div>
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Overall
          </p>
          <p className="mt-1 font-stat text-sm tabular-nums text-ink-muted">
            {formatPct(mover.overallWinRatePct)}
          </p>
        </div>
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Delta
          </p>
          <p className={`mt-1 font-stat text-sm tabular-nums ${deltaClass}`}>
            {deltaLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

function TabList({
  tabs,
  activeId,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number; accentClass?: string }[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="ml-auto flex w-fit max-w-full overflow-x-auto rounded-md border border-white/10 bg-black/10">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 px-3 py-2 text-left font-stat text-xs uppercase tracking-[0.12em] transition-colors ${
              isActive
                ? "bg-gold text-bg"
                : "text-ink-muted hover:bg-white/10 hover:text-ink focus:bg-white/10 focus:text-ink focus:outline-none"
            }`}
          >
            <span className={isActive ? "" : tab.accentClass}>{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span className="ml-2 opacity-70">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function TeamMovementPanel({
  title,
  description,
  movers,
  assets,
}: {
  title: string;
  description: string;
  movers: TeamFormMover[];
  assets?: EsportsAssets;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-surface/40 p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
            {title}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
            {description}
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          {movers.length} teams
        </p>
      </div>
      {movers.length > 0 ? (
        <div className="mt-4">
          {movers.map((mover, index) => (
            <TeamMovementRow
              key={mover.team}
              mover={mover}
              rank={index + 1}
              assets={assets}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">
          No movement signal for this scope yet.
        </p>
      )}
    </article>
  );
}

function ObjectiveRankingPanel({
  ranking,
  assets,
}: {
  ranking: ObjectiveIdentityRanking;
  assets?: EsportsAssets;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-surface/40 p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
            {ranking.title}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
            {ranking.description}
          </p>
        </div>
        <p className={`font-stat text-sm tabular-nums ${ranking.accentClass}`}>
          Top {ranking.leaders.length}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {ranking.leaders.map((leader, index) => (
          <div
            key={`${ranking.title}-${leader.team}`}
            className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/10 bg-black/10 p-3"
          >
            <span className="font-stat text-sm text-ink-muted">
              {index + 1}
            </span>
            <div
              className="asset-bg-name-cell min-w-0 py-1 font-body"
              style={teamRowBackgroundStyle(leader.team, assets)}
            >
              <p className="truncate text-sm font-semibold text-ink">
                {leader.team}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {leader.detail}
              </p>
            </div>
            <p
              className={`font-stat text-sm tabular-nums ${ranking.accentClass}`}
            >
              {leader.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function DraftPayoffRow({
  champion,
  rank,
}: {
  champion: DraftPayoffChampion;
  rank: number;
}) {
  const sampleClass = champion.picks >= 5 ? "text-green" : "text-ink-muted";

  return (
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 border-b border-white/5 py-3 last:border-b-0 md:grid-cols-[1.5rem_minmax(0,1fr)_repeat(3,6rem)] md:items-center">
      <p className="font-stat text-sm text-ink-muted">{rank}</p>
      <div
        className="asset-bg-name-cell min-w-0 py-1 font-body"
        style={championRowBackgroundStyle(champion.champion)}
      >
        <p className="truncate text-sm font-semibold text-ink">
          {champion.champion}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {champion.roles} / {champion.detail}
        </p>
      </div>
      <div className="col-start-2 grid grid-cols-3 gap-3 md:col-start-auto md:contents">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted md:hidden">
            Presence
          </p>
          <p className="font-stat text-sm tabular-nums text-gold md:text-right">
            {formatPct(champion.presenceRatePct)}
          </p>
        </div>
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted md:hidden">
            Win
          </p>
          <p className="font-stat text-sm tabular-nums text-ink-muted md:text-right">
            {formatPct(champion.winRatePct)}
          </p>
        </div>
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted md:hidden">
            Sample
          </p>
          <p className={`font-stat text-sm tabular-nums md:text-right ${sampleClass}`}>
            {champion.picks}P
          </p>
        </div>
      </div>
    </div>
  );
}

function DraftPayoffPanel({
  title,
  description,
  champions,
  accentClass,
}: {
  title: string;
  description: string;
  champions: DraftPayoffChampion[];
  accentClass: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-surface/40 p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3
            className={`font-display text-2xl font-bold tracking-tight ${accentClass}`}
          >
            {title}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
            {description}
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          {champions.length} champions
        </p>
      </div>
      {champions.length > 0 ? (
        <div className="mt-4">
          <div className="hidden grid-cols-[1.5rem_minmax(0,1fr)_repeat(3,6rem)] gap-3 border-b border-white/10 pb-2 text-sm text-ink-muted md:grid">
            <span></span>
            <span>Champion</span>
            <span className="text-right">Presence</span>
            <span className="text-right">Win%</span>
            <span className="text-right">Sample</span>
          </div>
          {champions.map((champion, index) => (
            <DraftPayoffRow
              key={champion.champion}
              champion={champion}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">
          No champions match this quadrant in the selected scope.
        </p>
      )}
    </article>
  );
}

export function TeamFormMovers({
  movers,
  assets,
}: {
  movers: TeamFormMoversData;
  assets?: EsportsAssets;
}) {
  const tabs = [
    {
      id: "risers",
      label: "Risers",
      description:
        "Recent game win rate is running ahead of the full-scope baseline.",
      movers: movers.risers,
      accentClass: "text-green",
    },
    {
      id: "fallers",
      label: "Fallers",
      description: "Recent form has dipped below the full-scope baseline.",
      movers: movers.fallers,
      accentClass: "text-red-side",
    },
    {
      id: "steady",
      label: "Most Stable",
      description: "Recent form is closest to the full-scope expectation.",
      movers: movers.steady,
      accentClass: "text-gold",
    },
  ];
  const {
    activeId,
    isVisible: isPanelVisible,
    selectTab,
  } = useFadingTab(tabs[0].id);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <TabList
          tabs={tabs.map((tab) => ({
            id: tab.id,
            label: tab.label,
            count: tab.movers.length,
            accentClass: tab.accentClass,
          }))}
          activeId={activeId}
          onChange={selectTab}
        />
      </div>
      <FadingTabPanel isVisible={isPanelVisible}>
        <TeamMovementPanel
          title={activeTab.label}
          description={activeTab.description}
          movers={activeTab.movers}
          assets={assets}
        />
      </FadingTabPanel>
    </div>
  );
}

export function ObjectiveIdentityRankings({
  rankings,
  assets,
}: {
  rankings: ObjectiveIdentityRanking[];
  assets?: EsportsAssets;
}) {
  const {
    activeId,
    isVisible: isPanelVisible,
    selectTab,
  } = useFadingTab(rankings[0]?.title ?? "");
  const activeRanking =
    rankings.find((ranking) => ranking.title === activeId) ?? rankings[0];

  if (!activeRanking) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <TabList
          tabs={rankings.map((ranking) => ({
            id: ranking.title,
            label: ranking.title,
            count: ranking.leaders.length,
            accentClass: ranking.accentClass,
          }))}
          activeId={activeRanking.title}
          onChange={selectTab}
        />
      </div>
      <FadingTabPanel isVisible={isPanelVisible}>
        <ObjectiveRankingPanel ranking={activeRanking} assets={assets} />
      </FadingTabPanel>
    </div>
  );
}

export function DraftPayoffQuadrants({
  quadrants,
}: {
  quadrants: DraftPayoffQuadrantsData;
}) {
  const tabs = [
    {
      id: "high-pressure-high-payoff",
      label: "Pressure + Payoff",
      title: "High Pressure / High Payoff",
      description: "Priority champions that are also winning when picked.",
      champions: quadrants.highPressureHighPayoff,
      accentClass: "text-green",
    },
    {
      id: "high-pressure-low-payoff",
      label: "Pressure Trap",
      title: "High Pressure / Low Payoff",
      description: "Champions drawing draft attention without converting picks.",
      champions: quadrants.highPressureLowPayoff,
      accentClass: "text-red-side",
    },
    {
      id: "low-pressure-high-payoff",
      label: "Quiet Hits",
      title: "Low Pressure / High Payoff",
      description: "Lower-presence picks creating outsized results.",
      champions: quadrants.lowPressureHighPayoff,
      accentClass: "text-blue-side",
    },
    {
      id: "ban-traps",
      label: "Ban Traps",
      title: "Ban Traps",
      description:
        "Champions banned far more often than they are actually played.",
      champions: quadrants.banTraps,
      accentClass: "text-gold",
    },
  ];
  const {
    activeId,
    isVisible: isPanelVisible,
    selectTab,
  } = useFadingTab(tabs[0].id);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <TabList
          tabs={tabs.map((tab) => ({
            id: tab.id,
            label: tab.label,
            count: tab.champions.length,
            accentClass: tab.accentClass,
          }))}
          activeId={activeId}
          onChange={selectTab}
        />
      </div>
      <FadingTabPanel isVisible={isPanelVisible}>
        <DraftPayoffPanel
          title={activeTab.title}
          description={activeTab.description}
          champions={activeTab.champions}
          accentClass={activeTab.accentClass}
        />
      </FadingTabPanel>
    </div>
  );
}

function TeamIdentity({ team }: { team?: TeamSideProfile }) {
  if (!team || team.side_delta_pct === null || team.side_delta_pct === 0) {
    return <span className="text-ink-muted">Balanced profile</span>;
  }

  const side = team.side_delta_pct > 0 ? "Blue" : "Red";

  return (
    <span className={side === "Blue" ? "text-blue-side" : "text-red-side"}>
      {side} side {formatDelta(Math.abs(team.side_delta_pct))}
    </span>
  );
}

function PickOrderIdentity({ team }: { team?: TeamSideProfile }) {
  if (!team) {
    return <span className="text-ink-muted">No pick-order sample</span>;
  }

  const delta = team.first_pick_win_rate_pct - team.second_pick_win_rate_pct;

  if (delta === 0) {
    return <span className="text-ink-muted">Even pick order</span>;
  }

  const favoredOrder = delta > 0 ? "First pick" : "Second pick";

  return (
    <span className={delta > 0 ? "text-gold" : "text-silver"}>
      {favoredOrder} {formatDelta(Math.abs(delta))}
    </span>
  );
}

export function TeamFormPickOrderTable({
  teams,
  assets,
}: {
  teams: TeamSideProfile[];
  assets?: EsportsAssets;
}) {
  return (
    <div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-ink-muted">
              <th></th>
              <th className="py-2 font-normal">Team</th>
              <th className="py-2 text-right font-normal">Match Record</th>
              <th className="py-2 text-right font-normal">Game Record</th>
              <th className="py-2 text-right font-normal">Game WR</th>
              <th className="py-2 text-right font-normal">Blue</th>
              <th className="py-2 text-right font-normal">Red</th>
              <th className="py-2 text-right font-normal">First Pick</th>
              <th className="py-2 text-right font-normal">Second Pick</th>
              <th className="py-2 text-right font-normal">Side Read</th>
              <th className="py-2 text-right font-normal">Pick Read</th>
            </tr>
          </thead>
          <tbody className="font-stat tabular-nums">
            {teams.map((team, index) => (
              <tr key={team.team} className="border-b border-white/5">
                <td className="w-5 text-ink-muted">{index + 1}</td>
                <td
                  className="asset-bg-name-cell py-2 font-body"
                  style={teamRowBackgroundStyle(team.team, assets)}
                >
                  <span className="flex items-center gap-2">{team.team}</span>
                </td>
                <td className="py-2 text-right text-gold">
                  {formatMatchRecord(team)}
                </td>
                <td className="py-2 text-right">
                  {team.game_wins}-{team.game_losses}
                </td>
                <td className="py-2 text-right text-ink-muted">
                  {formatPct(team.win_rate_pct)}
                </td>
                <td className="py-2 text-right text-blue-side">
                  {formatPct(team.blue_win_rate_pct)}
                </td>
                <td className="py-2 text-right text-red-side">
                  {formatPct(team.red_win_rate_pct)}
                </td>
                <td className="py-2 text-right text-gold">
                  {formatPct(team.first_pick_win_rate_pct)}
                </td>
                <td className="py-2 text-right text-silver">
                  {formatPct(team.second_pick_win_rate_pct)}
                </td>
                <td className="py-2 text-right">
                  <TeamIdentity team={team} />
                </td>
                <td className="py-2 text-right">
                  <PickOrderIdentity team={team} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RolePlayerBoards({
  roleGroups,
  assets,
}: {
  roleGroups: { role: PlayerRole; players: PlayerRoleProfile[] }[];
  assets?: EsportsAssets;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {roleGroups.map(({ role, players }) => (
        <article
          key={role}
          className="rounded-lg border border-white/10 bg-surface/40 p-4"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">
              {ROLE_LABELS[role]}
            </h3>
          </div>

          {players.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              No qualified players in this role for the selected scope.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-5" />
                  <col className="w-[4.25rem]" />
                  <col className="w-[12rem]" />
                  <col className="w-12" />
                  <col className="w-10" />
                  <col className="w-10" />
                  <col className="w-14" />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/10 text-left text-ink-muted">
                    <th></th>
                    <th className="py-2 font-normal">Player</th>
                    <th className="py-2 font-normal">Team</th>
                    <th className="py-2 text-right font-normal">Games</th>
                    <th className="py-2 text-right font-normal">KDA</th>
                    <th className="py-2 text-right font-normal">DPM</th>
                    <th className="py-2 text-right font-normal">GD@15</th>
                  </tr>
                </thead>
                <tbody className="font-stat tabular-nums">
                  {players.map((player, index) => (
                    <tr
                      key={`${player.player_id}-${player.position}`}
                      className="border-b border-white/5"
                    >
                      <td className="w-5 text-ink-muted">{index + 1}</td>
                      <td className="py-2 font-body">
                        <span className="block truncate">{player.player}</span>
                      </td>
                      <td
                        className="asset-bg-name-cell py-2 font-body"
                        style={teamRowBackgroundStyle(player.team, assets)}
                      >
                        <span className="block truncate">{player.team}</span>
                      </td>
                      <td className="py-2 text-right">{player.games_played}</td>
                      <td className="py-2 text-right text-gold">
                        {player.kda.toFixed(2)}
                      </td>
                      <td className="py-2 text-right text-ink-muted">
                        {player.avg_dpm}
                      </td>
                      <td className="py-2 text-right text-ink-muted">
                        {player.avg_gd15.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export function ChampionPressureTable({
  champions,
}: {
  champions: ChampionProfile[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-ink-muted">
            <th></th>
            <th className="py-2 font-normal">Champion</th>
            <th className="py-2 font-normal">Roles</th>
            <th className="py-2 text-right font-normal">Presence</th>
            <th className="py-2 text-right font-normal">Pick%</th>
            <th className="py-2 text-right font-normal">Ban%</th>
            <th className="py-2 text-right font-normal">Win%</th>
            <th className="py-2 text-right font-normal">DPM</th>
          </tr>
        </thead>
        <tbody className="font-stat tabular-nums">
          {champions.map((champion, index) => (
            <tr key={champion.champion} className="border-b border-white/5">
              <td className="w-5 text-ink-muted">{index + 1}</td>
              <td
                className="asset-bg-name-cell py-2 font-body"
                style={championRowBackgroundStyle(champion.champion)}
              >
                <span className="flex items-center gap-2">
                  {champion.champion}
                </span>
              </td>
              <td className="py-2 font-body text-ink-muted">
                {champion.roles}
              </td>
              <td className="py-2 text-right text-gold">
                {champion.presence} / {formatPct(champion.presence_rate_pct)}
              </td>
              <td className="py-2 text-right text-blue-side">
                {formatPct(champion.pick_rate_pct)}
              </td>
              <td className="py-2 text-right text-red-side">
                {formatPct(champion.ban_rate_pct)}
              </td>
              <td className="py-2 text-right text-ink-muted">
                {champion.picks > 0 ? formatPct(champion.win_rate_pct) : "-"}
              </td>
              <td className="py-2 text-right text-ink-muted">
                {champion.picks > 0 ? champion.avg_dpm : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
