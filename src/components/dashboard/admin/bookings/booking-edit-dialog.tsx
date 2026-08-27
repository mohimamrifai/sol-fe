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
import { DEFAULT_COUNTRY } from "@/lib/countries";
import type { BookingDetail } from "./types";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { deleteAdminBookingAttachment, fetchAdminCompanyLocations } from "@/lib/admin-api";
import type { AttachmentDraft, CustomerLoc } from "@/hooks/use-booking-form";
import { ADMIN_SHIPMENT_COVERAGES } from "@/hooks/use-admin-booking-form";
import {
  deriveBookingCargoCategoryId,
  mapContainerRowsForApi,
  mapPackageRowsForApi,
} from "@/lib/admin-booking-payload";
import { PartyInfoSection } from "@/components/dashboard/booking/create/party-info-section";
import { CargoDetailSection } from "@/components/dashboard/booking/create/cargo-detail-section";
import { AttachmentSection } from "@/components/dashboard/booking/create/attachment-section";
import type { ContainerRow, PackageRow } from "@/hooks/use-booking-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

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
type ExistingAttachment = {
  id: number;
  original_name?: string;
  document_type?: string | null;
  file_path?: string;
};

type ComboOption = { value: string; label: string };

const FCL_MANDATORY_CODES = ["FREE_STORAGE_FCL", "LOLO", "CONTAINER_RENT"];
const LCL_MANDATORY_CODES = ["FREE_STORAGE_LCL"];

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
  const tForm = useTranslations("Bookings.create.form");
  const tCommon = useTranslations("Bookings");
  const te = useTranslations("AdminBookings.editDialog");
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
  const [shipperName, setShipperName] = useState("");
  const [shipperAddress, setShipperAddress] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [shipperLocationId, setShipperLocationId] = useState("");
  const [shipperPicName, setShipperPicName] = useState("");
  const [shipperPicEmail, setShipperPicEmail] = useState("");
  const [shipperPicMobile, setShipperPicMobile] = useState("");
  const [shipperProvinceId, setShipperProvinceId] = useState("");
  const [shipperCityId, setShipperCityId] = useState("");
  const [shipperDistrictId, setShipperDistrictId] = useState("");
  const [shipperPostalCode, setShipperPostalCode] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");
  const [consigneeType, setConsigneeType] = useState<"customer_location" | "external">("external");
  const [consigneeLocationId, setConsigneeLocationId] = useState("");
  const [consigneePicName, setConsigneePicName] = useState("");
  const [consigneePicEmail, setConsigneePicEmail] = useState("");
  const [consigneePicMobile, setConsigneePicMobile] = useState("");
  const [consigneeProvinceId, setConsigneeProvinceId] = useState("");
  const [consigneeCityId, setConsigneeCityId] = useState("");
  const [consigneeDistrictId, setConsigneeDistrictId] = useState("");
  const [consigneePostalCode, setConsigneePostalCode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [shipmentCoverage, setShipmentCoverage] = useState("port_to_port");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [customerLocations, setCustomerLocations] = useState<CustomerLoc[]>([]);
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
  const [containerResponsibility, setContainerResponsibility] = useState("COC");
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingMasters(true);
      setLoadError(null);
      try {
        const [locRes, mRes, stRes, ctRes, asRes, ccRes, dgRes] = await Promise.all([
          fetchPublicMasterLocations(),
          fetchPublicMasterTransportModes(),
          fetchPublicMasterServiceTypes(),
          fetchPublicMasterContainerTypes(),
          fetchPublicMasterAdditionalServices(),
          fetchPublicMasterCargoCategories(),
          fetchPublicMasterDgClasses(),
        ]);
        if (cancelled) return;
        setLocations(((locRes as LaravelPaginated<Loc>).data ?? []) as Loc[]);
        setModes(((mRes as LaravelPaginated<TM>).data ?? []) as TM[]);
        const allServiceTypes = ((stRes as { data: ST[] }).data ?? []) as ST[];
        setServiceTypes(allServiceTypes.filter((s) => s.code === "FCL" || s.code === "LCL"));
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
    setShipperName(data.shipper_name ?? "");
    setShipperAddress(data.shipper_address ?? "");
    setShipperPhone(data.shipper_phone ?? "");
    setShipperLocationId(data.shipper_location_id ? String(data.shipper_location_id) : "");
    const shipperSnap = (data as BookingDetail & { shipper_snapshot?: Record<string, unknown> }).shipper_snapshot;
    setShipperPicName(String(shipperSnap?.pic_name ?? ""));
    setShipperPicEmail(String(shipperSnap?.pic_email ?? ""));
    setShipperPicMobile(String(shipperSnap?.pic_mobile ?? shipperSnap?.phone ?? data.shipper_phone ?? ""));
    setShipperProvinceId(String(shipperSnap?.province_id ?? ""));
    setShipperCityId(String(shipperSnap?.city_id ?? ""));
    setShipperDistrictId(String(shipperSnap?.district_id ?? ""));
    setShipperPostalCode(String(shipperSnap?.postal_code ?? ""));
    setConsigneeName(data.consignee_name ?? "");
    setConsigneeAddress(data.consignee_address ?? "");
    setConsigneePhone(data.consignee_phone ?? "");
    setConsigneeType(((data as BookingDetail & { consignee_type?: string }).consignee_type as "customer_location" | "external") ?? "external");
    setConsigneeLocationId((data as BookingDetail & { consignee_location_id?: number }).consignee_location_id ? String((data as BookingDetail & { consignee_location_id?: number }).consignee_location_id) : "");
    const consigneeSnap = (data as BookingDetail & { consignee_snapshot?: Record<string, unknown> }).consignee_snapshot;
    setConsigneePicName(String(consigneeSnap?.pic_name ?? ""));
    setConsigneePicEmail(String(consigneeSnap?.pic_email ?? ""));
    setConsigneePicMobile(String(consigneeSnap?.pic_mobile ?? consigneeSnap?.phone ?? data.consignee_phone ?? ""));
    setConsigneeProvinceId(String(consigneeSnap?.province_id ?? ""));
    setConsigneeCityId(String(consigneeSnap?.city_id ?? ""));
    setConsigneeDistrictId(String(consigneeSnap?.district_id ?? ""));
    setConsigneePostalCode(String(consigneeSnap?.postal_code ?? ""));
    setDeliveryNotes(String((data as BookingDetail & { delivery_notes?: string }).delivery_notes ?? ""));
    setShipmentCoverage(String(data.shipment_coverage ?? "port_to_port"));
    setPickupDate((data as BookingDetail & { pickup_date?: string }).pickup_date ? String((data as BookingDetail & { pickup_date?: string }).pickup_date).slice(0, 10) : "");
    setPickupTime(String((data as BookingDetail & { pickup_time?: string }).pickup_time ?? ""));
    setPickupNotes(String((data as BookingDetail & { pickup_notes?: string }).pickup_notes ?? ""));
    setIsDg(Boolean(data.is_dangerous_goods));
    setDgClassId(data.dg_class_id ? String(data.dg_class_id) : (data.dgClass?.id ? String(data.dgClass.id) : (data.dg_class?.id ? String(data.dg_class.id) : "")));
    setUnNumber(data.un_number ?? "");
    setEquipmentCondition(data.equipment_condition ?? "");
    setTemperature(data.temperature != null ? String(data.temperature) : "");
    setSelectedAddOns((data.additional_services ?? []).map((s) => Number(s.id)).filter(Boolean));
    setContainerResponsibility(String((data as BookingDetail & { container_responsibility?: string }).container_responsibility ?? "COC"));
    setPackages(
      ((data as BookingDetail & { packages?: Array<Record<string, unknown>> }).packages ?? []).map((p) => ({
        description: String(p.description ?? ""),
        package_type: String(p.package_type ?? ""),
        piece_count: Number(p.piece_count ?? 1),
        weight_kg: Number(p.weight_kg ?? 0),
        length_cm: Number(p.length ?? 0),
        width_cm: Number(p.width ?? 0),
        height_cm: Number(p.height ?? 0),
        remark: String(p.remark ?? ""),
        cargo_category_id: p.cargo_category_id != null ? String(p.cargo_category_id) : "",
        is_dangerous_goods: Boolean(p.is_dangerous_goods),
        un_number: String(p.un_number ?? ""),
        dg_class_id: p.dg_class_id ? String(p.dg_class_id) : "",
        packing_group: String(p.packing_group ?? ""),
        proper_shipping_name: String(p.proper_shipping_name ?? ""),
        flash_point_c: p.flash_point != null ? String(p.flash_point) : "",
        dg_remark: String(p.dg_remark ?? p.dg_notes ?? ""),
        msds_file: null,
      }))
    );
    setContainers(
      ((data as BookingDetail & { containers?: Array<Record<string, unknown>> }).containers ?? []).map((c) => ({
        container_type_id: c.container_type_id ? String(c.container_type_id) : (c.container_type as { id?: number })?.id ? String((c.container_type as { id?: number }).id) : "",
        quantity: Number(c.quantity ?? 1),
        gross_weight_kg: Number(c.gross_weight_kg ?? 0),
        cargo_description: String(c.cargo_description ?? ""),
        remark: String(c.remark ?? ""),
        cargo_category_id: c.cargo_category_id != null ? String(c.cargo_category_id) : "",
        is_dangerous_goods: Boolean(c.is_dangerous_goods),
        un_number: String(c.un_number ?? ""),
        dg_class_id: c.dg_class_id ? String(c.dg_class_id) : "",
        packing_group: String(c.packing_group ?? ""),
        proper_shipping_name: String(c.proper_shipping_name ?? ""),
        flash_point_c: c.flash_point != null ? String(c.flash_point) : "",
        dg_remark: String(c.dg_remark ?? c.dg_notes ?? ""),
        msds_file: null,
      }))
    );
    setMsdsFile(null);
    setNotes(String(data.notes ?? ""));
    setAttachments([]);
    setExistingAttachments(
      (((data as BookingDetail & { attachments?: ExistingAttachment[] }).attachments ?? []) as ExistingAttachment[]).map((att) => ({
        id: Number(att.id),
        original_name: att.original_name,
        document_type: att.document_type,
        file_path: att.file_path,
      }))
    );
    setValidationErrors(null);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data?.company_id) {
      setCustomerLocations([]);
      return;
    }
    let cancelled = false;
    void fetchAdminCompanyLocations(Number(data.company_id), { page: 1, perPage: 500, status: "active" }).then((res) => {
      if (cancelled) return;
      setCustomerLocations(((res as LaravelPaginated<CustomerLoc>).data ?? []) as CustomerLoc[]);
    });
    return () => {
      cancelled = true;
    };
  }, [open, data?.company_id]);

  const selectedService = serviceTypes.find((s) => String(s.id) === serviceTypeId);

  useEffect(() => {
    if (!selectedService?.transport_mode_id) return;
    setModeId(String(selectedService.transport_mode_id));
  }, [serviceTypeId, selectedService?.transport_mode_id]);

  const isLCL = selectedService?.code === "LCL";
  const isFCL = selectedService?.code === "FCL";
  const selectedCargoCategory = cargoCats.find((c) => String(c.id) === cargoCategoryId);
  const showTemp = selectedCargoCategory?.requires_temperature;
  const showProject = selectedCargoCategory?.is_project_cargo;

  const locationOptions: ComboOption[] = locations.map((l) => ({
    value: String(l.id),
    label: `${l.name}${l.code ? ` (${l.code})` : ""}`,
  }));
  const serviceOptions: ComboOption[] = serviceTypes.map((s) => ({
    value: String(s.id),
    label: `${s.name}${s.code ? ` (${s.code})` : ""}`,
  }));
  const coverageOptions: ComboOption[] = ADMIN_SHIPMENT_COVERAGES.map((c) => ({
    value: c.value,
    label: tCommon(`coverage.${c.value}`),
  }));
  const showPickupFields = shipmentCoverage === "door_to_port" || shipmentCoverage === "door_to_door";
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
    const derivedCargoCategoryId = deriveBookingCargoCategoryId(packages, containers, cargoCategoryId);
    const fd = new FormData();
    fd.append("origin_location_id", originId);
    fd.append("destination_location_id", destId);
    fd.append("transport_mode_id", modeId);
    fd.append("service_type_id", serviceTypeId);
    if (derivedCargoCategoryId) fd.append("cargo_category_id", derivedCargoCategoryId);
    if (!isLCL && containerTypeId) fd.append("container_type_id", containerTypeId);
    if (!isLCL) fd.append("container_count", containerCount || "1");
    if (weight) fd.append("estimated_weight", weight);
    if (cbm) fd.append("estimated_cbm", cbm);
    if (isLCL && itemLength) fd.append("length", itemLength);
    if (isLCL && itemWidth) fd.append("width", itemWidth);
    if (isLCL && itemHeight) fd.append("height", itemHeight);
    if (shipmentCoverage) fd.append("shipment_coverage", shipmentCoverage);
    if (pickupDate) fd.append("pickup_date", pickupDate);
    if (pickupTime) fd.append("pickup_time", pickupTime);
    if (pickupNotes) fd.append("pickup_notes", pickupNotes);
    if (deliveryNotes) fd.append("delivery_notes", deliveryNotes);
    if (notes) fd.append("notes", notes);
    fd.append("shipper_name", shipperName);
    fd.append("shipper_address", shipperAddress);
    fd.append("shipper_phone", shipperPhone);
    if (shipperLocationId) fd.append("shipper_location_id", shipperLocationId);
    fd.append(
      "shipper_snapshot",
      JSON.stringify({
        company: shipperName,
        pic_name: shipperPicName,
        pic_email: shipperPicEmail,
        pic_mobile: shipperPicMobile,
        country: DEFAULT_COUNTRY,
        province_id: shipperProvinceId || null,
        city_id: shipperCityId || null,
        district_id: shipperDistrictId || null,
        postal_code: shipperPostalCode || null,
        address: shipperAddress,
        phone: shipperPhone,
      })
    );
    fd.append("consignee_name", consigneeName);
    fd.append("consignee_address", consigneeAddress);
    fd.append("consignee_phone", consigneePhone);
    fd.append("consignee_type", consigneeType);
    if (consigneeType === "customer_location" && consigneeLocationId) fd.append("consignee_location_id", consigneeLocationId);
    fd.append(
      "consignee_snapshot",
      JSON.stringify({
        company: consigneeName,
        pic_name: consigneePicName,
        pic_email: consigneePicEmail,
        pic_mobile: consigneePicMobile,
        country: DEFAULT_COUNTRY,
        province_id: consigneeProvinceId || null,
        city_id: consigneeCityId || null,
        district_id: consigneeDistrictId || null,
        postal_code: consigneePostalCode || null,
        address: consigneeAddress,
        phone: consigneePhone,
      })
    );
    fd.append("additional_services", JSON.stringify(selectedAddOns.map((id) => ({ id }))));
    if (isFCL) fd.append("container_responsibility", containerResponsibility);
    attachments.forEach((a, i) => {
      fd.append(`attachments[${i}]`, a.file);
    });
    if (attachments.length) {
      fd.append(
        "attachments_meta",
        JSON.stringify(
          attachments.map((a) => ({
            document_type: a.document_type || "other",
            remarks: a.remarks || "",
          }))
        )
      );
    }
    if (packages.length) {
      fd.append("packages", JSON.stringify(mapPackageRowsForApi(packages, cargoCats)));
      packages.forEach((p, i) => {
        if (p.msds_file) fd.append(`packages_msds_files[${i}]`, p.msds_file);
      });
    }
    if (containers.length) {
      fd.append("containers", JSON.stringify(mapContainerRowsForApi(containers, cargoCats)));
      containers.forEach((c, i) => {
        if (c.msds_file) fd.append(`containers_msds_files[${i}]`, c.msds_file);
      });
    }
    
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
            <DialogTitle className="text-xl">{te("title")}</DialogTitle>
            <DialogDescription>
              {te("description", { bookingNo: data?.booking_number ?? "booking" })}
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 py-6 bg-zinc-50/30">
          {loadError ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{loadError}</p> : null}
          
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">{te("loading")}</p>
          ) : loadingMasters ? (
            <p className="text-sm text-muted-foreground text-center py-8">{te("loadingMasters")}</p>
          ) : (
            <div className="space-y-8">
              {/* Section 1: Route & Service */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">{te("routeTitle")}</h3>
                <div className="grid gap-5 sm:grid-cols-2 bg-white p-5 rounded-xl border shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{tForm("originStation")}</Label>
                    <Combobox items={locationOptions} value={locationOptions.find((x) => x.value === originId) ?? null} onValueChange={(next) => setOriginId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.origin_location_id && "[&_input]:border-red-500")} placeholder={tForm("originStationPlaceholder")} />
                      <ComboboxContent><ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("origin_location_id")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{tForm("destinationStation")}</Label>
                    <Combobox items={locationOptions} value={locationOptions.find((x) => x.value === destId) ?? null} onValueChange={(next) => setDestId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.destination_location_id && "[&_input]:border-red-500")} placeholder={tForm("destinationStationPlaceholder")} />
                      <ComboboxContent><ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("destination_location_id")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{tForm("serviceType")}</Label>
                    <Combobox items={serviceOptions} value={serviceOptions.find((x) => x.value === serviceTypeId) ?? null} onValueChange={(next) => setServiceTypeId(next?.value ?? "")}>
                      <ComboboxInput className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.service_type_id && "[&_input]:border-red-500")} placeholder={tForm("serviceTypePlaceholder")} />
                      <ComboboxContent><ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty><ComboboxList>{(item: ComboOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxContent>
                    </Combobox>
                    {renderError("service_type_id")}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      {tForm("shipmentCoverage")}
                    </Label>
                    <Combobox
                      items={coverageOptions}
                      value={coverageOptions.find((x) => x.value === shipmentCoverage) ?? null}
                      onValueChange={(next) => setShipmentCoverage(next?.value ?? "")}
                    >
                      <ComboboxInput
                        className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.shipment_coverage && "[&_input]:border-red-500")}
                        placeholder={tForm("shipmentCoveragePlaceholder")}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
                        <ComboboxList>
                          {(item: ComboOption) => (
                            <ComboboxItem key={item.value} value={item}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {renderError("shipment_coverage")}
                  </div>
                  {showPickupFields ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                          {tForm("pickupDate")}
                        </Label>
                        <Input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className={cn("h-10 bg-zinc-50/50", validationErrors?.pickup_date && "border-red-500")}
                        />
                        {renderError("pickup_date")}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                          {tForm("pickupTime")}
                        </Label>
                        <Input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className={cn("h-10 bg-zinc-50/50", validationErrors?.pickup_time && "border-red-500")}
                        />
                        {renderError("pickup_time")}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                          {tForm("pickupNotes")}
                        </Label>
                        <Textarea
                          value={pickupNotes}
                          onChange={(e) => setPickupNotes(e.target.value)}
                          className="min-h-[88px] bg-zinc-50/50"
                          placeholder={tForm("pickupNotesPlaceholder")}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Section 2: Parties */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">{te("partiesTitle")}</h3>
                <PartyInfoSection
                  kind="shipper"
                  customerLocations={customerLocations}
                  locationId={shipperLocationId}
                  setLocationId={setShipperLocationId}
                  company={shipperName}
                  setCompany={setShipperName}
                  picName={shipperPicName}
                  setPicName={setShipperPicName}
                  picEmail={shipperPicEmail}
                  setPicEmail={setShipperPicEmail}
                  picMobile={shipperPicMobile}
                  setPicMobile={setShipperPicMobile}
                  setPhone={setShipperPhone}
                  provinceId={shipperProvinceId}
                  setProvinceId={setShipperProvinceId}
                  cityId={shipperCityId}
                  setCityId={setShipperCityId}
                  districtId={shipperDistrictId}
                  setDistrictId={setShipperDistrictId}
                  postalCode={shipperPostalCode}
                  setPostalCode={setShipperPostalCode}
                  address={shipperAddress}
                  setAddress={setShipperAddress}
                  renderFieldError={(field) => validationErrors?.[field]?.[0] ?? null}
                />
                <PartyInfoSection
                  kind="consignee"
                  customerLocations={customerLocations}
                  locationId={consigneeLocationId}
                  setLocationId={setConsigneeLocationId}
                  destinationType={consigneeType}
                  setDestinationType={setConsigneeType}
                  showDeliveryNotes={shipmentCoverage === "port_to_door" || shipmentCoverage === "door_to_door"}
                  company={consigneeName}
                  setCompany={setConsigneeName}
                  picName={consigneePicName}
                  setPicName={setConsigneePicName}
                  picEmail={consigneePicEmail}
                  setPicEmail={setConsigneePicEmail}
                  picMobile={consigneePicMobile}
                  setPicMobile={setConsigneePicMobile}
                  setPhone={setConsigneePhone}
                  provinceId={consigneeProvinceId}
                  setProvinceId={setConsigneeProvinceId}
                  cityId={consigneeCityId}
                  setCityId={setConsigneeCityId}
                  districtId={consigneeDistrictId}
                  setDistrictId={setConsigneeDistrictId}
                  postalCode={consigneePostalCode}
                  setPostalCode={setConsigneePostalCode}
                  address={consigneeAddress}
                  setAddress={setConsigneeAddress}
                  deliveryNotes={deliveryNotes}
                  setDeliveryNotes={setDeliveryNotes}
                  renderFieldError={(field) => validationErrors?.[field]?.[0] ?? null}
                />
              </div>

              {/* Section 3: Cargo Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">{te("cargoTitle")}</h3>
                <CargoDetailSection
                  adminFsdMode
                  isLCL={isLCL}
                  isFCL={isFCL}
                  containerTypes={containerTypes}
                  cargoCategories={cargoCats}
                  dgClasses={dgClasses}
                  departureDate={departureDate}
                  setDepartureDate={setDepartureDate}
                  cargoCategoryId={cargoCategoryId}
                  setCargoCategoryId={setCargoCategoryId}
                  cargo={cargo}
                  setCargo={setCargo}
                  equipmentCondition={equipmentCondition}
                  setEquipmentCondition={setEquipmentCondition}
                  temperature={temperature}
                  setTemperature={setTemperature}
                  showTemp={showTemp}
                  showProject={showProject}
                  containerResponsibility={containerResponsibility}
                  setContainerResponsibility={setContainerResponsibility}
                  packages={packages}
                  setPackages={setPackages}
                  containers={containers}
                  setContainers={setContainers}
                  renderFieldError={(field) => validationErrors?.[field]?.[0] ?? null}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">{te("attachmentsTitle")}</h3>
                {existingAttachments.length > 0 ? (
                  <ul className="space-y-2 rounded-xl border bg-white p-4 text-sm">
                    {existingAttachments.map((att) => (
                      <li key={att.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{att.original_name ?? `Attachment #${att.id}`}</p>
                          <p className="text-xs text-muted-foreground">{att.document_type ?? "—"}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            if (!data?.id) return;
                            void deleteAdminBookingAttachment(data.id, att.id).then(() => {
                              setExistingAttachments((prev) => prev.filter((x) => x.id !== att.id));
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <AttachmentSection attachments={attachments} setAttachments={setAttachments} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{te("internalNotes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[96px] bg-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 bg-white border-t px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {te("cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={saving || loadingMasters} className="bg-black hover:bg-zinc-800 text-white font-semibold">
            {saving ? te("saving") : te("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
