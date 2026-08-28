"use client";

import { useRef, useState } from "react";
import { Download, Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadAdminInvoiceDocument,
  downloadAdminInvoicePdf,
  uploadAdminInvoiceDocument,
  viewAdminInvoicePdf,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download-blob";
import { viewPdfBlob } from "@/lib/pdf-blob";

type Row = Record<string, unknown>;
type DocumentKind = "tax_invoice" | "supporting";

const money = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `Rp ${amount.toLocaleString("id-ID")}` : "—";
};

const date = (value: unknown, includeTime = false) => {
  if (!value) return "—";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
  }).format(parsed);
};

function downloadBlobFile(blob: Blob, filename: string) {
  downloadBlob(blob, filename);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export function InvoiceDetailView({
  data,
  onReload,
}: {
  data: Row;
  onReload: () => void;
}) {
  const t = useTranslations("AdminInvoices");
  const [busy, setBusy] = useState(false);
  const uploadKind = useRef<DocumentKind>("tax_invoice");
  const fileInput = useRef<HTMLInputElement>(null);
  const id = Number(data.id);
  const header = data.header as Row;
  const info = data.invoice_info as Row;
  const shipment = data.shipment as Row;
  const summary = data.summary as Row;
  const paymentSummary = data.payment_summary as Row;
  const documents = data.documents as Row;
  const invoicePdf = (documents.invoice_pdf ?? {}) as Row;
  const invoicePdfAvailable = Boolean(invoicePdf.available);
  const items = (data.items as Row[]) ?? [];
  const payments = (data.payment_history as Row[]) ?? [];
  const activities = (data.activity_log as Row[]) ?? [];
  const taxInvoices = (documents.tax_invoices as Row[]) ?? [];
  const supporting = (documents.supporting_documents as Row[]) ?? [];
  const customer = info.customer as Row | undefined;

  const runDocument = async (document: Row, view: boolean) => {
    setBusy(true);
    try {
      const blob = await downloadAdminInvoiceDocument(id, Number(document.id), view);
      if (view) viewPdfBlob(blob);
      else downloadBlobFile(blob, String(document.name ?? "document"));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("toasts.documentFailed"));
    } finally {
      setBusy(false);
    }
  };

  const runPdf = async (view: boolean) => {
    setBusy(true);
    try {
      const blob = view ? await viewAdminInvoicePdf(id) : await downloadAdminInvoicePdf(id);
      if (view) viewPdfBlob(blob);
      else downloadBlobFile(blob, `invoice-${String(header.invoice_number)}.pdf`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("toasts.pdfFailed"));
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      await uploadAdminInvoiceDocument(id, uploadKind.current, file);
      toast.success(t("toasts.documentUploaded"));
      onReload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("toasts.documentUploadFailed"));
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const openUpload = (kind: DocumentKind) => {
    uploadKind.current = kind;
    fileInput.current?.click();
  };

  const documentRows = (rows: Row[], kind: DocumentKind) => (
    <div className="space-y-2">
      {rows.map((document) => (
        <div key={String(document.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
          <span className="text-sm">{String(document.name ?? "—")}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void runDocument(document, true)}>
              <Eye className="h-4 w-4" /> {t("actions.view")}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void runDocument(document, false)}>
              <Download className="h-4 w-4" /> {t("actions.download")}
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" disabled={busy} onClick={() => openUpload(kind)}>
        <Upload className="h-4 w-4" /> {t("actions.upload")}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <input
        ref={fileInput}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
        onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])}
      />

      <Card>
        <CardHeader><CardTitle>{t("detail.invoiceInformation")}</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("detail.invoiceNumber")} value={String(info.invoice_number ?? "—")} />
          <Field label={t("detail.customer")} value={String(customer?.name ?? header.customer ?? "—")} />
          <Field label={t("detail.invoiceDate")} value={date(info.invoice_date)} />
          <Field label={t("detail.dueDate")} value={date(info.due_date)} />
          <Field label={t("detail.currency")} value={String(info.currency ?? "IDR")} />
          <Field label={t("detail.paymentTerms")} value={String(info.payment_term ?? info.payment_terms ?? "—")} />
          <Field label={t("detail.remark")} value={<span className="whitespace-pre-wrap">{String(info.remark ?? "—")}</span>} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("detail.shipmentInformation")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("detail.shipmentNo")}</TableHead><TableHead>{t("detail.cnNo")}</TableHead>
              <TableHead>{t("detail.route")}</TableHead><TableHead>{t("detail.service")}</TableHead>
              <TableHead>{t("detail.shipmentCoverage")}</TableHead>
            </TableRow></TableHeader>
            <TableBody><TableRow>
              <TableCell>{String(shipment.shipment_no ?? "—")}</TableCell>
              <TableCell>{String(shipment.cn_no ?? "—")}</TableCell>
              <TableCell>{String(shipment.route ?? "—")}</TableCell>
              <TableCell>{String(shipment.service ?? "—")}</TableCell>
              <TableCell>{String(shipment.shipment_coverage ?? "—")}</TableCell>
            </TableRow></TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("detail.invoiceDetail")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t("detail.description")}</TableHead><TableHead className="text-right">{t("detail.quantity")}</TableHead>
                <TableHead className="text-right">{t("detail.unitPrice")}</TableHead><TableHead className="text-right">{t("detail.amount")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{items.map((item) => <TableRow key={String(item.id)}>
                <TableCell>{String(item.description ?? "—")}</TableCell><TableCell className="text-right">{String(item.qty ?? "—")}</TableCell>
                <TableCell className="text-right">{money(item.unit_price)}</TableCell><TableCell className="text-right">{money(item.amount)}</TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </div>
          <div className="ml-auto w-full max-w-sm space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            {[
              [t("detail.subtotal"), summary.subtotal],
              [t("detail.discount"), summary.discount],
              [t("detail.ppn"), summary.ppn],
              [t("detail.grandTotal"), summary.grand_total],
            ].map(([label, value], index) => <div key={String(label)} className={`flex justify-between ${index === 3 ? "border-t pt-2 font-semibold" : ""}`}>
              <span>{String(label)}</span><span>{money(value)}</span>
            </div>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("detail.supportingDocuments")}</CardTitle></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("detail.invoicePdf")}</h3>
            {invoicePdfAvailable ? (
              <>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void runPdf(true)}><Eye className="h-4 w-4" />{t("actions.view")}</Button>
                <Button size="sm" variant="outline" className="ml-2" disabled={busy} onClick={() => void runPdf(false)}><Download className="h-4 w-4" />{t("actions.download")}</Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("detail.invoicePdfUnavailable")}</p>
            )}
          </div>
          <div className="space-y-2"><h3 className="text-sm font-medium">{t("detail.taxInvoice")}</h3>{documentRows(taxInvoices, "tax_invoice")}</div>
          <div className="space-y-2"><h3 className="text-sm font-medium">{t("detail.supportingDocument")}</h3>{documentRows(supporting, "supporting")}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("detail.paymentSummary")}</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field label={t("detail.invoiceAmount")} value={money(paymentSummary.invoice_amount)} />
          <Field label={t("detail.paidAmount")} value={money(paymentSummary.paid_amount)} />
          <Field label={t("detail.outstandingAmount")} value={money(paymentSummary.outstanding_amount)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("detail.paymentHistory")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("detail.paymentDate")}</TableHead><TableHead className="text-right">{t("detail.amount")}</TableHead>
              <TableHead>{t("detail.method")}</TableHead><TableHead>{t("detail.referenceNo")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>{payments.length ? payments.map((payment) => <TableRow key={String(payment.id)}>
              <TableCell>{date(payment.payment_date)}</TableCell><TableCell className="text-right">{money(payment.amount)}</TableCell>
              <TableCell>{String(payment.method ?? "—")}</TableCell><TableCell>{String(payment.reference_number ?? "—")}</TableCell>
            </TableRow>) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("detail.noPayments")}</TableCell></TableRow>}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("detail.activityLog")}</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">{activities.map((activity) => <li key={String(activity.id)} className="flex flex-wrap justify-between gap-2 border-b pb-3 last:border-0">
            <span className="text-sm">{String(activity.description ?? "—")}{activity.actor ? ` · ${String(activity.actor)}` : ""}</span>
            <span className="text-xs text-muted-foreground">{date(activity.occurred_at, true)}</span>
          </li>)}</ul>
        </CardContent>
      </Card>
    </div>
  );
}
