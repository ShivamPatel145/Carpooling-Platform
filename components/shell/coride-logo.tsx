import { cn } from "@/lib/utils";

/**
 * The Coride mark — two riders (circles) joined by curved paths converging on an amber node.
 * Verbatim from the design comp. The tile background uses the ink `band` token so the mark
 * reads on both themes; the amber node is the one fixed brand colour.
 */
export function CorideMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="5" cy="6.6" r="1.6" stroke="#F4F1EA" strokeWidth="1.6" />
      <circle cx="5" cy="17.4" r="1.6" stroke="#F4F1EA" strokeWidth="1.6" />
      <path d="M6.6 6.9C10.6 8.2 11 10.6 14.1 11.7" stroke="#F4F1EA" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.6 17.1C10.6 15.8 11 13.4 14.1 12.3" stroke="#F4F1EA" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.6" cy="12" r="2.5" fill="#F4A726" />
    </svg>
  );
}
