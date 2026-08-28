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
import { generateAdminInvoiceFromShipment, fetchAdminEligibleShipments } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type EligibleRow = Record<string, unknown>;

function fmtIdr(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

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
        await generateAdminInvoiceFromShipment(shipId);
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
                  <TableHead className="w-10">{t("generateDialog.columns.select")}</TableHead>
                  <TableHead>{t("generateDialog.columns.shipmentNo")}</TableHead>
                  <TableHead>{t("generateDialog.columns.cnNo")}</TableHead>
                  <TableHead>{t("generateDialog.columns.customer")}</TableHead>
                  <TableHead>{t("generateDialog.columns.service")}</TableHead>
                  <TableHead>{t("generateDialog.columns.completed")}</TableHead>
                  <TableHead className="text-right">{t("generateDialog.columns.amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
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
                        <TableCell>
                          {row.completion_date
                            ? String(row.completion_date).slice(0, 10)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{fmtIdr(row.estimated_amount)}</TableCell>
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
