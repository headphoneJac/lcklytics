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
import type { EsportsAssets } from "@/lib/assets";
import type {
  ChampionProfile,
  ObjectiveConversionLoss,
  ObjectiveInsightStats,
  PlayerRoleProfile,
  TeamSideProfile,
} from "@/lib/types";

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
                {formatShortDate(loss.game_date)} / {loss.split} /{" "}
                {typeof loss.elders === "number" ? (
                  <>
                    {formatCountLabel(loss.elders, "elder", "elders")},{" "}
                  </>
                ) : null}
                {formatCountLabel(loss.barons, "baron", "barons")},{" "}
                {formatCountLabel(
                  loss.elemental_dragons,
                  "elemental dragon",
                  "elemental dragons",
                )}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink-muted">{emptyText}</p>
      )}
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

export function NewspaperInsights({
  currentSplit,
  teamInsight,
  playerInsight,
  championInsight,
  objectiveInsights,
  assets,
}: {
  currentSplit: string;
  teamInsight: {
    title: string;
    body: string;
    metric: string;
    team?: TeamSideProfile;
  };
  playerInsight: {
    title: string;
    body: string;
    metric: string;
    player?: PlayerRoleProfile;
  };
  championInsight: {
    title: string;
    body: string;
    metric: string;
    champion?: ChampionProfile;
  };
  objectiveInsights: ObjectiveInsightStats;
  assets?: EsportsAssets;
}) {
  const team = teamInsight.team;
  const player = playerInsight.player;
  const champion = championInsight.champion;
  const baronLosses = objectiveLosses(objectiveInsights.baron);
  const soulLosses = objectiveLosses(objectiveInsights.dragonSoul);
  const conversionMisses = baronLosses + soulLosses;
  const { comebackThrowFlags } = objectiveInsights;
  const comebackTeam = comebackThrowFlags.comebackTeam;
  const throwTeam = comebackThrowFlags.throwTeam;

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
        <article className="relative isolate overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
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
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-ink">
                {teamInsight.body}
              </p>
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

        <article
          className="asset-bg-snapshot-player relative isolate overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6"
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
            </div>
          </div>
        </article>

        <article className="relative isolate overflow-hidden rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-10 z-0 opacity-[0.08]"
          >
            <ChampionIcon
              champion={champion?.champion ?? "Aatrox"}
              className="size-80 rounded"
              sizes="320px"
            />
          </div>
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div>
              <p className="font-stat text-xs uppercase tracking-[0.2em] text-red-side">
                Draft Pressure
              </p>
              <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
                {championInsight.title}
              </h3>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-ink">
                {championInsight.body}
              </p>
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

        <article className="rounded-lg border border-white/10 bg-surface/50 p-5 md:p-6">
          <div>
            <p className="font-stat text-xs uppercase tracking-[0.2em] text-blue-side">
              Objective Conversion
            </p>
            <h3 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-9 text-ink">
              The misses say more than the baseline
            </h3>
            <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-ink">
              Teams with at least one Baron win{" "}
              {formatPct(objectiveInsights.baron.win_rate_pct)} of those games,
              while teams finishing with exactly four elemental dragons win{" "}
              {formatPct(objectiveInsights.dragonSoul.win_rate_pct)}. Those
              rates set the expectation; the useful read is who failed to
              convert after securing one of those map states.
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Dragon soul uses team objective rows with exactly 4 elemental
              dragons. Miss details show the listed losing team&apos;s
              objective totals.
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

            <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 lg:grid-cols-3">
              <ObjectiveConversionList
                title="Baron Taken, Game Lost"
                losses={objectiveInsights.baronLosses}
                emptyText="No Baron conversion misses in this scope."
              />
              <ObjectiveConversionList
                title="Soul Secured, Game Lost"
                losses={objectiveInsights.dragonSoulLosses}
                emptyText="No dragon soul conversion misses in this scope."
              />
              <ObjectiveConversionList
                title="Elder Taken, Game Lost"
                losses={objectiveInsights.elderDragonLosses}
                emptyText="No Elder conversion misses in this scope."
              />
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
