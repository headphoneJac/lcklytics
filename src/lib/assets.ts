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
  fenrir: ['KT FenRir 2026 LCK Cup.png', 'KT FenRir 2026 Split 1.png'],
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

function md5(input: string) {
  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff
  }

  function cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number,
  ) {
    a = add32(add32(a, q), add32(x, t))
    return add32((a << s) | (a >>> (32 - s)), b)
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  function md5cycle(state: number[], block: number[]) {
    let [a, b, c, d] = state

    a = ff(a, b, c, d, block[0], 7, -680876936)
    d = ff(d, a, b, c, block[1], 12, -389564586)
    c = ff(c, d, a, b, block[2], 17, 606105819)
    b = ff(b, c, d, a, block[3], 22, -1044525330)
    a = ff(a, b, c, d, block[4], 7, -176418897)
    d = ff(d, a, b, c, block[5], 12, 1200080426)
    c = ff(c, d, a, b, block[6], 17, -1473231341)
    b = ff(b, c, d, a, block[7], 22, -45705983)
    a = ff(a, b, c, d, block[8], 7, 1770035416)
    d = ff(d, a, b, c, block[9], 12, -1958414417)
    c = ff(c, d, a, b, block[10], 17, -42063)
    b = ff(b, c, d, a, block[11], 22, -1990404162)
    a = ff(a, b, c, d, block[12], 7, 1804603682)
    d = ff(d, a, b, c, block[13], 12, -40341101)
    c = ff(c, d, a, b, block[14], 17, -1502002290)
    b = ff(b, c, d, a, block[15], 22, 1236535329)

    a = gg(a, b, c, d, block[1], 5, -165796510)
    d = gg(d, a, b, c, block[6], 9, -1069501632)
    c = gg(c, d, a, b, block[11], 14, 643717713)
    b = gg(b, c, d, a, block[0], 20, -373897302)
    a = gg(a, b, c, d, block[5], 5, -701558691)
    d = gg(d, a, b, c, block[10], 9, 38016083)
    c = gg(c, d, a, b, block[15], 14, -660478335)
    b = gg(b, c, d, a, block[4], 20, -405537848)
    a = gg(a, b, c, d, block[9], 5, 568446438)
    d = gg(d, a, b, c, block[14], 9, -1019803690)
    c = gg(c, d, a, b, block[3], 14, -187363961)
    b = gg(b, c, d, a, block[8], 20, 1163531501)
    a = gg(a, b, c, d, block[13], 5, -1444681467)
    d = gg(d, a, b, c, block[2], 9, -51403784)
    c = gg(c, d, a, b, block[7], 14, 1735328473)
    b = gg(b, c, d, a, block[12], 20, -1926607734)

    a = hh(a, b, c, d, block[5], 4, -378558)
    d = hh(d, a, b, c, block[8], 11, -2022574463)
    c = hh(c, d, a, b, block[11], 16, 1839030562)
    b = hh(b, c, d, a, block[14], 23, -35309556)
    a = hh(a, b, c, d, block[1], 4, -1530992060)
    d = hh(d, a, b, c, block[4], 11, 1272893353)
    c = hh(c, d, a, b, block[7], 16, -155497632)
    b = hh(b, c, d, a, block[10], 23, -1094730640)
    a = hh(a, b, c, d, block[13], 4, 681279174)
    d = hh(d, a, b, c, block[0], 11, -358537222)
    c = hh(c, d, a, b, block[3], 16, -722521979)
    b = hh(b, c, d, a, block[6], 23, 76029189)
    a = hh(a, b, c, d, block[9], 4, -640364487)
    d = hh(d, a, b, c, block[12], 11, -421815835)
    c = hh(c, d, a, b, block[15], 16, 530742520)
    b = hh(b, c, d, a, block[2], 23, -995338651)

    a = ii(a, b, c, d, block[0], 6, -198630844)
    d = ii(d, a, b, c, block[7], 10, 1126891415)
    c = ii(c, d, a, b, block[14], 15, -1416354905)
    b = ii(b, c, d, a, block[5], 21, -57434055)
    a = ii(a, b, c, d, block[12], 6, 1700485571)
    d = ii(d, a, b, c, block[3], 10, -1894986606)
    c = ii(c, d, a, b, block[10], 15, -1051523)
    b = ii(b, c, d, a, block[1], 21, -2054922799)
    a = ii(a, b, c, d, block[8], 6, 1873313359)
    d = ii(d, a, b, c, block[15], 10, -30611744)
    c = ii(c, d, a, b, block[6], 15, -1560198380)
    b = ii(b, c, d, a, block[13], 21, 1309151649)
    a = ii(a, b, c, d, block[4], 6, -145523070)
    d = ii(d, a, b, c, block[11], 10, -1120210379)
    c = ii(c, d, a, b, block[2], 15, 718787259)
    b = ii(b, c, d, a, block[9], 21, -343485551)

    state[0] = add32(a, state[0])
    state[1] = add32(b, state[1])
    state[2] = add32(c, state[2])
    state[3] = add32(d, state[3])
  }

  const bytes = Array.from(new TextEncoder().encode(input))
  const state = [1732584193, -271733879, -1732584194, 271733878]

  for (let offset = 0; offset + 64 <= bytes.length; offset += 64) {
    md5cycle(state, bytesToWords(bytes.slice(offset, offset + 64)))
  }

  const tail = bytes.slice(bytes.length - (bytes.length % 64))
  const block = new Array(16).fill(0)

  for (let index = 0; index < tail.length; index += 1) {
    block[index >> 2] |= tail[index] << (index % 4 << 3)
  }

  block[tail.length >> 2] |= 0x80 << (tail.length % 4 << 3)

  if (tail.length > 55) {
    md5cycle(state, block)
    block.fill(0)
  }

  block[14] = bytes.length * 8
  md5cycle(state, block)

  return state.map(hexLittleEndian).join('')
}

function bytesToWords(bytes: number[]) {
  const words = new Array(16).fill(0)

  for (let index = 0; index < bytes.length; index += 1) {
    words[index >> 2] |= bytes[index] << (index % 4 << 3)
  }

  return words
}

function hexLittleEndian(value: number) {
  let output = ''

  for (let index = 0; index < 4; index += 1) {
    output += ((value >> (index * 8)) & 0xff)
      .toString(16)
      .padStart(2, '0')
  }

  return output
}

function leaguepediaFileUrl(fileName: string) {
  const normalizedFileName = fileName.replace(/\s+/g, '_')
  const hash = md5(normalizedFileName)
  const filePath = encodeURIComponent(normalizedFileName)

  return `https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/${hash[0]}/${hash.slice(0, 2)}/${filePath}/revision/latest`
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
          `${code} ${player} 2026 LCK Cup.png`,
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
