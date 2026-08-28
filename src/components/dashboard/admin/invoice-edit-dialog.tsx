"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchAdminInvoice, fetchAdminSystemSettings, updateAdminInvoice } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import {
  calculateAdminInvoiceTotals,
  isDiscountLine,
  withDiscountLine,
} from "@/lib/admin-invoice-calculation";

type EditItem = { key: string; description: string; quantity: string; unitPrice: string };
const money = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export function InvoiceEditDialog({
  open,
  onOpenChange,
  invoiceId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  onSaved: () => void;
}) {
  const t = useTranslations("AdminInvoices");
  const tc = useTranslations("AdminCommon");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [remark, setRemark] = useState("");
  const [items, setItems] = useState<EditItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState(0.11);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !invoiceId) return;
    let active = true;
    setLoading(true);
    void fetchAdminInvoice(invoiceId)
      .then((response) => {
        if (!active) return;
        const value = response.data;
        const info = value.invoice_info as Record<string, unknown>;
        const summary = value.summary as Record<string, unknown>;
        const responseItems = ((value.items as Array<Record<string, unknown>>) ?? []).map(
          (item, index) => ({
            key: String(item.id ?? index),
            description: String(item.description ?? ""),
            quantity: String(item.qty ?? 1),
            unitPrice: String(item.unit_price ?? 0),
          })
        );
        const normalItems = responseItems.filter(
          (item) =>
            !isDiscountLine({
              description: item.description,
              quantity: Number(item.quantity),
              unit_price: Number(item.unitPrice),
            })
        );
        const taxable = Math.max(
          0,
          Number(summary.subtotal ?? 0) - Number(summary.discount ?? 0)
        );
        const ppn = Number(summary.ppn ?? 0);
        setInvoiceDate(String(info.invoice_date ?? ""));
        setRemark(String(info.remark ?? ""));
        setItems(normalItems);
        setDiscount(String(Number(summary.discount ?? 0)));
        if (taxable > 0 && Number.isFinite(ppn)) setTaxRate(Math.max(0, ppn / taxable));
      })
      .catch((error) =>
        toast.error(error instanceof ApiError ? error.message : t("toasts.detailLoadFailed"))
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [invoiceId, open, t]);

  useEffect(() => {
    if (!open) return;
    void fetchAdminSystemSettings()
      .then((response) => {
        const percent = Number(response.data.values.default_tax_rate);
        if (Number.isFinite(percent)) setTaxRate(Math.max(0, percent / 100));
      })
      .catch(() => undefined);
  }, [open]);

  const totals = useMemo(() => {
    return calculateAdminInvoiceTotals(
      withDiscountLine(
        items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unitPrice) || 0,
        })),
        Number(discount)
      ),
      taxRate
    );
  }, [discount, items, taxRate]);

  const updateItem = (key: string, patch: Partial<EditItem>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminInvoice(invoiceId, {
        invoice_date: invoiceDate,
        remark: remark.trim() || null,
        items: withDiscountLine(
          items.map((item) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity),
            unit_price: Number(item.unitPrice),
          })),
          Number(discount)
        ),
      });
      toast.success(t("toasts.updated"));
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? firstLaravelError(error.body) ?? error.message
          : t("toasts.updateFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const valid =
    invoiceDate &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.description.trim() &&
        !item.description.toLowerCase().includes("discount") &&
        Number(item.quantity) >= 1 &&
        Number(item.unitPrice) >= 0
    ) &&
    Number(discount) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{t("edit.description")}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice-date">{t("detail.invoiceDate")}</Label>
                <Input
                  id="invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-remark">{t("detail.remark")}</Label>
                <Textarea
                  id="invoice-remark"
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder={t("edit.remarkPlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("detail.lineItems")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setItems((current) => [
                      ...current,
                      { key: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "0" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t("edit.addItem")}
                </Button>
              </div>
              {items.map((item) => (
                <div key={item.key} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_90px_160px_36px]">
                  <Input
                    aria-label={t("detail.description")}
                    value={item.description}
                    onChange={(event) => updateItem(item.key, { description: event.target.value })}
                  />
                  <Input
                    aria-label={t("detail.quantity")}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                  />
                  <Input
                    aria-label={t("detail.unitPrice")}
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(event) => updateItem(item.key, { unitPrice: event.target.value })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={items.length === 1}
                    onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-discount">{t("detail.discount")}</Label>
              <Input
                id="invoice-discount"
                type="number"
                min={0}
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("edit.discountHelp")}</p>
            </div>
            <div className="ml-auto w-full max-w-sm space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              {[
                [t("detail.subtotal"), totals.subtotal],
                [t("detail.discount"), totals.discount],
                [t("detail.ppn"), totals.ppn],
                [t("detail.grandTotal"), totals.grandTotal],
              ].map(([label, value], index) => (
                <div key={String(label)} className={`flex justify-between ${index === 3 ? "border-t pt-2 font-semibold" : ""}`}>
                  <span>{label}</span>
                  <span>{money(Number(value))}</span>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">{t("edit.calculationNotice")}</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.cancel")}
          </Button>
          <Button disabled={!valid || saving || loading} onClick={() => void save()}>
            {saving ? tc("actions.saving") : tc("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
