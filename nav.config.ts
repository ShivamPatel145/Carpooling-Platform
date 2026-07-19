import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Settings,
  Users,
  ScrollText,
  LifeBuoy,
  BarChart3,
  Building2,
  Search,
  PlusCircle,
  Route,
  Car,
  Wallet,
  History,
  MapPin,
} from "lucide-react";
import type { Role } from "@/lib/permissions";

export const roleHierarchy: Record<Role, number> = {
  super_admin: 100,
  company_admin: 50,
  employee: 10,
};

/**
 * SIDEBAR NAV — a CONFIG ARRAY. Adding a nav item is a DATA change here, never a layout edit
 * (extensibility contract #2). Role-aware: an item shows if the user's role tier is >= minRole.
 *
 * ⚠️  SHARED FILE. Only the integrator edits this (PreToolUse hook). Need an entry for your
 *     slice? Ask the integrator at :50.
 *
 * BUILD-DAY: add one entry per domain entity list screen. That's the whole nav change.
 */
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** minimum role tier required to see this item (uses roleHierarchy) */
  minRole: Role;
  /**
   * Optional EXACT role allowlist. When present it OVERRIDES minRole — the item shows only for these
   * roles. Carpooling has three DISTINCT consoles (not nested tiers), so employee-only screens use
   * `roles: ["employee"]` to keep them out of the super-admin sidebar even though super_admin outranks
   * employee. Omit `roles` for genuinely tier-based items (e.g. admin+ Reports).
   */
  roles?: Role[];
  /** optional grouping label for section headers in the sidebar */
  group?: string;
}

export const navConfig: NavItem[] = [
  // ── Super admin (platform console — its own world) ──────────────────────────────────────
  { title: "Platform", href: "/platform", icon: Building2, minRole: "super_admin", roles: ["super_admin"], group: "Platform" },

  // ── Employee app (mode-switcher) — a FLAT list mirroring the Coride comp sidebar (no group
  //    headers). roles:["employee"] keeps these out of the admin sidebars. Order follows the comp
  //    (Dashboard → Find → Offer → My Trips → Live Tracking → Wallet → Ride History → Settings);
  //    My Vehicles + Support are the two extras layered onto the comp's eight items. "My Trips" is
  //    /app/trips; the card view at /app/rides stays reachable from the dashboard + Quick Access.
  { title: "Dashboard", href: "/app", icon: LayoutDashboard, minRole: "employee", roles: ["employee"] },
  { title: "Find a Ride", href: "/app/find", icon: Search, minRole: "employee", roles: ["employee"] },
  { title: "Offer a Ride", href: "/app/offer", icon: PlusCircle, minRole: "employee", roles: ["employee"] },
  { title: "My Vehicles", href: "/app/vehicles", icon: Car, minRole: "employee", roles: ["employee"] },
  { title: "My Trips", href: "/app/trips", icon: Route, minRole: "employee", roles: ["employee"] },
  { title: "Live Tracking", href: "/app/track", icon: MapPin, minRole: "employee", roles: ["employee"] },
  { title: "Wallet", href: "/wallet", icon: Wallet, minRole: "employee", roles: ["employee"] },
  { title: "Ride History", href: "/history", icon: History, minRole: "employee", roles: ["employee"] },
  { title: "Support", href: "/support", icon: LifeBuoy, minRole: "employee", roles: ["employee"] },
  { title: "Settings", href: "/settings/profile", icon: Settings, minRole: "employee", roles: ["employee"] },

  // ── Company admin console ───────────────────────────────────────────────────────────────
  // Dashboard is the console home (/admin). Company admins now mirror the employee notification
  // UX: the topbar bell dropdown is the ONLY notifications surface (no full-page feed in the nav).
  // Support is shared, so it appears here too (grouped under Work for the admin).
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, minRole: "company_admin", roles: ["company_admin"] },
  { title: "Support", href: "/support", icon: LifeBuoy, minRole: "company_admin", roles: ["company_admin"], group: "Work" },
  { title: "Reports", href: "/reports", icon: BarChart3, minRole: "company_admin", roles: ["company_admin"], group: "Insights" },
  { title: "Users", href: "/admin/users", icon: Users, minRole: "company_admin", roles: ["company_admin"], group: "Administration" },
  { title: "Activity Log", href: "/admin/activity", icon: ScrollText, minRole: "company_admin", roles: ["company_admin"], group: "Administration" },
  { title: "Settings", href: "/admin/settings", icon: Settings, minRole: "company_admin", roles: ["company_admin"], group: "Administration" },
];

/** Filter the nav for a given role. `roles` allowlist wins when present; else fall back to minRole tier. */
export function navForRole(role: Role): NavItem[] {
  return navConfig.filter((item) =>
    item.roles ? item.roles.includes(role) : roleHierarchy[role] >= roleHierarchy[item.minRole],
  );
}

/** Unique group labels in display order, for a role. */
export function navGroupsForRole(role: Role): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const item of navForRole(role)) {
    const g = item.group ?? "";
    if (!seen.has(g)) {
      seen.add(g);
      groups.push(g);
    }
  }
  return groups;
}
