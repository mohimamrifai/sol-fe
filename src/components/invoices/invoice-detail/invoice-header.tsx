"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/routing";
import { downloadCustomerInvoicePdf, payInvoice } from "@/lib/customer-api";
import { downloadBlob } from "@/lib/download-blob";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import { ensureMidtransSnapLoaded, openMidtransSnap } from "@/lib/midtrans-client";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";
import { ApiError } from "@/lib/api-client";

interface Props {
  invoice: CustomerInvoiceDetail;
  onPaid?: () => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

export function InvoiceHeader({ invoice, onPaid }: Props) {
  const t = useTranslations("Invoices.detail.header");
  const tInfo = useTranslations("Invoices.detail.section1");
  const tStatus = useTranslations("Invoices.status");
  const router = useRouter();
  const [downloading, setDownloading] = React.useState(false);
  const [paying, setPaying] = React.useState(false);

  async function onDownload() {
    setDownloading(true);
    try {
      const blob = await downloadCustomerInvoicePdf(invoice.id);
      const filename = `invoice-${invoice.invoice_number || invoice.id}.pdf`;
      downloadBlob(blob, filename);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunduh PDF.");
    } finally {
      setDownloading(false);
    }
  }

  async function onPayNow() {
    setPaying(true);
    try {
      await ensureMidtransSnapLoaded();
      const res = await payInvoice(invoice.id);
      const token = res.data?.token;
      if (!token) {
        toast.error("Token pembayaran tidak tersedia.");
        return;
      }
      openMidtransSnap(token, {
        onSuccess: () => onPaid?.(),
        onPending: () => onPaid?.(),
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka pembayaran.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/invoices")}
            className="h-7 -ml-2 gap-1 px-2 text-xs text-zinc-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToList")}
          </Button>

          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Receipt className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {t("title")}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <span className="font-mono text-xs text-zinc-900 tabular-nums">
                  {invoice.invoice_number}
                </span>
                <span className="text-zinc-300">·</span>
                <span>{invoice.customer ?? "—"}</span>
                <span className="text-zinc-300">·</span>
                <Badge variant="outline" className={invoiceStatusBadgeClass(invoice.status)}>
                  {tStatus(invoice.status)}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span>
                  {tInfo("invoiceDate")}: {formatDate(invoice.invoice_date)}
                </span>
                <span className="text-zinc-300">·</span>
                <span>
                  {tInfo("dueDate")}: {formatDate(invoice.due_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={downloading}
            className="h-9 gap-2"
          >
            <Download className="h-4 w-4" />
            {t("downloadPdf")}
          </Button>
          {invoice.actions.can_pay_now ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => void onPayNow()}
              disabled={paying}
              className="h-9 gap-2"
            >
              <Wallet className="h-4 w-4" />
              {t("payNow")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
