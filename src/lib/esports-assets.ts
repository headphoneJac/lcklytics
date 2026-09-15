import {
  assetKey,
  compactAssetKey,
  playerAssetKey,
  teamAliases,
  teamCode,
  withStaticLckTeamAssets,
  type EsportsAssets,
  type PlayerAsset,
  type TeamAsset,
} from './assets'

const LCK_LEAGUE_ID = '98767991310872058'
const LCK_TEAM_SLUGS = [
  'gen-g',
  't1',
  'nongshim-redforce',
  'dn-soopers',
  'hanjin-brion',
  'hanwha-life-esports',
  'dplus-kia',
  'kt-rolster',
  'bnk-fearx',
  'kiwoom-drx',
]
const LOLESPORTS_API_URL =
  'https://esports-api.lolesports.com/persisted/gw/getTeams'
const LOLESPORTS_PUBLIC_PERSISTED_API_KEY =
  '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'

type LoLEsportsPlayer = {
  summonerName?: string
  name?: string
  role?: string
  image?: string
  photoUrl?: string
}

type LoLEsportsTeam = {
  code?: string
  image?: string
  alternativeImage?: string
  name?: string
  slug?: string
  players?: LoLEsportsPlayer[]
}

type LoLEsportsTeamsResponse = {
  data?: {
    teams?: LoLEsportsTeam[]
  }
}

function hasPlayerImages(teams: LoLEsportsTeam[]) {
  return teams.some((team) =>
    team.players?.some((player) => player.image || player.photoUrl),
  )
}

function mergeTeams(
  baseTeams: LoLEsportsTeam[],
  detailedTeams: LoLEsportsTeam[],
) {
  const teamsBySlugOrName = new Map<string, LoLEsportsTeam>()

  baseTeams.forEach((team, index) => {
    teamsBySlugOrName.set(team.slug ?? team.name ?? `team:${index}`, team)
  })

  for (const team of detailedTeams) {
    const key = team.slug ?? team.name

    if (!key) continue

    const existing = teamsBySlugOrName.get(key)
    teamsBySlugOrName.set(key, {
      ...existing,
      ...team,
      code: team.code ?? existing?.code,
      image: team.image ?? existing?.image,
      alternativeImage: team.alternativeImage ?? existing?.alternativeImage,
      players:
        team.players && team.players.length > 0
          ? team.players
          : existing?.players,
    })
  }

  return Array.from(teamsBySlugOrName.values())
}

function setTeamAsset(
  teams: EsportsAssets['teams'],
  name: string,
  asset: TeamAsset,
) {
  teams[assetKey(name)] = asset
  teams[compactAssetKey(name)] = asset
}

function setPlayerAsset(
  players: EsportsAssets['players'],
  player: string,
  asset: PlayerAsset,
  team?: string,
) {
  players[playerAssetKey(player)] = asset

  if (team) {
    players[playerAssetKey(player, team)] = asset
  }
}

function normalizeImageUrl(url?: string) {
  if (!url) return undefined
  return url.replace(/^http:\/\/static\.lolesports\.com/i, 'https://static.lolesports.com')
}

async function fetchTeams(apiKey: string, ids: string[]) {
  const url = new URL(LOLESPORTS_API_URL)
  url.searchParams.set('hl', 'en-US')

  for (const id of ids) {
    url.searchParams.append('id', id)
  }

  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
    },
    next: {
      revalidate: 60 * 60 * 12,
    },
  })

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as LoLEsportsTeamsResponse
  return payload.data?.teams ?? []
}

export async function getLckEsportsAssets(): Promise<EsportsAssets> {
  const apiKey =
    process.env.LOLESPORTS_API_KEY ?? LOLESPORTS_PUBLIC_PERSISTED_API_KEY

  try {
    let esportsTeams = await fetchTeams(apiKey, [LCK_LEAGUE_ID])

    if (esportsTeams.length === 0 || !hasPlayerImages(esportsTeams)) {
      const detailedTeams = await fetchTeams(apiKey, LCK_TEAM_SLUGS)
      esportsTeams = mergeTeams(esportsTeams, detailedTeams)
    }

    const teams: EsportsAssets['teams'] = {}
    const players: EsportsAssets['players'] = {}

    for (const team of esportsTeams) {
      if (!team.name) continue

      const teamAsset = {
        code: team.code || teamCode(team.name),
        logoUrl: normalizeImageUrl(team.image),
        altLogoUrl: normalizeImageUrl(team.alternativeImage),
        slug: team.slug,
      } satisfies TeamAsset

      setTeamAsset(teams, team.name, teamAsset)

      for (const alias of teamAliases(team.name)) {
        setTeamAsset(teams, alias, teamAsset)
      }

      for (const player of team.players ?? []) {
        const playerName = player.summonerName ?? player.name

        if (!playerName) continue
        const playerImage = normalizeImageUrl(player.image ?? player.photoUrl)

        setPlayerAsset(
          players,
          playerName,
          {
            imageUrl: playerImage,
            role: player.role,
            team: team.name,
          },
          team.name,
        )

        for (const alias of teamAliases(team.name)) {
          setPlayerAsset(
            players,
            playerName,
            {
              imageUrl: playerImage,
              role: player.role,
              team: alias,
            },
            alias,
          )
        }
      }
    }

    return withStaticLckTeamAssets({ teams, players })
  } catch {
    return withStaticLckTeamAssets()
  }
}
