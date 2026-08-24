"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { createAdminContainer, fetchAdminContainerTypes, fetchAdminYards } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function ContainerCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const t = useTranslations("AdminFsdContainers");
  const tc = useTranslations("AdminCommon");
  const [containerNumber, setContainerNumber] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [currentYardId, setCurrentYardId] = useState("");
  const [maxPayloadKg, setMaxPayloadKg] = useState("");
  const [maxCapacityCbm, setMaxCapacityCbm] = useState("");
  const [remark, setRemark] = useState("");
  const [types, setTypes] = useState<{ id: number; label: string }[]>([]);
  const [yards, setYards] = useState<{ id: number; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const typeOptions = useMemo(
    () => types.map((x) => ({ value: String(x.id), label: x.label })),
    [types]
  );

  const yardOptions = useMemo(
    () => [
      { value: "", label: tc("filters.all") },
      ...yards.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [tc, yards]
  );

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      fetchAdminContainerTypes({ perPage: 200 }),
      fetchAdminYards({ perPage: 200, status: "active" }),
    ]).then(([typeRes, yardRes]) => {
      setTypes(((typeRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((row) => ({
        id: Number(row.id),
        label: String(row.name ?? row.code),
      })));
      setYards(((yardRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((row) => ({
        id: Number(row.id),
        label: `${row.code ?? ""} · ${row.name ?? row.id}`.trim(),
      })));
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      setContainerNumber("");
      setContainerTypeId("");
      setManufactureYear("");
      setCurrentYardId("");
      setMaxPayloadKg("");
      setMaxCapacityCbm("");
      setRemark("");
    }
  }, [open]);

  const submit = async () => {
    setSaving(true);
    try {
      await createAdminContainer({
        container_number: containerNumber.trim(),
        container_type_id: Number(containerTypeId),
        manufacture_year: manufactureYear ? Number(manufactureYear) : undefined,
        current_yard_id: currentYardId ? Number(currentYardId) : undefined,
        max_payload_kg: maxPayloadKg ? Number(maxPayloadKg) : undefined,
        max_capacity_cbm: maxCapacityCbm ? Number(maxCapacityCbm) : undefined,
        remark: remark.trim() || undefined,
      });
      toast.success(t("createSuccess"));
      onOpenChange(false);
      onCreated();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addContainer")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>{t("columns.containerNo")}</Label>
            <Input value={containerNumber} onChange={(e) => setContainerNumber(e.target.value)} placeholder="SOLU00001" />
          </div>
          <div className="space-y-2">
            <Label>{t("columns.type")}</Label>
            <SearchableCombobox
              options={typeOptions}
              value={containerTypeId}
              onChange={setContainerTypeId}
              placeholder={t("columns.type")}
              searchPlaceholder={t("searchPlaceholder")}
              aria-label={t("columns.type")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("fields.manufactureYear")}</Label>
              <Input type="number" value={manufactureYear} onChange={(e) => setManufactureYear(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("fields.currentYard")}</Label>
              <SearchableCombobox
                options={yardOptions}
                value={currentYardId}
                onChange={setCurrentYardId}
                placeholder={t("fields.currentYard")}
                searchPlaceholder={t("searchPlaceholder")}
                aria-label={t("fields.currentYard")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("fields.maxPayload")}</Label>
              <Input type="number" value={maxPayloadKg} onChange={(e) => setMaxPayloadKg(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("fields.maxCapacity")}</Label>
              <Input type="number" value={maxCapacityCbm} onChange={(e) => setMaxCapacityCbm(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("fields.remark")}</Label>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("actions.cancel")}</Button>
          <Button disabled={saving || !containerNumber.trim() || !containerTypeId} onClick={() => void submit()}>
            {saving ? tc("actions.saving") : tc("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
