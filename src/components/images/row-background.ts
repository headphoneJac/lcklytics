import type { CSSProperties } from "react";
import {
  championSplashUrl,
  getPlayerAsset,
  getTeamAsset,
  leaguepediaPlayerAvatarUrls,
  type EsportsAssets,
} from "@/lib/assets";

type AssetRowBackgroundStyle = CSSProperties & {
  "--asset-row-image"?: string;
  "--asset-row-position"?: string;
  "--asset-row-size"?: string;
};

function assetRowBackgroundStyle(
  src?: string | null,
  options: {
    position?: string;
    size?: string;
  } = {},
): AssetRowBackgroundStyle {
  if (!src) return {};

  return {
    "--asset-row-image": `url(${JSON.stringify(src)})`,
    "--asset-row-position": options.position,
    "--asset-row-size": options.size,
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
  return assetRowBackgroundStyle(championSplashUrl(champion), {
    position: "left 10%",
    size: "auto 275%",
  });
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
