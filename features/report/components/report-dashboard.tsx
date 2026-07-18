"use client";

import { Route, Gauge, Fuel, TrendingUp, type LucideIcon } from "lucide-react";
import { useReportData } from "@/features/report/hooks";
import { coCard, CoEyebrow } from "@/components/co/ui";

const inr = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

/**
 * Reports dashboard — Coride restyle. Every figure is real, from GET /api/report (metrics +
 * monthlySummary), org- and role-scoped server-side. Charts are hand-drawn SVG in the employee
 * dashboard idiom; no chart library.
 */
export function ReportDashboard() {
  const { data, isLoading } = useReportData();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${coCard} h-[110px] animate-pulse p-5`} />
          ))}
        </div>
        <div className={`${coCard} h-[280px] animate-pulse`} />
      </div>
    );
  }
  if (!data) return null;

  const { metrics, monthlySummary } = data;
  const netPositive = metrics.netProfit >= 0;

  const kpis: { label: string; value: string; sub: string; Icon: LucideIcon; tone?: "ok" }[] = [
    { label: "Total trips", value: inr(metrics.totalTrips), sub: "Payment-completed", Icon: Route },
    { label: "Total distance", value: `${inr(metrics.totalDistance)} km`, sub: "Across completed trips", Icon: Gauge },
    { label: "Fuel cost", value: `₹${inr(metrics.totalFuelCost)}`, sub: "Distance × rate/km", Icon: Fuel },
    {
      label: "Net profit",
      value: `${netPositive ? "" : "−"}₹${inr(Math.abs(metrics.netProfit))}`,
      sub: "Revenue − fuel − upkeep",
      Icon: TrendingUp,
      ...(netPositive ? { tone: "ok" as const } : {}),
    },
  ];

  // Grouped monthly bars — revenue vs fuel, both always ≥ 0.
  const chartMax = Math.max(
    1,
    ...monthlySummary.map((m) => Math.max(Number(m.revenue) || 0, Number(m.fuel) || 0)),
  );
  const hasChartData = monthlySummary.some((m) => (Number(m.revenue) || 0) + (Number(m.fuel) || 0) > 0);

  const summaryRows: { label: string; value: number }[] = [
    { label: "Revenue", value: metrics.revenue },
    { label: "Fuel cost", value: metrics.totalFuelCost },
    ...(metrics.maintenanceMonthly > 0
      ? [{ label: "Maintenance", value: metrics.maintenanceMonthly }]
      : []),
  ];

  return (
    <div className="space-y-[22px]">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, sub, Icon, tone }) => (
          <div key={label} className={`${coCard} p-5`}>
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[12.5px] text-[color:var(--ink-3)]">{label}</span>
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
            </div>
            <div
              className={`mb-1.5 font-mono text-[24px] font-semibold tracking-[-0.01em] ${
                tone === "ok" ? "text-[color:var(--ok)]" : "text-[color:var(--ink)]"
              }`}
            >
              {value}
            </div>
            <div className="text-[12px] text-[color:var(--ink-3)]">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,320px)]">
        {/* Monthly bar chart */}
        <div className={`${coCard} p-5`}>
          <div className="mb-1 font-display text-[15px] font-semibold text-[color:var(--ink)]">
            Monthly summary
          </div>
          <div className="mb-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[12px] text-[color:var(--ink-2)]">
              <span className="h-[9px] w-[9px] rounded-[3px] bg-[color:var(--amber-strong)]" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[color:var(--ink-2)]">
              <span className="h-[9px] w-[9px] rounded-[3px] bg-[color:var(--ink-3)]" />
              Fuel cost
            </span>
          </div>

          {hasChartData ? (
            <div className="flex h-[168px] items-end gap-4">
              {monthlySummary.map((m, i) => {
                const rev = Number(m.revenue) || 0;
                const fuel = Number(m.fuel) || 0;
                return (
                  <div key={`${m.month}-${i}`} className="flex h-full flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end justify-center gap-1.5">
                      <div
                        className="w-full max-w-[26px] rounded-[5px]"
                        style={{
                          height: `${Math.max(4, (rev / chartMax) * 100)}%`,
                          background: "var(--amber-strong)",
                        }}
                        title={`Revenue ₹${inr(rev)}`}
                      />
                      <div
                        className="w-full max-w-[26px] rounded-[5px]"
                        style={{
                          height: `${Math.max(4, (fuel / chartMax) * 100)}%`,
                          background: "var(--ink-3)",
                        }}
                        title={`Fuel ₹${inr(fuel)}`}
                      />
                    </div>
                    <div className="text-[11px] text-[color:var(--ink-2)]">{m.month}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-[13px] text-[color:var(--ink-3)]">
              No completed trips yet — revenue and cost appear here once trips finish.
            </p>
          )}
        </div>

        {/* Financial summary band card */}
        <div className="rounded-2xl border border-[color:var(--band-line)] bg-[color:var(--band)] p-6 text-[color:var(--on-band)]">
          <CoEyebrow className="text-[color:var(--on-band-2)]">Net profit</CoEyebrow>
          <div
            className={`mt-2 font-mono text-[34px] font-semibold leading-none tracking-[-0.02em] ${
              netPositive ? "text-[color:var(--amber)]" : "text-[color:var(--on-band)]"
            }`}
          >
            {netPositive ? "" : "−"}₹{inr(Math.abs(metrics.netProfit))}
          </div>
          <ul className="mt-5 flex flex-col">
            {summaryRows.map((r, i) => (
              <li
                key={r.label}
                className={`flex items-center justify-between py-2.5 ${
                  i > 0 ? "border-t border-[color:var(--band-line)]" : ""
                }`}
              >
                <span className="text-[13px] text-[color:var(--on-band-2)]">{r.label}</span>
                <span className="font-mono text-[14px] font-semibold text-[color:var(--on-band)]">
                  ₹{inr(r.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
