"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Download, Eye, FileText, Inbox } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { usePathname } from "@/i18n/routing";
import { downloadBlob } from "@/lib/download-blob";
import { fetchCustomerDocumentBlob } from "@/lib/customer-api";
import type { DocumentRow } from "@/lib/document-types";

interface Props {
  rows: DocumentRow[];
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

function formatUploadDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

export function DocumentTable({ rows, page, perPage, total, onPageChange, loading }: Props) {
  const t = useTranslations("Documents.table");
  const tType = useTranslations("Documents.type");
  const tBucket = useTranslations("Documents.bucket");
  const router = useRouter();
  const pathname = usePathname();
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  async function onDownload(row: DocumentRow) {
    setDownloadingId(row.id);
    try {
      const blob = await fetchCustomerDocumentBlob(row.id, "download");
      const filename = `${row.name || "document"}.${row.format || "pdf"}`;
      downloadBlob(blob, filename);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-semibold">{t("columns.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.type")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.shipmentNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.bookingNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.uploadDate")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.uploadedBy")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-zinc-500">
                    <Inbox className="h-8 w-8" />
                    <p className="text-sm">{t("empty")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-zinc-900 line-clamp-2">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    <div className="flex flex-col">
                      <span>{tType(row.document_type)}</span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                        {tBucket(row.bucket)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">
                    {row.shipment_number ?? row.shipment_no ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">
                    {row.booking_no ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">
                    {formatUploadDate(row.upload_date)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{row.uploaded_by ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`${pathname}/${encodeURIComponent(row.id)}`)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        {t("view")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(row)}
                        disabled={downloadingId === row.id}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        {t("download")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {rows.length > 0 ? (
          <div className="px-4 py-3">
            <PaginationBar
              currentPage={page}
              lastPage={Math.max(1, Math.ceil(total / Math.max(1, perPage)))}
              total={total}
              from={total > 0 ? (page - 1) * perPage + 1 : null}
              to={Math.min(page * perPage, total)}
              onPageChange={onPageChange}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
