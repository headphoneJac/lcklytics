"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { links } from "@/components/nav-links";

function hrefWithCurrentSplit(
  href: string,
  split: string | null,
  preservesSplit: boolean,
) {
  if (!split || !preservesSplit) return href;
  return `${href}?split=${encodeURIComponent(split)}`;
}

export default function NavLinks() {
  const searchParams = useSearchParams();
  const split = searchParams.get("split");

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={hrefWithCurrentSplit(
            link.href,
            split,
            link.preservesSplit,
          )}
          className="transition-colors hover:text-ink"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
