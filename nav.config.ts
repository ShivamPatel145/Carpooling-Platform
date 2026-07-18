import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
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
} from "lucide-react";
import type { Role } from "@/lib/permissions";
import { roleHierarchy } from "@/lib/permissions";

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

  // ── Employee app (mode-switcher). roles:["employee"] keeps these out of admin sidebars. ──
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, minRole: "employee", roles: ["employee"], group: "Overview" },
  { title: "Notifications", href: "/notifications", icon: Bell, minRole: "employee", roles: ["employee", "company_admin"], group: "Work" },
  { title: "Support", href: "/support", icon: LifeBuoy, minRole: "employee", roles: ["employee", "company_admin"], group: "Work" },

  // ── Company admin console ───────────────────────────────────────────────────────────────
  { title: "Reports", href: "/reports", icon: BarChart3, minRole: "company_admin", roles: ["company_admin"], group: "Insights" },
  { title: "Users", href: "/admin/users", icon: Users, minRole: "company_admin", roles: ["company_admin"], group: "Administration" },
  { title: "Activity Log", href: "/admin/activity", icon: ScrollText, minRole: "company_admin", roles: ["company_admin"], group: "Administration" },
  { title: "Settings", href: "/admin/settings", icon: Settings, minRole: "company_admin", roles: ["company_admin"], group: "Administration" },

  // ── Rides (Slice A — employee mode-switcher) ────────────────────────────────────────────
  { title: "Find a Ride", href: "/app/find", icon: Search, minRole: "employee", roles: ["employee"], group: "Rides" },
  { title: "Offer a Ride", href: "/app/offer", icon: PlusCircle, minRole: "employee", roles: ["employee"], group: "Rides" },
  { title: "My Rides", href: "/app/rides", icon: Route, minRole: "employee", roles: ["employee"], group: "Rides" },
  { title: "My Vehicles", href: "/app/vehicles", icon: Car, minRole: "employee", roles: ["employee"], group: "Rides" },
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
