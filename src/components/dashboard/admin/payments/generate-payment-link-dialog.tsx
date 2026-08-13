"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminEligibleInvoices, generateAdminMidtransLink } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type InvRow = {
  id: number;
  invoice_number?: string;
  company?: { name?: string };
  due_date?: string;
  outstanding_amount?: number;
};

export function GeneratePaymentLinkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<InvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setInvoiceId(null);
    setPaymentUrl(null);
    setLoading(true);
    fetchAdminEligibleInvoices({ perPage: 50 })
      .then((res) => setRows(((res as LaravelPaginated<InvRow>).data ?? []) as InvRow[]))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open]);

  const onGenerate = async () => {
    if (invoiceId == null) return;
    setGenerating(true);
    try {
      const res = await generateAdminMidtransLink(invoiceId);
      const url = (res as { data?: { payment_url?: string } }).data?.payment_url ?? null;
      if (url) {
        setPaymentUrl(url);
        toast.success(t("generateLink.success"));
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("generateLink.failed"));
    } finally {
      setGenerating(false);
    }
  };

  const onCopy = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success(t("generateLink.copied"));
    } catch {
      toast.error(t("generateLink.copyFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("generateLink.title")}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("recordDialog.loadingEligible")}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("recordDialog.noEligible")}</p>
        ) : (
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
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <input
                      type="radio"
                      name="gen-link-inv"
                      checked={invoiceId === row.id}
                      onChange={() => {
                        setInvoiceId(row.id);
                        setPaymentUrl(null);
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.invoice_number ?? "—"}</TableCell>
                  <TableCell>{row.company?.name ?? "—"}</TableCell>
                  <TableCell>{row.due_date ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    Rp {Number(row.outstanding_amount ?? 0).toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {paymentUrl ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">{t("generateLink.urlLabel")}</p>
            <p className="break-all text-sm">{paymentUrl}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void onCopy()}>
              {t("generateLink.copy")}
            </Button>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.close")}
          </Button>
          <Button
            onClick={() => void onGenerate()}
            disabled={invoiceId == null || generating}
          >
            {generating ? tc("actions.generating") : t("generateLink.action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
