import Link from "next/link";
import { ArrowRight, ShieldCheck, Table2, BellRing, FileText } from "lucide-react";
import { auth } from "@/auth";
import { PublicHeader } from "@/components/marketing/public-header";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { homepageConfig, homepageCopy } from "@/homepage.config";

/**
 * Public homepage — a PLACEHOLDER STRUCTURE that already respects the design law, so build-day
 * only swaps copy + accent (design-standards §0/§8). Deliberately NOT a centered slogan + two
 * buttons + a stat row (§1/§9): asymmetric editorial hero, real composition, no gradients, no
 * fabricated numbers, no pill clutter. One orchestrated reveal.
 *
 * Sections are driven by homepage.config.ts (extensibility contract #2).
 */
const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: "Role-based access, enforced",
    body: "A single source-of-truth permission model gates every route at the API — not just the nav.",
  },
  {
    icon: Table2,
    title: "Fast, filterable data",
    body: "Every list is searchable, filterable, and paginated out of the box, backed by indexed queries.",
  },
  {
    icon: BellRing,
    title: "Notifications & audit trail",
    body: "In-app and email notifications, with every mutating action written to an activity log.",
  },
  {
    icon: FileText,
    title: "Reports & documents",
    body: "Generate PDFs for the artifacts that matter, with analytics that update as data lands.",
  },
];

const isEnabled = (key: string) => homepageConfig.find((s) => s.key === key)?.enabled;

export default async function HomePage() {
  const session = await auth();
  const isAuthed = Boolean(session?.user);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader isAuthed={isAuthed} />

      <main className="flex-1">
        {/* HERO — asymmetric, editorial. Left: statement. Right: a structural detail, not a stat row. */}
        {isEnabled("hero") && (
          <section className="border-b">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-24">
              <Reveal className="lg:col-span-7">
                <RevealItem>
                  <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    {/* TODO(build-day): domain eyebrow, e.g. "Facility operations" */}
                    Operations, organized
                  </p>
                </RevealItem>
                <RevealItem>
                  <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                    {homepageCopy.tagline}
                  </h1>
                </RevealItem>
                <RevealItem>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                    {homepageCopy.subhead}
                  </p>
                </RevealItem>
                <RevealItem>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button asChild size="lg">
                      <Link href={isAuthed ? "/dashboard" : "/register"}>
                        {isAuthed ? "Open the app" : "Get started"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {!isAuthed && (
                      <Button asChild size="lg" variant="outline">
                        <Link href="/login">Sign in</Link>
                      </Button>
                    )}
                  </div>
                </RevealItem>
              </Reveal>

              {/* Right column: a considered structural element (a stylized record row), not stats. */}
              <div className="hidden lg:col-span-5 lg:block">
                <div className="relative h-full rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Records
                    </span>
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <ul className="divide-y">
                    {["Draft", "In review", "Active", "Archived"].map((label, i) => (
                      <li key={label} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <span className="h-1.5 w-16 rounded-full bg-muted" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CAPABILITIES — a grid, left-aligned copy, restrained iconography. No glassmorphism. */}
        {isEnabled("capabilities") && (
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="max-w-2xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Built on primitives that transfer to any workflow
            </h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="bg-card p-6">
                    <Icon className="h-5 w-5 text-accent" />
                    <h3 className="mt-4 font-display text-base font-semibold">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA — a single band, not a repeat of the hero. */}
        {isEnabled("cta") && (
          <section className="border-t bg-secondary/40">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Ready when your team is
                </h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Sign in with your work account or create one in under a minute.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={isAuthed ? "/dashboard" : "/register"}>
                  {isAuthed ? "Open the app" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span>
            © {/* year filled at render */}
            {new Date().getFullYear()} {homepageCopy.productName}
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
