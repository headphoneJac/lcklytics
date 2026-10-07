import Link from "next/link";
import { Suspense } from "react";
import NavLinks from "@/components/NavLinks";
import { links } from "@/components/nav-links";

function StaticNavLinks() {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="transition-colors hover:text-ink"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-ink"
        >
          lcklytics
        </Link>
        <nav className="flex gap-6 text-sm text-ink-muted">
          <Suspense fallback={<StaticNavLinks />}>
            <NavLinks />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
