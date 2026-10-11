import Link from "next/link";

export default function PlatformHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="platform-container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-[-0.03em] text-foreground"
        >
          Emrinno
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-secondary">
          <Link
            href="/subminno"
            className="transition hover:text-foreground"
          >
            Subminno
          </Link>

          <Link
            href="/presentation"
            className="hidden transition hover:text-foreground sm:inline"
          >
            Presentation
          </Link>
        </nav>
      </div>
    </header>
  );
}
