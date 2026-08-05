"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { MoreHorizontal, Eye, Power, Pencil, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { useChangeLocationStatus } from "@/hooks/use-customer-locations-form";
import { rowNumber } from "@/lib/list-query";

export interface LocationRow {
  id: number;
  code?: string;
  name?: string;
  type?: string;
  city?: string;
  province?: string;
  pic_name?: string;
  pic_email?: string;
  pic_mobile?: string;
  phone?: string;
  country?: string;
  district?: string;
  postal_code?: string;
  address?: string;
  created_at?: string;
  status?: string;
}

interface Props {
  rows: LocationRow[];
  total: number;
  page: number;
  perPage: number;
  isLoading: boolean;
  onPageChange: (p: number) => void;
  onEdit: (row: LocationRow) => void;
}

const typeBadgeClass: Record<string, string> = {
  head_office: "bg-sky-50 text-sky-700 ring-sky-200/60",
  branch_office: "bg-indigo-50 text-indigo-700 ring-indigo-200/60",
  warehouse: "bg-amber-50 text-amber-700 ring-amber-200/60",
};

const statusBadgeClass: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200/60",
};

export function LocationTable({ rows, total, page, perPage, isLoading, onPageChange, onEdit }: Props) {
  const t = useTranslations("Locations");
  const router = useRouter();
  const changeStatus = useChangeLocationStatus();
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const handleStatusToggle = async (row: LocationRow) => {
    const next = row.status === "active" ? "inactive" : "active";
    setBusyId(row.id);
    try {
      await changeStatus.mutateAsync({ id: row.id, status: next as "active" | "inactive" });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-zinc-500">
        No locations found.
      </div>
    );
  }

  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>{t("table.code")}</TableHead>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.type")}</TableHead>
            <TableHead>{t("table.city")}</TableHead>
            <TableHead>{t("table.pic")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="w-12 text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.id}>
              <TableCell className="text-xs text-zinc-500">{rowNumber(page, perPage, idx)}</TableCell>
              <TableCell className="font-mono text-xs">{row.code ?? "—"}</TableCell>
              <TableCell className="font-medium text-zinc-900">{row.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={typeBadgeClass[row.type ?? ""] ?? ""}>
                  {row.type ? t(`type.${row.type}` as `type.${string}`) : "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{row.city ?? "—"}</TableCell>
              <TableCell className="text-sm">{row.pic_name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusBadgeClass[row.status ?? ""] ?? ""}>
                  {row.status ?? "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 disabled:opacity-50">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/locations/${row.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(row)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void handleStatusToggle(row)}
                      disabled={busyId === row.id}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="mr-2 h-4 w-4" />
                      )}
                      {row.status === "active" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 pb-3 pt-1">
        <PaginationBar
          currentPage={page}
          lastPage={lastPage}
          total={total}
          from={from}
          to={to}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
