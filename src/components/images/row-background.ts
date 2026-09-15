import type { CSSProperties } from "react";
import {
  championIconUrl,
  getPlayerAsset,
  getTeamAsset,
  leaguepediaPlayerAvatarUrls,
  type EsportsAssets,
} from "@/lib/assets";

type AssetRowBackgroundStyle = CSSProperties & {
  "--asset-row-image"?: string;
};

function assetRowBackgroundStyle(src?: string | null): AssetRowBackgroundStyle {
  if (!src) return {};

  return {
    "--asset-row-image": `url(${JSON.stringify(src)})`,
  };
}

export function teamRowBackgroundStyle(
  team: string,
  assets?: EsportsAssets,
) {
  const asset = getTeamAsset(assets, team);

  return assetRowBackgroundStyle(asset.logoUrl ?? asset.altLogoUrl);
}

export function championRowBackgroundStyle(champion: string) {
  return assetRowBackgroundStyle(championIconUrl(champion));
}

export function playerRowBackgroundStyle(
  player: string,
  team?: string | null,
  assets?: EsportsAssets,
) {
  const asset = getPlayerAsset(assets, player, team);
  const fallbackSrc = leaguepediaPlayerAvatarUrls(player, team)[0];

  return assetRowBackgroundStyle(asset?.imageUrl ?? fallbackSrc);
}
