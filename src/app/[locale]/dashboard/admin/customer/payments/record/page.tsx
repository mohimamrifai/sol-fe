"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminEligibleInvoices, fetchAdminPaymentOptions, recordAdminPayment } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

type InvRow = {
  id: number;
  invoice_number?: string;
  company?: { name?: string };
  due_date?: string;
  outstanding_amount?: number;
};

/** FSD Customer/customer-payment.md §5.2 — dedicated Record Payment screen. */
export default function AdminRecordPaymentPage() {
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");
  const router = useRouter();

  const methods = [
    { value: "transfer", label: t("recordDialog.methodTransfer") },
    { value: "giro", label: t("recordDialog.methodGiro") },
    { value: "cash", label: t("recordDialog.methodCash") },
    { value: "midtrans", label: t("recordDialog.methodMidtrans") },
  ];

  const [rows, setRows] = useState<InvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [method, setMethod] = useState("transfer");
  const [companyBank, setCompanyBank] = useState("");
  const [account, setAccount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [remark, setRemark] = useState("");
  const [companyBanks, setCompanyBanks] = useState<string[]>([]);

  const isManualMethod = method !== "midtrans";
  const selected = rows.find((r) => r.id === invoiceId);

  useEffect(() => {
    void fetchAdminPaymentOptions()
      .then((res) => setCompanyBanks(res.data.company_banks ?? []))
      .catch(() => setCompanyBanks([]));
    void fetchAdminEligibleInvoices({ perPage: 100 })
      .then((res) => setRows((res as LaravelPaginated<InvRow>).data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected?.outstanding_amount != null) {
      setAmount(String(selected.outstanding_amount));
    }
  }, [selected?.id, selected?.outstanding_amount]);

  const submit = async () => {
    if (invoiceId == null) return;
    if (method === "transfer" && !companyBank.trim()) {
      toast.error(t("recordDialog.companyBankRequired"));
      return;
    }
    if (isManualMethod && !account.trim()) {
      toast.error(t("recordDialog.accountRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await recordAdminPayment(invoiceId, {
        payment_method: method,
        company_bank: companyBank.trim() || null,
        account: account.trim() || null,
        payment_date: paymentDate,
        payment_amount: Number(amount),
        payment_reference_no: referenceNo.trim(),
        payment_remark: remark.trim() || null,
      });
      toast.success(t("recordDialog.recorded"));
      const paymentId = (res as { data?: { id?: number } })?.data?.id;
      if (typeof paymentId === "number") {
        router.push(`/dashboard/admin/customer/payments/${paymentId}`);
      } else {
        router.push(`/dashboard/admin/customer/payments/invoice/${invoiceId}`);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : t("recordDialog.recordFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t("recordDialog.title")}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/admin/customer/payments")}>
          {t("detail.back")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("recordDialog.loadingEligible")}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("recordDialog.select")}</TableHead>
                    <TableHead>{t("columns.invoiceNo")}</TableHead>
                    <TableHead>{tc("table.customer")}</TableHead>
                    <TableHead>{t("recordDialog.dueDate")}</TableHead>
                    <TableHead className="text-right">{t("recordDialog.outstanding")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        {t("recordDialog.noEligible")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id} className={invoiceId === row.id ? "bg-muted/40" : undefined}>
                        <TableCell>
                          <input
                            type="radio"
                            name="invoice-select"
                            checked={invoiceId === row.id}
                            onChange={() => setInvoiceId(row.id)}
                            aria-label={t("recordDialog.select")}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.invoice_number ?? "—"}</TableCell>
                        <TableCell>{row.company?.name ?? "—"}</TableCell>
                        <TableCell>{row.due_date ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.outstanding_amount?.toLocaleString("id-ID") ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {invoiceId != null ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("recordDialog.paymentMethod")}</Label>
                  <Select value={method} onValueChange={(v) => v && setMethod(v)}>
                    <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {methods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("recordDialog.paymentDate")}</Label>
                  <Input className="h-9" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>
                {method === "transfer" ? (
                  <div className="space-y-2">
                    <Label>{t("recordDialog.companyBank")}</Label>
                    {companyBanks.length > 0 ? (
                      <Select value={companyBank || "none"} onValueChange={(v) => setCompanyBank(!v || v === "none" ? "" : v)}>
                        <SelectTrigger className="h-9 w-full"><SelectValue placeholder={t("recordDialog.companyBank")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {companyBanks.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input className="h-9" value={companyBank} onChange={(e) => setCompanyBank(e.target.value)} />
                    )}
                  </div>
                ) : null}
                {isManualMethod ? (
                  <div className="space-y-2">
                    <Label>{t("recordDialog.account")}</Label>
                    <Input className="h-9" value={account} onChange={(e) => setAccount(e.target.value)} />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>{t("recordDialog.paymentAmount")}</Label>
                  <Input className="h-9" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
                </div>
                <div className="space-y-2">
                  <Label>{t("recordDialog.referenceNo")}</Label>
                  <Input className="h-9" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("recordDialog.remark")}</Label>
                  <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/admin/customer/payments")}>
                {tc("actions.cancel")}
              </Button>
              <Button
                disabled={saving || invoiceId == null || !amount || !referenceNo.trim()}
                onClick={() => void submit()}
              >
                {saving ? tc("actions.saving") : t("recordPayment")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
