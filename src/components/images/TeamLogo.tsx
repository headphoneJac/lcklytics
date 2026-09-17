import AssetImage from "@/components/images/AssetImage"
import { getTeamAsset, type EsportsAssets } from "@/lib/assets"

export default function TeamLogo({
  team,
  assets,
  className = "size-8 rounded",
  sizes = "48px",
  loading,
}: {
  team: string
  assets?: EsportsAssets
  className?: string
  sizes?: string
  loading?: "eager" | "lazy"
}) {
  const asset = getTeamAsset(assets, team)

  return (
    <AssetImage
      src={asset.logoUrl ?? asset.altLogoUrl}
      alt={`${team} logo`}
      fallback={asset.code}
      className={className}
      imageClassName="object-contain p-1"
      fallbackClassName="border border-white/10 px-1 text-[10px]"
      sizes={sizes}
      loading={loading}
    />
  )
}
