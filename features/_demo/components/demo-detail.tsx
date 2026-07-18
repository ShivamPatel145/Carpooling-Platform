"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, Spinner, ErrorState } from "@/components/states";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatDateTime, shortId } from "@/lib/utils";
import { features } from "@/lib/client-features";
import { DemoEntityForm } from "@/features/_demo/form";
import { useDemoEntity, useDeleteDemoEntity } from "@/features/_demo/hooks";

/** Full detail/edit screen for one demoEntity. Renders loading / error / content states. */
export function DemoDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useDemoEntity(id);
  const del = useDeleteDemoEntity();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (isLoading) return <Spinner label="Loading item…" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Status", value: <StatusBadge status={data.status} /> },
    { label: "Amount", value: <span className="font-mono tabular-nums">{data.amount.toLocaleString()}</span> },
    { label: "Due date", value: <span className="font-mono text-sm">{formatDate(data.dueDate)}</span> },
    { label: "Pinned", value: data.isPinned ? "Yes" : "No" },
    { label: "ID", value: <span className="font-mono text-xs text-muted-foreground">{shortId(data.id)}</span> },
    { label: "Created", value: <span className="font-mono text-xs text-muted-foreground">{formatDateTime(data.createdAt)}</span> },
    { label: "Updated", value: <span className="font-mono text-xs text-muted-foreground">{formatDateTime(data.updatedAt)}</span> },
  ];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/demo">
          <ArrowLeft className="h-4 w-4" />
          All items
        </Link>
      </Button>

      <PageHeader
        title={data.name}
        description={data.description || "No description."}
        action={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium">{r.value}</dd>
              </div>
            ))}
            {data.attachmentUrl && (
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-muted-foreground">Attachment</dt>
                <dd>
                  <a
                    href={data.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
            <DialogDescription>Update “{data.name}”.</DialogDescription>
          </DialogHeader>
          <DemoEntityForm initial={data} uploadsEnabled={features.uploads} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              “{data.name}” will be permanently removed. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={async () => {
                await del.mutateAsync(data.id);
                router.push("/demo");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
