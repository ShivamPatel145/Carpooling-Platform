"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";

/**
 * A date / datetime picker for the ride forms. The shared TextField doesn't allow date input types,
 * and the ride Zod fields hold a `Date` (z.coerce.date()) while native <input type="date|
 * datetime-local"> works in strings — so this field bridges Date ⇄ string locally. Kept inside
 * features/ride to avoid editing the shared form primitives.
 */
export function DateTimeField<T extends FieldValues>({
  control,
  name,
  label,
  mode = "datetime",
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /** "datetime" → datetime-local (Offer departure); "date" → date only (Find). */
  mode?: "datetime" | "date";
}) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const inputType = mode === "datetime" ? "datetime-local" : "date";

  // Format a Date (or ISO string) into the value the native input expects, in LOCAL time.
  function toInputValue(v: unknown): string {
    if (!v) return "";
    const d = v instanceof Date ? v : new Date(v as string);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (mode === "date") return date;
    return `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Input
        type={inputType}
        value={toInputValue(field.value)}
        onChange={(e) => {
          const raw = e.target.value;
          field.onChange(raw ? new Date(raw) : undefined);
        }}
        onBlur={field.onBlur}
        aria-label={label}
      />
      {error?.message && <FormMessage>{error.message}</FormMessage>}
    </FormItem>
  );
}
