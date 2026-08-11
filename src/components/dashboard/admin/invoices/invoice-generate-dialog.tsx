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
import { Checkbox } from "@/components/ui/checkbox";
import { createAdminInvoice, fetchAdminEligibleShipments } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type EligibleRow = Record<string, unknown>;

export function InvoiceGenerateDialog({
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

  const [rows, setRows] = useState<EligibleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setLoading(true);
    void fetchAdminEligibleShipments({ perPage: 100 })
      .then((res) => setRows((res as LaravelPaginated<EligibleRow>).data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generate = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      for (const shipId of selected) {
        const row = rows.find((r) => Number(r.id) === shipId);
        if (!row) continue;
        const companyId = Number(row.company_id ?? (row.company as { id?: number })?.id);
        const amount = Number(row.total_amount ?? row.estimated_amount ?? 8000000);
        await createAdminInvoice({
          shipment_id: shipId,
          company_id: companyId,
          status: "draft",
          items: [
            { description: "Rail Freight", quantity: 1, unit_price: amount * 0.85 },
            { description: "Pickup", quantity: 1, unit_price: amount * 0.075 },
            { description: "Delivery", quantity: 1, unit_price: amount * 0.075 },
          ],
        });
      }
      toast.success(t("generateDialog.success", { count: selected.size }));
      onOpenChange(false);
      onCreated();
    } catch (e) {
      toast.error(e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : t("generateDialog.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("generateDialog.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("generateDialog.description")}</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("generateDialog.loading")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t("generateDialog.columns.shipmentNo")}</TableHead>
                  <TableHead>{t("generateDialog.columns.cnNo")}</TableHead>
                  <TableHead>{t("generateDialog.columns.customer")}</TableHead>
                  <TableHead>{t("generateDialog.columns.service")}</TableHead>
                  <TableHead>{t("generateDialog.columns.completed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      {t("generateDialog.noEligible")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const id = Number(row.id);
                    const company = row.company as { name?: string } | undefined;
                    const service = row.service_type as { name?: string } | undefined;
                    return (
                      <TableRow key={id}>
                        <TableCell>
                          <Checkbox checked={selected.has(id)} onCheckedChange={() => toggle(id)} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{String(row.shipment_number ?? "—")}</TableCell>
                        <TableCell className="font-mono text-xs">{String(row.waybill_number ?? "—")}</TableCell>
                        <TableCell>{company?.name ?? "—"}</TableCell>
                        <TableCell>{service?.name ?? "—"}</TableCell>
                        <TableCell>{row.updated_at ? String(row.updated_at).slice(0, 10) : "—"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.cancel")}
          </Button>
          <Button disabled={saving || selected.size === 0} onClick={() => void generate()}>
            {saving ? tc("actions.generating") : t("generateInvoice")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
