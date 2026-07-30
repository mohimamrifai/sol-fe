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
  estimateBookingPrice,
  createCustomerBooking,
  createCustomerBookingMultipart,
  updateCustomerBooking,
  fetchCustomerBookingDetail,
} from "@/lib/customer-api";
import { ApiError } from "@/lib/api-client";
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
export type EstimateBreakdown = {
  freight: number;
  discount: number;
  additional_services: number;
  total: number;
  // Optional fields the BE may include for "shipment coverage" breakdowns.
  pickup?: number;
  delivery?: number;
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

  // Form State
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
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

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

  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");

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
        const [locRes, mRes, ctRes, asRes, ccRes, dgRes] = await Promise.all([
          fetchCustomerMasterLocations(),
          fetchCustomerMasterTransportModes(),
          fetchCustomerMasterContainerTypes(),
          fetchCustomerMasterAdditionalServices(),
          fetchCustomerMasterCargoCategories(),
          fetchCustomerMasterDgClasses(),
        ]);
        if (!active) return;
        setLocations(((locRes as LaravelPaginated<Loc>).data ?? []) as Loc[]);
        const rawModes = (mRes as { data: TM[] }).data ?? [];
        setModes(rawModes);
        setContainerTypes(((ctRes as { data: CT[] }).data ?? []) as CT[]);
        setAddServices(((asRes as { data: AS[] }).data ?? []) as AS[]);
        setCargoCategories(((ccRes as { data: CC[] }).data ?? []) as CC[]);
        setDgClasses(((dgRes as { data: DC[] }).data ?? []) as DC[]);
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

            setContainerTypeId(bd.container_type_id ? String(bd.container_type_id) : "");
            setContainerCount(String(bd.container_count ?? 1));
            setWeight(bd.estimated_weight ? String(bd.estimated_weight) : "");
            setCbm(bd.estimated_cbm ? String(bd.estimated_cbm) : "");
            setCargo(String(bd.cargo_description ?? ""));
            setCargoCategoryId(bd.cargo_category_id ? String(bd.cargo_category_id) : "");

            setShipperName(String(bd.shipper_name ?? ""));
            setShipperAddress(String(bd.shipper_address ?? ""));
            setShipperPhone(String(bd.shipper_phone ?? ""));

            setConsigneeName(String(bd.consignee_name ?? ""));
            setConsigneeAddress(String(bd.consignee_address ?? ""));
            setConsigneePhone(String(bd.consignee_phone ?? ""));

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
        if (rows[0]?.id) setServiceTypeId(String(rows[0].id));
      } catch {
        setServiceTypes([]);
      }
    })();
    return () => { active = false; };
  }, [modeId]);

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

  const buildPayload = () => ({
    origin_location_id: originId ? Number(originId) : null,
    destination_location_id: destId ? Number(destId) : null,
    transport_mode_id: modeId ? Number(modeId) : null,
    service_type_id: serviceTypeId ? Number(serviceTypeId) : null,
    cargo_category_id: cargoCategoryId ? Number(cargoCategoryId) : null,
    container_type_id: !isLCL && containerTypeId ? Number(containerTypeId) : null,
    container_count: !isLCL ? (Number(containerCount) || 1) : null,
    estimated_weight: weight ? Number(weight) : null,
    estimated_cbm: cbm ? Number(cbm) : null,
    length: isLCL && itemLength ? Number(itemLength) : null,
    width: isLCL && itemWidth ? Number(itemWidth) : null,
    height: isLCL && itemHeight ? Number(itemHeight) : null,
    departure_date: departureDate || null,
    cargo_description: cargo || null,
    is_dangerous_goods: isDG ? 1 : 0,
    dg_class_id: isDG && dgClassId ? Number(dgClassId) : null,
    un_number: isDG && unNumber ? unNumber : null,
    equipment_condition: showProject && equipmentCondition ? equipmentCondition : null,
    temperature: showTemp && temperature ? Number(temperature) : null,
    shipper_name: shipperName || null,
    shipper_address: shipperAddress || null,
    shipper_phone: shipperPhone || null,
    consignee_name: consigneeName || null,
    consignee_address: consigneeAddress || null,
    consignee_phone: consigneePhone || null,
    additional_services: selectedAddOns.map((id) => ({ id })),
  });

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

      if (msdsFile) {
        // Use multipart/form-data only when there's a file to upload
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          if (k === "additional_services") {
            fd.append(k, JSON.stringify(v));
          } else {
            fd.append(k, String(v));
          }
        });
        fd.append("msds_file", msdsFile);
        if (editId) {
          bookingResponse = await updateCustomerBooking(editId, fd) as typeof bookingResponse;
        } else {
          bookingResponse = await createCustomerBookingMultipart(fd) as typeof bookingResponse;
        }
      } else if (editId) {
        // Edit an existing booking — PATCH-equivalent (Laravel uses POST + _method=PUT).
        bookingResponse = await updateCustomerBooking(editId, payload as unknown as Record<string, unknown>) as typeof bookingResponse;
      } else {
        // Send as JSON directly — this is the correct way
        bookingResponse = await createCustomerBooking(payload as unknown as Record<string, unknown>) as typeof bookingResponse;
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
    locations, modes, serviceTypes, containerTypes, addServices, cargoCategories, dgClasses,
    originId, setOriginId,
    destId, setDestId,
    modeId, setModeId,
    serviceTypeId, setServiceTypeId,
    containerTypeId, setContainerTypeId,
    containerCount, setContainerCount,
    weight, setWeight,
    cbm, setCbm,
    departureDate, setDepartureDate,
    cargo, setCargo,
    cargoCategoryId, setCargoCategoryId,
    selectedAddOns, setSelectedAddOns,
    itemLength, setItemLength,
    itemWidth, setItemWidth,
    itemHeight, setItemHeight,
    shipperName, setShipperName,
    shipperAddress, setShipperAddress,
    shipperPhone, setShipperPhone,
    isShipperSameAsAccount, setIsShipperSameAsAccount,
    consigneeName, setConsigneeName,
    consigneeAddress, setConsigneeAddress,
    consigneePhone, setConsigneePhone,
    isDG, setIsDG,
    dgClassId, setDgClassId,
    unNumber, setUnNumber,
    msdsFile, setMsdsFile,
    equipmentCondition, setEquipmentCondition,
    temperature, setTemperature,
    estimate, estimateBreakdown, error, validationErrors, renderFieldError, loading, submitting, showSuccess, setShowSuccess,
    isFCL, isLCL, selectedCT, selectedCC, showTemp, showProject,
    onEstimate, onSubmit,
    mode: editId ? ("edit" as const) : ("create" as const),
  };
}
