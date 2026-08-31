"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  fetchCustomerMasterLocations,
  fetchCustomerMasterTransportModes,
  fetchCustomerMasterServiceTypes,
  fetchCustomerMasterContainerTypes,
  fetchCustomerMasterAdditionalServices,
  fetchCustomerMasterCargoCategories,
  fetchCustomerMasterDgClasses,
  fetchCustomerMasterShipmentCoverages,
  fetchCustomerLocations,
  estimateBookingPrice,
  createCustomerBookingMultipart,
  updateCustomerBooking,
  fetchCustomerBookingDetail,
} from "@/lib/customer-api";
import { ApiError } from "@/lib/api-client";
import {
  resolveShipperCompanyName,
  resolveShipperLocationId,
} from "@/lib/booking-party";
import type { LaravelPaginated } from "@/lib/types-api";
import { useAuthStore } from "@/lib/store";

export type Loc = { id: number; name: string; code?: string };
export type TM = { id: number; name: string; code?: string };
export type ST = { id: number; name: string; code?: string; transport_mode_id: number };
export type CT = {
  id: number;
  name: string;
  size: string;
  length?: number;
  width?: number;
  height?: number;
  capacity_weight?: number;
  capacity_cbm?: number;
};
export type AS = { id: number; name: string; code?: string | null; category: string };
export type CC = {
  id: number;
  name: string;
  code: string;
  requires_temperature?: boolean;
  is_project_cargo?: boolean;
  is_liquid?: boolean;
  is_food?: boolean;
};

export type DC = { id: number; name: string; code: string; total_estimated?: number };
export type Coverage = { value: string };
export type CustomerLoc = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  pic_name?: string | null;
  pic_email?: string | null;
  pic_mobile?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  postal_code?: string | null;
};
export type EstimateBreakdown = {
  freight: number;
  discount: number;
  additional_services: number;
  total: number;
  // Optional fields the BE may include for "shipment coverage" breakdowns.
  pickup?: number;
  delivery?: number;
};

export type PackageRow = {
  description: string;
  package_type: string;
  piece_count: number;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  remark: string;
  cargo_category_id: string;
  is_dangerous_goods: boolean;
  un_number: string;
  dg_class_id: string;
  packing_group: string;
  proper_shipping_name: string;
  flash_point_c: string;
  dg_remark: string;
  msds_file: File | null;
  /** Path of an MSDS already stored on the server, so editing does not force a re-upload. */
  msds_file_path?: string | null;
};

export type ContainerRow = {
  container_type_id: string;
  quantity: number;
  gross_weight_kg: number;
  cargo_description: string;
  remark: string;
  cargo_category_id: string;
  is_dangerous_goods: boolean;
  un_number: string;
  dg_class_id: string;
  packing_group: string;
  proper_shipping_name: string;
  flash_point_c: string;
  dg_remark: string;
  msds_file: File | null;
  /** Path of an MSDS already stored on the server, so editing does not force a re-upload. */
  msds_file_path?: string | null;
};

export type AttachmentDraft = {
  file: File;
  document_type: string;
  remarks: string;
};

/** Stable codes for FCL mandatory add-ons (match by code, not name). */
const FCL_MANDATORY_CODES = ['FREE_STORAGE_FCL', 'LOLO', 'CONTAINER_RENT'];
/** Stable codes for LCL mandatory add-ons. */
const LCL_MANDATORY_CODES = ['FREE_STORAGE_LCL'];
/** All mandatory codes combined — used to strip them before re-applying. */
const ALL_MANDATORY_CODES = [...FCL_MANDATORY_CODES, ...LCL_MANDATORY_CODES];

export function useBookingForm(opts?: { editId?: number }) {
  const editId = opts?.editId;
  const { user } = useAuthStore();
  const userCompany = user?.company as { name?: string; address?: string; phone?: string } | undefined;
  const searchParams = useSearchParams();
  const rebookId = !editId ? searchParams.get("rebook") : null;

  // Master Data
  const [locations, setLocations] = useState<Loc[]>([]);
  const [modes, setModes] = useState<TM[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ST[]>([]);
  const [containerTypes, setContainerTypes] = useState<CT[]>([]);
  const [addServices, setAddServices] = useState<AS[]>([]);
  const [cargoCategories, setCargoCategories] = useState<CC[]>([]);
  const [dgClasses, setDgClasses] = useState<DC[]>([]);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [customerLocations, setCustomerLocations] = useState<CustomerLoc[]>([]);

  // Form State
  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [modeId, setModeId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [shipmentCoverage, setShipmentCoverage] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [containerCount, setContainerCount] = useState("1");
  const [containerResponsibility, setContainerResponsibility] = useState("");
  const [weight, setWeight] = useState("");
  const [cbm, setCbm] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargoCategoryId, setCargoCategoryId] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [confirmBooking, setConfirmBooking] = useState(false);

  // NEW: DG & Cargo specific fields
  const [isDG, setIsDG] = useState(false);
  const [dgClassId, setDgClassId] = useState("");
  const [unNumber, setUnNumber] = useState("");
  const [msdsFile, setMsdsFile] = useState<File | null>(null);
  const [equipmentCondition, setEquipmentCondition] = useState("");
  const [temperature, setTemperature] = useState("");

  // LCL Dimensions
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemHeight, setItemHeight] = useState("");

  // Shipper/Consignee
  const [shipperName, setShipperName] = useState("");
  const [shipperAddress, setShipperAddress] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [isShipperSameAsAccount, setIsShipperSameAsAccount] = useState(false);
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

  // UI State
  const [estimate, setEstimate] = useState<string | null>(null);
  const [estimateBreakdown, setEstimateBreakdown] = useState<EstimateBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedST = serviceTypes.find((s) => String(s.id) === serviceTypeId);
  const isFCL = selectedST?.code === "FCL";
  const isLCL = selectedST?.code === "LCL";
  const selectedCT = containerTypes.find((c) => String(c.id) === containerTypeId);
  const selectedCC = cargoCategories.find((c) => String(c.id) === cargoCategoryId);

  const showTemp = selectedCC?.requires_temperature;
  const showProject = selectedCC?.is_project_cargo;

  // Initial Load
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [locRes, mRes, ctRes, asRes, ccRes, dgRes, covRes, clRes] = await Promise.all([
          fetchCustomerMasterLocations({ type: "station" }),
          fetchCustomerMasterTransportModes(),
          fetchCustomerMasterContainerTypes(),
          fetchCustomerMasterAdditionalServices(),
          fetchCustomerMasterCargoCategories(),
          fetchCustomerMasterDgClasses(),
          fetchCustomerMasterShipmentCoverages(),
          fetchCustomerLocations({ status: "active", perPage: 500 }),
        ]);
        if (!active) return;
        setLocations(((locRes as LaravelPaginated<Loc>).data ?? []) as Loc[]);
        const rawModes = (mRes as { data: TM[] }).data ?? [];
        setModes(rawModes);
        setContainerTypes(((ctRes as { data: CT[] }).data ?? []) as CT[]);
        setAddServices(((asRes as { data: AS[] }).data ?? []) as AS[]);
        setCargoCategories(((ccRes as { data: CC[] }).data ?? []) as CC[]);
        setDgClasses(((dgRes as { data: DC[] }).data ?? []) as DC[]);
        const rawCoverages = (covRes as { data: Coverage[] }).data ?? [];
        setCoverages(rawCoverages);
        if (rawCoverages[0]?.value && !rebookId && !editId) setShipmentCoverage(String(rawCoverages[0].value));
        setCustomerLocations(((clRes as LaravelPaginated<CustomerLoc>).data ?? []) as CustomerLoc[]);
        if (rawModes[0]?.id && !rebookId && !editId) setModeId(String(rawModes[0].id));

        // Pre-fill from an existing booking — rebook (clone for a new booking) or edit (mutate existing).
        const prefillId = rebookId ? Number(rebookId) : editId ?? null;
        if (prefillId) {
          const detailRes = await fetchCustomerBookingDetail(prefillId);
          const bd = (detailRes as { data?: Record<string, unknown> }).data;
          if (bd) {
            setOriginId(bd.origin_location_id ? String(bd.origin_location_id) : "");
            setDestId(bd.destination_location_id ? String(bd.destination_location_id) : "");
            setModeId(bd.transport_mode_id ? String(bd.transport_mode_id) : "");
            // Service type is loaded in next effect, so we defer setting serviceTypeId
            setTimeout(() => {
              if (active) setServiceTypeId(bd.service_type_id ? String(bd.service_type_id) : "");
            }, 500);

            setShipmentCoverage(String(bd.shipment_coverage ?? ""));
            setPickupDate(String(bd.pickup_date ?? ""));
            setPickupTime(String(bd.pickup_time ?? ""));
            setPickupNotes(String(bd.pickup_notes ?? ""));
            setDeliveryNotes(String(bd.delivery_notes ?? ""));

            setContainerTypeId(bd.container_type_id ? String(bd.container_type_id) : "");
            setContainerCount(String(bd.container_count ?? 1));
            setContainerResponsibility(String(bd.container_responsibility ?? ""));
            setWeight(bd.estimated_weight ? String(bd.estimated_weight) : "");
            setCbm(bd.estimated_cbm ? String(bd.estimated_cbm) : "");
            setCargo(String(bd.cargo_description ?? ""));
            setCargoCategoryId(bd.cargo_category_id ? String(bd.cargo_category_id) : "");

            setShipperName(resolveShipperCompanyName(bd as Parameters<typeof resolveShipperCompanyName>[0]));
            setShipperAddress(String(bd.shipper_address ?? ""));
            setShipperPhone(String(bd.shipper_phone ?? ""));
            setShipperLocationId(resolveShipperLocationId(bd as Parameters<typeof resolveShipperLocationId>[0]));

            const shipperSnapshot = bd.shipper_snapshot as Record<string, unknown> | null | undefined;
            if (shipperSnapshot) {
              setShipperPicName(String(shipperSnapshot.pic_name ?? ""));
              setShipperPicEmail(String(shipperSnapshot.pic_email ?? ""));
              setShipperPicMobile(String(shipperSnapshot.pic_mobile ?? ""));
              setShipperProvinceId(String(shipperSnapshot.province_id ?? ""));
              setShipperCityId(String(shipperSnapshot.city_id ?? ""));
              setShipperDistrictId(String(shipperSnapshot.district_id ?? ""));
              setShipperPostalCode(String(shipperSnapshot.postal_code ?? ""));
            }

            setConsigneeName(String(bd.consignee_name ?? ""));
            setConsigneeAddress(String(bd.consignee_address ?? ""));
            setConsigneePhone(String(bd.consignee_phone ?? ""));
            setConsigneeType((bd.consignee_type as "customer_location" | "external" | undefined) ?? "external");
            setConsigneeLocationId(bd.consignee_location_id ? String(bd.consignee_location_id) : "");

            const consigneeSnapshot = bd.consignee_snapshot as Record<string, unknown> | null | undefined;
            if (consigneeSnapshot) {
              setConsigneePicName(String(consigneeSnapshot.pic_name ?? ""));
              setConsigneePicEmail(String(consigneeSnapshot.pic_email ?? ""));
              setConsigneePicMobile(String(consigneeSnapshot.pic_mobile ?? ""));
              setConsigneeProvinceId(String(consigneeSnapshot.province_id ?? ""));
              setConsigneeCityId(String(consigneeSnapshot.city_id ?? ""));
              setConsigneeDistrictId(String(consigneeSnapshot.district_id ?? ""));
              setConsigneePostalCode(String(consigneeSnapshot.postal_code ?? ""));
            }

            if (Array.isArray(bd.packages)) {
              setPackages(
                (bd.packages as Array<Record<string, unknown>>).map((p) => ({
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
                  dg_class_id: p.dg_class_id != null ? String(p.dg_class_id) : "",
                  packing_group: String(p.packing_group ?? ""),
                  proper_shipping_name: String(p.proper_shipping_name ?? ""),
                  flash_point_c: p.flash_point != null ? String(p.flash_point) : "",
                  dg_remark: String(p.dg_remark ?? ""),
                  msds_file: null,
                  msds_file_path: p.msds_file_path != null ? String(p.msds_file_path) : null,
                }))
              );
            }

            if (Array.isArray(bd.containers)) {
              setContainers(
                (bd.containers as Array<Record<string, unknown>>).map((c) => ({
                  container_type_id: c.container_type_id != null ? String(c.container_type_id) : "",
                  quantity: Number(c.quantity ?? 1),
                  gross_weight_kg: Number(c.gross_weight_kg ?? 0),
                  cargo_description: String(c.cargo_description ?? ""),
                  remark: String(c.remark ?? ""),
                  cargo_category_id: c.cargo_category_id != null ? String(c.cargo_category_id) : "",
                  is_dangerous_goods: Boolean(c.is_dangerous_goods),
                  un_number: String(c.un_number ?? ""),
                  dg_class_id: c.dg_class_id != null ? String(c.dg_class_id) : "",
                  packing_group: String(c.packing_group ?? ""),
                  proper_shipping_name: String(c.proper_shipping_name ?? ""),
                  flash_point_c: c.flash_point != null ? String(c.flash_point) : "",
                  dg_remark: String(c.dg_remark ?? ""),
                  msds_file: null,
                  msds_file_path: c.msds_file_path != null ? String(c.msds_file_path) : null,
                }))
              );
            }

            setIsDG(Boolean(bd.is_dangerous_goods));
            setDgClassId(bd.dg_class_id ? String(bd.dg_class_id) : "");
            setUnNumber(String(bd.un_number ?? ""));
            setEquipmentCondition(String(bd.equipment_condition ?? ""));
            setTemperature(bd.temperature != null ? String(bd.temperature) : "");

            if (bd.additional_services && Array.isArray(bd.additional_services)) {
              setSelectedAddOns(bd.additional_services.map((s: Record<string, unknown>) => Number(s.id)).filter(Boolean));
            }
          }
        }
      } catch {
        setError("Gagal memuat master data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [rebookId, editId]);

  // Mode change -> update service types
  useEffect(() => {
    if (!modeId) return;
    let active = true;
    (async () => {
      try {
        const r = await fetchCustomerMasterServiceTypes(Number(modeId));
        if (!active) return;
        const rows = (r as { data: ST[] }).data ?? [];
        setServiceTypes(rows);
        if (rows[0]?.id && !serviceTypeId && !rebookId && !editId) setServiceTypeId(String(rows[0].id));
      } catch {
        setServiceTypes([]);
      }
    })();
    return () => { active = false; };
  }, [modeId, serviceTypeId, rebookId, editId]);

  // Mandatory Add-ons Logic — matched by code (stable) instead of name
  useEffect(() => {
    if (addServices.length > 0 && serviceTypeId) {
      const codes = isFCL ? FCL_MANDATORY_CODES : isLCL ? LCL_MANDATORY_CODES : [];
      const mandatoryIds = addServices
        .filter((s) => s.code != null && codes.includes(s.code))
        .map((s) => s.id);

      setSelectedAddOns((prev) => {
        // Remove any previously auto-selected mandatory IDs, then re-add current ones.
        const others = prev.filter(
          (id) => !ALL_MANDATORY_CODES.includes(
            addServices.find((s) => s.id === id)?.code ?? ''
          )
        );
        return Array.from(new Set([...others, ...mandatoryIds]));
      });
    }
  }, [serviceTypeId, addServices, isFCL, isLCL]);

  // Shipper same as account
  useEffect(() => {
    if (isShipperSameAsAccount) {
      if (userCompany) {
        setShipperName(userCompany.name ?? "");
        setShipperAddress(userCompany.address ?? "");
        setShipperPhone(userCompany.phone ?? "");
      } else {
        toast.error("Data profil perusahaan tidak ditemukan. Silakan lengkapi di pengaturan.");
        setIsShipperSameAsAccount(false);
      }
    } else {
      // Clear fields if unchecking (optional: you might want to keep the data if the user wants to edit it)
      // For now, let's keep the user's focus on auto-fill behavior
    }
  }, [isShipperSameAsAccount, userCompany, setIsShipperSameAsAccount]);

  // CBM/Weight auto-calc
  useEffect(() => {
    if (!isLCL && selectedCT) {
      const qty = Number(containerCount) || 1;
      setWeight(String((selectedCT.capacity_weight || 0) * qty));
      setCbm(String((selectedCT.capacity_cbm || 0) * qty));
    }
  }, [containerTypeId, containerCount, selectedCT, isLCL]);

  useEffect(() => {
    if (isLCL) {
      const l = Number(itemLength) || 0;
      const w = Number(itemWidth) || 0;
      const h = Number(itemHeight) || 0;
      if (l && w && h) {
        setCbm(String((l * w * h) / 1000000));
      }
    }
  }, [isLCL, itemLength, itemWidth, itemHeight]);

  // NEW: Auto-DG logic
  useEffect(() => {
    if (equipmentCondition === "RESIDUAL" || selectedCC?.code === "DG") {
      setIsDG(true);
    } else {
      setIsDG(false);
    }
  }, [equipmentCondition, selectedCC]);

  const buildPayload = (opts?: { isDraft?: boolean }) => {
    const draft = Boolean(opts?.isDraft);

    const effectivePackages =
      packages.length > 0
        ? packages
        : isLCL
          ? [
              {
                description: cargo || "Package",
                package_type: "Carton",
                piece_count: 1,
                weight_kg: Number(weight) || 0,
                length_cm: Number(itemLength) || 0,
                width_cm: Number(itemWidth) || 0,
                height_cm: Number(itemHeight) || 0,
                remark: "",
                cargo_category_id: cargoCategoryId || defaultGeneralCategoryId(cargoCategories),
                is_dangerous_goods: false,
                un_number: "",
                dg_class_id: "",
                packing_group: "",
                proper_shipping_name: "",
                flash_point_c: "",
                dg_remark: "",
                msds_file: null,
              } satisfies PackageRow,
            ]
          : [];

    const effectiveContainers =
      containers.length > 0
        ? containers
        : isFCL && containerTypeId
          ? [
              {
                container_type_id: containerTypeId,
                quantity: Number(containerCount) || 1,
                gross_weight_kg: Number(weight) || 0,
                cargo_description: cargo || "Cargo",
                remark: "",
                cargo_category_id: cargoCategoryId || defaultGeneralCategoryId(cargoCategories),
                is_dangerous_goods: false,
                un_number: "",
                dg_class_id: "",
                packing_group: "",
                proper_shipping_name: "",
                flash_point_c: "",
                dg_remark: "",
                msds_file: null,
              } satisfies ContainerRow,
            ]
          : [];

    const pkgRows = effectivePackages.map((p) => {
      const qty = Number(p.piece_count) || 1;
      const l = Number(p.length_cm) || 0;
      const w = Number(p.width_cm) || 0;
      const h = Number(p.height_cm) || 0;
      const isDg = isDgCargoCategory(cargoCategories, p.cargo_category_id);
      return {
        description: p.description || null,
        package_type: p.package_type || null,
        piece_count: qty,
        length: l || null,
        width: w || null,
        height: h || null,
        weight_kg: Number(p.weight_kg) || null,
        remark: p.remark || null,
        cargo_category_id: p.cargo_category_id ? Number(p.cargo_category_id) : null,
        is_dangerous_goods: isDg ? 1 : 0,
        dg_class_id: isDg && p.dg_class_id ? Number(p.dg_class_id) : null,
        un_number: isDg ? (p.un_number || null) : null,
        packing_group: isDg ? (p.packing_group || null) : null,
        proper_shipping_name: isDg ? (p.proper_shipping_name || null) : null,
        flash_point: isDg && p.flash_point_c ? Number(p.flash_point_c) : null,
        dg_remark: isDg ? (p.dg_remark || null) : null,
        msds_file_path: isDg ? (p.msds_file_path || null) : null,
      };
    });

    const ctrRows = effectiveContainers.map((c) => {
      const isDg = isDgCargoCategory(cargoCategories, c.cargo_category_id);
      return {
        container_type_id: c.container_type_id ? Number(c.container_type_id) : null,
        quantity: Number(c.quantity) || 1,
        gross_weight_kg: Number(c.gross_weight_kg) || null,
        cargo_description: c.cargo_description || null,
        remark: c.remark || null,
        cargo_category_id: c.cargo_category_id ? Number(c.cargo_category_id) : null,
        is_dangerous_goods: isDg ? 1 : 0,
        dg_class_id: isDg && c.dg_class_id ? Number(c.dg_class_id) : null,
        un_number: isDg ? (c.un_number || null) : null,
        packing_group: isDg ? (c.packing_group || null) : null,
        proper_shipping_name: isDg ? (c.proper_shipping_name || null) : null,
        flash_point: isDg && c.flash_point_c ? Number(c.flash_point_c) : null,
        dg_remark: isDg ? (c.dg_remark || null) : null,
        msds_file_path: isDg ? (c.msds_file_path || null) : null,
      };
    });

    const pkgTotalCbm = effectivePackages.reduce((acc, p) => {
      const qty = Number(p.piece_count) || 1;
      const l = Number(p.length_cm) || 0;
      const w = Number(p.width_cm) || 0;
      const h = Number(p.height_cm) || 0;
      if (!l || !w || !h) return acc;
      return acc + ((l * w * h) / 1_000_000) * qty;
    }, 0);
    const pkgTotalWeight = effectivePackages.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);

    const ctrTotalQty = effectiveContainers.reduce((acc, c) => acc + (Number(c.quantity) || 1), 0);
    const ctrFirstType = effectiveContainers[0]?.container_type_id;

    const anyItemDg =
      effectivePackages.some((p) => isDgCargoCategory(cargoCategories, p.cargo_category_id)) ||
      effectiveContainers.some((c) => isDgCargoCategory(cargoCategories, c.cargo_category_id));

    return {
      origin_location_id: originId ? Number(originId) : null,
      destination_location_id: destId ? Number(destId) : null,
      transport_mode_id: modeId ? Number(modeId) : null,
      service_type_id: serviceTypeId ? Number(serviceTypeId) : null,
      shipment_coverage: shipmentCoverage || null,
      pickup_date: pickupDate || null,
      pickup_time: pickupTime || null,
      pickup_notes: pickupNotes || null,
      delivery_notes: deliveryNotes || null,
      cargo_category_id: cargoCategoryId ? Number(cargoCategoryId) : null,
      container_responsibility: containerResponsibility || (isFCL ? "COC" : null),
      container_type_id: isFCL && ctrFirstType ? Number(ctrFirstType) : !isLCL && containerTypeId ? Number(containerTypeId) : null,
      container_count: isFCL ? ctrTotalQty : !isLCL ? (Number(containerCount) || 1) : null,
      estimated_weight: isLCL ? (pkgTotalWeight || null) : weight ? Number(weight) : null,
      estimated_cbm: isLCL ? (pkgTotalCbm || null) : cbm ? Number(cbm) : null,
      length: isLCL && itemLength ? Number(itemLength) : null,
      width: isLCL && itemWidth ? Number(itemWidth) : null,
      height: isLCL && itemHeight ? Number(itemHeight) : null,
      departure_date: departureDate || null,
      cargo_description: cargo || null,
      is_dangerous_goods: anyItemDg ? 1 : 0,
      dg_class_id: null,
      un_number: null,
      equipment_condition: showProject && equipmentCondition ? equipmentCondition : null,
      temperature: showTemp && temperature ? Number(temperature) : null,
      shipper_name: shipperName || null,
      shipper_address: shipperAddress || null,
      shipper_phone: shipperPhone || null,
      shipper_location_id: shipperLocationId ? Number(shipperLocationId) : null,
      shipper_snapshot: {
        location_name: customerLocations.find((l) => String(l.id) === shipperLocationId)?.name ?? null,
        company: shipperName || null,
        pic_name: shipperPicName || null,
        pic_email: shipperPicEmail || null,
        pic_mobile: shipperPicMobile || null,
        country: "Indonesia",
        province_id: shipperProvinceId || null,
        city_id: shipperCityId || null,
        district_id: shipperDistrictId || null,
        postal_code: shipperPostalCode || null,
        address: shipperAddress || null,
        phone: shipperPhone || null,
      },
      consignee_name: consigneeName || null,
      consignee_address: consigneeAddress || null,
      consignee_phone: consigneePhone || null,
      consignee_type: consigneeType,
      consignee_location_id: consigneeType === "customer_location" && consigneeLocationId ? Number(consigneeLocationId) : null,
      consignee_snapshot: {
        company: consigneeName || null,
        pic_name: consigneePicName || null,
        pic_email: consigneePicEmail || null,
        pic_mobile: consigneePicMobile || null,
        country: "Indonesia",
        province_id: consigneeProvinceId || null,
        city_id: consigneeCityId || null,
        district_id: consigneeDistrictId || null,
        postal_code: consigneePostalCode || null,
        address: consigneeAddress || null,
        phone: consigneePhone || null,
      },
      packages: pkgRows.length ? pkgRows : null,
      containers: ctrRows.length ? ctrRows : null,
      additional_services: selectedAddOns.map((id) => ({ id })),
      confirm_booking: draft ? undefined : confirmBooking,
      is_draft: draft ? true : undefined,
    };
  };

  const onEstimate = async () => {
    setError(null);
    setEstimate(null);
    setEstimateBreakdown(null);
    try {
      const p = buildPayload();
      const r = await estimateBookingPrice(p);
      const inner = (r as { data?: { estimated_price?: number; breakdown?: EstimateBreakdown } }).data;
      setEstimate(
        inner?.estimated_price != null
          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
            Number(inner.estimated_price)
          )
          : "Estimasi tidak tersedia"
      );
      if (inner?.breakdown) {
        setEstimateBreakdown(inner.breakdown);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal estimasi";
      setError(msg);
      toast.error(msg);
    }
  };

  const renderFieldError = (field: string): string | null => {
    return validationErrors?.[field]?.[0] ?? null;
  };

  const submitDraft = async () => {
    const payload = buildPayload({ isDraft: true });
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (typeof v === "object") {
        fd.append(k, JSON.stringify(v));
        return;
      }
      fd.append(k, String(v));
    });
    packages.forEach((p, i) => {
      if (p.msds_file) fd.append(`packages_msds_files[${i}]`, p.msds_file);
    });
    containers.forEach((c, i) => {
      if (c.msds_file) fd.append(`containers_msds_files[${i}]`, c.msds_file);
    });
    attachments.forEach((a, i) => {
      fd.append(`attachments[${i}]`, a.file);
    });
    if (attachments.length) {
      fd.append(
        "attachments_meta",
        JSON.stringify(
          attachments.map((a) => ({
            document_type: a.document_type || null,
            remarks: a.remarks || null,
          }))
        )
      );
    }
    if (msdsFile) {
      fd.append("msds_file", msdsFile);
    }

    return createCustomerBookingMultipart(fd);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors(null);

    setSubmitting(true);
    try {
      const payload = buildPayload();
      let bookingResponse:
        | {
            prepaid?: {
              invoice?: { id?: number | string };
              midtrans?: { token?: string; redirect_url?: string | null; order_id?: string };
            } | null;
          }
        | undefined;

      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        if (typeof v === "object") {
          fd.append(k, JSON.stringify(v));
          return;
        }
        fd.append(k, String(v));
      });

      packages.forEach((p, i) => {
        if (p.msds_file) fd.append(`packages_msds_files[${i}]`, p.msds_file);
      });
      containers.forEach((c, i) => {
        if (c.msds_file) fd.append(`containers_msds_files[${i}]`, c.msds_file);
      });
      attachments.forEach((a, i) => {
        fd.append(`attachments[${i}]`, a.file);
      });
      if (attachments.length) {
        fd.append(
          "attachments_meta",
          JSON.stringify(
            attachments.map((a) => ({
              document_type: a.document_type || null,
              remarks: a.remarks || null,
            }))
          )
        );
      }
      if (msdsFile) {
        fd.append("msds_file", msdsFile);
      }

      if (editId) {
        bookingResponse = (await updateCustomerBooking(editId, fd)) as typeof bookingResponse;
      } else {
        bookingResponse = (await createCustomerBookingMultipart(fd)) as typeof bookingResponse;
      }

      const prepaid = bookingResponse?.prepaid;
      const redirectUrl = prepaid?.midtrans?.redirect_url;
      if (redirectUrl) {
        toast.success("Booking pre-paid berhasil dibuat. Mengarahkan ke pembayaran...");
        window.location.href = redirectUrl;
        return;
      }

      if (prepaid?.invoice?.id) {
        toast.success("Booking pre-paid berhasil dibuat dan invoice sudah terbit.");
      } else if (editId) {
        toast.success("Booking berhasil diperbarui.");
      } else {
        toast.success("Booking berhasil dikirim.");
      }
      setShowSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]> };
        if (body?.errors) {
          setValidationErrors(body.errors);
          setError("Terdapat kesalahan pada form. Silakan periksa kolom yang ditandai merah.");
          // Scroll to top to show error banner
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setError(err.message);
        }
      } else {
        const msg = err instanceof ApiError ? err.message : "Gagal menyimpan";
        setError(msg);
      }
      toast.error("Booking gagal dikirim. Periksa kembali isian form Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    locations, modes, serviceTypes, containerTypes, addServices, cargoCategories, dgClasses, coverages, customerLocations,
    originId, setOriginId,
    destId, setDestId,
    modeId, setModeId,
    serviceTypeId, setServiceTypeId,
    shipmentCoverage, setShipmentCoverage,
    pickupDate, setPickupDate,
    pickupTime, setPickupTime,
    pickupNotes, setPickupNotes,
    deliveryNotes, setDeliveryNotes,
    containerTypeId, setContainerTypeId,
    containerCount, setContainerCount,
    containerResponsibility, setContainerResponsibility,
    weight, setWeight,
    cbm, setCbm,
    departureDate, setDepartureDate,
    cargo, setCargo,
    cargoCategoryId, setCargoCategoryId,
    selectedAddOns, setSelectedAddOns,
    packages, setPackages,
    containers, setContainers,
    attachments, setAttachments,
    confirmBooking, setConfirmBooking,
    itemLength, setItemLength,
    itemWidth, setItemWidth,
    itemHeight, setItemHeight,
    shipperName, setShipperName,
    shipperAddress, setShipperAddress,
    shipperPhone, setShipperPhone,
    isShipperSameAsAccount, setIsShipperSameAsAccount,
    shipperLocationId, setShipperLocationId,
    shipperPicName, setShipperPicName,
    shipperPicEmail, setShipperPicEmail,
    shipperPicMobile, setShipperPicMobile,
    shipperProvinceId, setShipperProvinceId,
    shipperCityId, setShipperCityId,
    shipperDistrictId, setShipperDistrictId,
    shipperPostalCode, setShipperPostalCode,
    consigneeName, setConsigneeName,
    consigneeAddress, setConsigneeAddress,
    consigneePhone, setConsigneePhone,
    consigneeType, setConsigneeType,
    consigneeLocationId, setConsigneeLocationId,
    consigneePicName, setConsigneePicName,
    consigneePicEmail, setConsigneePicEmail,
    consigneePicMobile, setConsigneePicMobile,
    consigneeProvinceId, setConsigneeProvinceId,
    consigneeCityId, setConsigneeCityId,
    consigneeDistrictId, setConsigneeDistrictId,
    consigneePostalCode, setConsigneePostalCode,
    isDG, setIsDG,
    dgClassId, setDgClassId,
    unNumber, setUnNumber,
    msdsFile, setMsdsFile,
    equipmentCondition, setEquipmentCondition,
    temperature, setTemperature,
    estimate, estimateBreakdown, error, validationErrors, renderFieldError, loading, submitting, showSuccess, setShowSuccess,
    isFCL, isLCL, selectedCT, selectedCC, showTemp, showProject,
    onEstimate, onSubmit,
    submitDraft,
    mode: editId ? ("edit" as const) : ("create" as const),
  };
}

function isDgCargoCategory(categories: CC[], categoryId: string): boolean {
  const cat = categories.find((c) => String(c.id) === categoryId);
  return cat?.code === "DG";
}

function defaultGeneralCategoryId(categories: CC[]): string {
  const gen = categories.find((c) => c.code === "GEN");
  return gen ? String(gen.id) : "";
}
