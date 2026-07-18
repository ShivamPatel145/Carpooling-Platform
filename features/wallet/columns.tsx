"use client";

import { ColumnDef } from "@tanstack/react-query";
import { format } from "date-fns";
import { WalletEntry } from "./schema";

// Wait, the ColumnDef import should be from "@tanstack/react-table"
import { type ColumnDef as ReactTableColumnDef } from "@tanstack/react-table";

export const walletColumns: ReactTableColumnDef<WalletEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a"),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.original.reason;
      return <span className="capitalize">{reason.replace("_", " ")}</span>;
    },
  },
  {
    accessorKey: "delta",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = Number(row.original.delta);
      const isPositive = amount > 0;
      return (
        <div className={`text-right font-medium ${isPositive ? "text-green-600 dark:text-green-400" : ""}`}>
          {isPositive ? "+" : ""}₹{Math.abs(amount).toFixed(2)}
        </div>
      );
    },
  },
  {
    accessorKey: "balanceAfter",
    header: () => <div className="text-right">Balance After</div>,
    cell: ({ row }) => {
      const balance = Number(row.original.balanceAfter);
      return <div className="text-right">₹{balance.toFixed(2)}</div>;
    },
  },
];
