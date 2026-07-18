import Link from "next/link";
import { Hexagon } from "lucide-react";
import { homepageCopy } from "@/homepage.config";
import { cn } from "@/lib/utils";

/**
 * Brand mark. Deliberately a geometric glyph + wordmark in the LOCKED display face — no gradient,
 * no glow (design-standards §1). The wordmark reads from homepage.config so build-day renames it
 * in one place.
 */
export function Brand({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Hexagon className="h-4 w-4" />
      </span>
      <span className="font-display text-base font-semibold tracking-tight">
        {homepageCopy.productName}
      </span>
    </Link>
  );
}
