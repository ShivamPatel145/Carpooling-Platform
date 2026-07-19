"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

/**
 * Global client providers, mounted once in the root layout:
 *   - next-themes  → dark mode (class strategy, matches tailwind darkMode: ["class"])
 *   - TanStack Query → all data fetching/mutations (one client, sensible defaults)
 *   - Auth.js SessionProvider → useSession() in client components
 *   - Tooltip provider + Toaster → shared UI infrastructure
 *
 * QueryClient is created inside useState so it's stable per-tab and not shared across requests
 * on the server.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider
      // Don't poll or refetch the session on every window focus / tab switch. The session is a JWT
      // (auth.config.ts) and role/tenancy only change via an explicit signOut+signIn, so the client
      // has no reason to keep re-hitting /api/auth/session — which, on a miss, does a Neon round-trip
      // in the jwt callback (auth.ts). This collapses the burst of GET /api/auth/session calls.
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
