"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAdminVendorPricing, updateAdminPricing, fetchAdminContainerTypes } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { toast } from "sonner";

export type VendorServiceOption = { id: number; label: string; serviceType?: string };

export function VendorPricingDialog({
  open,
  onOpenChange,
  mode = "create",
  row = null,
  vendorServiceOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  row?: Record<string, unknown> | null;
  vendorServiceOptions: VendorServiceOption[];
  onSaved: () => void;
}) {
  const [containerTypes, setContainerTypes] = useState<{ id: number; label: string }[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const [vendorServiceId, setVendorServiceId] = useState("");
  const [containerTypeId, setContainerTypeId] = useState<string>("");
  const [priceType, setPriceType] = useState<"buy" | "sell">("buy");
  const [pricePerKg, setPricePerKg] = useState("");
  const [pricePerCbm, setPricePerCbm] = useState("");
  const [pricePerContainer, setPricePerContainer] = useState("");
  const [minimumCharge, setMinimumCharge] = useState("");
  const [minKg, setMinKg] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && row) {
      setVendorServiceId(String(row.vendor_service_id ?? ""));
      setContainerTypeId(row.container_type_id != null ? String(row.container_type_id) : "");
      setPriceType(row.price_type === "sell" ? "sell" : "buy");
      setPricePerKg(row.price_per_kg != null ? String(row.price_per_kg) : "");
      setPricePerCbm(row.price_per_cbm != null ? String(row.price_per_cbm) : "");
      setPricePerContainer(row.price_per_container != null ? String(row.price_per_container) : "");
      setMinimumCharge(row.minimum_charge != null ? String(row.minimum_charge) : "");
      setMinKg(row.min_kg != null ? String(row.min_kg) : "");
      setEffectiveFrom(row.effective_from ? String(row.effective_from).slice(0, 10) : "");
      setEffectiveTo(row.effective_to ? String(row.effective_to).slice(0, 10) : "");
      setIsActive(row.is_active !== false);
    } else {
      setVendorServiceId(vendorServiceOptions[0] ? String(vendorServiceOptions[0].id) : "");
      setContainerTypeId("");
      setPriceType("buy");
      setPricePerKg("");
      setPricePerCbm("");
      setPricePerContainer("");
      setMinimumCharge("");
      setMinKg("");
      setEffectiveFrom("");
      setEffectiveTo("");
      setIsActive(true);
    }
    let cancelled = false;
    void (async () => {
      setListsLoading(true);
      try {
        const res = await fetchAdminContainerTypes({ perPage: 500 });
        if (cancelled) return;
        const data = (res as LaravelPaginated<Record<string, unknown>>).data ?? [];
        setContainerTypes(
          data.map((r) => ({
            id: Number(r.id),
            label: String(r.name ?? r.code ?? r.id),
          }))
        );
      } catch {
        if (!cancelled) setContainerTypes([]);
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mode, row, vendorServiceOptions]);

  const numOrNull = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    const vsId = Number(vendorServiceId);
    if (!Number.isFinite(vsId)) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        price_type: priceType,
        is_active: isActive,
      };
      const ct = containerTypeId ? Number(containerTypeId) : null;
      body.container_type_id = ct != null && Number.isFinite(ct) ? ct : null;
      const pkg = numOrNull(pricePerKg);
      const pcbm = numOrNull(pricePerCbm);
      const pcont = numOrNull(pricePerContainer);
      const minc = numOrNull(minimumCharge);
      const mkg = numOrNull(minKg);
      if (pkg != null) body.price_per_kg = pkg;
      if (pcbm != null) body.price_per_cbm = pcbm;
      if (pcont != null) body.price_per_container = pcont;
      if (minc != null) body.minimum_charge = minc;
      if (mkg != null) body.min_kg = mkg;
      if (effectiveFrom.trim()) body.effective_from = effectiveFrom.trim();
      if (effectiveTo.trim()) body.effective_to = effectiveTo.trim();

      if (mode === "edit" && row?.id) {
        await updateAdminPricing(Number(row.id), body);
        toast.success("Tarif berhasil diperbarui.");
      } else {
        await createAdminVendorPricing(vsId, body);
        toast.success("Tarif berhasil ditambahkan.");
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      const msg = e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const disabled =
    !vendorServiceId || vendorServiceOptions.length === 0 || saving || listsLoading;

  const selectedVs = vendorServiceOptions.find(o => String(o.id) === vendorServiceId);
  const isFcl = selectedVs?.serviceType?.toUpperCase().includes("FCL");
  const isLcl = selectedVs?.serviceType?.toUpperCase().includes("LCL");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className={DIALOG_CREATE_HEADER_CLASS}>
          <DialogTitle>{mode === "edit" ? "Edit tarif" : "Tambah tarif"}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        ) : null}
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Layanan vendor</Label>
            <Select
              value={vendorServiceId}
              onValueChange={(v) => {
                if (v != null) setVendorServiceId(v);
              }}
              disabled={listsLoading || mode === "edit"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih lane / layanan">
                  {vendorServiceId
                    ? vendorServiceOptions.find((o) => String(o.id) === vendorServiceId)?.label ?? undefined
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {vendorServiceOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipe harga</Label>
            <Select
              value={priceType}
              onValueChange={(v) => {
                if (v === "buy" || v === "sell") setPriceType(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Beli</SelectItem>
                <SelectItem value="sell">Jual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jenis kontainer (opsional)</Label>
            <Select
              value={containerTypeId || "__none__"}
              onValueChange={(v) => {
                if (v == null) return;
                setContainerTypeId(v === "__none__" ? "" : v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua / umum">
                  {containerTypeId
                    ? containerTypes.find((o) => String(o.id) === containerTypeId)?.label ?? containerTypeId
                    : "Semua / umum"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Semua / umum</SelectItem>
                {containerTypes.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {!isFcl && (
              <div className="space-y-2">
                <Label htmlFor="ppkg">Next Tarif (Per kg)</Label>
                <Input
                  id="ppkg"
                  inputMode="decimal"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}
            {!isFcl && (
              <div className="space-y-2">
                <Label htmlFor="pcbm">Per CBM</Label>
                <Input
                  id="pcbm"
                  inputMode="decimal"
                  value={pricePerCbm}
                  onChange={(e) => setPricePerCbm(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {!isLcl && (
              <div className="space-y-2">
                <Label htmlFor="pcont">Harga per kontainer</Label>
                <Input
                  id="pcont"
                  inputMode="decimal"
                  value={pricePerContainer}
                  onChange={(e) => setPricePerContainer(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}
            {!isFcl && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="minkg">Min. Kg Awal</Label>
                  <Input
                    id="minkg"
                    inputMode="numeric"
                    value={minKg}
                    onChange={(e) => setMinKg(e.target.value)}
                    placeholder="Contoh: 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minc">Min. Tarif (Charge awal)</Label>
                  <Input
                    id="minc"
                    inputMode="decimal"
                    value={minimumCharge}
                    onChange={(e) => setMinimumCharge(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="eff-from">Berlaku dari</Label>
              <Input
                id="eff-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eff-to">Berlaku s/d</Label>
              <Input
                id="eff-to"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="p-active" checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
            <Label htmlFor="p-active" className="font-normal cursor-pointer">
              Aktif
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" disabled={disabled} onClick={() => void save()}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
