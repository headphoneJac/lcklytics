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
  | 'avg_dpm'
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
  avg_dpm: NumericValue
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

function toNumber(value: NumericValue) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals))
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

  return Math.round(Math.min(Math.max(normalized, 0), 100))
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
        buildRadarMetric(rolePlayers, player, 'Vision', 'avg_vision_score'),
        buildRadarMetric(rolePlayers, player, 'Wards Placed', 'avg_wards_placed'),
        buildRadarMetric(rolePlayers, player, 'Wards Cleared', 'avg_wards_killed'),
        buildRadarMetric(rolePlayers, player, 'Control Wards', 'avg_control_wards_bought'),
        buildRadarMetric(rolePlayers, player, 'Assists', 'avg_assists'),
        buildRadarMetric(rolePlayers, player, 'Survival', 'avg_deaths', {
          lowerIsBetter: true,
        }),
      ]
      continue
    }

    if (player.position === 'jng') {
      player.radar = [
        buildRadarMetric(rolePlayers, player, 'KDA', 'kda'),
        buildRadarMetric(rolePlayers, player, 'Assists', 'avg_assists'),
        buildRadarMetric(rolePlayers, player, 'Vision', 'avg_vision_score'),
        buildRadarMetric(rolePlayers, player, 'DPM', 'avg_dpm'),
        buildRadarMetric(rolePlayers, player, 'GD@15', 'avg_gd15'),
        buildRadarMetric(rolePlayers, player, 'Win Rate', 'win_rate_pct', {
          suffix: '%',
        }),
      ]
      continue
    }

    player.radar = [
      buildRadarMetric(rolePlayers, player, 'GD@15', 'avg_gd15'),
      buildRadarMetric(rolePlayers, player, 'CS/min', 'avg_cspm'),
      buildRadarMetric(rolePlayers, player, 'DPM', 'avg_dpm'),
      buildRadarMetric(rolePlayers, player, 'Damage Share', 'avg_damage_share', {
        suffix: '%',
      }),
      buildRadarMetric(rolePlayers, player, 'KDA', 'kda'),
    ]
  }

  return players
}

export async function getPlayerRoleProfiles(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<PlayerRoleProfile[]> {
  const rows = await fetchScopedRows<RawPlayerRoleProfile>(
    'dashboard_player_stats_by_split',
    'player_id, player, team, position, games_played, wins, win_rate_pct, total_kills, total_deaths, total_assists, avg_kills, avg_deaths, avg_assists, kda, avg_dpm, avg_damage_share, avg_vision_score, avg_wards_placed, avg_wards_killed, avg_control_wards_bought, avg_cspm, avg_gd15, avg_xpd15, avg_csd15, first_blood_pct, first_tower_pct',
    splitKey,
  )

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
      avg_dpm: Math.round(toNumber(row.avg_dpm)),
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

export async function getChampionProfiles(
  splitKey = DEFAULT_SPLIT_KEY,
): Promise<ChampionProfile[]> {
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

type RawHomeGame = {
  game_id: string
  split: string
  playoffs: boolean
  game_date: string
  game_number: NumericValue
}

type RawHomeTeamSide = {
  game_id: string
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
}

const CUP_GROUPS: { name: string; teams: HomeGroupTeam[] }[] = [
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
    name: 'Group Elder',
    teams: [
      { label: 'BNK FearX', dbName: 'BNK FEARX' },
      { label: 'Dplus Kia', dbName: 'Dplus Kia' },
      { label: 'DRX', dbName: 'Kiwoom DRX' },
      { label: 'KT Rolster', dbName: 'KT Rolster' },
      { label: 'Hanwha Life Esports', dbName: 'Hanwha Life Esports' },
    ],
  },
]

const ROUNDS_THREE_FOUR_GROUPS: { name: string; teams: HomeGroupTeam[] }[] = [
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

async function getLckGamesBySplit(
  split: string,
  playoffs?: boolean,
): Promise<RawHomeGame[]> {
  const rows: RawHomeGame[] = []
  let start = 0

  while (true) {
    let query = supabase
      .from('games')
      .select('game_id, split, playoffs, game_date, game_number')
      .eq('league', 'LCK')
      .eq('split', split)
      .order('game_date', { ascending: true })
      .order('game_number', { ascending: true })
      .range(start, start + PAGE_SIZE - 1)

    if (typeof playoffs === 'boolean') {
      query = query.eq('playoffs', playoffs)
    }

    const { data, error } = await query
    if (error) throw error

    rows.push(...((data ?? []) as RawHomeGame[]))
    if (!data || data.length < PAGE_SIZE) break
    start += PAGE_SIZE
  }

  return rows
}

async function getTeamSidesForGames(gameIds: string[]): Promise<RawHomeTeamSide[]> {
  if (gameIds.length === 0) return []

  const rows: RawHomeTeamSide[] = []

  for (let start = 0; start < gameIds.length; start += PAGE_SIZE) {
    const gameIdChunk = gameIds.slice(start, start + PAGE_SIZE)
    const { data, error } = await supabase
      .from('game_team_stats')
      .select('game_id, result, teams ( name )')
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
        }
      : lastSeries

    if (shouldStartSeries) {
      series.push(currentSeries)
    }

    currentSeries.gamesPlayed += 1
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

type BracketStageDefinition = {
  name: string
  count: number
}

function toBracketSeriesByStage(
  series: InternalSeries[],
  stageDefinitions: BracketStageDefinition[],
): HomeBracketSeries[] {
  const stageNames = stageDefinitions.flatMap((stage) =>
    Array.from({ length: stage.count }, () => stage.name),
  )

  return series.map((result, index) => ({
    id: result.id,
    date: result.date,
    stage:
      stageNames[index] ??
      stageDefinitions[stageDefinitions.length - 1]?.name ??
      'Bracket',
    team_a: displayTeamName(result.teamA),
    team_b: displayTeamName(result.teamB),
    score_a: result.scoreA,
    score_b: result.scoreB,
    winner: displayTeamName(result.winner),
  }))
}

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
      playIn: toBracketSeriesByStage(cup.playIn, [
        { name: 'Round 1', count: 2 },
        { name: 'Round 2', count: 2 },
        { name: 'Round 3', count: 1 },
      ]),
      playoffs: toBracketSeriesByStage(cup.playoffs, [
        { name: 'Round 1', count: 2 },
        { name: 'Round 2', count: 3 },
        { name: 'Round 3', count: 3 },
        { name: 'Round 4', count: 1 },
        { name: 'Finals', count: 1 },
      ]),
    },
    roundsOneTwo: {
      standings: buildStandings(roundsOneTwoSeries),
    },
    roadToMsi: {
      bracket: toBracketSeriesByStage(roadToMsiSeries, [
        { name: 'Round 1', count: 1 },
        { name: 'Round 2', count: 1 },
        { name: 'Round 3', count: 2 },
        { name: 'Round 4', count: 1 },
      ]),
    },
    roundsThreeFour: {
      groups: buildGroups(ROUNDS_THREE_FOUR_GROUPS, cumulativeRoundsThreeFour),
    },
    seasonFinals: {
      playIn: toBracketSeriesByStage(seasonPlayInSeries, [
        { name: 'Round 1', count: 2 },
        { name: 'Round 2', count: 1 },
      ]),
      playoffs: toBracketSeriesByStage(seasonPlayoffSeries, [
        { name: 'Round 1', count: 2 },
        { name: 'Round 2', count: 3 },
        { name: 'Round 3', count: 2 },
        { name: 'Round 4', count: 2 },
        { name: 'Finals', count: 1 },
      ]),
    },
  }
}
