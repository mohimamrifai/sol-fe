"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  approveAdminVendorPayment,
  fetchAdminVendorPayment,
  fetchAdminVendorPaymentCompanyBanks,
  fetchAdminVendorPaymentVoucher,
  recordAdminVendorPayment,
  rejectAdminVendorPayment,
  uploadAdminVendorPaymentDocument,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { formatIdr, VENDOR_PAYMENT_METHOD_OPTIONS, vendorPaymentMethodLabel, vendorPaymentTermLabel, vendorTypesLabel } from "@/lib/vendor-fsd-options";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useAuthStore } from "@/lib/store";
import { useVendorPaymentStatusLabel } from "@/hooks/use-admin-status-labels";
import { toast } from "sonner";

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function AdminVendorPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManagePayment = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [companyBanks, setCompanyBanks] = useState<string[]>([]);
  const [approvalRemark, setApprovalRemark] = useState("");
  const [method, setMethod] = useState("transfer");
  const [companyBank, setCompanyBank] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentRemark, setPaymentRemark] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const vendorPaymentStatusLabel = useVendorPaymentStatusLabel();

  const refresh = async () => {
    const res = await fetchAdminVendorPayment(id);
    setDetail((res as { data: Record<string, unknown> }).data);
  };

  useEffect(() => { void refresh().catch(() => setDetail(null)); }, [id]);
  useEffect(() => {
    void fetchAdminVendorPaymentCompanyBanks().then((res) => {
      setCompanyBanks((res as { data: string[] }).data ?? []);
    });
  }, []);

  const approve = async () => {
    setBusy(true);
    try {
      await approveAdminVendorPayment(id, { approval_remark: approvalRemark });
      toast.success("Payment disetujui.");
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
      await rejectAdminVendorPayment(id, { approval_remark: approvalRemark });
      toast.success("Payment ditolak.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  };

  const record = async () => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("payment_method", method);
      fd.append("company_bank", companyBank);
      fd.append("payment_date", paymentDate);
      fd.append("payment_amount", paymentAmount);
      if (referenceNo) fd.append("reference_no", referenceNo);
      if (paymentRemark) fd.append("payment_remark", paymentRemark);
      if (proof) fd.append("payment_proof", proof);
      await recordAdminVendorPayment(id, fd);
      toast.success("Pembayaran dicatat.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  };

  const printVoucher = async () => {
    setBusy(true);
    try {
      const res = await fetchAdminVendorPaymentVoucher(id);
      const html = (res as { data: { html: string } }).data.html;
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mencetak voucher.");
    } finally {
      setBusy(false);
    }
  };

  const uploadDocument = async (file: File, documentType: "other_document" | "tax_invoice") => {
    setDocBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", documentType);
      await uploadAdminVendorPaymentDocument(id, fd);
      toast.success("Dokumen diunggah.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunggah dokumen.");
    } finally {
      setDocBusy(false);
    }
  };

  if (!detail) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  const status = String(detail.status);
  const invoiceId = detail.vendor_invoice_id;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{String(detail.payment_number)}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {String(detail.vendor ?? "—")} ·{" "}
              {invoiceId ? (
                <Link className="text-primary underline" href={`/${locale}/dashboard/admin/vendor/invoices/${invoiceId}`}>
                  Invoice {String(detail.vendor_invoice_no ?? "—")}
                </Link>
              ) : (
                <>Invoice {String(detail.vendor_invoice_no ?? "—")}</>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Created: {detail.created_at ? new Date(String(detail.created_at)).toLocaleString("id-ID") : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{vendorPaymentStatusLabel(status)}</Badge>
            {detail.can_print_voucher ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void printVoucher()}>
                Print Voucher
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vendor Information</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ReadonlyField label="Vendor Code" value={String(detail.vendor_code ?? "—")} />
          <ReadonlyField label="Vendor Name" value={String(detail.vendor_name ?? detail.vendor ?? "—")} />
          <ReadonlyField label="Vendor Category" value={vendorTypesLabel(detail.vendor_types as string[])} />
          <ReadonlyField label="Payment Terms" value={vendorPaymentTermLabel(String(detail.payment_terms ?? ""))} />
          <ReadonlyField label="Bank Account" value={String(detail.bank_account ?? "—")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Invoice Information</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ReadonlyField label="Vendor Invoice No" value={String(detail.vendor_invoice_no ?? "—")} />
          <ReadonlyField label="Invoice Date" value={String(detail.invoice_date ?? "—")} />
          <ReadonlyField label="Due Date" value={String(detail.due_date ?? "—")} />
          <ReadonlyField label="Invoice Amount" value={formatIdr(detail.invoice_amount as string)} />
          <ReadonlyField label="Approved Amount" value={formatIdr(detail.approved_amount as string)} />
          <ReadonlyField label="Outstanding Amount" value={formatIdr(detail.outstanding_amount as string)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Approval</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ReadonlyField label="Approval Status" value={String(detail.approval_status ?? status)} />
          <ReadonlyField label="Approved By" value={String(detail.approved_by ?? "—")} />
          <ReadonlyField label="Approved Date" value={detail.approved_at ? new Date(String(detail.approved_at)).toLocaleString("id-ID") : "—"} />
          {status === "waiting_approval" && canManagePayment ? (
            <div className="space-y-2">
              <div>
                <Label>Approval Remark</Label>
                <Textarea placeholder="Approval remark" value={approvalRemark} onChange={(e) => setApprovalRemark(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button disabled={busy} onClick={() => void approve()}>Approve Payment</Button>
                <Button variant="destructive" disabled={busy || !approvalRemark.trim()} onClick={() => void reject()}>Reject Payment</Button>
              </div>
            </div>
          ) : (
            <ReadonlyField label="Approval Remark" value={String(detail.approval_remark ?? "—")} />
          )}
        </CardContent>
      </Card>

      {status === "ready_to_pay" && canManagePayment ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Record Payment</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={(v) => v && setMethod(v)}>
                <SelectTrigger><SelectValue>{vendorPaymentMethodLabel(method)}</SelectValue></SelectTrigger>
                <SelectContent>
                  {VENDOR_PAYMENT_METHOD_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company Bank</Label>
              <Select value={companyBank} onValueChange={(v) => v && setCompanyBank(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekening perusahaan">
                    {companyBank || null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {companyBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Payment Date</Label><Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></div>
            <div><Label>Payment Amount</Label><Input inputMode="decimal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></div>
            <div><Label>Reference No</Label><Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} /></div>
            <div><Label>Payment Proof</Label><Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setProof(e.target.files?.[0] ?? null)} /></div>
            <div className="md:col-span-2">
              <Label>Payment Remark</Label>
              <Textarea value={paymentRemark} onChange={(e) => setPaymentRemark(e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Button disabled={busy} onClick={() => void record()}>Record Payment</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle className="text-base">Supporting Documents</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
            <span className="font-medium">Vendor Invoice</span>
            {detail.invoice_file ? (
              <a className="text-primary underline text-xs" href={String(detail.invoice_file)} target="_blank" rel="noreferrer">View</a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
            <span className="font-medium">Tax Invoice</span>
            <div className="flex items-center gap-2">
              {detail.tax_invoice_url ? (
                <a className="text-primary underline text-xs" href={String(detail.tax_invoice_url)} target="_blank" rel="noreferrer">View</a>
              ) : (
                <span className="text-muted-foreground text-xs">Belum ada</span>
              )}
              {canManagePayment ? (
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="max-w-48 h-8"
                  disabled={docBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadDocument(f, "tax_invoice");
                    e.target.value = "";
                  }}
                />
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">Other Documents</span>
              {canManagePayment ? (
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="max-w-48 h-8"
                  disabled={docBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadDocument(f, "other_document");
                    e.target.value = "";
                  }}
                />
              ) : null}
            </div>
            <ul className="space-y-2">
              {((detail.other_documents as Record<string, unknown>[]) ?? []).map((doc) => (
                <li key={String(doc.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <span>{String(doc.original_name ?? "Document")}</span>
                  {doc.url ? (
                    <a className="text-primary underline text-xs" href={String(doc.url)} target="_blank" rel="noreferrer">Download</a>
                  ) : null}
                </li>
              ))}
              {((detail.other_documents as unknown[]) ?? []).length === 0 ? (
                <li className="text-muted-foreground">Belum ada other document.</li>
              ) : null}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference No</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Proof</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((detail.payment_history as Record<string, unknown>[]) ?? []).map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{String(p.payment_date ?? "—")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatIdr(p.amount as string)}</TableCell>
                  <TableCell>{vendorPaymentMethodLabel(String(p.method ?? ""))}</TableCell>
                  <TableCell>{String(p.reference_no ?? "—")}</TableCell>
                  <TableCell>{String(p.paid_by ?? "—")}</TableCell>
                  <TableCell>
                    {p.payment_proof ? (
                      <a className="text-primary underline text-xs" href={String(p.payment_proof)} target="_blank" rel="noreferrer">View</a>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/vendor/payments`)}>Kembali</Button>
    </div>
  );
}
