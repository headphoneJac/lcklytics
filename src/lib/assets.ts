export type TeamAsset = {
  code: string
  logoUrl?: string
  altLogoUrl?: string
  slug?: string
}

export type PlayerAsset = {
  imageUrl?: string
  role?: string
  team?: string
}

export type EsportsAssets = {
  teams: Record<string, TeamAsset>
  players: Record<string, PlayerAsset>
}

export const EMPTY_ESPORTS_ASSETS: EsportsAssets = {
  teams: {},
  players: {},
}

export const DDRAGON_VERSION = '16.18.1'

const TEAM_CODES: Record<string, string> = {
  'bnk fearx': 'BFX',
  'bnk fear x': 'BFX',
  'dplus kia': 'DK',
  'dn soopers': 'DNS',
  drx: 'DRX',
  'kiwoom drx': 'DRX',
  geng: 'GEN',
  'gen g': 'GEN',
  'gen.g': 'GEN',
  'hanjin brion': 'BRO',
  brion: 'BRO',
  'hanwha life esports': 'HLE',
  'kt rolster': 'KT',
  'nongshim redforce': 'NS',
  'ns redforce': 'NS',
  t1: 'T1',
  tbd: 'TBD',
}

const TEAM_ALIASES: Record<string, string[]> = {
  'BNK FearX': ['BNK FEARX', 'FearX'],
  'Dplus Kia': ['Dplus KIA', 'Dplus'],
  'DN SOOPers': ['DN Freecs', 'Kwangdong Freecs'],
  DRX: ['Kiwoom DRX'],
  'Gen.G': ['GenG', 'Gen.G Esports'],
  'HANJIN BRION': ['BRION', 'OKSavingsBank BRION'],
  'Hanwha Life Esports': ['HLE'],
  'KT Rolster': ['kt Rolster'],
  'NS Redforce': ['Nongshim RedForce', 'Nongshim Redforce'],
  T1: ['SK Telecom T1'],
}

const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  'bel veth': 'Belveth',
  'cho gath': 'Chogath',
  'dr mundo': 'DrMundo',
  'jarvan iv': 'JarvanIV',
  'kai sa': 'Kaisa',
  'k sante': 'KSante',
  'kha zix': 'Khazix',
  'kog maw': 'KogMaw',
  leblanc: 'Leblanc',
  'lee sin': 'LeeSin',
  'master yi': 'MasterYi',
  'miss fortune': 'MissFortune',
  'nunu and willump': 'Nunu',
  'rek sai': 'RekSai',
  'renata glasc': 'Renata',
  'tahm kench': 'TahmKench',
  'twisted fate': 'TwistedFate',
  'vel koz': 'Velkoz',
  wukong: 'MonkeyKing',
  'xin zhao': 'XinZhao',
}

const STATIC_LCK_TEAM_ASSETS: Record<string, TeamAsset> = {
  'BNK FearX': {
    code: 'BFX',
    logoUrl:
      'https://static.lolesports.com/teams/1734691810721_BFXfullcolorfordarkbg.png',
    slug: 'bnk-fearx',
  },
  'Dplus Kia': {
    code: 'DK',
    logoUrl:
      'https://static.lolesports.com/teams/1673260049703_DPlusKIALOGO11.png',
    slug: 'dplus-kia',
  },
  'DN SOOPers': {
    code: 'DNS',
    logoUrl:
      'https://static.lolesports.com/teams/1767340467921_DN_SOOPerslogo_profile.webp',
    slug: 'dn-soopers',
  },
  DRX: {
    code: 'DRX',
    logoUrl:
      'https://static.lolesports.com/teams/1774247803537_horizontal_EN_Wh.png',
    slug: 'kiwoom-drx',
  },
  'Gen.G': {
    code: 'GEN',
    logoUrl:
      'https://static.lolesports.com/teams/1773829250929_GENGLOGO_GOLD.png',
    slug: 'gen-g',
  },
  'HANJIN BRION': {
    code: 'BRO',
    logoUrl:
      'https://static.lolesports.com/teams/1716454325887_Nowyprojekt.png',
    slug: 'hanjin-brion',
  },
  'Hanwha Life Esports': {
    code: 'HLE',
    logoUrl:
      'https://static.lolesports.com/teams/1631819564399_hle-2021-worlds.png',
    slug: 'hanwha-life-esports',
  },
  'KT Rolster': {
    code: 'KT',
    logoUrl: 'https://static.lolesports.com/teams/kt_darkbackground.png',
    slug: 'kt-rolster',
  },
  'NS Redforce': {
    code: 'NS',
    logoUrl: 'https://static.lolesports.com/teams/NSFullonDark.png',
    slug: 'nongshim-redforce',
  },
  T1: {
    code: 'T1',
    logoUrl:
      'https://static.lolesports.com/teams/1726801573959_539px-T1_2019_full_allmode.png',
    slug: 't1',
  },
}

export function assetKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function compactAssetKey(value: string) {
  return assetKey(value).replace(/\s+/g, '')
}

export function playerAssetKey(player: string, team?: string | null) {
  const normalizedPlayer = assetKey(player)
  const normalizedTeam = team ? assetKey(team) : ''

  return normalizedTeam
    ? `${normalizedTeam}:${normalizedPlayer}`
    : normalizedPlayer
}

export function teamCode(team: string) {
  return TEAM_CODES[assetKey(team)] ?? TEAM_CODES[compactAssetKey(team)] ?? team
}

export function teamAliases(team: string) {
  return [team, ...(TEAM_ALIASES[team] ?? [])]
}

function setTeamAsset(
  teams: EsportsAssets['teams'],
  name: string,
  asset: TeamAsset,
) {
  teams[assetKey(name)] = asset
  teams[compactAssetKey(name)] = asset
}

export function withStaticLckTeamAssets(assets?: EsportsAssets): EsportsAssets {
  const teams = { ...(assets?.teams ?? {}) }

  for (const [team, asset] of Object.entries(STATIC_LCK_TEAM_ASSETS)) {
    const existing = teams[assetKey(team)] ?? teams[compactAssetKey(team)]
    const merged = {
      ...asset,
      ...existing,
      code: existing?.code ?? asset.code,
      logoUrl: existing?.logoUrl ?? asset.logoUrl,
      altLogoUrl: existing?.altLogoUrl ?? asset.altLogoUrl,
      slug: existing?.slug ?? asset.slug,
    } satisfies TeamAsset

    setTeamAsset(teams, team, merged)

    for (const alias of teamAliases(team)) {
      setTeamAsset(teams, alias, merged)
    }
  }

  return {
    teams,
    players: assets?.players ?? {},
  }
}

export function getTeamAsset(
  assets: EsportsAssets | undefined,
  team: string,
): TeamAsset {
  const fallbackAssets = withStaticLckTeamAssets(assets)

  for (const alias of teamAliases(team)) {
    const asset =
      fallbackAssets.teams[assetKey(alias)] ??
      fallbackAssets.teams[compactAssetKey(alias)]

    if (asset) {
      return {
        ...asset,
        code: asset.code || teamCode(team),
      }
    }
  }

  return { code: teamCode(team) }
}

export function getPlayerAsset(
  assets: EsportsAssets | undefined,
  player: string,
  team?: string | null,
) {
  return (
    (team ? assets?.players[playerAssetKey(player, team)] : undefined) ??
    assets?.players[playerAssetKey(player)] ??
    null
  )
}

export function leaguepediaPlayerAvatarUrl(
  player: string,
  team?: string | null,
) {
  return leaguepediaPlayerAvatarUrls(player, team)[0] ?? null
}

const PLAYER_IMAGE_FILE_OVERRIDES: Record<string, string[]> = {
  aiming: ['KT Aiming 2026 Split 1.png'],
  bluffing: [
    'HLE.C Bluffing 2026 Split 1.png',
    'HLE Bluffing 2026 Split 1.png',
  ],
  ddoiv: ['DNS.C DDoiV 2026 Split 1.png'],
  diable: ['NS Diable 2026 Split 2.png'],
  doran: ['T1 Doran 2026 LCK Cup.png'],
  effort: ['KT.C Effort 2026 Split 1.png'],
  enosh: ['DNS.C Enosh 2026 Split 1.png'],
  faker: ['T1 Faker 2026 LCK Cup.png'],
  fenrir: ['KT FenRir LCK Cup 2026.png', 'KT FenRir 2026 Split 1.png'],
  frog: ['DRX.C Frog 2026 Split 1.png'],
  jiwoo: ['DRX Jiwoo 2026 Split 2.png'],
  keria: ['T1 Keria 2026 LCK Cup.png'],
  lazyfeel: ['DRX.C LazyFeel 2026 Split 1.png'],
  loki: ['C9 Loki 2025 Split 1.png'],
  minous: ['DRX.C Minous 2026 Split 1.png'],
  oner: ['T1 Oner 2026 LCK Cup.png'],
  painter: ['T1.EA Painter 2026 Split 1.png'],
  peyz: ['T1 Peyz 2026 LCK Cup.png'],
  pleata: ['NS.EA Pleata 2026 Split 1.png'],
  quantum: ['DNS.C Quantum 2026 Split 1.png'],
  sharvel: ['DK.C Sharvel 2026 Split 1.png'],
  slayer: ['BFX.Y Slayer 2026 Split 1.png'],
  taeyoon: ['BFX Taeyoon 2026 Split 2.png'],
}

function leaguepediaFileUrl(fileName: string) {
  const filePath = encodeURIComponent(fileName.replace(/\s+/g, '_'))

  return `https://lol.fandom.com/wiki/Special:FilePath/${filePath}`
}

export function leaguepediaPlayerAvatarUrls(
  player: string,
  team?: string | null,
) {
  const overrideFiles = PLAYER_IMAGE_FILE_OVERRIDES[compactAssetKey(player)] ?? []

  if (!team || team.includes(' / ')) {
    return overrideFiles.map(leaguepediaFileUrl)
  }

  const code = teamCode(team)

  const inferredFiles =
    !code || code === team || code === 'TBD'
      ? []
      : [
          `${code} ${player} 2026 Split 1.png`,
          `${code} ${player} LCK Cup 2026.png`,
          `${code} ${player} 2026 Split 2.png`,
          `${code}.C ${player} 2026 Split 1.png`,
          `${code}.A ${player} 2026 Split 1.png`,
        ]

  return Array.from(new Set([...overrideFiles, ...inferredFiles])).map(
    leaguepediaFileUrl,
  )
}

function colorIndex(value: string, colorCount: number) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 9973
  }

  return hash % colorCount
}

export function generatedPlayerAvatarUrl(player: string, team?: string | null) {
  const backgrounds = ['252b34', '273349', '382b46', '2b3d38', '3f3426']
  const background =
    backgrounds[colorIndex(`${team ?? ''}:${player}`, backgrounds.length)]
  const params = new URLSearchParams({
    name: player,
    background,
    color: 'e6e9ef',
    bold: 'true',
    size: '128',
    format: 'png',
    rounded: 'true',
    length: '2',
  })

  return `https://ui-avatars.com/api/?${params.toString()}`
}

export function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function championKey(champion: string) {
  const normalized = assetKey(champion)
  const override = CHAMPION_KEY_OVERRIDES[normalized]

  if (override) return override

  return champion
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('')
}

export function championIconUrl(champion: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championKey(champion)}.png`
}

export function championSplashUrl(champion: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey(champion)}_0.jpg`
}
