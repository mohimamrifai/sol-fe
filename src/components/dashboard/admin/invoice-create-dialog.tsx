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
  createAdminInvoice,
  fetchAdminEligibleShipments,
  fetchAdminSystemSettings,
  previewAdminInvoiceLineItems,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { toast } from "sonner";
import { InvoiceItemForm, type ItemLine, newLine } from "./invoice-create-dialog/invoice-item-form";
import { InvoiceMainFields } from "./invoice-create-dialog/invoice-main-fields";
import { useTranslations } from "next-intl";
import { withDiscountLine } from "@/lib/admin-invoice-calculation";

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const t = useTranslations("AdminInvoices");
  const tc = useTranslations("AdminCommon");
  const [shipments, setShipments] = useState<{ id: number; label: string; company_id?: number }[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const [formValues, setFormValues] = useState({
    shipmentId: "",
    companyId: "",
    invoiceDate: "",
    notes: "",
  });
  const [items, setItems] = useState<ItemLine[]>([newLine()]);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState(0.11);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFormValues({
      shipmentId: "",
      companyId: "",
      invoiceDate: "",
      notes: "",
    });
    setItems([newLine()]);
    setDiscount("0");
    void fetchAdminSystemSettings()
      .then((response) => {
        const percent = Number(response.data.values.default_tax_rate);
        if (Number.isFinite(percent)) setTaxRate(Math.max(0, percent / 100));
      })
      .catch(() => undefined);
    let cancelled = false;
    void (async () => {
      setListsLoading(true);
      try {
        const shipRes = await fetchAdminEligibleShipments({ perPage: 200 });
        if (cancelled) return;
        const shipData = (shipRes as LaravelPaginated<Record<string, unknown>>).data ?? [];
        setShipments(
          shipData.map((r) => ({
            id: Number(r.id),
            label: String(r.waybill_number ?? r.shipment_number ?? r.id ?? ""),
            company_id: r.company_id != null ? Number(r.company_id) : undefined,
          }))
        );
        setCompanies(
          Array.from(
            new Map(
              shipData.map((r) => {
                const company = r.company as { id?: number; name?: string } | undefined;
                return [Number(company?.id ?? r.company_id), {
                  id: Number(company?.id ?? r.company_id),
                  name: String(company?.name ?? "—"),
                }];
              })
            ).values()
          )
        );
      } catch {
        if (!cancelled) {
          setShipments([]);
          setCompanies([]);
        }
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const updateField = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const onShipmentPick = (value: string) => {
    updateField("shipmentId", value);
    const row = shipments.find((s) => String(s.id) === value);
    if (row?.company_id != null && Number.isFinite(row.company_id)) {
      updateField("companyId", String(row.company_id));
    }
    void previewAdminInvoiceLineItems(Number(value))
      .then((response) => {
        const subtotal = Number(response.data.subtotal);
        const tax = Number(response.data.tax_amount);
        if (subtotal > 0 && Number.isFinite(tax)) {
          setTaxRate(Math.max(0, tax / subtotal));
        }
      })
      .catch(() => undefined);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        shipment_id: Number(formValues.shipmentId),
        company_id: Number(formValues.companyId),
        invoice_date: formValues.invoiceDate,
        remark: formValues.notes.trim() || null,
        items: withDiscountLine(
          items.map((it) => ({
            description: it.description.trim(),
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
          })),
          Number(discount)
        ),
      };
      await createAdminInvoice(body);
      toast.success(t("toasts.created"));
      onOpenChange(false);
      onCreated();
    } catch (e) {
      const msg = e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : t("toasts.createFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const validItems = items.every(
    (it) =>
      it.description.trim().length > 0 &&
      !it.description.toLowerCase().includes("discount") &&
      Number(it.quantity) >= 1 &&
      Number(it.unit_price) >= 0
  );

  const disabled =
    !formValues.shipmentId ||
    !formValues.companyId ||
    !formValues.invoiceDate ||
    Number(discount) < 0 ||
    !validItems ||
    saving ||
    listsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className={DIALOG_CREATE_HEADER_CLASS}>
          <DialogTitle>{t("create.title")}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-6 pt-2">
          <InvoiceMainFields
            shipments={shipments}
            companies={companies}
            listsLoading={listsLoading}
            values={formValues}
            onChange={updateField}
            onShipmentPick={onShipmentPick}
          />

          <InvoiceItemForm
            items={items}
            onItemsChange={setItems}
            discount={discount}
            onDiscountChange={setDiscount}
            taxRate={taxRate}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.cancel")}
          </Button>
          <Button type="button" disabled={disabled} onClick={() => void save()}>
            {saving ? tc("actions.saving") : t("create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
