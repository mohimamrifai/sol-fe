"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { LaravelPaginated } from "@/lib/types-api";
import {
  fetchPublicMasterAdditionalServices,
  fetchPublicMasterCargoCategories,
  fetchPublicMasterContainerTypes,
  fetchPublicMasterDgClasses,
  fetchPublicMasterLocations,
  fetchPublicMasterServiceTypes,
  fetchPublicMasterTransportModes,
} from "@/lib/public-api";
import { ApiError } from "@/lib/api-client";
import type { BookingDetail } from "./types";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Package, Truck, Wrench, Settings } from "lucide-react";
import { DangerousGoodsSection } from "@/components/dashboard/admin/bookings/create/dangerous-goods-section";
import { ShipperConsigneeSection } from "@/components/dashboard/admin/bookings/create/shipper-consignee-section";

type Loc = { id: number; name: string; code?: string };
type TM = { id: number; name: string; code?: string };
type ST = { id: number; name: string; code?: string; transport_mode_id: number };
type CT = { id: number; name: string; size: string };
type AS = { id: number; name: string; category: string; code?: string | null };
type DC = { id: number; name: string; code: string };
type CC = {
  id: number;
  name: string;
  code: string;
  requires_temperature?: boolean;
  is_project_cargo?: boolean;
};
type ComboOption = { value: string; label: string };

const FCL_MANDATORY_CODES = ["FREE_STORAGE_FCL", "LOLO", "CONTAINER_RENT"];
const LCL_MANDATORY_CODES = ["FREE_STORAGE_LCL"];

const CATEGORIES = [
  { key: "pickup", label: "Pickup", icon: Truck },
  { key: "packing", label: "Packing", icon: Package },
  { key: "handling", label: "Handling", icon: Wrench },
  { key: "other", label: "Lainnya", icon: Settings },
];

interface BookingEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BookingDetail | null;
  loading?: boolean;
  saving: boolean;
  onSave: (payload: FormData) => void | Promise<void>;
}

export function BookingEditDialog({
  open,
  onOpenChange,
  data,
  loading = false,
  saving,
  onSave,
}: BookingEditDialogProps) {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [modes, setModes] = useState<TM[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ST[]>([]);
  const [containerTypes, setContainerTypes] = useState<CT[]>([]);
  const [addServices, setAddServices] = useState<AS[]>([]);
  const [cargoCats, setCargoCats] = useState<CC[]>([]);
  const [dgClasses, setDgClasses] = useState<DC[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [modeId, setModeId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [containerCount, setContainerCount] = useState("1");
  const [weight, setWeight] = useState("");
  const [cbm, setCbm] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargoCategoryId, setCargoCategoryId] = useState("");
  const [shipper, setShipper] = useState({ name: "", address: "", phone: "" });
  const [consignee, setConsignee] = useState({ name: "", address: "", phone: "" });
  const [isDg, setIsDg] = useState(false);
  const [dgClassId, setDgClassId] = useState("");
  const [unNumber, setUnNumber] = useState("");
  const [msdsFile, setMsdsFile] = useState<File | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [equipmentCondition, setEquipmentCondition] = useState("");
  const [temperature, setTemperature] = useState("");
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemHeight, setItemHeight] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingMasters(true);
      setLoadError(null);
      try {
        const [locRes, mRes, ctRes, asRes, ccRes, dgRes] = await Promise.all([
          fetchPublicMasterLocations(),
          fetchPublicMasterTransportModes(),
          fetchPublicMasterContainerTypes(),
          fetchPublicMasterAdditionalServices(),
          fetchPublicMasterCargoCategories(),
          fetchPublicMasterDgClasses(),
        ]);
        if (cancelled) return;
        setLocations(((locRes as LaravelPaginated<Loc>).data ?? []) as Loc[]);
        setModes(((mRes as LaravelPaginated<TM>).data ?? []) as TM[]);
        setContainerTypes(((ctRes as LaravelPaginated<CT>).data ?? []) as CT[]);
        setAddServices(((asRes as LaravelPaginated<AS>).data ?? []) as AS[]);
        setCargoCats(((ccRes as LaravelPaginated<CC>).data ?? []) as CC[]);
        setDgClasses(((dgRes as LaravelPaginated<DC>).data ?? []) as DC[]);
      } catch (e) {
        setLoadError(e instanceof ApiError ? e.message : "Gagal memuat master data.");
      } finally {
        if (!cancelled) setLoadingMasters(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !data) return;
    setOriginId(data.origin_location_id ? String(data.origin_location_id) : (data.originLocation?.id ? String(data.originLocation.id) : (data.origin_location?.id ? String(data.origin_location.id) : "")));
    setDestId(data.destination_location_id ? String(data.destination_location_id) : (data.destinationLocation?.id ? String(data.destinationLocation.id) : (data.destination_location?.id ? String(data.destination_location.id) : "")));
    setModeId(data.transport_mode_id ? String(data.transport_mode_id) : (data.transportMode?.id ? String(data.transportMode.id) : (data.transport_mode?.id ? String(data.transport_mode.id) : "")));
    setServiceTypeId(data.service_type_id ? String(data.service_type_id) : (data.serviceType?.id ? String(data.serviceType.id) : (data.service_type?.id ? String(data.service_type.id) : "")));
    setContainerTypeId(data.container_type_id ? String(data.container_type_id) : (data.containerType?.id ? String(data.containerType.id) : (data.container_type?.id ? String(data.container_type.id) : "")));
    setContainerCount(String(data.container_count ?? 1));
    setWeight(data.estimated_weight ? String(data.estimated_weight) : "");
    setCbm(data.estimated_cbm ? String(data.estimated_cbm) : "");
    setItemLength(data.length ? String(data.length) : "");
    setItemWidth(data.width ? String(data.width) : "");
    setItemHeight(data.height ? String(data.height) : "");
    setDepartureDate(data.departure_date ? String(data.departure_date).slice(0, 10) : "");
    setCargo(data.cargo_description ?? "");
    setCargoCategoryId(data.cargo_category_id ? String(data.cargo_category_id) : (data.cargoCategory?.id ? String(data.cargoCategory.id) : (data.cargo_category?.id ? String(data.cargo_category.id) : "")));
    setShipper({
      name: data.shipper_name ?? "",
      address: data.shipper_address ?? "",
      phone: data.shipper_phone ?? "",
    });
    setConsignee({
      name: data.consignee_name ?? "",
      address: data.consignee_address ?? "",
      phone: data.consignee_phone ?? "",
    });
    setIsDg(Boolean(data.is_dangerous_goods));
    setDgClassId(data.dg_class_id ? String(data.dg_class_id) : (data.dgClass?.id ? String(data.dgClass.id) : (data.dg_class?.id ? String(data.dg_class.id) : "")));
    setUnNumber(data.un_number ?? "");
    setEquipmentCondition(data.equipment_condition ?? "");
    setTemperature(data.temperature != null ? String(data.temperature) : "");
    setSelectedAddOns((data.additional_services ?? []).map((s) => Number(s.id)).filter(Boolean));
    setMsdsFile(null);
    setValidationErrors(null);
  }, [open, data]);

  useEffect(() => {
    if (!open || !modeId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchPublicMasterServiceTypes(Number(modeId));
        if (cancelled) return;
        const rows = ((r as { data: ST[] }).data ?? []) as ST[];
        setServiceTypes(rows);
      } catch {
        if (!cancelled) setServiceTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, modeId]);

  const selectedService = serviceTypes.find((s) => String(s.id) === serviceTypeId);
  const isLCL = selectedService?.code === "LCL";
  const isFCL = selectedService?.code === "FCL";
  const selectedCargoCategory = cargoCats.find((c) => String(c.id) === cargoCategoryId);
  const selectedCT = containerTypes.find((c) => String(c.id) === containerTypeId);
  const showTemp = selectedCargoCategory?.requires_temperature;
  const showProject = selectedCargoCategory?.is_project_cargo;

  const locationOptions: ComboOption[] = locations.map((l) => ({
    value: String(l.id),
    label: `${l.name}${l.code ? ` (${l.code})` : ""}`,
  }));
  const modeOptions: ComboOption[] = modes.map((m) => ({
    value: String(m.id),
    label: `${m.name}${m.code ? ` (${m.code})` : ""}`,
  }));
  const serviceOptions: ComboOption[] = serviceTypes.map((s) => ({
    value: String(s.id),
    label: `${s.name}${s.code ? ` (${s.code})` : ""}`,
  }));
  const containerOptions: ComboOption[] = [
    { value: "__none__", label: "—" },
    ...containerTypes.map((c) => ({ value: String(c.id), label: `${c.name} (${c.size})` })),
  ];
  const cargoCategoryOptions: ComboOption[] = cargoCats.map((c) => ({ value: String(c.id), label: c.name }));

  // Sync isDg
  useEffect(() => {
    if (cargoCategoryOptions.length > 0) {
      const selectedCat = cargoCats.find((c) => String(c.id) === cargoCategoryId);
      if (selectedCat?.code === "DG" || equipmentCondition === "RESIDUAL") {
        setIsDg(true);
      } else {
        setIsDg(false);
      }
    }
  }, [cargoCategoryId, equipmentCondition, cargoCats, cargoCategoryOptions.length]);

  // Sync mandatory add-ons
  useEffect(() => {
    if (addServices.length > 0 && serviceTypeId) {
      const codes = isFCL ? FCL_MANDATORY_CODES : isLCL ? LCL_MANDATORY_CODES : [];
      const mandatoryIds = addServices
        .filter((s) => s.code != null && codes.includes(s.code))
        .map((s) => s.id);
      setSelectedAddOns((prev) => {
        const others = prev.filter(
          (id) =>
            ![...FCL_MANDATORY_CODES, ...LCL_MANDATORY_CODES].includes(
              addServices.find((s) => s.id === id)?.code ?? ""
            )
        );
        return Array.from(new Set([...others, ...mandatoryIds]));
      });
    }
  }, [serviceTypeId, addServices, isFCL, isLCL]);

  const renderError = (field: string) => {
    const msgs = validationErrors?.[field];
    if (!msgs?.length) return null;
    return <p className="mt-1 text-[11px] font-medium text-red-500">{msgs[0]}</p>;
  };

  const submit = async () => {
    setValidationErrors(null);
    const fd = new FormData();
    fd.append("origin_location_id", originId);
    fd.append("destination_location_id", destId);
    fd.append("transport_mode_id", modeId);
    fd.append("service_type_id", serviceTypeId);
    if (!isLCL && containerTypeId) fd.append("container_type_id", containerTypeId);
    if (!isLCL) fd.append("container_count", containerCount || "1");
    if (weight) fd.append("estimated_weight", weight);
    if (cbm) fd.append("estimated_cbm", cbm);
    if (isLCL && itemLength) fd.append("length", itemLength);
    if (isLCL && itemWidth) fd.append("width", itemWidth);
    if (isLCL && itemHeight) fd.append("height", itemHeight);
    fd.append("cargo_category_id", cargoCategoryId);
    if (departureDate) fd.append("departure_date", departureDate);
    if (cargo) fd.append("cargo_description", cargo);
    fd.append("shipper_name", shipper.name);
    fd.append("shipper_address", shipper.address);
    fd.append("shipper_phone", shipper.phone);
    fd.append("consignee_name", consignee.name);
    fd.append("consignee_address", consignee.address);
    fd.append("consignee_phone", consignee.phone);
    fd.append("is_dangerous_goods", isDg ? "1" : "0");
    if (isDg && dgClassId) fd.append("dg_class_id", dgClassId);
    if (isDg && unNumber) fd.append("un_number", unNumber);
    if (isDg && msdsFile) fd.append("msds_file", msdsFile);
    if (showProject && equipmentCondition) fd.append("equipment_condition", equipmentCondition);
    if (showTemp && temperature) fd.append("temperature", temperature);
    fd.append("additional_services", JSON.stringify(selectedAddOns.map((id) => ({ id }))));
    
    // Add Laravel's method spoofing
    fd.append("_method", "PUT");

    try {
      await onSave(fd);
      onOpenChange(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        const body = e.body as { errors?: Record<string, string[]> };
        setValidationErrors(body.errors ?? null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl p-0 gap-0">
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl">Edit Booking</DialogTitle>
            <DialogDescription>
              Ubah detail booking untuk <span className="font-mono">{data?.booking_number ?? "booking"}</span>.
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 py-6 bg-zinc-50/30">
          {loadError ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{loadError}</p> : null}
          
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Memuat detail booking…</p>
          ) : loadingMasters ? (
            <p className="text-sm text-muted-foreground text-center py-8">Memuat form edit…</p>
          ) : (
            <div className="space-y-8">
              {/* Section 1: Route & Service */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">Rute & Layanan</h3>
                <div className="grid gap-5 sm:grid-cols-2 bg-white p-5 rounded-xl border shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Origin</Label>
                    <Combobox items={locationOptions} value={locationOptions.find((x) => x.value === originId) ?? null} onValueChange={(next) => setOriginId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.origin_location_id && "[&_input]:border-red-500")} placeholder="Pilih origin..." />
                      <ComboboxContent><ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("origin_location_id")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Destination</Label>
                    <Combobox items={locationOptions} value={locationOptions.find((x) => x.value === destId) ?? null} onValueChange={(next) => setDestId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.destination_location_id && "[&_input]:border-red-500")} placeholder="Pilih destination..." />
                      <ComboboxContent><ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("destination_location_id")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Transport mode</Label>
                    <Combobox items={modeOptions} value={modeOptions.find((x) => x.value === modeId) ?? null} onValueChange={(next) => setModeId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.transport_mode_id && "[&_input]:border-red-500")} placeholder="Pilih moda..." />
                      <ComboboxContent><ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("transport_mode_id")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Service type</Label>
                    <Combobox items={serviceOptions} value={serviceOptions.find((x) => x.value === serviceTypeId) ?? null} onValueChange={(next) => setServiceTypeId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.service_type_id && "[&_input]:border-red-500")} placeholder="Pilih layanan..." />
                      <ComboboxContent><ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("service_type_id")}
                  </div>
                </div>
              </div>

              {/* Section 2: Parties */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">Informasi Pihak Terkait</h3>
                <ShipperConsigneeSection
                  shipper={shipper}
                  onShipperChange={(fields) => setShipper((prev) => ({ ...prev, ...fields }))}
                  consignee={consignee}
                  onConsigneeChange={(fields) => setConsignee((prev) => ({ ...prev, ...fields }))}
                  renderError={renderError}
                  validationErrors={validationErrors ?? undefined}
                />
              </div>

              {/* Section 3: Cargo Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">Detail Kargo & Pengiriman</h3>
                <div className="grid gap-5 sm:grid-cols-2 bg-white p-5 rounded-xl border shadow-sm">
                  {!isLCL ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Container type {isFCL && <span className="text-red-500">*</span>}</Label>
                        <Combobox items={containerOptions} value={containerOptions.find((x) => x.value === (containerTypeId || "__none__")) ?? null} onValueChange={(next) => setContainerTypeId(next?.value && next.value !== "__none__" ? next.value : "")}>
                          <ComboboxInput className="w-full h-10 bg-zinc-50/50" placeholder="Pilih tipe kontainer..." />
                          <ComboboxContent><ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                        </Combobox>
                        {renderError("container_type_id")}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Jumlah kontainer</Label>
                        <Input type="number" min={1} value={containerCount} onChange={(e) => setContainerCount(e.target.value.replace(/\D/g, ""))} className={cn("h-10 bg-zinc-50/50", validationErrors?.container_count && "border-red-500")} />
                        {renderError("container_count")}
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3 bg-zinc-50/50 p-4 rounded-lg border border-dashed">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Panjang (cm)</Label>
                        <Input type="number" value={itemLength} onChange={(e) => {
                          setItemLength(e.target.value);
                          const l = Number(e.target.value) || 0;
                          const w = Number(itemWidth) || 0;
                          const h = Number(itemHeight) || 0;
                          if (l && w && h) setCbm(String((l * w * h) / 1000000));
                        }} placeholder="cm" className="h-10 bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Lebar (cm)</Label>
                        <Input type="number" value={itemWidth} onChange={(e) => {
                          setItemWidth(e.target.value);
                          const l = Number(itemLength) || 0;
                          const w = Number(e.target.value) || 0;
                          const h = Number(itemHeight) || 0;
                          if (l && w && h) setCbm(String((l * w * h) / 1000000));
                        }} placeholder="cm" className="h-10 bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Tinggi (cm)</Label>
                        <Input type="number" value={itemHeight} onChange={(e) => {
                          setItemHeight(e.target.value);
                          const l = Number(itemLength) || 0;
                          const w = Number(itemWidth) || 0;
                          const h = Number(e.target.value) || 0;
                          if (l && w && h) setCbm(String((l * w * h) / 1000000));
                        }} placeholder="cm" className="h-10 bg-white" />
                      </div>
                      <p className="sm:col-span-3 text-[10px] text-muted-foreground ml-1">* Dimensi digunakan untuk menghitung CBM secara otomatis.</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Berat Estimasi (kg)</Label>
                    <Input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={!isLCL && !!selectedCT} className={cn("h-10 bg-zinc-50/50", !isLCL && selectedCT && "bg-zinc-100 italic", validationErrors?.estimated_weight && "border-red-500")} />
                    {renderError("estimated_weight")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">CBM Estimasi</Label>
                    <Input type="number" step="0.01" value={cbm} onChange={(e) => setCbm(e.target.value)} disabled={!!selectedCT || isLCL} className={cn("h-10 bg-zinc-50/50", (selectedCT || isLCL) && "bg-zinc-100 italic", validationErrors?.estimated_cbm && "border-red-500")} />
                    {renderError("estimated_cbm")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Tanggal keberangkatan</Label>
                    <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="h-10 bg-zinc-50/50" />
                    {renderError("departure_date")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Kategori Kargo</Label>
                    <Combobox items={cargoCategoryOptions} value={cargoCategoryOptions.find((x) => x.value === cargoCategoryId) ?? null} onValueChange={(next) => setCargoCategoryId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.cargo_category_id && "[&_input]:border-red-500")} placeholder="Pilih kategori..." />
                      <ComboboxContent><ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("cargo_category_id")}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      <span>Deskripsi barang</span>
                      <span className={selectedCargoCategory?.code === "MIX" ? "text-[10px] text-red-500 font-bold" : "text-[10px] text-zinc-400 normal-case"}>
                        {selectedCargoCategory?.code === "MIX" ? "(Wajib untuk Mixed Cargo)" : "(Opsional)"}
                      </span>
                    </Label>
                    <Textarea value={cargo} onChange={(e) => setCargo(e.target.value)} className={cn("min-h-[84px] bg-zinc-50/50", validationErrors?.cargo_description && "border-red-500")} required={selectedCargoCategory?.code === "MIX"} />
                    {renderError("cargo_description")}
                  </div>

                  {showProject ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Kondisi Mesin / Unit <span className="text-red-500">*</span></Label>
                      <select
                        className={cn("flex h-10 w-full rounded-md border border-input bg-zinc-50/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", validationErrors?.equipment_condition && "border-red-500")}
                        value={equipmentCondition}
                        onChange={(e) => setEquipmentCondition(e.target.value)}
                        required
                      >
                        <option value="">— pilih kondisi —</option>
                        <option value="CLEAN">CLEAN (Bersih/Baru)</option>
                        <option value="RESIDUAL">RESIDUAL (Bekas/Terdapat sisa BBM)</option>
                      </select>
                      {renderError("equipment_condition")}
                      {equipmentCondition === "RESIDUAL" && (
                        <p className="text-[10px] text-amber-600 font-medium ml-1">
                          * Unit Residual otomatis menjadi DG.
                        </p>
                      )}
                    </div>
                  ) : null}
                  
                  {showTemp ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Suhu (Celsius) <span className="text-red-500">*</span></Label>
                      <Input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={cn("h-10 bg-zinc-50/50", validationErrors?.temperature && "border-red-500")} placeholder="0.0" required />
                      {renderError("temperature")}
                    </div>
                  ) : null}
                </div>
                
                <DangerousGoodsSection
                  isDg={isDg}
                  dgClassId={dgClassId}
                  onDgClassIdChange={setDgClassId}
                  unNumber={unNumber}
                  onUnNumberChange={setUnNumber}
                  msdsFile={msdsFile}
                  onMsdsFileChange={setMsdsFile}
                  dgClasses={dgClasses}
                  validationErrors={validationErrors ?? undefined}
                  renderError={renderError}
                />
              </div>

              {/* Section 4: Add-ons */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">Layanan Tambahan</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-white p-5 rounded-xl border shadow-sm">
                  {CATEGORIES.map((cat) => {
                    const svcs = addServices.filter((s) => (s.category || "other") === cat.key);
                    if (svcs.length === 0) return null;

                    const activeCount = svcs.filter((s) => selectedAddOns.includes(s.id)).length;
                    const activeNames = svcs
                      .filter((s) => selectedAddOns.includes(s.id))
                      .map((s) => s.name)
                      .join(", ");

                    return (
                      <Popover key={cat.key}>
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              className="w-full justify-between h-auto py-3 px-4 text-left font-normal border-zinc-200 hover:bg-zinc-50"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                                  <cat.icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-zinc-900 leading-tight">{cat.label}</span>
                                  <span className="text-xs text-zinc-500 leading-tight truncate max-w-[120px]">
                                    {activeCount > 0 ? activeNames : "Pilih layanan"}
                                  </span>
                                </div>
                              </div>
                              <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                            </Button>
                          }
                        />
                        <PopoverContent className="w-72 p-2 shadow-2xl border-zinc-200" align="start">
                          <div className="flex flex-col gap-1">
                            {svcs.map((a) => {
                              const isMandatory =
                                (isFCL && a.code && FCL_MANDATORY_CODES.includes(a.code)) ||
                                (isLCL && a.code && LCL_MANDATORY_CODES.includes(a.code));
                              return (
                                <label
                                  key={a.id}
                                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100 cursor-pointer text-sm transition-colors"
                                >
                                  <Checkbox
                                    checked={selectedAddOns.includes(a.id)}
                                    disabled={Boolean(isMandatory)}
                                    onCheckedChange={(v) => {
                                      if (isMandatory) return;
                                      const on = v === true;
                                      setSelectedAddOns((prev) =>
                                        on
                                          ? prev.includes(a.id) ? prev : [...prev, a.id]
                                          : prev.filter((x) => x !== a.id)
                                      );
                                    }}
                                  />
                                  <div className="flex flex-col">
                                    <span className={isMandatory ? "text-zinc-500 font-semibold italic" : "font-normal group-hover:text-zinc-900"}>
                                      {a.name}
                                    </span>
                                    {isMandatory && <span className="text-[10px] text-zinc-400 font-medium">Bawaan (Default Terpilih)</span>}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 bg-white border-t px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={() => void submit()} disabled={saving || loadingMasters} className="bg-black hover:bg-zinc-800 text-white font-semibold">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
