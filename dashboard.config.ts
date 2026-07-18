import type { Role } from "@/lib/permissions";
import { roleHierarchy } from "@/lib/permissions";

/**
 * DASHBOARD WIDGETS — a CONFIG ARRAY (extensibility contract #2). The per-role dashboard renders
 * the widgets whose minRole the user meets, in order. Adding a widget is a DATA change; a widget
 * component is wired by `key` in components/dashboard/widget-registry.tsx.
 *
 * ⚠️  SHARED FILE — integrator only.
 *
 * BUILD-DAY: add domain KPI/stat/chart widgets here and register their components.
 */
export type WidgetSpan = 1 | 2 | 3 | 4;

export interface DashboardWidget {
  /** stable key → maps to a component in the widget registry */
  key: string;
  title: string;
  minRole: Role;
  /** column span on a 4-col grid (responsive collapses to 1) */
  span: WidgetSpan;
}

export const dashboardConfig: DashboardWidget[] = [
  { key: "welcome", title: "Welcome", minRole: "employee", span: 4 },
  { key: "open-tickets", title: "Open Tickets", minRole: "employee", span: 1 },
  { key: "unread-notifications", title: "Unread", minRole: "employee", span: 1 },
  { key: "pending-approvals", title: "Pending Approvals", minRole: "company_admin", span: 1 },
  { key: "recent-activity", title: "Recent Activity", minRole: "company_admin", span: 2 },
  { key: "user-count", title: "Total Users", minRole: "company_admin", span: 1 },
  // BUILD-DAY: domain widgets, e.g. { key: "revenue", title: "Revenue", minRole: "employee", span: 2 }
];

export function widgetsForRole(role: Role): DashboardWidget[] {
  return dashboardConfig.filter((w) => roleHierarchy[role] >= roleHierarchy[w.minRole]);
}
