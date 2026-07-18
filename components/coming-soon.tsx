import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Placeholder for routes that are SLICE work for build-day (admin, reports, etc.). These exist so
 * the role-aware nav never 404s and so RBAC gating is demonstrable tonight — but they are stubs,
 * not features (TODAY.md: "build the shell and primitives, nothing beyond them"). Each names the
 * slice that will own it and what already exists to build on.
 */
export function ComingSoon({
  icon: Icon = Construction,
  slice,
  builtOn,
  children,
}: {
  icon?: LucideIcon;
  slice: string;
  builtOn: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline">{slice}</Badge>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            This screen is scaffolded and RBAC-gated. It gets built on build-day from{" "}
            <span className="font-medium text-foreground">{builtOn}</span>, which already exists.
          </p>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
