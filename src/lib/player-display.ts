const PLAYER_RECENT_TEAM_OVERRIDES: Record<string, string> = {
  Aiming: "Kiwoom DRX",
  Diable: "NS Redforce",
  Jiwoo: "KT Rolster",
  Sharvel: "DN SOOPers",
  Taeyoon: "BNK FearX",
};

export function getPlayerDisplayTeam(player: string, team: string) {
  return PLAYER_RECENT_TEAM_OVERRIDES[player] ?? team;
}
