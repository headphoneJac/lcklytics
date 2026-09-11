import type { HomeBracketSeries } from "@/lib/types";

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
    TBD: "TBD",
  };

  return codes[team] ?? team;
}

function BracketMatch({ match }: { match: HomeBracketSeries }) {
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
          <span className="truncate px-2 font-body font-semibold">
            {teamCode(match.team_a)}
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
          <span className="truncate px-2 font-body font-semibold">
            {teamCode(match.team_b)}
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
    "2-2-1": [
      [0, 1],
      [0, 1],
      [0.5],
    ],
    "3-3-1-2-1": [
      [0.5, 1.5, 3],
      [0, 1, 2.5],
      [2],
      [0.5, 1.5],
      [1],
    ],
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

export default function TournamentBracket({
  title,
  matches,
  emptyText,
}: {
  title: string;
  matches: HomeBracketSeries[];
  emptyText: string;
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
                <BracketMatch match={positioned.match} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
