import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Consistent page title + description + action row for every screen inside the shell. */
export function PageHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-primary" />}
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
