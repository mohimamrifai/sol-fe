"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import { paymentTermLabel } from "@/lib/billing-cycle-labels";
import { resolvePaymentMethodLabel } from "@/lib/payment-utils";
import { paymentStatusBadgeClass } from "@/lib/payment-status";
import { cn } from "@/lib/utils";
import { useInvoiceStatusLabel, usePaymentStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";
import { regenerateAdminPaymentLink } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { PaymentSupportingDocuments } from "@/components/dashboard/admin/payments/payment-supporting-documents";

type Row = Record<string, unknown>;

function fmtIdr(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtDate(v: unknown): string {
  if (v == null || v === "") return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(v: unknown): string {
  if (v == null || v === "") return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sectionTitle(title: string) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>;
}

function fieldRow(label: string, value: ReactNode) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[160px_1fr] sm:gap-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

type Props = {
  data: Row | null;
  locale?: string;
  canManage?: boolean;
  onRefresh?: () => void;
};

export function PaymentDetailView({ data, locale = "id", canManage = false, onRefresh }: Props) {
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");
  const tMethod = useTranslations("Payments.paymentMethod");
  const paymentStatusLabel = usePaymentStatusLabel();
  const invoiceStatusLabel = useInvoiceStatusLabel();

  if (!data) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  const customerInfo = (data.customer_info ?? {}) as Row;
  const invoice = (data.invoice ?? {}) as Row;
  const paymentInfo = (data.payment_info ?? {}) as Row;
  const onlinePayment = (data.online_payment ?? null) as Row | null;
  const paymentHistory = (data.payment_history ?? []) as Row[];
  const activityTimeline = (data.activity_timeline ?? []) as Row[];
  const supportingDocuments = (data.supporting_documents ?? []) as Array<Record<string, unknown>>;
  const actions = (data.actions ?? {}) as Record<string, unknown>;
  const paymentId = Number(data.id);

  const [regenerating, setRegenerating] = useState(false);

  const arStatus = String(data.invoice_ar_status ?? invoice.status ?? "");
  const invoiceId = invoice.id != null ? Number(invoice.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="space-y-1">
          <p className="font-mono text-sm font-semibold">{String(data.payment_number ?? data.payment_no ?? "—")}</p>
          <p className="text-xs text-muted-foreground">{tc("table.customer")}: {String(customerInfo.customer_name ?? "—")}</p>
          {invoiceId ? (
            <Link
              href={`/${locale}/dashboard/admin/customer/invoices/${invoiceId}`}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              {String(invoice.invoice_number ?? "—")}
            </Link>
          ) : (
            <p className="text-xs">{String(invoice.invoice_number ?? "—")}</p>
          )}
          <p className="text-xs text-muted-foreground">{t("detail.recordedAt")}: {fmtDateTime(data.created_at)}</p>
        </div>
        {arStatus ? (
          <Badge variant="outline" className={cn(invoiceStatusBadgeClass(arStatus))}>
            {invoiceStatusLabel(arStatus)}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        {sectionTitle(t("detail.sectionCustomer"))}
        {fieldRow(t("detail.customerCode"), String(customerInfo.customer_code ?? "—"))}
        {fieldRow(t("detail.customerName"), String(customerInfo.customer_name ?? "—"))}
        {fieldRow(t("detail.paymentTerms"), paymentTermLabel(String(customerInfo.payment_terms ?? "")))}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        {sectionTitle(t("detail.sectionInvoice"))}
        {fieldRow(t("detail.invoiceNo"), <span className="font-mono text-xs">{String(invoice.invoice_number ?? "—")}</span>)}
        {fieldRow(t("detail.invoiceDate"), fmtDate(invoice.invoice_date))}
        {fieldRow(t("detail.dueDate"), fmtDate(invoice.due_date))}
        {fieldRow(t("detail.invoiceTotal"), <span className="tabular-nums font-medium">{fmtIdr(invoice.total_amount)}</span>)}
        {fieldRow(t("detail.paidTotal"), <span className="tabular-nums">{fmtIdr(invoice.paid_amount ?? data.invoice_paid_amount)}</span>)}
        {fieldRow(t("detail.outstanding"), <span className="tabular-nums font-medium">{fmtIdr(invoice.outstanding_amount ?? data.outstanding_amount)}</span>)}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        {sectionTitle(t("detail.sectionPayment"))}
        {fieldRow(
          t("detail.method"),
          resolvePaymentMethodLabel(
            {
              method: paymentInfo.payment_method as string | null | undefined,
              payment_type: data.method as string | null | undefined,
            },
            (key) => tMethod(key)
          )
        )}
        {paymentInfo.company_bank ? fieldRow(t("recordDialog.companyBank"), String(paymentInfo.company_bank)) : null}
        {paymentInfo.account ? fieldRow(t("recordDialog.account"), String(paymentInfo.account)) : null}
        {fieldRow(t("detail.paidAt"), fmtDate(paymentInfo.payment_date ?? data.paid_at))}
        {fieldRow(t("detail.amount"), <span className="tabular-nums font-medium">{fmtIdr(paymentInfo.payment_amount ?? data.amount)}</span>)}
        {fieldRow(t("recordDialog.referenceNo"), String(paymentInfo.payment_reference_no ?? "—"))}
        {paymentInfo.payment_remark ? fieldRow(t("recordDialog.remark"), String(paymentInfo.payment_remark)) : null}
      </div>

      {paymentHistory.length > 0 ? (
        <div className="space-y-3 rounded-lg border p-4">
          {sectionTitle(t("detail.paymentHistory"))}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("recordDialog.paymentDate")}</TableHead>
                  <TableHead className="text-right">{t("detail.amount")}</TableHead>
                  <TableHead>{t("detail.method")}</TableHead>
                  <TableHead>{t("recordDialog.referenceNo")}</TableHead>
                  <TableHead>{t("detail.recordedBy")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((p, i) => (
                  <TableRow key={String(p.id ?? i)}>
                    <TableCell>{fmtDate(p.payment_date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtIdr(p.amount)}</TableCell>
                    <TableCell>
                      {resolvePaymentMethodLabel(
                        { payment_method: p.payment_method as string | null | undefined },
                        (key) => tMethod(key)
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{String(p.reference_no ?? "—")}</TableCell>
                    <TableCell>{String(p.recorded_by ?? "—")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {onlinePayment ? (
        <div className="space-y-3 rounded-lg border p-4">
          {sectionTitle(t("detail.sectionOnline"))}
          {fieldRow(t("detail.midtransLink"), onlinePayment.payment_link ? (
            <a href={String(onlinePayment.payment_link)} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-primary underline-offset-2 hover:underline">
              {String(onlinePayment.payment_link)}
            </a>
          ) : "—")}
          {fieldRow(t("detail.linkStatus"), String(onlinePayment.link_status ?? "—"))}
          {fieldRow(t("detail.expiredAt"), fmtDateTime(onlinePayment.expired_at))}
          {fieldRow(t("detail.orderId"), <span className="font-mono text-xs">{String(onlinePayment.midtrans_order_id ?? "—")}</span>)}
          {fieldRow(t("detail.transactionId"), <span className="font-mono text-xs">{String(onlinePayment.midtrans_transaction_id ?? "—")}</span>)}
          {fieldRow(t("detail.midtransStatus"), onlinePayment.midtrans_status ? (
            <Badge variant="outline" className={paymentStatusBadgeClass(String(onlinePayment.midtrans_status))}>
              {paymentStatusLabel(String(onlinePayment.midtrans_status))}
            </Badge>
          ) : "—")}
          {(actions.can_copy_link || actions.can_regenerate_link) && canManage ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {actions.can_copy_link && onlinePayment.payment_link ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(String(onlinePayment.payment_link)).then(
                      () => toast.success(t("generateLink.copied")),
                      () => toast.error(t("generateLink.copyFailed"))
                    );
                  }}
                >
                  {t("detail.copyLink")}
                </Button>
              ) : null}
              {actions.can_regenerate_link && Number.isFinite(paymentId) ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={regenerating}
                  onClick={() => {
                    setRegenerating(true);
                    void regenerateAdminPaymentLink(paymentId)
                      .then((res) => {
                        toast.success(res.message);
                        onRefresh?.();
                      })
                      .catch((e) => toast.error(e instanceof ApiError ? e.message : t("detail.regenerateFailed")))
                      .finally(() => setRegenerating(false));
                  }}
                >
                  {regenerating ? t("detail.regenerating") : t("detail.regenerateLink")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {Number.isFinite(paymentId) ? (
        <PaymentSupportingDocuments
          paymentId={paymentId}
          paymentNo={String(data.payment_number ?? data.payment_no ?? paymentId)}
          documents={supportingDocuments as never[]}
          canUpload={canManage}
          onUploaded={onRefresh}
        />
      ) : null}

      {activityTimeline.length > 0 ? (
        <div className="space-y-3 rounded-lg border p-4">
          {sectionTitle(t("detail.sectionActivity"))}
          <ul className="space-y-2 text-sm">
            {activityTimeline.map((entry, i) => (
              <li key={i} className="flex flex-wrap gap-x-2 gap-y-0.5 border-b pb-2 last:border-0">
                <span className="text-muted-foreground">{fmtDateTime(entry.occurred_at)}</span>
                <span>{String(entry.activity ?? "—")}</span>
                {entry.user ? <span className="text-muted-foreground">· {String(entry.user)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
