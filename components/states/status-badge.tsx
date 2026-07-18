import { Badge, type BadgeProps } from "@/components/ui/badge";
import { humanize } from "@/lib/utils";

/**
 * STATUS BADGE — one of the mandated five states. A generic status→variant mapper so every
 * slice renders statuses consistently instead of ad-hoc coloured spans. Extend STATUS_VARIANTS
 * with domain statuses on build day.
 */
const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  // demo entity
  draft: "secondary",
  active: "success",
  archived: "outline",
  // support tickets
  open: "warning",
  in_progress: "accent",
  resolved: "success",
  closed: "outline",
  // priorities
  low: "outline",
  medium: "secondary",
  high: "warning",
  urgent: "destructive",
  // generic
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  // carpooling — vehicle approval
  inactive: "secondary",
  // carpooling — ride lifecycle (ride.status)
  published: "success",
  full: "secondary",
  cancelled: "destructive",
  // carpooling — booking lifecycle (booking.status): pending/cancelled shared above
  confirmed: "success",
  // trips — Slice B lifecycle (booked → started → in_progress → completed → payment_pending → payment_completed)
  booked: "secondary",
  started: "accent",
  // `completed` is shared by trips (Slice B) AND ride/booking (Slice A) — one mapping, positive-terminal.
  completed: "success",
  payment_pending: "warning",
  payment_completed: "success",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = STATUS_VARIANTS[status] ?? "secondary";
  return (
    <Badge variant={variant} className={className}>
      {humanize(status)}
    </Badge>
  );
}
