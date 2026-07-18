"use client";

import { usePathname } from "next/navigation";

/**
 * The Coride topbar shows a per-screen title + a mono subtitle. Rather than plumb a title through
 * every server page, we derive it from the current route — longest-prefix match wins.
 */
const TITLES: { prefix: string; title: string; sub: string }[] = [
  { prefix: "/app/find", title: "Find a Ride", sub: "Search & book a seat" },
  { prefix: "/app/offer", title: "Offer a Ride", sub: "Publish your empty seats" },
  { prefix: "/app/rides", title: "My Rides", sub: "Trips you drive & ride" },
  { prefix: "/app/vehicles", title: "My Vehicles", sub: "Cars approved to drive" },
  { prefix: "/app/trips", title: "My Trips", sub: "Upcoming & completed" },
  { prefix: "/app/saved-places", title: "Saved Places", sub: "Home, office & more" },
  { prefix: "/app", title: "Dashboard", sub: "Ride together, save together" },
  { prefix: "/wallet", title: "Wallet", sub: "Balance & transactions" },
  { prefix: "/history", title: "Ride History", sub: "Completed trips" },
  { prefix: "/notifications", title: "Notifications", sub: "Match, ETA & payment alerts" },
  { prefix: "/support", title: "Support", sub: "We're here to help" },
  { prefix: "/settings/profile", title: "Profile", sub: "Identity & preferences" },
  { prefix: "/settings", title: "Quick Access", sub: "Everything, one tap away" },
  { prefix: "/admin/users", title: "Users", sub: "Employees & admins" },
  { prefix: "/admin/vehicles", title: "Vehicles", sub: "Fleet approvals" },
  { prefix: "/admin/activity", title: "Activity Log", sub: "Audit trail" },
  { prefix: "/admin/settings", title: "Company Settings", sub: "Org configuration" },
  { prefix: "/admin", title: "Admin", sub: "Company console" },
  { prefix: "/reports", title: "Reports", sub: "Insights & exports" },
  { prefix: "/platform", title: "Platform", sub: "Cross-tenant console" },
  { prefix: "/dashboard", title: "Dashboard", sub: "Ride together, save together" },
];

export function TopbarTitle() {
  const pathname = usePathname();
  const match =
    TITLES.filter((t) => pathname === t.prefix || pathname.startsWith(`${t.prefix}/`)).sort(
      (a, b) => b.prefix.length - a.prefix.length,
    )[0] ?? { title: "Coride", sub: "" };

  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-display text-[18px] font-bold leading-tight tracking-[-0.01em] text-[color:var(--ink)]">
        {match.title}
      </div>
      {match.sub && (
        <div className="truncate font-mono text-[12.5px] text-[color:var(--ink-3)]">
          {match.sub}
        </div>
      )}
    </div>
  );
}
