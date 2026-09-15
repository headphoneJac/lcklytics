"use client"

import Image from "next/image"
import { useState } from "react"

type AssetImageProps = {
  src?: string | null
  fallbackSrc?: string | null
  fallbackSrcs?: string[]
  alt: string
  fallback: string
  className?: string
  imageClassName?: string
  fallbackClassName?: string
  sizes?: string
}

export default function AssetImage({
  src,
  fallbackSrc,
  fallbackSrcs = [],
  alt,
  fallback,
  className = "size-8",
  imageClassName = "object-cover",
  fallbackClassName = "",
  sizes = "32px",
}: AssetImageProps) {
  const [failedSrcs, setFailedSrcs] = useState<string[]>([])
  const sources = [src, fallbackSrc, ...fallbackSrcs].filter(
    (candidate): candidate is string => Boolean(candidate),
  )
  const activeSrc =
    sources.find((candidate) => !failedSrcs.includes(candidate)) ?? null

  if (!activeSrc) {
    return (
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center overflow-hidden bg-white/10 font-display font-bold text-ink ${className} ${fallbackClassName}`}
      >
        {fallback}
      </span>
    )
  }

  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`}>
      <Image
        src={activeSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={imageClassName}
        unoptimized={
          activeSrc.includes('/Special:Redirect/file/') ||
          activeSrc.includes('/Special:FilePath/')
        }
        onError={() =>
          setFailedSrcs((current) =>
            current.includes(activeSrc) ? current : [...current, activeSrc],
          )
        }
      />
    </span>
  )
}
