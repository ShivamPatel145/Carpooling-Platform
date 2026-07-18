import type { Metadata } from "next";
import Link from "next/link";
import { Car, CreditCard, History, LifeBuoy, MapPin, Route, Settings as SettingsIcon, ArrowRight } from "lucide-react";
import { requireSession } from "@/lib/session";
import { coCard } from "@/components/co/ui";

export const metadata: Metadata = { title: "Quick Access" };

/**
 * Quick Access hub (wireframe "Quick Access", PRD §7.14) — the employee's jumping-off point,
 * Coride card language. Targets are the real routes (wallet/history live at the top level).
 */
const LINKS = [
  { title: "My Rides", href: "/app/rides", icon: Route, desc: "Track, chat, and complete your rides" },
  { title: "Saved Places", href: "/app/saved-places", icon: MapPin, desc: "Home, Office, and frequent spots" },
  { title: "My Vehicles", href: "/app/vehicles", icon: Car, desc: "Register and manage your cars" },
  { title: "Wallet", href: "/wallet", icon: CreditCard, desc: "Balance, recharge and transactions" },
  { title: "Ride History", href: "/history", icon: History, desc: "Your completed, paid trips" },
  { title: "Help & Support", href: "/support", icon: LifeBuoy, desc: "Raise a ticket or get help" },
  { title: "Settings", href: "/settings/profile", icon: SettingsIcon, desc: "Identity and preferences" },
];

export default async function SettingsPage() {
  await requireSession();

  return (
    <div>
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Quick Access
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">Everything for your commute, one tap away.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`${coCard} group flex items-start gap-4 p-5 transition hover:-translate-y-[2px] hover:border-[color:var(--line-2)]`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[color:var(--surface-2)] text-[color:var(--ink)]">
                <Icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-1.5 text-[15px] font-semibold text-[color:var(--ink)]">
                  {l.title}
                  <ArrowRight className="h-3.5 w-3.5 text-[color:var(--ink-3)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--amber-strong)]" />
                </div>
                <div className="text-[13px] text-[color:var(--ink-3)]">{l.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
