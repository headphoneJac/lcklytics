import SplitSelector from "@/components/SplitSelector";
import {
  AggregateImpactCard,
  ChampionPressureTable,
  RolePlayerBoards,
  SectionHeader,
  StatTile,
  TeamFormPickOrderTable,
} from "@/components/analysis/AnalysisSections";
import { formatPct, formatRecord } from "@/components/analysis/format";
import { NewspaperInsights } from "@/components/analysis/InsightSnapshots";
import TeamProgressChart from "@/components/analysis/TeamProgressChart";
import {
  ALL_SPLITS_PROGRESS_MATCH_END,
  COMPACT_MIN_LEADERBOARD_GAMES,
  DEFAULT_MIN_LEADERBOARD_GAMES,
  HIDE_PLACEMENT_CHART_SPLITS,
  ROLE_ORDER,
  ROUNDS_3_4_GROUPS,
  ROUNDS_3_4_SPLIT_KEY,
  aggregateSidePickImpact,
  buildChampionInsight,
  buildGroupedProgressionPoints,
  buildPlacementChartProgression,
  buildPlayerInsight,
  buildTeamInsight,
  mergeTeamSideProfiles,
  pickLeader,
  playerScore,
  sortTeamsByMatchRecord,
  topBy,
} from "@/lib/analysis";
import { getLckEsportsAssets } from "@/lib/esports-assets";
import {
  DEFAULT_SPLIT_KEY,
  getChampionProfiles,
  getObjectiveInsightStats,
  getPlayerRoleProfiles,
  getTeamPageSideProfiles,
  getTeamProgression,
  getTeamSplitOptions,
} from "@/lib/queries";
import {
  getSplitLabel,
  resolveSplitKey,
  type SplitSearchParams,
} from "@/lib/splits";
import type { TeamProgressPoint, TeamSideProfile } from "@/lib/types";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams?: SplitSearchParams;
}) {
  const requestedSplitKey = await resolveSplitKey(searchParams);
  const splits = getTeamSplitOptions();
  const splitKey = splits.some((split) => split.split_key === requestedSplitKey)
    ? requestedSplitKey
    : DEFAULT_SPLIT_KEY;

  const [
    teams,
    players,
    champions,
    teamProgression,
    roundsOneTwoTeams,
    roundsOneTwoProgression,
    objectiveInsights,
    esportsAssets,
  ] = await Promise.all([
    getTeamPageSideProfiles(splitKey),
    getPlayerRoleProfiles(splitKey),
    getChampionProfiles(splitKey),
    getTeamProgression(splitKey),
    splitKey === ROUNDS_3_4_SPLIT_KEY
      ? getTeamPageSideProfiles("Rounds 1-2")
      : Promise.resolve([] as TeamSideProfile[]),
    splitKey === ROUNDS_3_4_SPLIT_KEY
      ? getTeamProgression("Rounds 1-2")
      : Promise.resolve([] as TeamProgressPoint[]),
    getObjectiveInsightStats(splitKey),
    getLckEsportsAssets(),
  ]);

  const currentSplit = getSplitLabel(splits, splitKey);
  const minimumPlayerGames =
    teams.length > 0 && Math.max(...teams.map((team) => team.games_played)) < 20
      ? COMPACT_MIN_LEADERBOARD_GAMES
      : DEFAULT_MIN_LEADERBOARD_GAMES;
  const qualifiedPlayers = players.filter(
    (player) => player.games_played >= minimumPlayerGames,
  );
  const teamInsight = buildTeamInsight(teams);
  const playerInsight = buildPlayerInsight(players, minimumPlayerGames);
  const championInsight = buildChampionInsight(champions);
  const sidePickImpact = aggregateSidePickImpact(teams);

  const standingsTeams =
    splitKey === ROUNDS_3_4_SPLIT_KEY
      ? mergeTeamSideProfiles(roundsOneTwoTeams, teams)
      : teams;
  const matchOrderedTeams = sortTeamsByMatchRecord(standingsTeams);
  const matchOrderedTeamNames = matchOrderedTeams.map((team) => team.team);
  const progressionTeams = Array.from(
    new Set(teamProgression.flatMap((point) => Object.keys(point.values))),
  ).sort((a, b) => {
    const indexA = matchOrderedTeamNames.indexOf(a);
    const indexB = matchOrderedTeamNames.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
  const placementChartProgression = buildPlacementChartProgression(
    teamProgression,
    splitKey,
    roundsOneTwoProgression,
  );
  const teamGroupSections =
    splitKey === ROUNDS_3_4_SPLIT_KEY
      ? ROUNDS_3_4_GROUPS.map((group) => {
          const groupTeamNames = new Set<string>(group.teams);
          const groupTeams = sortTeamsByMatchRecord(
            standingsTeams.filter((team) => groupTeamNames.has(team.team)),
          );
          const groupProgressionTeams = groupTeams.map((team) => team.team);

          return {
            name: group.name,
            teams: groupTeams,
            progressionTeams: groupProgressionTeams,
            progression: buildGroupedProgressionPoints(
              placementChartProgression,
              groupProgressionTeams,
            ),
          };
        }).filter((group) => group.teams.length > 0)
      : [];
  const hasTeamGroupSections = teamGroupSections.length > 0;

  const progressChartMetric =
    splitKey === DEFAULT_SPLIT_KEY ? "gameWinRate" : "placement";
  const rolePlayerGroups = ROLE_ORDER.map((role) => ({
    role,
    players: topBy(
      qualifiedPlayers.filter((player) => player.position === role),
      playerScore,
      4,
    ),
  }));
  const topChampionPressure = topBy(
    champions,
    (champion) => champion.presence_rate_pct,
    8,
  );
  const strongestBlue = pickLeader(
    teams,
    (team) => team.blue_win_rate_pct,
    (team) => team.blue_games_played,
  );
  const strongestRed = pickLeader(
    teams,
    (team) => team.red_win_rate_pct,
    (team) => team.red_games_played,
  );
  const strongestFirstPick = pickLeader(
    teams,
    (team) => team.first_pick_win_rate_pct,
    (team) => team.first_pick_games_played,
  );
  const strongestSecondPick = pickLeader(
    teams,
    (team) => team.second_pick_win_rate_pct,
    (team) => team.second_pick_games_played,
  );
  const priorityPool = champions.filter(
    (champion) => champion.presence_rate_pct >= 50,
  );
  const showPlacementChart = !HIDE_PLACEMENT_CHART_SPLITS.has(splitKey);
  const placementChartTickStep =
    splitKey === DEFAULT_SPLIT_KEY ||
    splitKey === "Rounds 1-2" ||
    splitKey === ROUNDS_3_4_SPLIT_KEY
      ? 10
      : undefined;

  return (
    <div className="flex flex-col gap-10">
      <SplitSelector
        splits={splits}
        activeSplitKey={splitKey}
        basePath="/analysis"
      />

      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-stat text-sm text-ink-muted">Analysis</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">
            LCK Analysis Desk
          </h1>
          <p className="mt-2 max-w-3xl text-ink-muted">
            A first-pass analyst view for team form, player standouts, and
            champion priority. It turns the dashboard tables into quick reads
            for the selected scope.
          </p>
        </div>
        <p className="font-stat text-xs text-ink-muted">
          Scope: {currentSplit}
        </p>
      </section>

      <NewspaperInsights
        currentSplit={currentSplit}
        teamInsight={teamInsight}
        playerInsight={playerInsight}
        championInsight={championInsight}
        objectiveInsights={objectiveInsights}
        assets={esportsAssets}
      />

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Game-wide tendencies"
          title="Side And Pick-Order Impact"
          description="A scope-level look at whether blue side, red side, first pick, or second pick is converting into wins across all loaded games."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AggregateImpactCard
            title="Blue Side vs Red Side"
            description="Compares all games by map side, independent of team strength."
            primary={sidePickImpact.blue}
            secondary={sidePickImpact.red}
          />
          <AggregateImpactCard
            title="First Pick vs Second Pick"
            description="Compares draft order across the same game pool."
            primary={sidePickImpact.firstPick}
            secondary={sidePickImpact.secondPick}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatTile
          label="Teams tracked"
          value={String(teams.length)}
          detail={`${teams.reduce((sum, team) => sum + team.games_played, 0) / 2} games in scope.`}
        />
        <StatTile
          label="Qualified players"
          value={String(qualifiedPlayers.length)}
          detail={`Minimum ${minimumPlayerGames} games for this board.`}
          accentClass="text-green"
        />
        <StatTile
          label="High-priority champions"
          value={String(priorityPool.length)}
          detail="Champions at 50%+ draft presence."
          accentClass="text-red-side"
        />
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Teams"
          title="Form, Side, And Pick Order"
          description="Use this for power ranking notes: who is winning matches most often, where side choice may matter, and whether first pick or second pick is converting better."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Best blue-side profile"
            value={strongestBlue ? strongestBlue.team : "TBD"}
            detail={
              strongestBlue
                ? `${formatRecord(
                    strongestBlue.blue_wins,
                    strongestBlue.blue_games_played,
                  )} on blue side / ${formatPct(strongestBlue.blue_win_rate_pct)}`
                : "No blue-side games found."
            }
            accentClass="text-blue-side"
          />
          <StatTile
            label="Best red-side profile"
            value={strongestRed ? strongestRed.team : "TBD"}
            detail={
              strongestRed
                ? `${formatRecord(
                    strongestRed.red_wins,
                    strongestRed.red_games_played,
                  )} on red side / ${formatPct(strongestRed.red_win_rate_pct)}`
                : "No red-side games found."
            }
            accentClass="text-red-side"
          />
          <StatTile
            label="Best first-pick profile"
            value={strongestFirstPick ? strongestFirstPick.team : "TBD"}
            detail={
              strongestFirstPick
                ? `${formatRecord(
                    strongestFirstPick.first_pick_wins,
                    strongestFirstPick.first_pick_games_played,
                  )} with first pick / ${formatPct(strongestFirstPick.first_pick_win_rate_pct)}`
                : "No first-pick games found."
            }
            accentClass="text-gold"
          />
          <StatTile
            label="Best second-pick profile"
            value={strongestSecondPick ? strongestSecondPick.team : "TBD"}
            detail={
              strongestSecondPick
                ? `${formatRecord(
                    strongestSecondPick.second_pick_wins,
                    strongestSecondPick.second_pick_games_played,
                  )} with second pick / ${formatPct(strongestSecondPick.second_pick_win_rate_pct)}`
                : "No second-pick games found."
            }
            accentClass="text-silver"
          />
        </div>
        {hasTeamGroupSections ? (
          <div className="flex flex-col gap-8">
            {teamGroupSections.map((group) => (
              <div key={group.name} className="flex flex-col gap-5">
                <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
                  {group.name}
                </h3>
                <TeamFormPickOrderTable
                  teams={group.teams}
                  assets={esportsAssets}
                />
                <TeamProgressChart
                  points={group.progression}
                  teams={group.progressionTeams}
                  matchOrderTickStep={placementChartTickStep}
                />
              </div>
            ))}
          </div>
        ) : (
          <TeamFormPickOrderTable
            teams={matchOrderedTeams}
            assets={esportsAssets}
          />
        )}
      </section>

      {showPlacementChart && !hasTeamGroupSections ? (
        <section className="flex flex-col gap-5">
          <SectionHeader
            eyebrow="Teams"
            title={
              progressChartMetric === "gameWinRate"
                ? "Team Game Win Rate Over Time"
                : "Team Placement Over Time"
            }
            description={
              progressChartMetric === "gameWinRate"
                ? "Game win rate after each loaded match in the selected scope."
                : "Standings placement after each loaded match in the selected scope, ranked by match record first and game record second."
            }
          />
          <TeamProgressChart
            points={placementChartProgression}
            teams={progressionTeams}
            matchOrderTickStep={placementChartTickStep}
            matchOrderMax={
              splitKey === DEFAULT_SPLIT_KEY
                ? ALL_SPLITS_PROGRESS_MATCH_END
                : undefined
            }
            metric={progressChartMetric}
          />
        </section>
      ) : null}

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Players"
          title="Standout Player Profiles"
          description="Role-separated boards showing the top four qualified players in each position, using a blended profile of KDA, damage, early lane gold, and vision contribution."
        />
        <RolePlayerBoards
          roleGroups={rolePlayerGroups}
          assets={esportsAssets}
        />
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Champions"
          title="Draft Pressure And Payoff"
          description="A priority table for the champions opponents are forced to answer through picks, bans, or both."
        />
        <ChampionPressureTable champions={topChampionPressure} />
      </section>
    </div>
  );
}
