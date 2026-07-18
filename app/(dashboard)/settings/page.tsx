import type { Metadata } from "next";
import Link from "next/link";
import { Car, CreditCard, History, LifeBuoy, MapPin, Route, Settings as SettingsIcon } from "lucide-react";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

/**
 * Quick Access hub (wireframe "Quick Access", PRD §7.14). A config-driven card grid — the employee's
 * jumping-off point to trips, vehicle, payments, history, saved places, help, and account settings.
 * (Some targets belong to other slices; nav wiring is the integrator's.)
 */
const LINKS = [
  { title: "My Trips", href: "/app/trips", icon: Route, desc: "Track, chat, and complete your rides" },
  { title: "Saved Places", href: "/app/saved-places", icon: MapPin, desc: "Home, Office, and frequent spots" },
  { title: "My Vehicle", href: "/app/vehicles", icon: Car, desc: "Register and manage your cars" },
  { title: "Payments", href: "/app/wallet", icon: CreditCard, desc: "Wallet balance and payment methods" },
  { title: "Ride History", href: "/app/history", icon: History, desc: "Your completed, paid trips" },
  { title: "Help & Support", href: "/support", icon: LifeBuoy, desc: "Raise a ticket or get help" },
  { title: "Account", href: "/settings/profile", icon: SettingsIcon, desc: "Profile and preferences" },
];

export default async function SettingsPage() {
  await requireSession();

  return (
    <div>
      <PageHeader title="Quick Access" description="Everything for your commute, one tap away." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className="group focus-visible:outline-none">
              <Card className="flex h-full items-start gap-4 p-5 transition-colors group-hover:border-accent/50 group-hover:bg-accent/5 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium">{l.title}</p>
                  <p className="text-sm text-muted-foreground">{l.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
