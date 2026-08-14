"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAdminVendorInvoice,
  rejectAdminVendorInvoice,
  startVerificationAdminVendorInvoice,
  uploadAdminVendorInvoiceAttachment,
  verifyAdminVendorInvoice,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { formatIdr } from "@/lib/vendor-fsd-options";
import { useVendorInvoiceStatusLabel } from "@/hooks/use-admin-status-labels";
import { toast } from "sonner";

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function AdminVendorInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const vendorInvoiceStatusLabel = useVendorInvoiceStatusLabel();

  const refresh = async () => {
    const res = await fetchAdminVendorInvoice(id);
    setDetail((res as { data: Record<string, unknown> }).data);
  };

  useEffect(() => { void refresh().catch(() => setDetail(null)); }, [id]);

  const startVerification = async () => {
    setBusy(true);
    try {
      await startVerificationAdminVendorInvoice(id);
      toast.success("Verifikasi dimulai.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      await verifyAdminVendorInvoice(id, { verification_notes: notes });
      toast.success("Invoice diverifikasi.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await rejectAdminVendorInvoice(id, { rejection_reason: rejectReason });
      toast.success("Invoice ditolak.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  };

  const uploadAttachment = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", "supporting");
      await uploadAdminVendorInvoiceAttachment(id, fd);
      toast.success("Dokumen diunggah.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunggah.");
    } finally {
      setUploading(false);
    }
  };

  if (!detail) return <p className="text-sm text-muted-foreground">Memuat…</p>;

  const isReadonly = Boolean(detail.is_readonly);
  const canVerify = Boolean(detail.can_verify) && !isReadonly;
  const canStartVerification = Boolean(detail.can_start_verification) && !isReadonly;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{String(detail.vendor_invoice_no)}</CardTitle>
            <p className="text-sm text-muted-foreground">{String(detail.vendor ?? "—")}</p>
          </div>
          <Badge>{vendorInvoiceStatusLabel(String(detail.status))}</Badge>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Invoice Information</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ReadonlyField label="Vendor Invoice No" value={String(detail.vendor_invoice_no ?? "—")} />
          <ReadonlyField label="Vendor" value={String(detail.vendor ?? "—")} />
          <ReadonlyField label="Invoice Date" value={String(detail.invoice_date ?? "—")} />
          <ReadonlyField label="Receive Date" value={String(detail.receive_date ?? "—")} />
          <ReadonlyField label="Currency" value={String(detail.currency ?? "IDR")} />
          <ReadonlyField label="Invoice Amount" value={formatIdr(detail.invoice_amount as string)} />
          <ReadonlyField label="Tax Amount" value={formatIdr(detail.tax_amount as string)} />
          <ReadonlyField label="Total Amount" value={formatIdr(detail.total_amount as string)} />
          <ReadonlyField label="Due Date" value={String(detail.due_date ?? "—")} />
          <ReadonlyField label="Remark" value={String(detail.remark ?? "—")} />
          {detail.file_path ? (
            <a className="text-sm text-primary underline" href={String(detail.file_path)} target="_blank" rel="noreferrer">
              View Invoice PDF
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Job Order Matching Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Order No</TableHead>
                <TableHead>Shipment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((detail.job_orders as Record<string, unknown>[]) ?? []).map((j) => (
                <TableRow key={String(j.id)}>
                  <TableCell>{String(j.job_order_number)}</TableCell>
                  <TableCell>{String(j.shipment_number ?? "—")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatIdr(j.amount as string)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <ReadonlyField label="Selected Job Orders" value={String(detail.selected_job_order_count ?? 0)} />
            <ReadonlyField label="Total Job Order Amount" value={formatIdr(detail.total_job_order_amount as string)} />
            <ReadonlyField label="Invoice Total" value={formatIdr(detail.total_amount as string)} />
            <ReadonlyField label="Difference" value={formatIdr(detail.difference as string)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Verification</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ReadonlyField label="Verification Status" value={vendorInvoiceStatusLabel(String(detail.verification_status ?? detail.status))} />
          <ReadonlyField label="Verified By" value={String(detail.verified_by ?? "—")} />
          <ReadonlyField label="Verified Date" value={detail.verified_at ? new Date(String(detail.verified_at)).toLocaleString("id-ID") : "—"} />
          {detail.rejection_reason ? (
            <ReadonlyField label="Rejection Reason" value={String(detail.rejection_reason)} />
          ) : null}
          {canStartVerification ? (
            <Button disabled={busy} onClick={() => void startVerification()}>Start Verification</Button>
          ) : null}
          {canVerify ? (
            <div className="space-y-2">
              <div>
                <Label>Verification Notes</Label>
                <Textarea placeholder="Verification notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isReadonly} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void verify()}>Verify</Button>
                <Button variant="destructive" disabled={busy || !rejectReason.trim()} onClick={() => void reject()}>Reject</Button>
              </div>
              <div>
                <Label>Rejection Reason</Label>
                <Textarea placeholder="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} disabled={isReadonly} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm">
            {((detail.attachments as Record<string, unknown>[]) ?? []).map((a) => (
              <li key={String(a.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span>{String(a.original_name ?? "Document")}</span>
                {a.url ? (
                  <a className="text-primary underline text-xs" href={String(a.url)} target="_blank" rel="noreferrer">Download</a>
                ) : null}
              </li>
            ))}
            {((detail.attachments as unknown[]) ?? []).length === 0 ? (
              <li className="text-muted-foreground">Belum ada lampiran.</li>
            ) : null}
          </ul>
          {!isReadonly ? (
            <div>
              <Label>Upload Supporting Document</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadAttachment(f);
                  e.target.value = "";
                }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {((detail.activity_log as Record<string, unknown>[]) ?? []).map((a, i) => (
              <li key={i}>
                {String(a.activity)}
                {a.created_by ? ` · ${String(a.created_by)}` : ""}
                {a.created_at ? ` · ${new Date(String(a.created_at)).toLocaleString("id-ID")}` : ""}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/vendor/invoices`)}>Kembali</Button>
    </div>
  );
}
