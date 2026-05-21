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
  fetchAdminCompanies,
  fetchAdminShipments,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { toast } from "sonner";
import { InvoiceItemForm, type ItemLine, newLine } from "./invoice-create-dialog/invoice-item-form";
import { InvoiceMainFields } from "./invoice-create-dialog/invoice-main-fields";

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [shipments, setShipments] = useState<{ id: number; label: string; company_id?: number }[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const [formValues, setFormValues] = useState({
    shipmentId: "",
    companyId: "",
    issuedDate: "",
    dueDate: "",
    notes: "",
  });
  const [items, setItems] = useState<ItemLine[]>([newLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFormValues({
      shipmentId: "",
      companyId: "",
      issuedDate: "",
      dueDate: "",
      notes: "",
    });
    setItems([newLine()]);
    let cancelled = false;
    void (async () => {
      setListsLoading(true);
      try {
        const [shipRes, compRes] = await Promise.all([
          fetchAdminShipments({ perPage: 200 }),
          fetchAdminCompanies({ perPage: 500 }),
        ]);
        if (cancelled) return;
        const shipData = (shipRes as LaravelPaginated<Record<string, unknown>>).data ?? [];
        const compData = (compRes as LaravelPaginated<Record<string, unknown>>).data ?? [];
        setShipments(
          shipData.map((r) => ({
            id: Number(r.id),
            label: String(r.waybill_number ?? r.shipment_number ?? r.id ?? ""),
            company_id: r.company_id != null ? Number(r.company_id) : undefined,
          }))
        );
        setCompanies(
          compData.map((r) => ({
            id: Number(r.id),
            name: String(r.name ?? r.id),
          }))
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
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        shipment_id: Number(formValues.shipmentId),
        company_id: Number(formValues.companyId),
        issued_date: formValues.issuedDate,
        due_date: formValues.dueDate,
        notes: formValues.notes.trim() || null,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      };
      await createAdminInvoice(body);
      toast.success("Invoice berhasil dibuat.");
      onOpenChange(false);
      onCreated();
    } catch (e) {
      const msg = e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : "Gagal membuat invoice.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const validItems = items.every(
    (it) => it.description.trim().length > 0 && Number(it.quantity) >= 1 && Number(it.unit_price) >= 0
  );

  const disabled =
    !formValues.shipmentId ||
    !formValues.companyId ||
    !formValues.issuedDate ||
    !formValues.dueDate ||
    !validItems ||
    saving ||
    listsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className={DIALOG_CREATE_HEADER_CLASS}>
          <DialogTitle>Buat Invoice Baru</DialogTitle>
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

          <InvoiceItemForm items={items} onItemsChange={setItems} />
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" disabled={disabled} onClick={() => void save()}>
            {saving ? "Menyimpan…" : "Buat Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
