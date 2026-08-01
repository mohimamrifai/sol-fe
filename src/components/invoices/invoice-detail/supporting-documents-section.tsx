"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Download, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { apiFetchBlob, ApiError } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download-blob";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

interface Props {
  invoice: CustomerInvoiceDetail;
}

function filenameFromKey(key: string, invoiceNo: string): string {
  if (key === "invoice_pdf") return `invoice-${invoiceNo}.pdf`;
  if (key === "tax_invoice") return `tax-invoice-${invoiceNo}.pdf`;
  return `document-${invoiceNo}.pdf`;
}

async function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function parseShipmentId(listPath: string | null | undefined): number | null {
  if (!listPath) return null;
  const qIndex = listPath.indexOf("?");
  if (qIndex < 0) return null;
  const qs = listPath.slice(qIndex + 1);
  const params = new URLSearchParams(qs);
  const v = params.get("shipment_id");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function SupportingDocumentsSection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section4");
  const router = useRouter();
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  async function onView(doc: CustomerInvoiceDetail["supporting_documents"][number]) {
    if (!doc.view_path || !doc.available) return;
    setBusyKey(doc.key);
    try {
      const blob = await apiFetchBlob(doc.view_path, { method: "GET" });
      await openBlobInNewTab(blob);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka dokumen.");
    } finally {
      setBusyKey(null);
    }
  }

  async function onDownload(doc: CustomerInvoiceDetail["supporting_documents"][number]) {
    if (!doc.download_path || !doc.available) return;
    setBusyKey(doc.key);
    try {
      const blob = await apiFetchBlob(doc.download_path, { method: "GET" });
      downloadBlob(blob, filenameFromKey(doc.key, invoice.invoice_number));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunduh dokumen.");
    } finally {
      setBusyKey(null);
    }
  }

  function onViewSupportingList(doc: CustomerInvoiceDetail["supporting_documents"][number]) {
    const shipmentId = parseShipmentId(doc.list_path);
    const q = new URLSearchParams();
    if (shipmentId != null) q.set("shipment_id", String(shipmentId));
    q.set("type", "shipment");
    router.push(`/dashboard/documents${q.toString() ? `?${q.toString()}` : ""}`);
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
              <th className="px-4 py-3 font-semibold">{t("columns.document")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.supporting_documents.map((doc) => {
              const disabled = !doc.available;
              const busy = busyKey === doc.key;
              const isList = doc.key === "supporting" && !!doc.list_path;
              return (
                <tr key={doc.key} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-zinc-900">{doc.label}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {isList ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewSupportingList(doc)}
                          disabled={disabled}
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t("view")}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void onView(doc)}
                            disabled={disabled || busy || !doc.view_path}
                            className="h-7 gap-1 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                            {t("view")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void onDownload(doc)}
                            disabled={disabled || busy || !doc.download_path}
                            className="h-7 gap-1 px-2 text-xs"
                          >
                            <Download className="h-3 w-3" />
                            {t("download")}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
