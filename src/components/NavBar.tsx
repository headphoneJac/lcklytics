import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/champions", label: "Champions" },
  { href: "/analysis", label: "Analysis" },
  { href: "/matchups", label: "Matchups" },
];

export default function NavBar() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-ink"
        >
          lcklytics
        </Link>
        <nav className="flex gap-6 text-sm text-ink-muted">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
