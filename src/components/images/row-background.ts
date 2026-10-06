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
  "--asset-snapshot-position"?: string;
  "--asset-snapshot-size"?: string;
  "--asset-snapshot-opacity"?: string;
  "--asset-analysis-position"?: string;
  "--asset-analysis-size"?: string;
  "--asset-analysis-opacity"?: string;
};

function assetRowBackgroundStyle(
  src?: string | null,
  options: {
    position?: string;
    size?: string;
    snapshotPosition?: string;
    snapshotSize?: string;
    snapshotOpacity?: string;
    analysisPosition?: string;
    analysisSize?: string;
    analysisOpacity?: string;
  } = {},
): AssetRowBackgroundStyle {
  if (!src) return {};

  return {
    "--asset-row-image": `url(${JSON.stringify(src)})`,
    "--asset-row-position": options.position,
    "--asset-row-size": options.size,
    "--asset-snapshot-position": options.snapshotPosition,
    "--asset-snapshot-size": options.snapshotSize,
    "--asset-snapshot-opacity": options.snapshotOpacity,
    "--asset-analysis-position": options.analysisPosition,
    "--asset-analysis-size": options.analysisSize,
    "--asset-analysis-opacity": options.analysisOpacity,
  };
}

export function teamRowBackgroundStyle(
  team: string,
  assets?: EsportsAssets,
) {
  const asset = getTeamAsset(assets, team);

  return assetRowBackgroundStyle(asset.logoUrl ?? asset.altLogoUrl);
}

export function teamSnapshotBackgroundStyle(
  team: string,
  assets?: EsportsAssets,
) {
  const asset = getTeamAsset(assets, team);

  return assetRowBackgroundStyle(asset.logoUrl ?? asset.altLogoUrl, {
    snapshotPosition: "center",
    snapshotSize: "contain",
    snapshotOpacity: "0.18",
  });
}

export function teamAnalysisWatermarkStyle(
  team: string,
  assets?: EsportsAssets,
) {
  const asset = getTeamAsset(assets, team);

  return assetRowBackgroundStyle(asset.logoUrl ?? asset.altLogoUrl, {
    analysisPosition: "left 15rem center",
    analysisSize: "auto 170%",
    analysisOpacity: "0.12",
  });
}

export function championRowBackgroundStyle(champion: string) {
  return assetRowBackgroundStyle(championSplashUrl(champion), {
    position: "center 35%",
    size: "cover",
  });
}

export function championAnalysisWatermarkStyle(champion: string) {
  return assetRowBackgroundStyle(championSplashUrl(champion), {
    analysisPosition: "left 15rem center",
    analysisSize: "auto 310%",
    analysisOpacity: "0.14",
  });
}

export function championSnapshotBackgroundStyle(champion: string) {
  if (champion === "Varus") {
    return assetRowBackgroundStyle(championSplashUrl(champion), {
    snapshotPosition: "center 35%",
    snapshotSize: "auto 100%",
    snapshotOpacity: "0.18",
  });
  }
  if (champion === "Orianna") {
    return assetRowBackgroundStyle(championSplashUrl(champion), {
    snapshotPosition: "90% 35%",
    snapshotSize: "auto 100%",
    snapshotOpacity: "0.18",
  });
  }
  return assetRowBackgroundStyle(championSplashUrl(champion), {
    snapshotPosition: "75% 35%",
    snapshotSize: "auto 100%",
    snapshotOpacity: "0.18",
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
