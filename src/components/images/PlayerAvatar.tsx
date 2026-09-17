import AssetImage from "@/components/images/AssetImage";
import {
  initials,
  leaguepediaPlayerAvatarUrls,
  type EsportsAssets,
} from "@/lib/assets";

export default function PlayerAvatar({
  player,
  team,
  className = "size-10 rounded-full",
  sizes = "48px",
  loading,
}: {
  player: string;
  team?: string | null;
  assets?: EsportsAssets;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
}) {
  const [src, ...fallbackSrcs] = leaguepediaPlayerAvatarUrls(player, team);

  return (
    <AssetImage
      src={src}
      fallbackSrcs={fallbackSrcs}
      alt={`${player} avatar`}
      fallback={initials(player)}
      className={className}
      imageClassName="object-cover"
      fallbackClassName="rounded-full border border-white/10 text-xs"
      sizes={sizes}
      loading={loading}
    />
  );
}
