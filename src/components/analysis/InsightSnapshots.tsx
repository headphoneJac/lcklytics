"use client";

import { useEffect, useState } from "react";

import { StatTile } from "@/components/analysis/AnalysisSections";
import {
  formatCountLabel,
  formatPct,
  formatRecord,
  formatShortDate,
  ROLE_LABELS,
} from "@/components/analysis/format";
import ChampionIcon from "@/components/images/ChampionIcon";
import TeamLogo from "@/components/images/TeamLogo";
import { playerRowBackgroundStyle } from "@/components/images/row-background";
import { objectiveLosses } from "@/lib/analysis";
import { championSplashUrl, type EsportsAssets } from "@/lib/assets";
import type {
  ChampionProfile,
  ObjectiveConversionDraft,
  ObjectiveConversionLoss,
  ObjectiveInsightStats,
  PlayerRoleProfile,
  TeamSideProfile,
} from "@/lib/types";

const SNAPSHOT_ROTATION_MS = 10000;
const OBJECTIVE_ROTATION_MS = 8000;
const FADE_MS = 450;

type SnapshotSlide = "team" | "player" | "champion";

const SNAPSHOT_SLIDES: SnapshotSlide[] = ["team", "player", "champion"];

type InsightStat = {
  label: string;
  value: string;
  detail?: string;
};

type TeamSnapshotInsight = {
  title: string;
  body: string;
  metric: string;
  team?: TeamSideProfile;
  recent?: InsightStat;
  hardestOpponent?: {
    opponent: string;
    matchRecord: string;
    gameRecord: string;
    stats: InsightStat[];
  };
};

type PlayerSnapshotInsight = {
  title: string;
  body: string;
  metric: string;
  player?: PlayerRoleProfile;
  archetype?: {
    label: string;
    detail: string;
    stats: InsightStat[];
  };
};

type ChampionSnapshotInsight = {
  title: string;
  body: string;
  metric: string;
  champion?: ChampionProfile;
  driver?: InsightStat;
  teamPressure?: {
    champion: string;
    team: string;
    value: string;
    detail: string;
  };
  matchupReads?: InsightStat[];
};

function useRotatingIndex(length: number, intervalMs: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (length <= 1) return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setIsVisible(false);

      fadeTimer = setTimeout(() => {
        setActiveIndex((current) => (current + 1) % length);
        requestAnimationFrame(() => setIsVisible(true));
      }, FADE_MS);
    }, intervalMs);

    return () => {
      clearInterval(interval);

      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
    };
  }, [intervalMs, length]);

  return { activeIndex, isVisible };
}

function PlayerInsightMeta({
  player,
  assets,
}: {
  player?: PlayerRoleProfile;
  assets?: EsportsAssets;
}) {
  if (!player) return <span>No qualified player found</span>;

  return (
    <span className="flex items-center gap-2">
      <TeamLogo
        team={player.team}
        assets={assets}
        className="size-5 rounded-sm"
      />
      <span>
        {player.team} / {ROLE_LABELS[player.position]}
      </span>
    </span>
  );
}

function ObjectiveConversionList({
  title,
  losses,
  emptyText,
}: {
  title: string;
  losses: ObjectiveConversionLoss[];
  emptyText: string;
}) {
  return (
    <div>
      <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
        {title}
      </p>
      {losses.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {losses.map((loss) => (
            <div
              key={`${title}-${loss.game_id}-${loss.team}`}
              className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
            >
              <p className="font-stat text-sm tabular-nums text-red-side">
                {loss.team} lost to {loss.opponent}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                {formatShortDate(loss.game_date)}
              </p>
              <ObjectiveDraftBreakdown
                drafts={loss.drafts}
                losingTeam={loss.team}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink-muted">{emptyText}</p>
      )}
    </div>
  );
}

function DraftIconStrip({
  champions,
  label,
}: {
  champions: string[];
  label: string;
}) {
  const filteredChampions = champions.filter(Boolean);

  return (
    <div>
      <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      {filteredChampions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {filteredChampions.map((champion, index) => (
            <span
              key={`${label}-${champion}-${index}`}
              title={champion}
              className="block"
            >
              <ChampionIcon
                champion={champion}
                className="size-7 rounded-sm ring-1 ring-white/10"
                sizes="28px"
              />
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-ink-muted">No draft data</p>
      )}
    </div>
  );
}

function ObjectiveDraftColumn({
  draft,
  result,
}: {
  draft: ObjectiveConversionDraft;
  result: "win" | "loss";
}) {
  const sideClass = draft.side === "Blue" ? "text-blue-side" : "text-red-side";
  const resultClass =
    result === "loss"
      ? "border-red-side/30 bg-red-side/15"
      : "border-green/30 bg-green/15";

  return (
    <div className={`min-w-0 rounded-md border p-3 ${resultClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`truncate font-display text-base font-bold ${sideClass}`}>
          {draft.team}
        </p>
        <p className={`shrink-0 font-stat text-[10px] uppercase ${sideClass}`}>
          {draft.side}
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DraftIconStrip champions={draft.picks} label="Picked" />
        <DraftIconStrip champions={draft.bans} label="Banned" />
      </div>
    </div>
  );
}

function ObjectiveDraftBreakdown({
  drafts,
  losingTeam,
}: {
  drafts: ObjectiveConversionDraft[];
  losingTeam: string;
}) {
  if (drafts.length === 0) return null;
  const orderedDrafts = [...drafts].sort((a, b) => {
    if (a.side === b.side) return a.team.localeCompare(b.team);
    return a.side === "Blue" ? -1 : 1;
  });

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      {orderedDrafts.map((draft) => (
        <ObjectiveDraftColumn
          key={`${draft.side}-${draft.team}`}
          draft={draft}
          result={draft.team === losingTeam ? "loss" : "win"}
        />
      ))}
    </div>
  );
}

function TeamInsightMeta({ team }: { team?: TeamSideProfile }) {
  if (!team) return <span>No team sample found</span>;

  return (
    <span>
      {team.match_wins}-{team.match_losses} match record / {team.game_wins}-
      {team.game_losses} game record
    </span>
  );
}

function ChampionInsightMeta({ champion }: { champion?: ChampionProfile }) {
  if (!champion) return <span>No champion sample found</span>;

  return (
    <span>
      {champion.presence} presence / {champion.picks} picks / {champion.bans}{" "}
      bans
    </span>
  );
}

function SnapshotStatBlock({
  stat,
  accentClass = "text-ink",
}: {
  stat: InsightStat;
  accentClass?: string;
}) {
  return (
    <div className="min-w-0 border-l border-white/10 pl-3">
      <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {stat.label}
      </p>
      <p className={`mt-1 truncate font-stat text-sm tabular-nums ${accentClass}`}>
        {stat.value}
      </p>
      {stat.detail ? (
        <p className="mt-1 text-xs leading-5 text-ink-muted">{stat.detail}</p>
      ) : null}
    </div>
  );
}

function HardestOpponentPanel({
  insight,
}: {
  insight: TeamSnapshotInsight;
}) {
  if (!insight.hardestOpponent) return null;

  return (
    <div className="mt-4 rounded-md border border-white/10 bg-black/10 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Hardest Opponent
          </p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {insight.hardestOpponent.opponent}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-right">
          <SnapshotStatBlock
            stat={{
              label: "Matches",
              value: insight.hardestOpponent.matchRecord,
            }}
            accentClass="text-gold"
          />
          <SnapshotStatBlock
            stat={{
              label: "Games",
              value: insight.hardestOpponent.gameRecord,
            }}
            accentClass="text-gold"
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {insight.hardestOpponent.stats.map((stat) => (
          <SnapshotStatBlock key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}

function PlayerArchetypePanel({
  insight,
}: {
  insight: PlayerSnapshotInsight;
}) {
  if (!insight.archetype) return null;

  return (
    <div className="mt-4 rounded-md border border-green/20 bg-green/10 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-green">
            Role Archetype
          </p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {insight.archetype.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            {insight.archetype.detail}
          </p>
        </div>
        <div className="grid min-w-[18rem] gap-3 sm:grid-cols-3">
          {insight.archetype.stats.map((stat) => (
            <SnapshotStatBlock
              key={stat.label}
              stat={stat}
              accentClass="text-green"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DraftPressurePanels({
  insight,
}: {
  insight: ChampionSnapshotInsight;
}) {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      {insight.driver ? (
        <div className="rounded-md border border-red-side/20 bg-red-side/10 p-3">
          <SnapshotStatBlock
            stat={insight.driver}
            accentClass="text-red-side"
          />
        </div>
      ) : null}
      {insight.teamPressure ? (
        <div className="rounded-md border border-gold/20 bg-gold/10 p-3">
          <p className="font-stat text-[10px] uppercase tracking-[0.14em] text-gold">
            Team Context
          </p>
          <p className="mt-1 font-display text-lg font-bold text-ink">
            {insight.teamPressure.champion} into {insight.teamPressure.team}
          </p>
          <p className="mt-1 font-stat text-sm tabular-nums text-gold">
            {insight.teamPressure.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            {insight.teamPressure.detail}
          </p>
        </div>
      ) : null}
      {insight.matchupReads?.map((stat) => (
        <div key={stat.label} className="rounded-md border border-white/10 bg-black/10 p-3">
          <SnapshotStatBlock stat={stat} />
        </div>
      ))}
    </div>
  );
}

function SnapshotInsightSlide({
  slide,
  teamInsight,
  playerInsight,
  championInsight,
  assets,
}: {
  slide: SnapshotSlide;
  teamInsight: TeamSnapshotInsight;
  playerInsight: PlayerSnapshotInsight;
  championInsight: ChampionSnapshotInsight;
  assets?: EsportsAssets;
}) {
  const team = teamInsight.team;
  const player = playerInsight.player;
  const champion = championInsight.champion;

  if (slide === "player") {
    return (
      <article
        className="asset-bg-snapshot-player relative isolate min-h-[14rem] overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6"
        style={
          player
            ? playerRowBackgroundStyle(player.player, player.team, assets)
            : undefined
        }
      >
        <div className="relative z-10 grid gap-6 lg:grid-cols-[var(--snapshot-player-panel-width)_minmax(0,1fr)] lg:items-center">
          <div className="flex min-h-36 flex-col justify-center border-b border-white/10 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <div className="min-w-0">
              <p className="font-stat text-xs uppercase tracking-[0.2em] text-green">
                Player Form
              </p>
              <p className="mt-2 truncate font-display text-3xl font-bold text-ink">
                {player?.player ?? "TBD"}
              </p>
              <div className="mt-2 text-xs text-ink-muted">
                <PlayerInsightMeta player={player} assets={assets} />
              </div>
            </div>
            <div className="mt-5">
              <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                KDA
              </p>
              <p className="mt-1 font-stat text-5xl tabular-nums text-green">
                {playerInsight.metric}
              </p>
            </div>
          </div>
          <div>
            <p className="font-stat text-xs uppercase tracking-[0.2em] text-ink-muted">
              Featured Read
            </p>
            <h3 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
              {playerInsight.title}
            </h3>
            <p className="mt-5 max-w-4xl text-sm leading-7 text-ink-muted">
              {playerInsight.body}
            </p>
            <PlayerArchetypePanel insight={playerInsight} />
          </div>
        </div>
      </article>
    );
  }

  if (slide === "champion") {
    return (
      <article className="relative isolate min-h-[14rem] overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full bg-cover bg-center opacity-[0.10] lg:w-[18rem]"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(11, 15, 20, 0) 0%, rgba(11, 15, 20, 0.35) 100%), url(${championSplashUrl(
              champion?.champion ?? "Aatrox",
            )})`,
          }}
        />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <p className="font-stat text-xs uppercase tracking-[0.2em] text-red-side">
              Draft Pressure
            </p>
            <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
              {championInsight.title}
            </h3>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-ink-muted">
              {championInsight.body}
            </p>
            <DraftPressurePanels insight={championInsight} />
          </div>
          <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center gap-4 lg:justify-end">
              <div className="lg:text-right">
                <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                  Presence
                </p>
                <p className="mt-1 font-stat text-5xl tabular-nums text-red-side">
                  {championInsight.metric}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-ink-muted lg:text-right">
              <ChampionInsightMeta champion={champion} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="relative isolate min-h-[14rem] overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-14 z-0 opacity-[0.07]"
      >
        <TeamLogo
          team={team?.team ?? "TBD"}
          assets={assets}
          className="size-80 rounded"
          sizes="320px"
          loading="eager"
        />
      </div>
      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
        <div>
          <p className="font-stat text-xs uppercase tracking-[0.2em] text-gold">
            Team Signal
          </p>
          <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
            {teamInsight.title}
          </h3>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-ink-muted">
            {teamInsight.body}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {teamInsight.recent ? (
              <div className="rounded-md border border-gold/20 bg-gold/10 p-3">
                <SnapshotStatBlock
                  stat={teamInsight.recent}
                  accentClass="text-gold"
                />
              </div>
            ) : null}
          </div>
          <HardestOpponentPanel insight={teamInsight} />
        </div>
        <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex items-center gap-4 lg:justify-end">
            <div className="lg:text-right">
              <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                Win Rate
              </p>
              <p className="mt-1 font-stat text-5xl tabular-nums text-gold">
                {teamInsight.metric}
              </p>
            </div>
          </div>
          <div className="mt-4 text-xs text-ink-muted lg:text-right">
            <TeamInsightMeta team={team} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function NewspaperInsights({
  currentSplit,
  teamInsight,
  playerInsight,
  championInsight,
  objectiveInsights,
  assets,
}: {
  currentSplit: string;
  teamInsight: TeamSnapshotInsight;
  playerInsight: PlayerSnapshotInsight;
  championInsight: ChampionSnapshotInsight;
  objectiveInsights: ObjectiveInsightStats;
  assets?: EsportsAssets;
}) {
  const { activeIndex: activeSnapshotIndex, isVisible: isSnapshotVisible } =
    useRotatingIndex(SNAPSHOT_SLIDES.length, SNAPSHOT_ROTATION_MS);
  const baronLosses = objectiveLosses(objectiveInsights.baron);
  const soulLosses = objectiveLosses(objectiveInsights.dragonSoul);
  const conversionMisses = baronLosses + soulLosses;
  const { comebackThrowFlags } = objectiveInsights;
  const comebackTeam = comebackThrowFlags.comebackTeam;
  const throwTeam = comebackThrowFlags.throwTeam;
  const objectiveSlides = [
    {
      title: "Baron Taken, Game Lost",
      losses: objectiveInsights.baronLosses,
      emptyText: "No Baron conversion misses in this scope.",
    },
    {
      title: "Soul Secured, Game Lost",
      losses: objectiveInsights.dragonSoulLosses,
      emptyText: "No dragon soul conversion misses in this scope.",
    },
    {
      title: "Elder Taken, Game Lost",
      losses: objectiveInsights.elderDragonLosses,
      emptyText: "No Elder conversion misses in this scope.",
    },
  ];
  const { activeIndex: activeObjectiveIndex, isVisible: isObjectiveVisible } =
    useRotatingIndex(objectiveSlides.length, OBJECTIVE_ROTATION_MS);
  const activeSnapshot = SNAPSHOT_SLIDES[activeSnapshotIndex] ?? "team";
  const activeObjective =
    objectiveSlides[activeObjectiveIndex] ?? objectiveSlides[0];

  return (
    <section className="border-y border-white/15 py-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-xs uppercase tracking-[0.22em] text-ink-muted">
            Insight Snapshot
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-ink md:text-5xl">
            What The Numbers Are Saying
          </h2>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <div
          key={activeSnapshot}
          className={`transition-opacity duration-[450ms] motion-reduce:transition-none ${
            isSnapshotVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <SnapshotInsightSlide
            slide={activeSnapshot}
            teamInsight={teamInsight}
            playerInsight={playerInsight}
            championInsight={championInsight}
            assets={assets}
          />
        </div>

        <article className="rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
          <div>
            <p className="font-stat text-xs uppercase tracking-[0.2em] text-blue-side">
              Objective Conversion
            </p>
            <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
              The misses say more than the baseline
            </h3>
            <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-ink-muted">
              Teams with at least one Baron win{" "}
              {formatPct(objectiveInsights.baron.win_rate_pct)} of those games,
              while teams finishing with exactly four elemental dragons win{" "}
              {formatPct(objectiveInsights.dragonSoul.win_rate_pct)}. Those
              rates set the expectation; the useful read is who failed to
              convert after securing one of those map states.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <StatTile
                label="Baron holder WR"
                value={formatPct(objectiveInsights.baron.win_rate_pct)}
                detail={`${formatRecord(
                  objectiveInsights.baron.wins,
                  objectiveInsights.baron.games,
                )} across ${objectiveInsights.baron.games} holder games`}
                accentClass="text-gold"
              />
              <StatTile
                label="Dragon soul WR"
                value={formatPct(objectiveInsights.dragonSoul.win_rate_pct)}
                detail={`${formatRecord(
                  objectiveInsights.dragonSoul.wins,
                  objectiveInsights.dragonSoul.games,
                )} across ${objectiveInsights.dragonSoul.games} soul games`}
                accentClass="text-blue-side"
              />
              <StatTile
                label="Conversion misses"
                value={`${conversionMisses}`}
                detail={`${formatCountLabel(
                  baronLosses,
                  "Baron loss",
                  "Baron losses",
                )} / ${formatCountLabel(
                  soulLosses,
                  "soul loss",
                  "soul losses",
                )}`}
                accentClass="text-red-side"
              />
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-start justify-between gap-4">
                <p className="mt-1 font-stat text-xs tabular-nums text-ink-muted">
                  {activeObjectiveIndex + 1} / {objectiveSlides.length}
                </p>
              </div>
              <div
                key={activeObjective.title}
                className={`mt-4 min-h-[18rem] transition-opacity duration-[450ms] motion-reduce:transition-none ${
                  isObjectiveVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <ObjectiveConversionList
                  title={activeObjective.title}
                  losses={activeObjective.losses}
                  emptyText={activeObjective.emptyText}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
          <p className="font-stat text-xs uppercase tracking-[0.2em] text-green">
            Comeback / Throw Flags
          </p>
          <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
            Who wins without control, and who drops it?
          </h3>
          <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-ink">
            Comeback wins flag games where a team won while the opponent had
            Baron or soul control and they did not. Throw losses flag games
            where a team lost after holding Baron or soul control themselves.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/10 p-4">
              <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                Comeback Signal
              </p>
              {comebackTeam ? (
                <>
                  <p className="mt-2 font-display text-2xl font-bold text-green">
                    {comebackTeam.team}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {formatCountLabel(
                      comebackTeam.count,
                      "objective-deficit win",
                      "objective-deficit wins",
                    )}{" "}
                    from {comebackTeam.games} deficit games (
                    {formatPct(comebackTeam.rate_pct)}).
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  No objective-deficit wins in this scope.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/10 p-4">
              <p className="font-stat text-xs uppercase tracking-[0.16em] text-ink-muted">
                Throw Watch
              </p>
              {throwTeam ? (
                <>
                  <p className="mt-2 font-display text-2xl font-bold text-red-side">
                    {throwTeam.team}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {formatCountLabel(
                      throwTeam.count,
                      "loss from control",
                      "losses from control",
                    )}{" "}
                    across {throwTeam.games} control games (
                    {formatPct(throwTeam.rate_pct)}).
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  No Baron-or-soul throw losses in this scope.
                </p>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
