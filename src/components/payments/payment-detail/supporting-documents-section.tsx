"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Download, Eye, FileText, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadCustomerPaymentProof, downloadCustomerPaymentReceipt } from "@/lib/customer-api";
import { downloadBlob } from "@/lib/download-blob";
import { ApiError } from "@/lib/api-client";
import type { PaymentDetail, SupportingDocument } from "@/lib/payment-types";

interface Props {
  payment: PaymentDetail;
}

function fileSizeKb(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function SupportingDocumentsSection({ payment }: Props) {
  const t = useTranslations("Payments.detail.section5");
  const rows: SupportingDocument[] = payment.supporting_documents;

  async function onPreview(doc: SupportingDocument) {
    try {
      if (doc.key === "payment_receipt") {
        const blob = await downloadCustomerPaymentReceipt(payment.id, "preview");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        return;
      }
      if (doc.key === "payment_proof") {
        const blob = await downloadCustomerPaymentProof(payment.id, "preview");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka dokumen.");
    }
  }

  async function onDownload(doc: SupportingDocument) {
    try {
      if (doc.key === "payment_receipt") {
        const blob = await downloadCustomerPaymentReceipt(payment.id, "download");
        downloadBlob(blob, `payment-receipt-${payment.payment_no}.pdf`);
        return;
      }
      if (doc.key === "payment_proof") {
        const blob = await downloadCustomerPaymentProof(payment.id, "download");
        const name = (doc.meta?.original_name as string) || `payment-proof-${payment.payment_no}`;
        downloadBlob(blob, name);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunduh dokumen.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-zinc-500">
            <Inbox className="h-6 w-6" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((doc) => (
              <li
                key={doc.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-zinc-600">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">{doc.label}</div>
                    {doc.meta ? (
                      <div className="truncate text-[11px] text-zinc-500">
                        {String(doc.meta.original_name ?? "—")}
                        {doc.meta.file_size ? ` · ${fileSizeKb(doc.meta.file_size)}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {doc.available ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(doc)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        {t("view")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(doc)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        {t("download")}
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11px] text-zinc-400">—</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
