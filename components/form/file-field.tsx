"use client";

import * as React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { FileUp, X, ExternalLink } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/states/loading-state";
import { cn } from "@/lib/utils";

/**
 * Reusable RHF file-upload field on UploadThing. Stores the resulting URL string. Degrades to a
 * disabled control with a hint when uploads aren't configured (UPLOADTHING_TOKEN absent) so the
 * app still works during Phase 0.
 */
export function FileField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  uploadsEnabled = true,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  uploadsEnabled?: boolean;
}) {
  const { toast } = useToast();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FileFieldInner
          label={label}
          description={description}
          uploadsEnabled={uploadsEnabled}
          value={field.value ?? ""}
          onChange={field.onChange}
          onError={(m) => toast({ variant: "destructive", title: "Upload failed", description: m })}
        />
      )}
    />
  );
}

function FileFieldInner({
  label,
  description,
  uploadsEnabled,
  value,
  onChange,
  onError,
}: {
  label: string;
  description?: string;
  uploadsEnabled: boolean;
  value: string;
  onChange: (v: string) => void;
  onError: (message: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("entityAttachment", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) onChange(url);
    },
    onUploadError: (e) => onError(e.message),
  });

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="space-y-2">
          {value ? (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 truncate text-sm text-accent hover:underline"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">{value.split("/").pop()}</span>
              </a>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange("")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,text/plain"
                disabled={!uploadsEnabled || isUploading}
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length) void startUpload(files);
                }}
              />
              <Button
                type="button"
                variant="outline"
                className={cn("w-full", !uploadsEnabled && "cursor-not-allowed opacity-60")}
                disabled={!uploadsEnabled || isUploading}
                onClick={() => inputRef.current?.click()}
              >
                {isUploading ? <Spinner className="p-0" /> : <FileUp className="h-4 w-4" />}
                {isUploading ? "Uploading…" : "Upload a file"}
              </Button>
            </>
          )}
        </div>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {!uploadsEnabled && (
        <p className="text-xs text-muted-foreground">
          File uploads are disabled until <code className="font-mono">UPLOADTHING_TOKEN</code> is set.
        </p>
      )}
      <FormMessage />
    </FormItem>
  );
}
