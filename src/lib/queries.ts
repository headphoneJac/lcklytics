import { supabase } from './supabase'
import type {
  ChampionProfile,
  ChampionRate,
  DashboardSplitOption,
  GameDraft,
  HomeBracketSeries,
  HomeSeasonOverview,
  HomeStandingRow,
  HomeTeamGroup,
  PlayerChampionMatchupProfile,
  PlayerRadarMetric,
  PlayerRole,
  PlayerRoleProfile,
  PomLeader,
  RecentGame,
  RecentGameSide,
  SplitGoldSwing,
  TeamSideProfile,
  TeamSideWinRate,
  TeamStanding,
} from './types'

export const DEFAULT_SPLIT_KEY = '__all__'

const PAGE_SIZE = 1000
const MIN_RADAR_SCORE = 10

const PLAYER_PROFILE_COLUMNS =
  'player_id, player, team, position, games_played, wins, win_rate_pct, total_kills, total_deaths, total_assists, avg_kills, avg_deaths, avg_assists, kda, avg_kill_participation_pct, avg_dpm, avg_gold_per_min, avg_damage_share, avg_vision_score, avg_wards_placed, avg_wards_killed, avg_control_wards_bought, avg_cspm, avg_gd15, avg_xpd15, avg_csd15, first_blood_pct, first_tower_pct'

const LEGACY_PLAYER_PROFILE_COLUMNS =
  'player_id, player, team, position, games_played, wins, win_rate_pct, total_kills, total_deaths, total_assists, avg_kills, avg_deaths, avg_assists, kda, avg_dpm, avg_damage_share, avg_vision_score, avg_wards_placed, avg_wards_killed, avg_control_wards_bought, avg_cspm, avg_gd15, avg_xpd15, avg_csd15, first_blood_pct, first_tower_pct'

type NumericValue = number | string | null

type RawSplitOption = Omit<
  DashboardSplitOption,
  'sort_order' | 'games_played'
> & {
  sort_order: NumericValue
  games_played: NumericValue
}

type RawTeamStanding = Omit<
  TeamStanding,
  | 'matches_played'
  | 'match_wins'
  | 'match_losses'
  | 'games_played'
  | 'game_wins'
  | 'game_losses'
  | 'win_rate_pct'
> & {
  matches_played: NumericValue
  match_wins: NumericValue
  match_losses: NumericValue
  games_played: NumericValue
  game_wins: NumericValue
  game_losses: NumericValue
  win_rate_pct: NumericValue
}

type RawTeamSideWinRate = Omit<
  TeamSideWinRate,
  'games_played' | 'wins' | 'win_rate_pct'
> & {
  games_played: NumericValue
  wins: NumericValue
  win_rate_pct: NumericValue
}

type RawPlayerRoleProfile = Omit<
  PlayerRoleProfile,
  | 'games_played'
  | 'wins'
  | 'win_rate_pct'
  | 'total_kills'
  | 'total_deaths'
  | 'total_assists'
  | 'avg_kills'
  | 'avg_deaths'
  | 'avg_assists'
  | 'kda'
  | 'avg_kill_participation_pct'
  | 'avg_dpm'
  | 'avg_gold_per_min'
  | 'avg_damage_share'
  | 'avg_vision_score'
  | 'avg_wards_placed'
  | 'avg_wards_killed'
  | 'avg_control_wards_bought'
  | 'avg_cspm'
  | 'avg_gd15'
  | 'avg_xpd15'
  | 'avg_csd15'
  | 'first_blood_pct'
  | 'first_tower_pct'
  | 'radar'
> & {
  games_played: NumericValue
  wins: NumericValue
  win_rate_pct: NumericValue
  total_kills: NumericValue
  total_deaths: NumericValue
  total_assists: NumericValue
  avg_kills: NumericValue
  avg_deaths: NumericValue
  avg_assists: NumericValue
  kda: NumericValue
  avg_kill_participation_pct: NumericValue
  avg_dpm: NumericValue
  avg_gold_per_min: NumericValue
  avg_damage_share: NumericValue
  avg_vision_score: NumericValue
  avg_wards_placed: NumericValue
  avg_wards_killed: NumericValue
  avg_control_wards_bought: NumericValue
  avg_cspm: NumericValue
  avg_gd15: NumericValue
  avg_xpd15: NumericValue
  avg_csd15: NumericValue
  first_blood_pct: NumericValue
  first_tower_pct: NumericValue
}

type RawChampionProfile = Omit<
  ChampionProfile,
  | 'picks'
  | 'bans'
  | 'presence'
  | 'pick_rate_pct'
  | 'ban_rate_pct'
  | 'presence_rate_pct'
  | 'wins'
  | 'win_rate_pct'
  | 'total_kills'
  | 'total_deaths'
  | 'total_assists'
  | 'kda'
  | 'avg_dpm'
  | 'avg_damage_share'
  | 'avg_cspm'
> & {
  picks: NumericValue
  bans: NumericValue
  presence: NumericValue
  pick_rate_pct: NumericValue
  ban_rate_pct: NumericValue
  presence_rate_pct: NumericValue
  wins: NumericValue
  win_rate_pct: NumericValue
  total_kills: NumericValue
  total_deaths: NumericValue
  total_assists: NumericValue
  kda: NumericValue
  avg_dpm: NumericValue
  avg_damage_share: NumericValue
  avg_cspm: NumericValue
}

type SupabaseNamedRelation = { name: string } | { name: string }[] | null

type RawScopedPlayerGameStat = {
  game_id: string
  player_id: string
  team_id: string
  position: string
  champion: string | null
  result: boolean
  kills: NumericValue
  deaths: NumericValue
  assists: NumericValue
  earned_gold: NumericValue
  dpm: NumericValue
  damage_share: NumericValue
  vision_score: NumericValue
  wards_placed: NumericValue
  wards_killed: NumericValue
  control_wards_bought: NumericValue
  cspm: NumericValue
  players: SupabaseNamedRelation
  teams: SupabaseNestedTeam
}

type RawScopedPlayerTimeline = {
  game_id: string
  player_id: string
  minute: NumericValue
  gold_diff: NumericValue
  xp_diff: NumericValue
  cs_diff: NumericValue
}

type RawScopedTeamObjective = {
  game_id: string
  team_id: string
  team_kills: NumericValue
  first_blood: boolean | null
  first_tower: boolean | null
}

type RawGameDuration = {
  game_id: string
  game_length_seconds: NumericValue
}

type RawScopedDraftAction = {
  game_id: string
  action_type: string
  champion: string | null
}

type MatchupGame = {
  game_id: string
  team_id: string
  result: boolean
}

type RawMatchupProfile = Omit<
  PlayerChampionMatchupProfile,
  | 'id'
  | 'games_played'
  | 'wins'
  | 'win_rate_pct'
  | 'total_kills'
  | 'total_deaths'
  | 'total_assists'
  | 'avg_kills'
  | 'avg_deaths'
  | 'avg_assists'
  | 'kda'
  | 'avg_dpm'
  | 'avg_damage_share'
  | 'avg_cspm'
  | 'avg_vision_score'
  | 'avg_gd15'
  | 'avg_xpd15'
  | 'avg_csd15'
  | 'first_blood_pct'
  | 'first_tower_pct'
  | 'performance_score'
  | 'games'
> & {
  games_played: NumericValue
  wins: NumericValue
  win_rate_pct: NumericValue
  total_kills: NumericValue
  total_deaths: NumericValue
  total_assists: NumericValue
  avg_kills: NumericValue
  avg_deaths: NumericValue
  avg_assists: NumericValue
  kda: NumericValue
  avg_dpm: NumericValue
  avg_damage_share: NumericValue
  avg_cspm: NumericValue
  avg_vision_score: NumericValue
  avg_gd15: NumericValue
  avg_xpd15: NumericValue
  avg_csd15: NumericValue
  first_blood_pct: NumericValue
  first_tower_pct: NumericValue
  games: MatchupGame[] | string | null
}

type RawRecentGameScope = {
  game_id: string
  source_split: string | null
  split_label: string
  game_date: string
}

type RawDashboardGameScope = {
  game_id: string
}

type SupabaseNestedTeam = { name: string } | { name: string }[] | null

type RawRecentGameSide = Omit<RecentGameSide, 'teams'> & {
  game_id: string
  teams: SupabaseNestedTeam
}

type RawGameDraft = Omit<GameDraft, 'side'> & {
  game_id: string
  side: string
}

function normalizeTeam(team: SupabaseNestedTeam): RecentGameSide['teams'] {
  if (Array.isArray(team)) return team[0] ?? null
  return team
}

function normalizeNamedRelation(relation: SupabaseNamedRelation) {
  if (Array.isArray(relation)) return relation[0] ?? null
  return relation
}

function toNumber(value: NumericValue) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function isMissingPlayerProfileMetricError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const record = error as { code?: unknown; message?: unknown }
  const message = String(record.message ?? '')

  return (
    record.code === '42703' &&
    (message.includes('avg_kill_participation_pct') ||
      message.includes('avg_gold_per_min'))
  )
}

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals))
}

function pct(part: number, total: number) {
  return total > 0 ? round((part / total) * 100) : 0
}

function isPlayerRole(position: string): position is PlayerRole {
  return ['top', 'jng', 'mid', 'bot', 'sup'].includes(position)
}

async function fetchScopedRows<T>(
  view: string,
  columns: string,
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<T[]> {
  const rows: T[] = []
  let start = 0

  while (true) {
    const { data, error } = await supabase
      .from(view)
      .select(columns)
      .eq('split_key', splitKey)
      .range(start, start + PAGE_SIZE - 1)

    if (error) throw error

    rows.push(...((data ?? []) as T[]))

    if (!data || data.length < PAGE_SIZE) break
    start += PAGE_SIZE
  }

  return rows
}

async function fetchRowsByGameIds<T>(
  table: string,
  columns: string,
  gameIds: string[],
  orderColumns = ['game_id'],
): Promise<T[]> {
  if (gameIds.length === 0) return []

  const rows: T[] = []

  for (let start = 0; start < gameIds.length; start += PAGE_SIZE) {
    const gameIdChunk = gameIds.slice(start, start + PAGE_SIZE)
    let rowStart = 0

    while (true) {
      let query = supabase
        .from(table)
        .select(columns)
        .in('game_id', gameIdChunk)

      for (const column of orderColumns) {
        query = query.order(column, { ascending: true })
      }

      const { data, error } = await query.range(
        rowStart,
        rowStart + PAGE_SIZE - 1,
      )

      if (error) throw error
      rows.push(...((data ?? []) as T[]))

      if (!data || data.length < PAGE_SIZE) break
      rowStart += PAGE_SIZE
    }
  }

  return rows
}

export async function getSplitOptions(): Promise<DashboardSplitOption[]> {
  const { data, error } = await supabase
    .from('dashboard_split_options')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error

  return ((data ?? []) as RawSplitOption[]).map((split) => ({
    split_key: split.split_key,
    split_label: split.split_label,
    source_split: split.source_split,
    sort_order: toNumber(split.sort_order),
    games_played: toNumber(split.games_played),
    first_game_date: split.first_game_date,
    last_game_date: split.last_game_date,
  }))
}

export async function getTeamStandings(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<TeamStanding[]> {
  const rows = await fetchScopedRows<RawTeamStanding>(
    'dashboard_team_standings_by_split',
    'team, matches_played, match_wins, match_losses, games_played, game_wins, game_losses, win_rate_pct',
    splitKey,
  )

  return rows
    .map((team) => ({
      team: team.team,
      matches_played: toNumber(team.matches_played),
      match_wins: toNumber(team.match_wins),
      match_losses: toNumber(team.match_losses),
      games_played: toNumber(team.games_played),
      game_wins: toNumber(team.game_wins),
      game_losses: toNumber(team.game_losses),
      win_rate_pct: toNumber(team.win_rate_pct),
    }))
    .sort((a, b) => {
      if (b.match_wins !== a.match_wins) return b.match_wins - a.match_wins
      if (b.win_rate_pct !== a.win_rate_pct) return b.win_rate_pct - a.win_rate_pct
      return a.team.localeCompare(b.team)
    })
}

export async function getTeamSideWinRates(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<TeamSideWinRate[]> {
  const rows = await fetchScopedRows<RawTeamSideWinRate>(
    'dashboard_team_side_win_rates_by_split',
    'team, side, games_played, wins, win_rate_pct',
    splitKey,
  )

  return rows
    .filter((row) => row.side === 'Blue' || row.side === 'Red')
    .map((row) => ({
      team: row.team,
      side: row.side,
      games_played: toNumber(row.games_played),
      wins: toNumber(row.wins),
      win_rate_pct: toNumber(row.win_rate_pct),
    }))
}

export async function getTeamSideProfiles(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<TeamSideProfile[]> {
  const [standings, sideWinRates] = await Promise.all([
    getTeamStandings(splitKey),
    getTeamSideWinRates(splitKey),
  ])

  const byTeam = new Map<string, Partial<Record<'Blue' | 'Red', TeamSideWinRate>>>()

  for (const sideRate of sideWinRates) {
    const current = byTeam.get(sideRate.team) ?? {}
    current[sideRate.side] = sideRate
    byTeam.set(sideRate.team, current)
  }

  return standings.map((team) => {
    const sides = byTeam.get(team.team) ?? {}
    const blue = sides.Blue
    const red = sides.Red
    const sideDelta =
      blue && red ? Number((blue.win_rate_pct - red.win_rate_pct).toFixed(1)) : null

    return {
      ...team,
      blue_games_played: blue?.games_played ?? 0,
      blue_wins: blue?.wins ?? 0,
      blue_win_rate_pct: blue?.win_rate_pct ?? 0,
      red_games_played: red?.games_played ?? 0,
      red_wins: red?.wins ?? 0,
      red_win_rate_pct: red?.win_rate_pct ?? 0,
      side_delta_pct: sideDelta,
      first_pick_games_played: 0,
      first_pick_wins: 0,
      first_pick_win_rate_pct: 0,
      second_pick_games_played: 0,
      second_pick_wins: 0,
      second_pick_win_rate_pct: 0,
    }
  })
}

function normalizeMetric(
  players: PlayerRoleProfile[],
  player: PlayerRoleProfile,
  key: keyof PlayerRoleProfile,
  lowerIsBetter = false,
) {
  const values = players
    .map((p) => Number(p[key]))
    .filter((value) => Number.isFinite(value))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const value = Number(player[key])

  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return 0
  }

  if (max === min) return 50

  const normalized = lowerIsBetter
    ? ((max - value) / (max - min)) * 100
    : ((value - min) / (max - min)) * 100
  const scaled = MIN_RADAR_SCORE + normalized * ((100 - MIN_RADAR_SCORE) / 100)

  return Math.round(Math.min(Math.max(scaled, MIN_RADAR_SCORE), 100))
}

function buildRadarMetric(
  rolePlayers: PlayerRoleProfile[],
  player: PlayerRoleProfile,
  metric: string,
  key: keyof PlayerRoleProfile,
  options: { lowerIsBetter?: boolean; suffix?: string } = {},
): PlayerRadarMetric {
  return {
    metric,
    value: normalizeMetric(rolePlayers, player, key, options.lowerIsBetter),
    raw: Number(player[key]),
    suffix: options.suffix,
  }
}

function attachRoleRadars(players: PlayerRoleProfile[]) {
  const byRole = new Map<PlayerRole, PlayerRoleProfile[]>()

  for (const player of players) {
    const current = byRole.get(player.position) ?? []
    current.push(player)
    byRole.set(player.position, current)
  }

  for (const player of players) {
    const rolePlayers = byRole.get(player.position) ?? []

    if (player.position === 'sup') {
      player.radar = [
        buildRadarMetric(rolePlayers, player, 'KDA', 'kda'),
        buildRadarMetric(rolePlayers, player, 'KP', 'avg_kill_participation_pct', {
          suffix: '%',
        }),
        buildRadarMetric(rolePlayers, player, 'Vision', 'avg_vision_score'),
        buildRadarMetric(rolePlayers, player, 'Wards Placed', 'avg_wards_placed'),
        buildRadarMetric(rolePlayers, player, 'Wards Cleared', 'avg_wards_killed'),
        buildRadarMetric(rolePlayers, player, 'Control Wards', 'avg_control_wards_bought'),
        buildRadarMetric(rolePlayers, player, 'GD@15', 'avg_gd15'),
        buildRadarMetric(rolePlayers, player, 'XP Diff @ 15', 'avg_xpd15'),
      ]
      continue
    }

    player.radar = [
      buildRadarMetric(rolePlayers, player, 'KDA', 'kda'),
      buildRadarMetric(rolePlayers, player, 'KP', 'avg_kill_participation_pct', {
        suffix: '%',
      }),
      buildRadarMetric(rolePlayers, player, 'DMG/min', 'avg_dpm'),
      buildRadarMetric(rolePlayers, player, 'CS/min', 'avg_cspm'),
      buildRadarMetric(rolePlayers, player, 'Gold/min', 'avg_gold_per_min'),
      buildRadarMetric(rolePlayers, player, 'FB %', 'first_blood_pct', {
        suffix: '%',
      }),
      buildRadarMetric(rolePlayers, player, 'GD@15', 'avg_gd15'),
      buildRadarMetric(rolePlayers, player, 'CSD@15', 'avg_csd15'),
    ]
  }

  return players
}

async function getDashboardGameIdsForSplitScope(splitKey: string) {
  const rows = await fetchScopedRows<RawDashboardGameScope>(
    'dashboard_game_scopes',
    'game_id',
    splitKey,
  )

  return rows.map((row) => row.game_id)
}

async function getGameIdsForTeamSplitScope(
  splitKey: string,
): Promise<string[] | null> {
  switch (splitKey) {
    case 'Cup': {
      const games = await getLckGamesBySplit('Cup')
      const sides = await getTeamSidesForGames(games.map((game) => game.game_id))
      const cup = splitCupSeries(buildSeries(games, sides))
      return cup.group.flatMap((series) => series.gameIds)
    }
    case TEAMS_CUP_POSTSEASON_SPLIT_KEY: {
      const games = await getLckGamesBySplit('Cup')
      const sides = await getTeamSidesForGames(games.map((game) => game.game_id))
      const cup = splitCupSeries(buildSeries(games, sides))
      return [...cup.playIn, ...cup.playoffs].flatMap((series) => series.gameIds)
    }
    case 'Rounds 1-2':
      return (await getLckGamesBySplit('Rounds 1-2', false)).map(
        (game) => game.game_id,
      )
    case TEAMS_ROAD_TO_MSI_SPLIT_KEY:
      return (await getLckGamesBySplit('Rounds 1-2', true)).map(
        (game) => game.game_id,
      )
    case 'Rounds 3-4':
      return (await getLckGamesBySplit('Rounds 3-4', false)).map(
        (game) => game.game_id,
      )
    case TEAMS_SEASON_POSTSEASON_SPLIT_KEY:
      return (await getLckGamesBySplit('Rounds 3-4', true)).map(
        (game) => game.game_id,
      )
    default:
      return getDashboardGameIdsForSplitScope(splitKey)
  }
}

async function getTimeline15ByPlayerGame(gameIds: string[]) {
  const timelineRows = await fetchRowsByGameIds<RawScopedPlayerTimeline>(
    'game_player_timeline',
    'game_id, player_id, minute, gold_diff, xp_diff, cs_diff',
    gameIds,
    ['game_id', 'player_id', 'minute'],
  )

  return new Map(
    timelineRows
      .filter((row) => toNumber(row.minute) === 15)
      .map((row) => [`${row.game_id}:${row.player_id}`, row]),
  )
}

async function getObjectivesByTeamGame(gameIds: string[]) {
  const objectiveRows = await fetchRowsByGameIds<RawScopedTeamObjective>(
    'game_team_stats',
    'game_id, team_id, team_kills, first_blood, first_tower',
    gameIds,
    ['game_id', 'team_id'],
  )

  return new Map(
    objectiveRows.map((row) => [`${row.game_id}:${row.team_id}`, row]),
  )
}

async function getGameDurations(gameIds: string[]) {
  const gameRows = await fetchRowsByGameIds<RawGameDuration>(
    'games',
    'game_id, game_length_seconds',
    gameIds,
  )

  return new Map(
    gameRows.map((row) => [row.game_id, toNumber(row.game_length_seconds)]),
  )
}

async function getPlayerRoleProfilesForGameIds(
  gameIds: string[],
): Promise<PlayerRoleProfile[]> {
  const [
    playerRows,
    timelineByPlayerGame,
    objectivesByTeamGame,
    gameDurations,
  ] =
    await Promise.all([
      fetchRowsByGameIds<RawScopedPlayerGameStat>(
        'game_player_stats',
        'game_id, player_id, team_id, position, champion, result, kills, deaths, assists, earned_gold, dpm, damage_share, vision_score, wards_placed, wards_killed, control_wards_bought, cspm, players ( name ), teams ( name )',
        gameIds,
        ['game_id', 'player_id'],
      ),
      getTimeline15ByPlayerGame(gameIds),
      getObjectivesByTeamGame(gameIds),
      getGameDurations(gameIds),
    ])

  type PlayerAccumulator = {
    player_id: string
    player: string
    teams: Set<string>
    position: PlayerRole
    games_played: number
    wins: number
    total_kills: number
    total_deaths: number
    total_assists: number
    total_team_kills: number
    total_earned_gold: number
    total_game_seconds: number
    total_dpm: number
    total_damage_share: number
    total_vision_score: number
    total_wards_placed: number
    total_wards_killed: number
    total_control_wards_bought: number
    total_cspm: number
    total_gd15: number
    total_xpd15: number
    total_csd15: number
    timeline_games: number
    first_bloods: number
    first_towers: number
  }

  const players = new Map<string, PlayerAccumulator>()

  for (const row of playerRows) {
    if (!isPlayerRole(row.position)) continue

    const playerName = normalizeNamedRelation(row.players)?.name ?? row.player_id
    const teamName = normalizeTeam(row.teams)?.name ?? row.team_id
    const key = `${row.player_id}:${row.position}`
    const accumulator =
      players.get(key) ??
      ({
        player_id: row.player_id,
        player: playerName,
        teams: new Set<string>(),
        position: row.position,
        games_played: 0,
        wins: 0,
        total_kills: 0,
        total_deaths: 0,
        total_assists: 0,
        total_team_kills: 0,
        total_earned_gold: 0,
        total_game_seconds: 0,
        total_dpm: 0,
        total_damage_share: 0,
        total_vision_score: 0,
        total_wards_placed: 0,
        total_wards_killed: 0,
        total_control_wards_bought: 0,
        total_cspm: 0,
        total_gd15: 0,
        total_xpd15: 0,
        total_csd15: 0,
        timeline_games: 0,
        first_bloods: 0,
        first_towers: 0,
      } satisfies PlayerAccumulator)

    players.set(key, accumulator)
    accumulator.teams.add(displayTeamName(teamName))
    accumulator.games_played += 1
    accumulator.wins += row.result ? 1 : 0
    accumulator.total_kills += toNumber(row.kills)
    accumulator.total_deaths += toNumber(row.deaths)
    accumulator.total_assists += toNumber(row.assists)
    accumulator.total_earned_gold += toNumber(row.earned_gold)
    accumulator.total_dpm += toNumber(row.dpm)
    accumulator.total_damage_share += toNumber(row.damage_share)
    accumulator.total_vision_score += toNumber(row.vision_score)
    accumulator.total_wards_placed += toNumber(row.wards_placed)
    accumulator.total_wards_killed += toNumber(row.wards_killed)
    accumulator.total_control_wards_bought += toNumber(row.control_wards_bought)
    accumulator.total_cspm += toNumber(row.cspm)

    const objective = objectivesByTeamGame.get(`${row.game_id}:${row.team_id}`)
    accumulator.total_team_kills += toNumber(objective?.team_kills ?? 0)
    accumulator.first_bloods += objective?.first_blood ? 1 : 0
    accumulator.first_towers += objective?.first_tower ? 1 : 0

    accumulator.total_game_seconds += gameDurations.get(row.game_id) ?? 0

    const timeline = timelineByPlayerGame.get(`${row.game_id}:${row.player_id}`)
    if (timeline) {
      accumulator.timeline_games += 1
      accumulator.total_gd15 += toNumber(timeline.gold_diff)
      accumulator.total_xpd15 += toNumber(timeline.xp_diff)
      accumulator.total_csd15 += toNumber(timeline.cs_diff)
    }
  }

  const profiles = Array.from(players.values()).map((player) => {
    const games = player.games_played
    const timelineGames = player.timeline_games

    return {
      player_id: player.player_id,
      player: player.player,
      team: Array.from(player.teams).sort().join(' / '),
      position: player.position,
      games_played: games,
      wins: player.wins,
      win_rate_pct: pct(player.wins, games),
      total_kills: player.total_kills,
      total_deaths: player.total_deaths,
      total_assists: player.total_assists,
      avg_kills: games > 0 ? round(player.total_kills / games) : 0,
      avg_deaths: games > 0 ? round(player.total_deaths / games) : 0,
      avg_assists: games > 0 ? round(player.total_assists / games) : 0,
      kda:
        player.total_deaths > 0
          ? round(
              (player.total_kills + player.total_assists) /
                player.total_deaths,
              2,
            )
          : 0,
      avg_kill_participation_pct: pct(
        player.total_kills + player.total_assists,
        player.total_team_kills,
      ),
      avg_dpm: games > 0 ? Math.round(player.total_dpm / games) : 0,
      avg_gold_per_min:
        player.total_game_seconds > 0
          ? round(player.total_earned_gold / (player.total_game_seconds / 60))
          : 0,
      avg_damage_share:
        games > 0 ? round((player.total_damage_share / games) * 100) : 0,
      avg_vision_score:
        games > 0 ? round(player.total_vision_score / games) : 0,
      avg_wards_placed:
        games > 0 ? round(player.total_wards_placed / games) : 0,
      avg_wards_killed:
        games > 0 ? round(player.total_wards_killed / games) : 0,
      avg_control_wards_bought:
        games > 0 ? round(player.total_control_wards_bought / games) : 0,
      avg_cspm: games > 0 ? round(player.total_cspm / games) : 0,
      avg_gd15:
        timelineGames > 0 ? Math.round(player.total_gd15 / timelineGames) : 0,
      avg_xpd15:
        timelineGames > 0 ? Math.round(player.total_xpd15 / timelineGames) : 0,
      avg_csd15:
        timelineGames > 0 ? round(player.total_csd15 / timelineGames) : 0,
      first_blood_pct: pct(player.first_bloods, games),
      first_tower_pct: pct(player.first_towers, games),
      radar: [],
    } satisfies PlayerRoleProfile
  })

  return attachRoleRadars(profiles).sort((a, b) => {
    if (a.position !== b.position) return a.position.localeCompare(b.position)
    if (b.games_played !== a.games_played) return b.games_played - a.games_played
    return a.player.localeCompare(b.player)
  })
}

export async function getPlayerRoleProfiles(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<PlayerRoleProfile[]> {
  const gameIds = await getGameIdsForTeamSplitScope(splitKey)

  if (gameIds !== null) {
    return getPlayerRoleProfilesForGameIds(gameIds)
  }

  let rows: RawPlayerRoleProfile[]

  try {
    rows = await fetchScopedRows<RawPlayerRoleProfile>(
      'dashboard_player_stats_by_split',
      PLAYER_PROFILE_COLUMNS,
      splitKey,
    )
  } catch (error) {
    if (!isMissingPlayerProfileMetricError(error)) throw error

    rows = await fetchScopedRows<RawPlayerRoleProfile>(
      'dashboard_player_stats_by_split',
      LEGACY_PLAYER_PROFILE_COLUMNS,
      splitKey,
    )
  }

  const players = rows
    .filter((row) => isPlayerRole(row.position))
    .map((row) => ({
      player_id: row.player_id,
      player: row.player,
      team: row.team,
      position: row.position,
      games_played: toNumber(row.games_played),
      wins: toNumber(row.wins),
      win_rate_pct: toNumber(row.win_rate_pct),
      total_kills: toNumber(row.total_kills),
      total_deaths: toNumber(row.total_deaths),
      total_assists: toNumber(row.total_assists),
      avg_kills: toNumber(row.avg_kills),
      avg_deaths: toNumber(row.avg_deaths),
      avg_assists: toNumber(row.avg_assists),
      kda: toNumber(row.kda),
      avg_kill_participation_pct: toNumber(row.avg_kill_participation_pct),
      avg_dpm: Math.round(toNumber(row.avg_dpm)),
      avg_gold_per_min: toNumber(row.avg_gold_per_min),
      avg_damage_share: toNumber(row.avg_damage_share),
      avg_vision_score: toNumber(row.avg_vision_score),
      avg_wards_placed: toNumber(row.avg_wards_placed),
      avg_wards_killed: toNumber(row.avg_wards_killed),
      avg_control_wards_bought: toNumber(row.avg_control_wards_bought),
      avg_cspm: toNumber(row.avg_cspm),
      avg_gd15: toNumber(row.avg_gd15),
      avg_xpd15: toNumber(row.avg_xpd15),
      avg_csd15: toNumber(row.avg_csd15),
      first_blood_pct: toNumber(row.first_blood_pct),
      first_tower_pct: toNumber(row.first_tower_pct),
      radar: [],
    }))

  return attachRoleRadars(players).sort((a, b) => {
    if (a.position !== b.position) return a.position.localeCompare(b.position)
    if (b.games_played !== a.games_played) return b.games_played - a.games_played
    return a.player.localeCompare(b.player)
  })
}

async function getChampionProfilesForGameIds(
  gameIds: string[],
): Promise<ChampionProfile[]> {
  const [playerRows, draftRows] = await Promise.all([
    fetchRowsByGameIds<RawScopedPlayerGameStat>(
      'game_player_stats',
      'game_id, player_id, team_id, position, champion, result, kills, deaths, assists, dpm, damage_share, vision_score, wards_placed, wards_killed, control_wards_bought, cspm, players ( name ), teams ( name )',
      gameIds,
      ['game_id', 'player_id'],
    ),
    fetchRowsByGameIds<RawScopedDraftAction>(
      'draft_actions',
      'game_id, action_type, champion',
      gameIds,
      ['game_id', 'side', 'action_type', 'action_order'],
    ),
  ])

  type ChampionAccumulator = {
    champion: string
    picks: number
    bans: number
    wins: number
    total_kills: number
    total_deaths: number
    total_assists: number
    total_dpm: number
    total_damage_share: number
    total_cspm: number
    roles: Set<string>
  }

  const champions = new Map<string, ChampionAccumulator>()

  function ensureChampion(champion: string) {
    const accumulator =
      champions.get(champion) ??
      ({
        champion,
        picks: 0,
        bans: 0,
        wins: 0,
        total_kills: 0,
        total_deaths: 0,
        total_assists: 0,
        total_dpm: 0,
        total_damage_share: 0,
        total_cspm: 0,
        roles: new Set<string>(),
      } satisfies ChampionAccumulator)

    champions.set(champion, accumulator)
    return accumulator
  }

  for (const row of playerRows) {
    if (!row.champion) continue

    const champion = ensureChampion(row.champion)
    champion.picks += 1
    champion.wins += row.result ? 1 : 0
    champion.total_kills += toNumber(row.kills)
    champion.total_deaths += toNumber(row.deaths)
    champion.total_assists += toNumber(row.assists)
    champion.total_dpm += toNumber(row.dpm)
    champion.total_damage_share += toNumber(row.damage_share)
    champion.total_cspm += toNumber(row.cspm)

    if (row.position) {
      champion.roles.add(row.position)
    }
  }

  for (const row of draftRows) {
    if (row.action_type !== 'ban' || !row.champion) continue
    ensureChampion(row.champion).bans += 1
  }

  const roleOrder = new Map(
    ['top', 'jng', 'mid', 'bot', 'sup'].map((role, index) => [role, index]),
  )
  const totalGames = gameIds.length

  return Array.from(champions.values())
    .map((champion) => ({
      champion: champion.champion,
      picks: champion.picks,
      bans: champion.bans,
      presence: champion.picks + champion.bans,
      pick_rate_pct: pct(champion.picks, totalGames),
      ban_rate_pct: pct(champion.bans, totalGames),
      presence_rate_pct: pct(champion.picks + champion.bans, totalGames),
      wins: champion.wins,
      win_rate_pct: pct(champion.wins, champion.picks),
      total_kills: champion.total_kills,
      total_deaths: champion.total_deaths,
      total_assists: champion.total_assists,
      kda:
        champion.total_deaths > 0
          ? round(
              (champion.total_kills + champion.total_assists) /
                champion.total_deaths,
              2,
            )
          : 0,
      avg_dpm:
        champion.picks > 0 ? Math.round(champion.total_dpm / champion.picks) : 0,
      avg_damage_share:
        champion.picks > 0
          ? round((champion.total_damage_share / champion.picks) * 100)
          : 0,
      avg_cspm:
        champion.picks > 0 ? round(champion.total_cspm / champion.picks) : 0,
      roles:
        champion.roles.size > 0
          ? Array.from(champion.roles)
              .sort(
                (a, b) =>
                  (roleOrder.get(a) ?? Number.MAX_SAFE_INTEGER) -
                    (roleOrder.get(b) ?? Number.MAX_SAFE_INTEGER) ||
                  a.localeCompare(b),
              )
              .join(' / ')
          : 'Not picked',
    }))
    .sort((a, b) => {
      if (b.presence !== a.presence) return b.presence - a.presence
      if (b.picks !== a.picks) return b.picks - a.picks
      return a.champion.localeCompare(b.champion)
    })
}

export async function getChampionProfiles(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<ChampionProfile[]> {
  const gameIds = await getGameIdsForTeamSplitScope(splitKey)

  if (gameIds !== null) {
    return getChampionProfilesForGameIds(gameIds)
  }

  const rows = await fetchScopedRows<RawChampionProfile>(
    'dashboard_champion_stats_by_split',
    'champion, picks, bans, presence, pick_rate_pct, ban_rate_pct, presence_rate_pct, wins, win_rate_pct, total_kills, total_deaths, total_assists, kda, avg_dpm, avg_damage_share, avg_cspm, roles',
    splitKey,
  )

  return rows
    .map((champion) => ({
      champion: champion.champion,
      picks: toNumber(champion.picks),
      bans: toNumber(champion.bans),
      presence: toNumber(champion.presence),
      pick_rate_pct: toNumber(champion.pick_rate_pct),
      ban_rate_pct: toNumber(champion.ban_rate_pct),
      presence_rate_pct: toNumber(champion.presence_rate_pct),
      wins: toNumber(champion.wins),
      win_rate_pct: toNumber(champion.win_rate_pct),
      total_kills: toNumber(champion.total_kills),
      total_deaths: toNumber(champion.total_deaths),
      total_assists: toNumber(champion.total_assists),
      kda: toNumber(champion.kda),
      avg_dpm: Math.round(toNumber(champion.avg_dpm)),
      avg_damage_share: toNumber(champion.avg_damage_share),
      avg_cspm: toNumber(champion.avg_cspm),
      roles: champion.roles || 'Not picked',
    }))
    .sort((a, b) => {
      if (b.presence !== a.presence) return b.presence - a.presence
      if (b.picks !== a.picks) return b.picks - a.picks
      return a.champion.localeCompare(b.champion)
    })
}

function normalizeMatchupMetric(
  profiles: PlayerChampionMatchupProfile[],
  profile: PlayerChampionMatchupProfile,
  key: keyof PlayerChampionMatchupProfile,
  lowerIsBetter = false,
) {
  const peers = profiles.filter((candidate) => candidate.position === profile.position)
  const values = peers
    .map((candidate) => Number(candidate[key]))
    .filter((value) => Number.isFinite(value))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const value = Number(profile[key])

  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return 0
  }

  if (max === min) return 50

  const normalized = lowerIsBetter
    ? ((max - value) / (max - min)) * 100
    : ((value - min) / (max - min)) * 100

  return Math.min(Math.max(normalized, 0), 100)
}

function matchupPerformanceScore(
  profiles: PlayerChampionMatchupProfile[],
  profile: PlayerChampionMatchupProfile,
) {
  const metricWeights: [keyof PlayerChampionMatchupProfile, number, boolean?][] =
    profile.position === 'sup'
      ? [
          ['win_rate_pct', 1.4],
          ['kda', 1.2],
          ['avg_assists', 1.4],
          ['avg_vision_score', 1.8],
          ['avg_deaths', 1.1, true],
          ['first_tower_pct', 0.7],
        ]
      : profile.position === 'jng'
        ? [
            ['win_rate_pct', 1.5],
            ['kda', 1.2],
            ['avg_assists', 1.2],
            ['avg_dpm', 1],
            ['avg_gd15', 1],
            ['first_blood_pct', 0.9],
          ]
        : [
            ['win_rate_pct', 1.3],
            ['kda', 1.2],
            ['avg_dpm', 1.4],
            ['avg_damage_share', 1],
            ['avg_cspm', 1],
            ['avg_gd15', 1.1],
          ]

  const totalWeight = metricWeights.reduce((sum, [, weight]) => sum + weight, 0)
  const weightedScore = metricWeights.reduce((sum, [key, weight, lowerIsBetter]) => {
    return sum + normalizeMatchupMetric(profiles, profile, key, lowerIsBetter) * weight
  }, 0)

  return round(weightedScore / totalWeight)
}

function normalizeMatchupGames(games: RawMatchupProfile['games']): MatchupGame[] {
  if (!games) return []
  if (Array.isArray(games)) return games

  try {
    const parsed = JSON.parse(games)
    return Array.isArray(parsed) ? (parsed as MatchupGame[]) : []
  } catch {
    return []
  }
}

export async function getPlayerChampionMatchups(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<PlayerChampionMatchupProfile[]> {
  const rows = await fetchScopedRows<RawMatchupProfile>(
    'dashboard_player_champion_matchups_by_split',
    'player_id, player, team, position, champion, games_played, wins, win_rate_pct, total_kills, total_deaths, total_assists, avg_kills, avg_deaths, avg_assists, kda, avg_dpm, avg_damage_share, avg_cspm, avg_vision_score, avg_gd15, avg_xpd15, avg_csd15, first_blood_pct, first_tower_pct, games',
    splitKey,
  )

  const profiles = rows
    .filter((row) => isPlayerRole(row.position))
    .map((profile) => ({
      id: `${profile.player_id}:${profile.position}:${profile.champion}`,
      player_id: profile.player_id,
      player: profile.player,
      team: profile.team,
      position: profile.position,
      champion: profile.champion,
      games_played: toNumber(profile.games_played),
      wins: toNumber(profile.wins),
      win_rate_pct: toNumber(profile.win_rate_pct),
      total_kills: toNumber(profile.total_kills),
      total_deaths: toNumber(profile.total_deaths),
      total_assists: toNumber(profile.total_assists),
      avg_kills: toNumber(profile.avg_kills),
      avg_deaths: toNumber(profile.avg_deaths),
      avg_assists: toNumber(profile.avg_assists),
      kda: toNumber(profile.kda),
      avg_dpm: Math.round(toNumber(profile.avg_dpm)),
      avg_damage_share: toNumber(profile.avg_damage_share),
      avg_cspm: toNumber(profile.avg_cspm),
      avg_vision_score: toNumber(profile.avg_vision_score),
      avg_gd15: toNumber(profile.avg_gd15),
      avg_xpd15: toNumber(profile.avg_xpd15),
      avg_csd15: toNumber(profile.avg_csd15),
      first_blood_pct: toNumber(profile.first_blood_pct),
      first_tower_pct: toNumber(profile.first_tower_pct),
      performance_score: 0,
      games: normalizeMatchupGames(profile.games),
    }))

  return profiles
    .map((profile) => ({
      ...profile,
      performance_score: matchupPerformanceScore(profiles, profile),
    }))
    .sort((a, b) => {
      if (a.player !== b.player) return a.player.localeCompare(b.player)
      if (b.games_played !== a.games_played) return b.games_played - a.games_played
      return a.champion.localeCompare(b.champion)
    })
}

export async function getPomLeaders(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<PomLeader[]> {
  const rows = await fetchScopedRows<
    Pick<
      RawPlayerRoleProfile,
      | 'player'
      | 'team'
      | 'games_played'
      | 'wins'
      | 'total_kills'
      | 'total_deaths'
      | 'total_assists'
      | 'avg_damage_share'
      | 'avg_vision_score'
    >
  >(
    'dashboard_player_stats_by_split',
    'player, team, games_played, wins, total_kills, total_deaths, total_assists, avg_damage_share, avg_vision_score',
    splitKey,
  )

  const scored = rows
    .map((row) => {
      const games = toNumber(row.games_played)
      const points =
        toNumber(row.total_kills) * 3 +
        toNumber(row.total_assists) * 1.5 -
        toNumber(row.total_deaths) +
        toNumber(row.wins) * 3 +
        toNumber(row.avg_vision_score) * games * 0.15 +
        toNumber(row.avg_damage_share) * games * 0.2

      return {
        player: row.player,
        team: row.team,
        pom_points: round(points, 1),
      }
    })
    .sort((a, b) => {
      if (b.pom_points !== a.pom_points) return b.pom_points - a.pom_points
      return a.player.localeCompare(b.player)
    })

  const leaders: PomLeader[] = []
  let currentRank = 0
  let lastPoints: number | null = null

  scored.forEach((player, index) => {
    if (player.pom_points !== lastPoints) {
      currentRank = index + 1
      lastPoints = player.pom_points
    }

    if (currentRank <= 5) {
      leaders.push({ ...player, rnk: currentRank })
    }
  })

  return leaders
}

export async function getTopPickedChampions(
  limit = 5,
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<ChampionRate[]> {
  const rows = await fetchScopedRows<
    Pick<RawChampionProfile, 'champion' | 'picks' | 'pick_rate_pct'>
  >(
    'dashboard_champion_stats_by_split',
    'champion, picks, pick_rate_pct',
    splitKey,
  )

  return rows
    .map((champion) => ({
      champion: champion.champion,
      pick_rate_pct: toNumber(champion.pick_rate_pct),
    }))
    .sort((a, b) => (b.pick_rate_pct ?? 0) - (a.pick_rate_pct ?? 0))
    .slice(0, limit)
}

export async function getTopBannedChampions(
  limit = 5,
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<ChampionRate[]> {
  const rows = await fetchScopedRows<
    Pick<RawChampionProfile, 'champion' | 'bans' | 'ban_rate_pct'>
  >(
    'dashboard_champion_stats_by_split',
    'champion, bans, ban_rate_pct',
    splitKey,
  )

  return rows
    .map((champion) => ({
      champion: champion.champion,
      ban_rate_pct: toNumber(champion.ban_rate_pct),
    }))
    .sort((a, b) => (b.ban_rate_pct ?? 0) - (a.ban_rate_pct ?? 0))
    .slice(0, limit)
}

export async function getGoldSwingBySplit(): Promise<SplitGoldSwing[]> {
  const { data, error } = await supabase
    .from('avg_lane_gold_swing_at_15_by_split')
    .select('*')

  if (error) throw error
  return data
}

export async function getRecentGames(
  limit = 6,
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<RecentGame[]> {
  const { data: games, error: gamesError } = await supabase
    .from('dashboard_game_scopes')
    .select('game_id, source_split, split_label, game_date')
    .eq('split_key', splitKey)
    .order('game_date', { ascending: false })
    .limit(limit)

  if (gamesError) throw gamesError
  if (!games?.length) return []

  const gameRows = games as RawRecentGameScope[]
  const gameIds = gameRows.map((game) => game.game_id)

  const [{ data: sides, error: sidesError }, { data: drafts, error: draftsError }] =
    await Promise.all([
      supabase
        .from('game_team_stats')
        .select('game_id, side, result, teams ( name )')
        .in('game_id', gameIds),
      supabase
        .from('game_draft_summary')
        .select('game_id, side, bans, picks')
        .in('game_id', gameIds),
    ])

  if (sidesError) throw sidesError
  if (draftsError) throw draftsError

  return gameRows.map((game) => ({
    game_id: game.game_id,
    split: game.source_split ?? game.split_label,
    game_date: game.game_date,
    sides: ((sides ?? []) as RawRecentGameSide[])
      .filter((side) => side.game_id === game.game_id)
      .map((side) => ({
        side: side.side,
        result: side.result,
        teams: normalizeTeam(side.teams),
      })),
    drafts: ((drafts ?? []) as RawGameDraft[])
      .filter((draft) => draft.game_id === game.game_id)
      .filter((draft) => draft.side === 'Blue' || draft.side === 'Red')
      .map((draft) => ({
        side: draft.side as 'Blue' | 'Red',
        bans: draft.bans,
        picks: draft.picks,
      })),
  }))
}

type HomeGroupTeam = {
  label: string
  dbName: string
}

type TeamGroupDefinition = {
  name: string
  teams: HomeGroupTeam[]
}

type RawHomeGame = {
  game_id: string
  split: string
  playoffs: boolean
  game_date: string
  game_number: NumericValue
}

type RawHomeTeamSide = {
  game_id: string
  side: string
  first_pick: boolean | null
  result: boolean
  teams: SupabaseNestedTeam
}

type InternalSeries = {
  id: string
  date: string
  split: string
  playoffs: boolean
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  winner: string
  gamesPlayed: number
  gameIds: string[]
}

export const TEAMS_CUP_POSTSEASON_SPLIT_KEY = 'cup-play-in-playoffs'
export const TEAMS_ROAD_TO_MSI_SPLIT_KEY = 'road-to-msi'
export const TEAMS_SEASON_POSTSEASON_SPLIT_KEY = 'season-play-in-playoffs'

export const TEAM_SPLIT_OPTIONS: DashboardSplitOption[] = [
  {
    split_key: DEFAULT_SPLIT_KEY,
    split_label: 'All Splits',
    source_split: null,
    sort_order: 0,
    games_played: 0,
    first_game_date: null,
    last_game_date: null,
  },
  {
    split_key: 'Cup',
    split_label: 'Cup',
    source_split: 'Cup',
    sort_order: 1,
    games_played: 0,
    first_game_date: null,
    last_game_date: null,
  },
  {
    split_key: TEAMS_CUP_POSTSEASON_SPLIT_KEY,
    split_label: 'Play-In and Playoffs',
    source_split: 'Cup',
    sort_order: 2,
    games_played: 0,
    first_game_date: null,
    last_game_date: null,
  },
  {
    split_key: 'Rounds 1-2',
    split_label: 'Rounds 1-2',
    source_split: 'Rounds 1-2',
    sort_order: 3,
    games_played: 0,
    first_game_date: null,
    last_game_date: null,
  },
  {
    split_key: TEAMS_ROAD_TO_MSI_SPLIT_KEY,
    split_label: 'Road to MSI',
    source_split: 'Rounds 1-2',
    sort_order: 4,
    games_played: 0,
    first_game_date: null,
    last_game_date: null,
  },
  {
    split_key: 'Rounds 3-4',
    split_label: 'Rounds 3-4',
    source_split: 'Rounds 3-4',
    sort_order: 5,
    games_played: 0,
    first_game_date: null,
    last_game_date: null,
  },
  {
    split_key: TEAMS_SEASON_POSTSEASON_SPLIT_KEY,
    split_label: 'Season Play-In and Playoffs',
    source_split: 'Rounds 3-4',
    sort_order: 6,
    games_played: 0,
    first_game_date: null,
    last_game_date: null,
  },
]

export function getTeamSplitOptions() {
  return TEAM_SPLIT_OPTIONS
}

export const CUP_GROUPS: TeamGroupDefinition[] = [
  {
    name: 'Group Baron',
    teams: [
      { label: 'Gen.G', dbName: 'Gen.G' },
      { label: 'T1', dbName: 'T1' },
      { label: 'NS Redforce', dbName: 'Nongshim RedForce' },
      { label: 'DN SOOPers', dbName: 'DN SOOPers' },
      { label: 'HANJIN BRION', dbName: 'HANJIN BRION' },
    ],
  },
  {
    name: 'Group Dragon',
    teams: [
      { label: 'BNK FearX', dbName: 'BNK FEARX' },
      { label: 'Dplus Kia', dbName: 'Dplus Kia' },
      { label: 'DRX', dbName: 'Kiwoom DRX' },
      { label: 'KT Rolster', dbName: 'KT Rolster' },
      { label: 'Hanwha Life Esports', dbName: 'Hanwha Life Esports' },
    ],
  },
]

export const ROUNDS_THREE_FOUR_GROUPS: TeamGroupDefinition[] = [
  {
    name: 'Legend Group',
    teams: [
      { label: 'Gen.G', dbName: 'Gen.G' },
      { label: 'Hanwha Life Esports', dbName: 'Hanwha Life Esports' },
      { label: 'T1', dbName: 'T1' },
      { label: 'Dplus Kia', dbName: 'Dplus Kia' },
      { label: 'KT Rolster', dbName: 'KT Rolster' },
    ],
  },
  {
    name: 'Rise Group',
    teams: [
      { label: 'HANJIN BRION', dbName: 'HANJIN BRION' },
      { label: 'NS Redforce', dbName: 'Nongshim RedForce' },
      { label: 'BNK FearX', dbName: 'BNK FEARX' },
      { label: 'Kiwoom DRX', dbName: 'Kiwoom DRX' },
      { label: 'DN SOOPers', dbName: 'DN SOOPers' },
    ],
  },
]

const TEAM_LABELS = new Map<string, string>(
  [...CUP_GROUPS, ...ROUNDS_THREE_FOUR_GROUPS].flatMap((group) =>
    group.teams.map((team) => [team.dbName, team.label] as [string, string]),
  ),
)

function displayTeamName(team: string) {
  return TEAM_LABELS.get(team) ?? team
}

function dateOnly(date: string) {
  return date.slice(0, 10)
}

async function getLckGames(filters: {
  split?: string
  playoffs?: boolean
} = {}): Promise<RawHomeGame[]> {
  const rows: RawHomeGame[] = []
  let start = 0

  while (true) {
    let query = supabase
      .from('games')
      .select('game_id, split, playoffs, game_date, game_number')
      .eq('league', 'LCK')
      .order('game_date', { ascending: true })
      .order('game_number', { ascending: true })
      .range(start, start + PAGE_SIZE - 1)

    if (filters.split) {
      query = query.eq('split', filters.split)
    }

    if (typeof filters.playoffs === 'boolean') {
      query = query.eq('playoffs', filters.playoffs)
    }

    const { data, error } = await query
    if (error) throw error

    rows.push(...((data ?? []) as RawHomeGame[]))
    if (!data || data.length < PAGE_SIZE) break
    start += PAGE_SIZE
  }

  return rows
}

async function getLckGamesBySplit(
  split: string,
  playoffs?: boolean,
): Promise<RawHomeGame[]> {
  return getLckGames({ split, playoffs })
}

async function getTeamSidesForGames(gameIds: string[]): Promise<RawHomeTeamSide[]> {
  if (gameIds.length === 0) return []

  const rows: RawHomeTeamSide[] = []

  for (let start = 0; start < gameIds.length; start += PAGE_SIZE) {
    const gameIdChunk = gameIds.slice(start, start + PAGE_SIZE)
    const { data, error } = await supabase
      .from('game_team_stats')
      .select('game_id, side, first_pick, result, teams ( name )')
      .in('game_id', gameIdChunk)

    if (error) throw error
    rows.push(...((data ?? []) as RawHomeTeamSide[]))
  }

  return rows
}

function buildSeries(games: RawHomeGame[], sides: RawHomeTeamSide[]) {
  const sidesByGame = new Map<string, RawHomeTeamSide[]>()

  for (const side of sides) {
    const current = sidesByGame.get(side.game_id) ?? []
    current.push(side)
    sidesByGame.set(side.game_id, current)
  }

  const series: InternalSeries[] = []

  for (const game of games) {
    const gameSides = (sidesByGame.get(game.game_id) ?? [])
      .map((side) => ({
        team: normalizeTeam(side.teams)?.name,
        result: side.result,
      }))
      .filter((side): side is { team: string; result: boolean } => Boolean(side.team))

    if (gameSides.length !== 2) continue

    const orderedTeams = gameSides.map((side) => side.team).sort()
    const pairingKey = orderedTeams.join('::')
    const gameNumber = toNumber(game.game_number)
    const lastSeries = series[series.length - 1]

    const shouldStartSeries =
      !lastSeries ||
      gameNumber === 1 ||
      `${lastSeries.teamA}::${lastSeries.teamB}` !== pairingKey

    const currentSeries = shouldStartSeries
      ? {
          id: `${game.split}:${game.game_id}`,
          date: dateOnly(game.game_date),
          split: game.split,
          playoffs: game.playoffs,
          teamA: orderedTeams[0],
          teamB: orderedTeams[1],
          scoreA: 0,
          scoreB: 0,
          winner: orderedTeams[0],
          gamesPlayed: 0,
          gameIds: [],
        }
      : lastSeries

    if (shouldStartSeries) {
      series.push(currentSeries)
    }

    currentSeries.gamesPlayed += 1
    currentSeries.gameIds.push(game.game_id)
    for (const side of gameSides) {
      if (!side.result) continue
      if (side.team === currentSeries.teamA) currentSeries.scoreA += 1
      if (side.team === currentSeries.teamB) currentSeries.scoreB += 1
    }

    currentSeries.winner =
      currentSeries.scoreA >= currentSeries.scoreB
        ? currentSeries.teamA
        : currentSeries.teamB
  }

  return series
}

async function getLckSeries(split: string, playoffs?: boolean) {
  const games = await getLckGamesBySplit(split, playoffs)
  const sides = await getTeamSidesForGames(games.map((game) => game.game_id))
  return buildSeries(games, sides)
}

function isKnownSide(side: string): side is 'Blue' | 'Red' {
  return side === 'Blue' || side === 'Red'
}

function buildTeamSideProfiles(
  series: InternalSeries[],
  sides: RawHomeTeamSide[],
): TeamSideProfile[] {
  const teams = new Map<string, TeamSideProfile>()

  function ensureTeam(team: string) {
    const current =
      teams.get(team) ??
      ({
        team: displayTeamName(team),
        matches_played: 0,
        match_wins: 0,
        match_losses: 0,
        games_played: 0,
        game_wins: 0,
        game_losses: 0,
        win_rate_pct: 0,
        blue_games_played: 0,
        blue_wins: 0,
        blue_win_rate_pct: 0,
        red_games_played: 0,
        red_wins: 0,
        red_win_rate_pct: 0,
        side_delta_pct: null,
        first_pick_games_played: 0,
        first_pick_wins: 0,
        first_pick_win_rate_pct: 0,
        second_pick_games_played: 0,
        second_pick_wins: 0,
        second_pick_win_rate_pct: 0,
      } satisfies TeamSideProfile)

    teams.set(team, current)
    return current
  }

  for (const result of series) {
    const entries = [
      {
        team: result.teamA,
        wins: result.scoreA,
        losses: result.scoreB,
      },
      {
        team: result.teamB,
        wins: result.scoreB,
        losses: result.scoreA,
      },
    ]

    for (const entry of entries) {
      const team = ensureTeam(entry.team)
      team.matches_played += 1
      team.match_wins += entry.wins > entry.losses ? 1 : 0
      team.match_losses += entry.wins > entry.losses ? 0 : 1
    }
  }

  for (const side of sides) {
    if (!isKnownSide(side.side)) continue

    const teamName = normalizeTeam(side.teams)?.name
    if (!teamName) continue

    const team = ensureTeam(teamName)
    team.games_played += 1
    team.game_wins += side.result ? 1 : 0
    team.game_losses += side.result ? 0 : 1

    if (side.side === 'Blue') {
      team.blue_games_played += 1
      team.blue_wins += side.result ? 1 : 0
    } else {
      team.red_games_played += 1
      team.red_wins += side.result ? 1 : 0
    }

    if (side.first_pick === true) {
      team.first_pick_games_played += 1
      team.first_pick_wins += side.result ? 1 : 0
    } else if (side.first_pick === false) {
      team.second_pick_games_played += 1
      team.second_pick_wins += side.result ? 1 : 0
    }
  }

  return Array.from(teams.values())
    .map((team) => {
      const blueWinRate =
        team.blue_games_played > 0
          ? round((team.blue_wins / team.blue_games_played) * 100)
          : 0
      const redWinRate =
        team.red_games_played > 0
          ? round((team.red_wins / team.red_games_played) * 100)
          : 0
      const sideDelta =
        team.blue_games_played > 0 && team.red_games_played > 0
          ? round(blueWinRate - redWinRate)
          : null

      return {
        ...team,
        win_rate_pct:
          team.games_played > 0
            ? round((team.game_wins / team.games_played) * 100)
            : 0,
        blue_win_rate_pct: blueWinRate,
        red_win_rate_pct: redWinRate,
        side_delta_pct: sideDelta,
        first_pick_win_rate_pct: pct(
          team.first_pick_wins,
          team.first_pick_games_played,
        ),
        second_pick_win_rate_pct: pct(
          team.second_pick_wins,
          team.second_pick_games_played,
        ),
      }
    })
    .sort((a, b) => {
      if (b.match_wins !== a.match_wins) return b.match_wins - a.match_wins
      if (b.win_rate_pct !== a.win_rate_pct) return b.win_rate_pct - a.win_rate_pct
      if (b.games_played !== a.games_played) return b.games_played - a.games_played
      return a.team.localeCompare(b.team)
    })
}

async function getTeamSideProfilesFromLckGames(filters: {
  split?: string
  playoffs?: boolean
}) {
  const games = await getLckGames(filters)
  const sides = await getTeamSidesForGames(games.map((game) => game.game_id))
  const series = buildSeries(games, sides)

  return buildTeamSideProfiles(series, sides)
}

async function getCupPostseasonTeamSideProfiles() {
  const games = await getLckGamesBySplit('Cup')
  const sides = await getTeamSidesForGames(games.map((game) => game.game_id))
  const cup = splitCupSeries(buildSeries(games, sides))
  const postseasonSeries = [...cup.playIn, ...cup.playoffs]
  const postseasonGameIds = new Set(
    postseasonSeries.flatMap((series) => series.gameIds),
  )

  return buildTeamSideProfiles(
    postseasonSeries,
    sides.filter((side) => postseasonGameIds.has(side.game_id)),
  )
}

async function getCupGroupTeamSideProfiles() {
  const games = await getLckGamesBySplit('Cup')
  const sides = await getTeamSidesForGames(games.map((game) => game.game_id))
  const cup = splitCupSeries(buildSeries(games, sides))
  const groupGameIds = new Set(cup.group.flatMap((series) => series.gameIds))

  return buildTeamSideProfiles(
    cup.group,
    sides.filter((side) => groupGameIds.has(side.game_id)),
  )
}

export async function getTeamPageSideProfiles(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<TeamSideProfile[]> {
  switch (splitKey) {
    case DEFAULT_SPLIT_KEY:
      return getTeamSideProfilesFromLckGames({})
    case 'Cup':
      return getCupGroupTeamSideProfiles()
    case TEAMS_CUP_POSTSEASON_SPLIT_KEY:
      return getCupPostseasonTeamSideProfiles()
    case 'Rounds 1-2':
      return getTeamSideProfilesFromLckGames({
        split: 'Rounds 1-2',
        playoffs: false,
      })
    case TEAMS_ROAD_TO_MSI_SPLIT_KEY:
      return getTeamSideProfilesFromLckGames({
        split: 'Rounds 1-2',
        playoffs: true,
      })
    case 'Rounds 3-4':
      return getTeamSideProfilesFromLckGames({
        split: 'Rounds 3-4',
        playoffs: false,
      })
    case TEAMS_SEASON_POSTSEASON_SPLIT_KEY:
      return getTeamSideProfilesFromLckGames({
        split: 'Rounds 3-4',
        playoffs: true,
      })
    default:
      return getTeamSideProfiles(splitKey)
  }
}

function buildStandings(
  series: InternalSeries[],
  groupTeams?: HomeGroupTeam[],
): HomeStandingRow[] {
  const allowedTeams = groupTeams
    ? new Map(groupTeams.map((team) => [team.dbName, team.label]))
    : null
  const teams = new Map<string, HomeStandingRow>()

  function ensureTeam(team: string) {
    const displayName = allowedTeams?.get(team) ?? displayTeamName(team)
    const current =
      teams.get(team) ??
      ({
        team: displayName,
        matches_played: 0,
        match_wins: 0,
        match_losses: 0,
        game_wins: 0,
        game_losses: 0,
      } satisfies HomeStandingRow)

    teams.set(team, current)
    return current
  }

  for (const team of allowedTeams?.keys() ?? []) {
    ensureTeam(team)
  }

  for (const result of series) {
    const entries = [
      {
        team: result.teamA,
        wins: result.scoreA,
        losses: result.scoreB,
      },
      {
        team: result.teamB,
        wins: result.scoreB,
        losses: result.scoreA,
      },
    ]

    for (const entry of entries) {
      if (allowedTeams && !allowedTeams.has(entry.team)) continue

      const standing = ensureTeam(entry.team)
      standing.matches_played += 1
      standing.match_wins += entry.wins > entry.losses ? 1 : 0
      standing.match_losses += entry.wins > entry.losses ? 0 : 1
      standing.game_wins += entry.wins
      standing.game_losses += entry.losses
    }
  }

  return Array.from(teams.values()).sort((a, b) => {
    if (b.match_wins !== a.match_wins) return b.match_wins - a.match_wins
    const gameDiffA = a.game_wins - a.game_losses
    const gameDiffB = b.game_wins - b.game_losses
    if (gameDiffB !== gameDiffA) return gameDiffB - gameDiffA
    if (b.game_wins !== a.game_wins) return b.game_wins - a.game_wins
    return a.team.localeCompare(b.team)
  })
}

function buildGroups(
  groups: { name: string; teams: HomeGroupTeam[] }[],
  series: InternalSeries[],
): HomeTeamGroup[] {
  return groups.map((group) => ({
    name: group.name,
    teams: group.teams.map((team) => team.label),
    standings: buildStandings(series, group.teams),
  }))
}

function splitCupSeries(series: InternalSeries[]) {
  const groupTeams = new Set(
    CUP_GROUPS.flatMap((group) => group.teams.map((team) => team.dbName)),
  )
  const appearances = new Map<string, number>(
    Array.from(groupTeams).map((team) => [team, 0]),
  )
  let groupEndIndex = 0

  for (const result of series) {
    if (!groupTeams.has(result.teamA) || !groupTeams.has(result.teamB)) break

    appearances.set(result.teamA, (appearances.get(result.teamA) ?? 0) + 1)
    appearances.set(result.teamB, (appearances.get(result.teamB) ?? 0) + 1)
    groupEndIndex += 1

    if (Array.from(appearances.values()).every((count) => count >= 5)) {
      break
    }
  }

  const bracketSeries = series.slice(groupEndIndex)

  return {
    group: series.slice(0, groupEndIndex),
    playIn: bracketSeries.slice(0, 5),
    playoffs: bracketSeries.slice(5),
  }
}

type BracketMatchDefinition = {
  stage: string
  teamA: string
  teamB: string
  label?: string
  placeholderScore?: string
}

function teamPairKey(teamA: string, teamB: string) {
  return [teamA, teamB].sort().join('::')
}

function toBracketSeriesByPlan(
  series: InternalSeries[],
  matchDefinitions: BracketMatchDefinition[],
): HomeBracketSeries[] {
  const seriesByPair = new Map<string, InternalSeries[]>()
  const bracketSeries: HomeBracketSeries[] = []

  for (const result of series) {
    const key = teamPairKey(result.teamA, result.teamB)
    const current = seriesByPair.get(key) ?? []
    current.push(result)
    seriesByPair.set(key, current)
  }

  matchDefinitions.forEach((definition, index) => {
    const key = teamPairKey(definition.teamA, definition.teamB)
    const matchingSeries = seriesByPair.get(key)
    const result = matchingSeries?.shift()

    if (!result) {
      if (definition.placeholderScore) {
        bracketSeries.push({
          id: `placeholder:${definition.stage}:${index}`,
          stage: definition.stage,
          match_label: definition.label,
          team_a: displayTeamName(definition.teamA),
          team_b: displayTeamName(definition.teamB),
          score_a: definition.placeholderScore,
          score_b: definition.placeholderScore,
        })
      }

      return
    }

    const definitionTeamAWon = result.winner === definition.teamA
    const resultTeamAIsDefinitionTeamA = result.teamA === definition.teamA
    const scoreA = resultTeamAIsDefinitionTeamA ? result.scoreA : result.scoreB
    const scoreB = resultTeamAIsDefinitionTeamA ? result.scoreB : result.scoreA

    bracketSeries.push({
      id: result.id,
      date: result.date,
      stage: definition.stage,
      match_label: definition.label,
      team_a: displayTeamName(definition.teamA),
      team_b: displayTeamName(definition.teamB),
      score_a: scoreA,
      score_b: scoreB,
      winner: displayTeamName(
        definitionTeamAWon ? definition.teamA : definition.teamB,
      ),
    })
  })

  return bracketSeries
}

const CUP_PLAY_IN_BRACKET: BracketMatchDefinition[] = [
  { stage: 'Round 1', teamA: 'Kiwoom DRX', teamB: 'HANJIN BRION' },
  { stage: 'Round 1', teamA: 'KT Rolster', teamB: 'DN SOOPers' },
  {
    stage: 'Round 2',
    teamA: 'Dplus Kia',
    teamB: 'Kiwoom DRX',
    label: 'Qualification Match',
  },
  {
    stage: 'Round 2',
    teamA: 'Nongshim RedForce',
    teamB: 'DN SOOPers',
    label: 'Qualification Match',
  },
  {
    stage: 'Round 3',
    teamA: 'Kiwoom DRX',
    teamB: 'Nongshim RedForce',
    label: 'Qualification Match',
  },
]

const CUP_PLAYOFF_BRACKET: BracketMatchDefinition[] = [
  { stage: 'Round 1', teamA: 'BNK FEARX', teamB: 'DN SOOPers' },
  { stage: 'Round 1', teamA: 'Dplus Kia', teamB: 'Kiwoom DRX' },
  {
    stage: 'Round 1',
    teamA: 'DN SOOPers',
    teamB: 'Kiwoom DRX',
    label: "Losers' Bracket",
  },
  { stage: 'Round 2', teamA: 'Gen.G', teamB: 'Dplus Kia' },
  { stage: 'Round 2', teamA: 'T1', teamB: 'BNK FEARX' },
  {
    stage: 'Round 2',
    teamA: 'Dplus Kia',
    teamB: 'DN SOOPers',
    label: 'R2 Lower Seed',
  },
  {
    stage: 'Round 3',
    teamA: 'T1',
    teamB: 'Dplus Kia',
    label: 'R2 Higher Seed',
  },
  { stage: 'Round 4', teamA: 'Gen.G', teamB: 'BNK FEARX' },
  {
    stage: 'Round 4',
    teamA: 'BNK FEARX',
    teamB: 'Dplus Kia',
    label: 'Lower Finals',
  },
  { stage: 'Finals', teamA: 'Gen.G', teamB: 'BNK FEARX' },
]

const ROAD_TO_MSI_BRACKET: BracketMatchDefinition[] = [
  { stage: 'Round 1', teamA: 'Dplus Kia', teamB: 'HANJIN BRION' },
  { stage: 'Round 2', teamA: 'KT Rolster', teamB: 'Dplus Kia' },
  {
    stage: 'Round 3',
    teamA: 'Hanwha Life Esports',
    teamB: 'T1',
    label: 'Qualification Match',
  },
  { stage: 'Round 3', teamA: 'Gen.G', teamB: 'KT Rolster' },
  {
    stage: 'Round 4',
    teamA: 'T1',
    teamB: 'Gen.G',
    label: 'Qualification Match',
  },
]

const SEASON_PLAY_IN_BRACKET: BracketMatchDefinition[] = [
  {
    stage: 'Round 1',
    teamA: 'KT Rolster',
    teamB: 'HANJIN BRION',
    label: 'Qualification Match',
  },
  { stage: 'Round 1', teamA: 'Nongshim RedForce', teamB: 'BNK FEARX' },
  {
    stage: 'Round 2',
    teamA: 'HANJIN BRION',
    teamB: 'BNK FEARX',
    label: 'Qualification Match',
  },
]

const SEASON_PLAYOFF_BRACKET: BracketMatchDefinition[] = [
  { stage: 'Round 1', teamA: 'T1', teamB: 'BNK FEARX' },
  { stage: 'Round 1', teamA: 'Dplus Kia', teamB: 'KT Rolster' },
  {
    stage: 'Round 1',
    teamA: 'BNK FEARX',
    teamB: 'Dplus Kia',
    label: "Losers' Bracket",
  },
  { stage: 'Round 2', teamA: 'Gen.G', teamB: 'KT Rolster' },
  { stage: 'Round 2', teamA: 'Hanwha Life Esports', teamB: 'T1' },
  {
    stage: 'Round 2',
    teamA: 'KT Rolster',
    teamB: 'Dplus Kia',
    label: 'R2 Lower Seed',
  },
  {
    stage: 'Round 3',
    teamA: 'T1',
    teamB: 'Dplus Kia',
    label: 'R2 Higher Seed',
  },
  { stage: 'Round 4', teamA: 'Gen.G', teamB: 'Hanwha Life Esports' },
  {
    stage: 'Round 4',
    teamA: 'Hanwha Life Esports',
    teamB: 'T1',
    label: 'Lower Finals',
  },
  {
    stage: 'Grand Finals',
    teamA: 'Gen.G',
    teamB: 'Hanwha Life Esports',
  },
]

export async function getHomeSeasonOverview(): Promise<HomeSeasonOverview> {
  const [cupSeries, roundsOneTwoSeries, roadToMsiSeries, roundsThreeFourSeries, seasonFinalsSeries] =
    await Promise.all([
      getLckSeries('Cup'),
      getLckSeries('Rounds 1-2', false),
      getLckSeries('Rounds 1-2', true),
      getLckSeries('Rounds 3-4', false),
      getLckSeries('Rounds 3-4', true),
    ])

  const cup = splitCupSeries(cupSeries)
  const seasonPlayInSeries = seasonFinalsSeries.slice(0, 3)
  const seasonPlayoffSeries = seasonFinalsSeries.slice(3)
  const cumulativeRoundsThreeFour = [
    ...roundsOneTwoSeries,
    ...roundsThreeFourSeries,
  ]

  return {
    cup: {
      groups: buildGroups(CUP_GROUPS, cup.group),
      playIn: toBracketSeriesByPlan(cup.playIn, CUP_PLAY_IN_BRACKET),
      playoffs: toBracketSeriesByPlan(cup.playoffs, CUP_PLAYOFF_BRACKET),
    },
    roundsOneTwo: {
      standings: buildStandings(roundsOneTwoSeries),
    },
    roadToMsi: {
      bracket: toBracketSeriesByPlan(roadToMsiSeries, ROAD_TO_MSI_BRACKET),
    },
    roundsThreeFour: {
      groups: buildGroups(ROUNDS_THREE_FOUR_GROUPS, cumulativeRoundsThreeFour),
    },
    seasonFinals: {
      playIn: toBracketSeriesByPlan(
        seasonPlayInSeries,
        SEASON_PLAY_IN_BRACKET,
      ),
      playoffs: toBracketSeriesByPlan(
        seasonPlayoffSeries,
        SEASON_PLAYOFF_BRACKET,
      ),
    },
  }
}

export type TeamBracketSection = {
  title: string
  matches: HomeBracketSeries[]
  emptyText: string
}

export async function getTeamBracketSections(
  splitKey: string,
): Promise<TeamBracketSection[]> {
  if (
    splitKey !== TEAMS_CUP_POSTSEASON_SPLIT_KEY &&
    splitKey !== TEAMS_ROAD_TO_MSI_SPLIT_KEY &&
    splitKey !== TEAMS_SEASON_POSTSEASON_SPLIT_KEY
  ) {
    return []
  }

  const overview = await getHomeSeasonOverview()

  if (splitKey === TEAMS_CUP_POSTSEASON_SPLIT_KEY) {
    return [
      {
        title: 'Play-In',
        matches: overview.cup.playIn,
        emptyText: 'No LCK Cup play-in results are loaded yet.',
      },
      {
        title: 'Playoffs',
        matches: overview.cup.playoffs,
        emptyText: 'No LCK Cup playoff results are loaded yet.',
      },
    ]
  }

  if (splitKey === TEAMS_ROAD_TO_MSI_SPLIT_KEY) {
    return [
      {
        title: 'Road to MSI Bracket',
        matches: overview.roadToMsi.bracket,
        emptyText: 'No Road to MSI results are loaded yet.',
      },
    ]
  }

  return [
    {
      title: 'Season Play-In',
      matches: overview.seasonFinals.playIn,
      emptyText: 'No Season Play-In results are loaded yet.',
    },
    {
      title: 'Season Playoffs',
      matches: overview.seasonFinals.playoffs,
      emptyText: 'No Season Playoff results are loaded yet.',
    },
  ]
}
