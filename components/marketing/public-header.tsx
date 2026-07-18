import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { coAmberBtn } from "@/components/co/ui";

const NAV = [
  { label: "How it works", href: "#co-how" },
  { label: "Routes", href: "#co-routes" },
  { label: "Why Coride", href: "#co-why" },
  { label: "Trust & safety", href: "#co-safety" },
];

/** Public site header — Coride treatment: brand, section nav, theme toggle, Sign in + amber CTA. */
export function PublicHeader({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-[color:var(--page)]">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-[clamp(18px,4vw,40px)] py-3.5">
        <Brand href="/" size="lg" />
        <nav className="ml-3 hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-[14.5px] font-medium text-[color:var(--ink-2)] transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex-1" />
        <ThemeToggle />
        {isAuthed ? (
          <Link href="/dashboard" className={`${coAmberBtn} px-[18px] py-2.5 text-[14.5px]`}>
            Open app
          </Link>
        ) : (
          <Link href="/login" className={`${coAmberBtn} px-[18px] py-2.5 text-[14.5px]`}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
