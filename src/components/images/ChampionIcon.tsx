import AssetImage from "@/components/images/AssetImage"
import { championIconUrl, initials } from "@/lib/assets"

export default function ChampionIcon({
  champion,
  className = "size-8 rounded",
}: {
  champion: string
  className?: string
}) {
  return (
    <AssetImage
      src={championIconUrl(champion)}
      alt={`${champion} icon`}
      fallback={initials(champion)}
      className={className}
      imageClassName="object-cover"
      fallbackClassName="text-xs"
      sizes="40px"
    />
  )
}
