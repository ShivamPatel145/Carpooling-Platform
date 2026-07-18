import { cn } from "@/lib/utils";

/** Base shimmer block. Compose into per-shape skeletons; see components/states/. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
