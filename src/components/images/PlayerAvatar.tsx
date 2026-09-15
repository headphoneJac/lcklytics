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
}: {
  player: string;
  team?: string | null;
  assets?: EsportsAssets;
  className?: string;
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
      sizes="48px"
    />
  );
}
