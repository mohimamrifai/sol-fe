"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableCombobox } from "@/components/searchable-combobox";
import {
  CONTAINER_SERVICE_CATEGORIES,
  PRICING_BASIS_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  TRUCKING_SERVICE_CATEGORIES,
  VEHICLE_TYPE_OPTIONS,
  pricingBasisLabel,
  serviceCategoryLabel,
  vehicleTypeLabel,
} from "@/lib/vendor-fsd-options";
import { createAdminPricing, fetchAdminContainerTypes, fetchAdminLocations, fetchAdminVendors } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";

export function VendorPricingCreateDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; label: string }[]>([]);
  const [containerTypes, setContainerTypes] = useState<{ id: number; label: string }[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [vendorId, setVendorId] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [pricingBasis, setPricingBasis] = useState("per_trip");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [minimumCharge, setMinimumCharge] = useState("");
  const [remark, setRemark] = useState("");
  const [deactivateExisting, setDeactivateExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showVehicle = TRUCKING_SERVICE_CATEGORIES.includes(serviceCategory);
  const showContainer = CONTAINER_SERVICE_CATEGORIES.includes(serviceCategory);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setVendorId("");
    setServiceCategory("");
    setPricingBasis("per_trip");
    setOriginId("");
    setDestinationId("");
    setVehicleType("");
    setContainerTypeId("");
    setUnitPrice("");
    setMinimumCharge("");
    setRemark("");
    setDeactivateExisting(false);

    let cancelled = false;
    void (async () => {
      setLoadingLists(true);
      try {
        const [vRes, lRes, cRes] = await Promise.all([
          fetchAdminVendors({ perPage: 500 }),
          fetchAdminLocations({ perPage: 500 }),
          fetchAdminContainerTypes({ perPage: 500 }),
        ]);
        if (cancelled) return;
        setVendors(((vRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((v) => ({
          id: Number(v.id),
          label: String(v.name ?? v.code ?? v.id),
        })));
        setLocations(((lRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((l) => ({
          id: Number(l.id),
          label: `${l.code ?? ""} · ${l.name ?? l.id}`.trim(),
        })));
        setContainerTypes(((cRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((c) => ({
          id: Number(c.id),
          label: [c.name, c.size].filter(Boolean).join(" · ") || String(c.id),
        })));
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const canSave = useMemo(() => {
    if (!vendorId || !serviceCategory || !originId || !destinationId || !unitPrice.trim()) return false;
    if (showVehicle && !vehicleType) return false;
    if (showContainer && !containerTypeId) return false;
    return true;
  }, [vendorId, serviceCategory, originId, destinationId, unitPrice, showVehicle, vehicleType, showContainer, containerTypeId]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createAdminPricing({
        vendor_id: Number(vendorId),
        service_category: serviceCategory,
        pricing_basis: pricingBasis,
        origin_location_id: Number(originId),
        destination_location_id: Number(destinationId),
        vehicle_type: showVehicle ? vehicleType : null,
        container_type_id: showContainer ? Number(containerTypeId) : null,
        unit_price: Number(unitPrice),
        minimum_charge: minimumCharge.trim() ? Number(minimumCharge) : null,
        remark: remark.trim() || null,
        deactivate_existing: deactivateExisting,
      });
      toast.success("Pricing berhasil dibuat.");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Pricing</DialogTitle>
        </DialogHeader>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Vendor</Label>
            <SearchableCombobox
              options={vendors.map((v) => ({ value: String(v.id), label: v.label }))}
              value={vendorId}
              onChange={setVendorId}
              placeholder="Pilih vendor"
              disabled={loadingLists}
            />
          </div>
          <div className="space-y-2">
            <Label>Service Category</Label>
            <Select value={serviceCategory} onValueChange={(v) => v && setServiceCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori">
                  {serviceCategory ? serviceCategoryLabel(serviceCategory) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pricing Basis</Label>
            <Select value={pricingBasis} onValueChange={(v) => v && setPricingBasis(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih basis">
                  {pricingBasis ? pricingBasisLabel(pricingBasis) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRICING_BASIS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Origin</Label>
              <SearchableCombobox
                options={locations.map((l) => ({ value: String(l.id), label: l.label }))}
                value={originId}
                onChange={setOriginId}
                placeholder="Origin"
                disabled={loadingLists}
              />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <SearchableCombobox
                options={locations.map((l) => ({ value: String(l.id), label: l.label }))}
                value={destinationId}
                onChange={setDestinationId}
                placeholder="Destination"
                disabled={loadingLists}
              />
            </div>
          </div>
          {showVehicle ? (
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={(v) => v && setVehicleType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih vehicle">
                    {vehicleType ? vehicleTypeLabel(vehicleType) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {showContainer ? (
            <div className="space-y-2">
              <Label>Container Type</Label>
              <Select value={containerTypeId} onValueChange={(v) => v && setContainerTypeId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih container">
                    {containerTypeId
                      ? containerTypes.find((o) => String(o.id) === containerTypeId)?.label ?? containerTypeId
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {containerTypes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Unit Price (IDR)</Label>
              <Input inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Minimum Charge</Label>
              <Input inputMode="decimal" value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Remark</Label>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox checked={deactivateExisting} onCheckedChange={(c) => setDeactivateExisting(c === true)} />
            Nonaktifkan pricing aktif dengan kombinasi yang sama jika sudah ada
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="button" disabled={!canSave || saving || loadingLists} onClick={() => void save()}>
            {saving ? "Menyimpan…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
