import TeamLogo from "@/components/images/TeamLogo";
import { teamRowBackgroundStyle } from "@/components/images/row-background";
import { getLckEsportsAssets } from "@/lib/esports-assets";
import { getHomeSeasonOverview } from "@/lib/queries";
import type { EsportsAssets } from "@/lib/assets";
import type {
  HomeBracketSeries,
  HomeStandingRow,
  HomeTeamGroup,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function record(wins: number, losses: number) {
  return `${wins}-${losses}`;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="font-stat text-sm text-ink-muted">{eyebrow}</p>
      <h2 className="font-display text-4xl font-bold text-ink">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>
      ) : null}
    </div>
  );
}

function StandingsTable({
  title,
  standings,
  assets,
}: {
  title: string;
  standings: HomeStandingRow[];
  assets?: EsportsAssets;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-ink-muted">
              <th className="py-2 font-normal">Team</th>
              <th className="py-2 text-right font-normal">Series</th>
              <th className="py-2 text-right font-normal">Games</th>
            </tr>
          </thead>
          <tbody className="font-stat tabular-nums">
            {standings.map((team, index) => {
              return (
                <tr
                  key={team.team}
                  className="border-b border-white/5"
                >
                  <td
                    className="asset-bg-name-cell py-2 font-body"
                    style={teamRowBackgroundStyle(team.team, assets)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-ink-muted">{index + 1}</span>
                      <span>{team.team}</span>
                    </span>
                  </td>
                  <td className="py-2 text-right text-gold">
                    {record(team.match_wins, team.match_losses)}
                  </td>
                  <td className="py-2 text-right text-ink">
                    {record(team.game_wins, team.game_losses)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupStandings({
  groups,
  assets,
}: {
  groups: HomeTeamGroup[];
  assets?: EsportsAssets;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {groups.map((group) => (
        <div key={group.name}>
          <StandingsTable
            title={group.name}
            standings={group.standings}
            assets={assets}
          />
        </div>
      ))}
    </div>
  );
}

function teamCode(team: string) {
  const codes: Record<string, string> = {
    "BNK FearX": "BFX",
    "Dplus Kia": "DK",
    "DN SOOPers": "DNS",
    DRX: "DRX",
    "Gen.G": "GEN",
    "HANJIN BRION": "BRO",
    "Hanwha Life Esports": "HLE",
    "Kiwoom DRX": "DRX",
    "KT Rolster": "KT",
    "NS Redforce": "NS",
    T1: "T1",
  };

  return codes[team] ?? team;
}

function BracketMatch({
  match,
  assets,
}: {
  match: HomeBracketSeries;
  assets?: EsportsAssets;
}) {
  const teamAWon = match.winner === match.team_a;
  const teamBWon = match.winner === match.team_b;

  return (
    <article
      className="relative"
      style={{ height: BRACKET_CARD_HEIGHT, width: BRACKET_CARD_WIDTH }}
    >
      <p className="mb-1 h-3 truncate text-center font-stat text-[9px] leading-3 text-ink-muted">
        {match.match_label ? `${match.match_label}` : ""}
      </p>
      <div className="overflow-hidden rounded border border-white/25 bg-background/70 font-stat text-xs tabular-nums">
        <div
          className={`grid h-[18px] grid-cols-[1fr_2rem] items-center border-b border-white/15 ${
            teamAWon ? "bg-emerald-900/70 text-ink" : "text-ink-muted"
          }`}
        >
          <span className="flex min-w-0 items-center gap-1 px-2 font-body font-semibold">
            <TeamLogo
              team={match.team_a}
              assets={assets}
              className="size-4 rounded-sm"
            />
            <span className="truncate">{teamCode(match.team_a)}</span>
          </span>
          <span className="border-l border-white/15 px-2 text-right text-ink">
            {match.score_a}
          </span>
        </div>
        <div
          className={`grid h-[18px] grid-cols-[1fr_2rem] items-center ${
            teamBWon ? "bg-emerald-900/70 text-ink" : "text-ink-muted"
          }`}
        >
          <span className="flex min-w-0 items-center gap-1 px-2 font-body font-semibold">
            <TeamLogo
              team={match.team_b}
              assets={assets}
              className="size-4 rounded-sm"
            />
            <span className="truncate">{teamCode(match.team_b)}</span>
          </span>
          <span className="border-l border-white/15 px-2 text-right text-ink">
            {match.score_b}
          </span>
        </div>
      </div>
    </article>
  );
}

const BRACKET_CARD_WIDTH = 148;
const BRACKET_CARD_HEIGHT = 52;
const BRACKET_ROUND_GAP = 52;
const BRACKET_ROW_STEP = 62;
const BRACKET_HEADER_HEIGHT = 24;
const BRACKET_PADDING_X = 10;
const BRACKET_PADDING_Y = 12;

type BracketRound = {
  stage: string;
  matches: HomeBracketSeries[];
};

type PositionedBracketMatch = {
  match: HomeBracketSeries;
  x: number;
  y: number;
};

function bracketLayoutRows(rounds: BracketRound[]) {
  const countKey = rounds.map((round) => round.matches.length).join("-");
  const presets: Record<string, number[][]> = {
    "2-2-1": [[0, 1], [0, 1], [0.5]],
    "3-3-1-2-1": [[0.5, 1.5, 3], [0, 1, 2.5], [2], [0.5, 1.5], [1]],
    "1-1-2-1": [[1.5], [1.25], [0, 1], [0.5]],
    "2-1": [[0, 2], [1]],
  };

  const preset = presets[countKey];
  if (preset) {
    return preset;
  }

  const maxMatches = Math.max(...rounds.map((round) => round.matches.length));
  const span = Math.max(1, maxMatches - 1) * 2;

  return rounds.map((round) => {
    if (round.matches.length === 1) {
      return [span / 2];
    }

    return round.matches.map(
      (_, index) => (index * span) / (round.matches.length - 1),
    );
  });
}

function buildBracketConnectors(
  rounds: BracketRound[],
  positionedMatches: PositionedBracketMatch[],
) {
  const byMatchId = new Map(
    positionedMatches.map((positioned) => [positioned.match.id, positioned]),
  );
  const connectors: string[] = [];
  const seen = new Set<string>();

  rounds.forEach((round, roundIndex) => {
    round.matches.forEach((match) => {
      const source = byMatchId.get(match.id);
      if (!source) {
        return;
      }

      [match.team_a, match.team_b].forEach((team) => {
        const targetRound = rounds
          .slice(roundIndex + 1)
          .map((futureRound) =>
            futureRound.matches.find(
              (futureMatch) =>
                futureMatch.team_a === team || futureMatch.team_b === team,
            ),
          )
          .find(Boolean);

        if (!targetRound) {
          return;
        }

        const target = byMatchId.get(targetRound.id);
        const connectorKey = `${source.match.id}-${targetRound.id}`;

        if (!target || seen.has(connectorKey)) {
          return;
        }

        seen.add(connectorKey);

        const x1 = source.x + BRACKET_CARD_WIDTH;
        const y1 = source.y + BRACKET_CARD_HEIGHT / 1.5;
        const x2 = target.x;
        const y2 = target.y + BRACKET_CARD_HEIGHT / 1.5;
        const midX = x1 + (x2 - x1) / 2;

        connectors.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
      });
    });
  });

  return connectors;
}

function Bracket({
  title,
  matches,
  emptyText,
  assets,
}: {
  title: string;
  matches: HomeBracketSeries[];
  emptyText: string;
  assets?: EsportsAssets;
}) {
  const stages = Array.from(new Set(matches.map((match) => match.stage)));
  const rounds = stages.map((stage) => ({
    stage,
    matches: matches.filter((match) => match.stage === stage),
  }));
  const layoutRows = bracketLayoutRows(rounds);
  const positionedMatches = rounds.flatMap((round, roundIndex) =>
    round.matches.map((match, matchIndex) => ({
      match,
      x:
        BRACKET_PADDING_X +
        roundIndex * (BRACKET_CARD_WIDTH + BRACKET_ROUND_GAP),
      y:
        BRACKET_PADDING_Y +
        BRACKET_HEADER_HEIGHT +
        18 +
        (layoutRows[roundIndex]?.[matchIndex] ?? matchIndex * 2) *
          BRACKET_ROW_STEP,
    })),
  );
  const boardWidth =
    BRACKET_PADDING_X * 2 +
    stages.length * BRACKET_CARD_WIDTH +
    Math.max(0, stages.length - 1) * BRACKET_ROUND_GAP;
  const boardHeight =
    Math.max(
      ...positionedMatches.map(
        (positioned) => positioned.y + BRACKET_CARD_HEIGHT,
      ),
      BRACKET_PADDING_Y + BRACKET_HEADER_HEIGHT + BRACKET_CARD_HEIGHT,
    ) + BRACKET_PADDING_Y;
  const connectors = buildBracketConnectors(rounds, positionedMatches);

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      </div>

      {matches.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-white/15 p-5 text-sm text-ink-muted">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-surface/40 p-3">
          <div
            className="relative min-w-max"
            style={{ width: boardWidth, height: boardHeight }}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              height={boardHeight}
              width={boardWidth}
            >
              {connectors.map((path, index) => (
                <path
                  key={`${path}-${index}`}
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.38)"
                  strokeLinecap="round"
                  strokeWidth="1.25"
                />
              ))}
            </svg>

            {stages.map((stage, stageIndex) => (
              <p
                key={stage}
                className="absolute rounded border border-white/25 bg-background/80 px-3 py-1 text-center font-stat text-xs text-ink"
                style={{
                  left:
                    BRACKET_PADDING_X +
                    stageIndex * (BRACKET_CARD_WIDTH + BRACKET_ROUND_GAP),
                  top: BRACKET_PADDING_Y,
                  width: BRACKET_CARD_WIDTH,
                }}
              >
                {stage}
              </p>
            ))}

            {positionedMatches.map((positioned) => (
              <div
                key={positioned.match.id}
                className="absolute"
                style={{ left: positioned.x, top: positioned.y }}
              >
                <BracketMatch match={positioned.match} assets={assets} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [overview, esportsAssets] = await Promise.all([
    getHomeSeasonOverview(),
    getLckEsportsAssets(),
  ]);

  return (
    <div className="flex flex-col gap-14">
      <section>
        <p className="font-stat text-sm text-ink-muted">LCK 2026</p>
        <h1 className="font-display text-5xl font-bold text-ink">
          Season Overview
        </h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Domestic LCK format, group placement, carry-over standings, and
          bracket results from the loaded Oracle&apos;s Elixir data.
        </p>
      </section>

      <section className="flex flex-col gap-8">
        <SectionHeader
          eyebrow="Opening tournament"
          title="LCK Cup"
          description="Group Stage teams are shown in Group Baron and Group Dragon. Bracket results are pulled from the loaded Cup series after group play."
        />

        <GroupStandings groups={overview.cup.groups} assets={esportsAssets} />

        <Bracket
          title="Play-In"
          matches={overview.cup.playIn}
          emptyText="No LCK Cup play-in or playoff results are loaded yet."
          assets={esportsAssets}
        />

        <Bracket
          title="Playoffs"
          matches={overview.cup.playoffs}
          emptyText="No LCK Cup playoff results are loaded yet."
          assets={esportsAssets}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeader
          eyebrow="Spring split"
          title="Rounds 1-2"
          description="Regular-season match and game standings before the Road to MSI bracket."
        />
        <StandingsTable
          title="Rounds 1-2 Standings"
          standings={overview.roundsOneTwo.standings}
          assets={esportsAssets}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeader eyebrow="Mid-season qualifier" title="Road to MSI" />
        <Bracket
          title="Road to MSI Bracket"
          matches={overview.roadToMsi.bracket}
          emptyText="No Road to MSI results are loaded yet."
          assets={esportsAssets}
        />
      </section>

      <section className="flex flex-col gap-8">
        <SectionHeader
          eyebrow="Summer split"
          title="Rounds 3-4"
          description="Legend Group and Rise Group standings include the carried-over Rounds 1-2 record plus loaded Rounds 3-4 matches."
        />
        <GroupStandings
          groups={overview.roundsThreeFour.groups}
          assets={esportsAssets}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeader
          eyebrow="Season finish"
          title="Season Play-In and Season Playoffs"
        />
        <Bracket
          title="Season Play-In"
          matches={overview.seasonFinals.playIn}
          emptyText="No Season Play-In results are loaded yet."
          assets={esportsAssets}
        />
        <Bracket
          title="Season Playoffs"
          matches={overview.seasonFinals.playoffs}
          emptyText="No Season Playoff results are loaded yet."
          assets={esportsAssets}
        />
      </section>
    </div>
  );
}
