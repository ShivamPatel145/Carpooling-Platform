"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Reusable RHF text/textarea/number field. One of the shared form primitives (generic-crud skill:
 * "reusable form primitives on shadcn/ui"). Wire it with a control + name; validation messages
 * come from the shared Zod schema automatically.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = "text",
  multiline = false,
  rows = 4,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "number" | "password" | "url";
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea rows={rows} placeholder={placeholder} {...field} value={field.value ?? ""} />
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
                value={field.value ?? ""}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
