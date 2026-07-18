"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface ReportData {
  metrics: {
    totalTrips: number;
    totalDistance: number;
    totalFuelCost: number;
    netProfit: number;
    revenue: number;
    maintenanceMonthly: number;
  };
  monthlySummary: {
    month: string;
    revenue: number;
    fuel: number;
    net: number;
  }[];
}

const KEY = ["report"] as const;

export function useReportData() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<ReportData>("/api/report"),
  });
}
