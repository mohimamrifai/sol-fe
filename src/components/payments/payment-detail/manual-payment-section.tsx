"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar, CheckCircle2, FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSubmitManualPayment, type SubmitManualPaymentInput } from "@/hooks/use-submit-manual-payment";
import { ApiError } from "@/lib/api-client";
import { formatIdr } from "@/lib/format";
import type { PaymentDetail } from "@/lib/payment-types";

interface Props {
  payment: PaymentDetail;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-900 tabular-nums">{value}</div>
    </div>
  );
}

export function ManualPaymentSection({ payment }: Props) {
  const t = useTranslations("Payments.detail.section4");
  const tForm = useTranslations("Payments.detail.section4.form");
  const tManual = useTranslations("Payments.manualStatus");
  const tActions = useTranslations("Payments.actions");
  const mutation = useSubmitManualPayment();

  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = React.useState({
    payment_date: today,
    amount: String(payment.invoice.outstanding_amount ?? 0),
    bank_name: payment.manual.bank_name ?? payment.manual_payment.bank_account?.bank_name ?? "",
    reference_number: "",
    remark: "",
  });
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const enabled = payment.manual_payment.enabled;
  const isSubmitted = payment.manual.status === "submitted" || payment.manual.status === "verified";
  const isVerified = payment.manual.status === "verified";
  const isRejected = payment.manual.status === "rejected";

  if (!enabled) return null;

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file melebihi 5MB.");
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Tipe file tidak didukung.");
      return;
    }
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih file bukti pembayaran.");
      return;
    }
    if (!form.bank_name) {
      toast.error("Nama bank wajib diisi.");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Nominal harus lebih dari 0.");
      return;
    }
    const payload: SubmitManualPaymentInput = {
      paymentId: payment.id,
      payload: {
        payment_date: form.payment_date,
        amount,
        bank_name: form.bank_name,
        reference_number: form.reference_number || undefined,
        remark: form.remark || undefined,
        proof_file: file,
      },
    };
    try {
      await mutation.mutateAsync(payload);
      toast.success(tActions("manualSubmitSuccess"));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tActions("manualSubmitError"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          {t("title")}
          {enabled ? (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("enabled")}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-700">
              {t("disabled")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payment.manual_payment.bank_account ? (
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label={t("bankName")} value={payment.manual_payment.bank_account.bank_name ?? "—"} />
            <Field label={t("accountNumber")} value={payment.manual_payment.bank_account.account_number ?? "—"} />
            <Field label={t("accountName")} value={payment.manual_payment.bank_account.account_name ?? "—"} />
          </div>
        ) : null}

        {isSubmitted || isVerified || isRejected ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label={tForm("paymentDate")} value={formatDate(payment.manual.payment_date)} />
            <Field label={tForm("bankName")} value={payment.manual.bank_name ?? "—"} />
            <Field label={tForm("referenceNumber")} value={payment.manual.reference_number ?? "—"} />
            <Field
              label={tForm("title")}
              value={
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                  {tManual(payment.manual.status as never)}
                </Badge>
              }
            />
            <Field label={tForm("remark")} value={payment.manual.remark ?? "—"} />
            <Field
              label="Submitted At"
              value={formatDate(payment.manual.submitted_at)}
            />
            {payment.manual.verified_at ? (
              <Field label="Verified At" value={formatDate(payment.manual.verified_at)} />
            ) : null}
          </div>
        ) : null}

        {enabled && !isVerified ? (
          <form onSubmit={onSubmit} className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tForm("paymentDate")}</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
                  className="h-10 pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tForm("amount")}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">Rp</span>
                <Input
                  value={formatIdr(Number(form.amount || 0))}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setForm((p) => ({ ...p, amount: v }));
                  }}
                  className="h-10 pl-9 tabular-nums"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tForm("bankName")}</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tForm("referenceNumber")}</Label>
              <Input
                value={form.reference_number}
                onChange={(e) => setForm((p) => ({ ...p, reference_number: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-zinc-600">{tForm("remark")}</Label>
              <Textarea
                value={form.remark}
                onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
                className="min-h-[60px]"
                rows={2}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-zinc-600">{tForm("proofFile")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={onFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-500" />
                    <span className="truncate font-mono text-xs">{file.name}</span>
                    <span className="text-[11px] text-zinc-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={clearFile} className="h-7 w-7 p-0">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={pickFile}
                  className="h-10 w-full justify-start gap-2 text-zinc-600"
                >
                  <Upload className="h-4 w-4" />
                  {tForm("proofFile")}
                </Button>
              )}
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={mutation.isPending || !file || !enabled}
                className="h-10"
              >
                {mutation.isPending ? tForm("submitting") : tForm("submit")}
              </Button>
            </div>
          </form>
        ) : !enabled ? (
          <p className="text-sm text-zinc-500">{tForm("disabledReason")}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
