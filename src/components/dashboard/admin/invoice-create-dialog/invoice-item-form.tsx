"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { calculateAdminInvoiceTotals } from "@/lib/admin-invoice-calculation";

export type ItemLine = { key: string; description: string; quantity: string; unit_price: string };

export function newLine(): ItemLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: "",
    quantity: "1",
    unit_price: "0",
  };
}

interface InvoiceItemFormProps {
  items: ItemLine[];
  onItemsChange: (items: ItemLine[]) => void;
  discount: string;
  onDiscountChange: (discount: string) => void;
  taxRate: number;
}

const money = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export function InvoiceItemForm({
  items,
  onItemsChange,
  discount,
  onDiscountChange,
  taxRate,
}: InvoiceItemFormProps) {
  const t = useTranslations("AdminInvoices");
  const totals = calculateAdminInvoiceTotals(
    [
      ...items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      })),
      ...(Number(discount) > 0
        ? [{ description: "Discount", quantity: 1, unit_price: -Number(discount) }]
        : []),
    ],
    taxRate
  );
  const addItem = () => onItemsChange([...items, newLine()]);
  
  const removeItem = (key: string) => {
    if (items.length > 1) {
      onItemsChange(items.filter((it) => it.key !== key));
    }
  };

  const updateItem = (key: string, patch: Partial<ItemLine>) => {
    onItemsChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold">{t("detail.lineItems")}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          onClick={addItem}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t("edit.addItem")}
        </Button>
      </div>
      <div className="space-y-3 rounded-md border p-3 bg-zinc-50/30">
        {items.map((it, idx) => (
          <div key={it.key} className="grid gap-3 border-b pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight">{t("create.item", { number: idx + 1 })}</span>
              {items.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(it.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Input
              placeholder={t("create.descriptionPlaceholder")}
              value={it.description}
              onChange={(e) => updateItem(it.key, { description: e.target.value })}
              className="bg-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground ml-1">{t("detail.quantity")}</Label>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder={t("detail.quantity")}
                  value={it.quantity}
                  onChange={(e) => updateItem(it.key, { quantity: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground ml-1">{t("detail.unitPrice")}</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder={t("detail.unitPrice")}
                  value={it.unit_price}
                  onChange={(e) => updateItem(it.key, { unit_price: e.target.value })}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-invoice-discount">{t("detail.discount")}</Label>
        <Input
          id="manual-invoice-discount"
          type="number"
          min={0}
          value={discount}
          onChange={(event) => onDiscountChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("create.discountHelp")}</p>
      </div>
      <div className="ml-auto w-full max-w-sm space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
        {[
          [t("detail.subtotal"), totals.subtotal],
          [t("detail.discount"), totals.discount],
          [t("detail.ppn"), totals.ppn],
          [t("detail.grandTotal"), totals.grandTotal],
        ].map(([label, value], index) => (
          <div
            key={String(label)}
            className={`flex justify-between ${index === 3 ? "border-t pt-2 font-semibold" : ""}`}
          >
            <span>{label}</span>
            <span>{money(Number(value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
