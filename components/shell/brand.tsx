import Link from "next/link";
import { homepageCopy } from "@/homepage.config";
import { cn } from "@/lib/utils";
import { CorideMark } from "@/components/shell/coride-logo";

/**
 * Brand mark — the Coride glyph in an ink `band` tile + wordmark in the LOCKED display face. No
 * gradient, no glow (design-standards §1). The wordmark reads from homepage.config so a rename is
 * one line.
 */
export function Brand({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-[11px] bg-[color:var(--band)]",
          lg ? "h-[38px] w-[38px]" : "h-9 w-9",
        )}
      >
        <CorideMark size={lg ? 24 : 22} />
      </span>
      <span
        className={cn(
          "font-display font-bold tracking-[-0.02em] text-[color:var(--ink)]",
          lg ? "text-[22px]" : "text-[18px]",
        )}
      >
        {homepageCopy.productName}
      </span>
    </Link>
  );
}
