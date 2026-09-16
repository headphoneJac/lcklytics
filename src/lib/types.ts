export interface TeamStanding {
  team: string
  matches_played: number
  match_wins: number
  match_losses: number
  games_played: number
  game_wins: number
  game_losses: number
  win_rate_pct: number
}

export interface TeamSideWinRate {
  team: string
  side: 'Blue' | 'Red'
  games_played: number
  wins: number
  win_rate_pct: number
}

export interface TeamSideProfile extends TeamStanding {
  blue_games_played: number
  blue_wins: number
  blue_win_rate_pct: number
  red_games_played: number
  red_wins: number
  red_win_rate_pct: number
  side_delta_pct: number | null
  first_pick_games_played: number
  first_pick_wins: number
  first_pick_win_rate_pct: number
  second_pick_games_played: number
  second_pick_wins: number
  second_pick_win_rate_pct: number
}

export interface TeamProgressPoint {
  date: string
  match_index: number
  values: Record<string, number>
  records: Record<
    string,
    {
      match_wins: number
      match_losses: number
      game_wins: number
      game_losses: number
    }
  >
}

export interface DashboardSplitOption {
  split_key: string
  split_label: string
  source_split: string | null
  sort_order: number
  games_played: number
  first_game_date: string | null
  last_game_date: string | null
}

export type PlayerRole = 'top' | 'jng' | 'mid' | 'bot' | 'sup'

export interface PlayerRadarMetric {
  metric: string
  value: number
  raw: number
  suffix?: string
}

export interface PlayerRoleProfile {
  player_id: string
  player: string
  team: string
  position: PlayerRole
  games_played: number
  wins: number
  win_rate_pct: number
  total_kills: number
  total_deaths: number
  total_assists: number
  avg_kills: number
  avg_deaths: number
  avg_assists: number
  kda: number
  avg_kill_participation_pct: number
  avg_dpm: number
  avg_gold_per_min: number
  avg_damage_share: number
  avg_vision_score: number
  avg_wards_placed: number
  avg_wards_killed: number
  avg_control_wards_bought: number
  avg_cspm: number
  avg_gd15: number
  avg_xpd15: number
  avg_csd15: number
  first_blood_pct: number
  first_tower_pct: number
  radar: PlayerRadarMetric[]
}

export interface ChampionProfile {
  champion: string
  picks: number
  bans: number
  presence: number
  pick_rate_pct: number
  ban_rate_pct: number
  presence_rate_pct: number
  wins: number
  win_rate_pct: number
  total_kills: number
  total_deaths: number
  total_assists: number
  kda: number
  avg_dpm: number
  avg_damage_share: number
  avg_cspm: number
  roles: string
}

export interface PlayerChampionMatchupProfile {
  id: string
  player_id: string
  player: string
  team: string
  position: PlayerRole
  champion: string
  games_played: number
  wins: number
  win_rate_pct: number
  total_kills: number
  total_deaths: number
  total_assists: number
  avg_kills: number
  avg_deaths: number
  avg_assists: number
  kda: number
  avg_dpm: number
  avg_damage_share: number
  avg_cspm: number
  avg_vision_score: number
  avg_gd15: number
  avg_xpd15: number
  avg_csd15: number
  first_blood_pct: number
  first_tower_pct: number
  performance_score: number
  games: {
    game_id: string
    team_id: string
    result: boolean
  }[]
}

export interface PomLeader {
  player: string
  team: string | null
  pom_points: number
  rnk: number
}

export interface ChampionRate {
  champion: string
  pick_rate_pct?: number
  ban_rate_pct?: number
}

export interface SplitGoldSwing {
  split: string
  avg_lane_gold_swing_at_15: number
}

export interface GameDraft {
  side: 'Blue' | 'Red'
  bans: string[]
  picks: string[]
}

export interface RecentGameSide {
  side: 'Blue' | 'Red'
  result: boolean
  teams: { name: string } | null
}

export interface RecentGame {
  game_id: string
  split: string
  game_date: string
  sides: RecentGameSide[]
  drafts: GameDraft[]
}

export interface HomeStandingRow {
  team: string
  matches_played: number
  match_wins: number
  match_losses: number
  game_wins: number
  game_losses: number
}

export interface HomeTeamGroup {
  name: string
  teams: string[]
  standings: HomeStandingRow[]
}

export interface HomeBracketSeries {
  id: string
  date?: string
  stage: string
  match_label?: string
  team_a: string
  team_b: string
  score_a: number | string
  score_b: number | string
  winner?: string
}

export interface HomeSeasonOverview {
  cup: {
    groups: HomeTeamGroup[]
    playIn: HomeBracketSeries[]
    playoffs: HomeBracketSeries[]
  }
  roundsOneTwo: {
    standings: HomeStandingRow[]
  }
  roadToMsi: {
    bracket: HomeBracketSeries[]
  }
  roundsThreeFour: {
    groups: HomeTeamGroup[]
  }
  seasonFinals: {
    playIn: HomeBracketSeries[]
    playoffs: HomeBracketSeries[]
  }
}
