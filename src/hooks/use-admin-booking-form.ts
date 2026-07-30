import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import {
  fetchAdminAdditionalServices,
  fetchAdminCompanies,
  fetchAdminContainerTypes,
  fetchAdminLocations,
  fetchAdminServiceTypes,
  fetchAdminTransportModes,
  fetchAdminCargoCategories,
  fetchAdminDgClasses,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";

export type Company = { id: number; name: string; address?: string; phone?: string };
export type Loc = { id: number; name: string; code?: string };
export type TM = { id: number; name: string; code?: string };
export type ST = { id: number; name: string; code?: string; transport_mode_id: number };
export type CT = {
  id: number;
  name: string;
  size: string;
  capacity_weight?: number;
  capacity_cbm?: number;
};
export type AS = { id: number; name: string; category: string; code?: string | null };
export type DC = { id: number; name: string; code: string };
export type CC = {
  id: number;
  name: string;
  code: string;
  requires_temperature?: boolean;
  is_project_cargo?: boolean;
};
export type EstimateBreakdown = {
  freight: number;
  discount: number;
  additional_services: number;
  total: number;
};

const PER_PAGE = 1000;
const FCL_MANDATORY_CODES = ["FREE_STORAGE_FCL", "LOLO", "CONTAINER_RENT"];
const LCL_MANDATORY_CODES = ["FREE_STORAGE_LCL"];
export const ALL_MANDATORY_CODES = [...FCL_MANDATORY_CODES, ...LCL_MANDATORY_CODES];

export function useAdminBookingForm() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();

  const canCreate = useMemo(() => {
    if (!authHydrated) return false;
    const roles = user?.roles ?? [];
    return roles.includes("super_admin") || roles.includes("operations");
  }, [authHydrated, user?.roles]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [modes, setModes] = useState<TM[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ST[]>([]);
  const [containerTypes, setContainerTypes] = useState<CT[]>([]);
  const [addServices, setAddServices] = useState<AS[]>([]);
  const [cargoCats, setCargoCats] = useState<CC[]>([]);
  const [dgClasses, setDgClasses] = useState<DC[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [modeId, setModeId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [containerCount, setContainerCount] = useState("1");
  const [weight, setWeight] = useState("");
  const [cbm, setCbm] = useState("");
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemHeight, setItemHeight] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargoCategoryId, setCargoCategoryId] = useState("");

  const [shipper, setShipper] = useState({ name: "", address: "", phone: "" });
  const [consignee, setConsignee] = useState({ name: "", address: "", phone: "" });

  const [isDg, setIsDg] = useState(false);
  const [dgClassId, setDgClassId] = useState("");
  const [unNumber, setUnNumber] = useState("");
  const [msdsFile, setMsdsFile] = useState<File | null>(null);

  const [equipmentCondition, setEquipmentCondition] = useState("");
  const [temperature, setTemperature] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

  const [estimate, setEstimate] = useState<string | null>(null);
  const [estimateBreakdown, setEstimateBreakdown] = useState<EstimateBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load masters
  useEffect(() => {
    if (!authHydrated) return;
    let c = false;
    (async () => {
      try {
        const [coRes, locRes, mRes, ctRes, asRes, ccRes, dgRes] = await Promise.all([
          fetchAdminCompanies({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminLocations({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminTransportModes({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminContainerTypes({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminAdditionalServices({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminCargoCategories({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminDgClasses({ page: 1, perPage: PER_PAGE, status: "active" }),
        ]);
        if (c) return;
        setCompanies(((coRes as LaravelPaginated<Company>).data ?? []) as Company[]);
        setLocations(((locRes as LaravelPaginated<Loc>).data ?? []) as Loc[]);
        const rawModes = ((mRes as LaravelPaginated<TM>).data ?? []) as TM[];
        const railFirst = rawModes.filter((x) => x.code === "RAIL");
        setModes(railFirst.length ? railFirst : rawModes);
        setContainerTypes(((ctRes as LaravelPaginated<CT>).data ?? []) as CT[]);
        setAddServices(((asRes as LaravelPaginated<AS>).data ?? []) as AS[]);
        setCargoCats(((ccRes as LaravelPaginated<CC>).data ?? []) as CC[]);
        setDgClasses(((dgRes as LaravelPaginated<DC>).data ?? []) as DC[]);

        const defaultCompany = ((coRes as LaravelPaginated<Company>).data ?? [])[0]?.id;
        if (defaultCompany) setCompanyId(String(defaultCompany));

        const defaultMode = (railFirst[0] ?? rawModes[0])?.id;
        if (defaultMode) setModeId(String(defaultMode));
      } catch {
        setError("Gagal memuat master data.");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [authHydrated]);

  // Load service types based on modeId
  useEffect(() => {
    if (!authHydrated || !modeId) return;
    let c = false;
    (async () => {
      try {
        const r = await fetchAdminServiceTypes({
          page: 1,
          perPage: PER_PAGE,
          status: "active",
          transportModeId: Number(modeId),
        });
        if (c) return;
        const rows = ((r as LaravelPaginated<ST>).data ?? []) as ST[];
        setServiceTypes(rows);
        const first = rows[0]?.id;
        if (first) setServiceTypeId(String(first));
      } catch {
        setServiceTypes([]);
      }
    })();
    return () => {
      c = true;
    };
  }, [authHydrated, modeId]);

  const selectedST = serviceTypes.find((s) => String(s.id) === serviceTypeId);
  const isFCL = selectedST?.code === "FCL";
  const isLCL = selectedST?.code === "LCL";
  const selectedContainerType = containerTypes.find((c) => String(c.id) === containerTypeId);
  const selectedCompany = companies.find((c) => String(c.id) === companyId);
  const selectedCargoCategory = cargoCats.find((c) => String(c.id) === cargoCategoryId);
  const showTemp = selectedCargoCategory?.requires_temperature;
  const showProject = selectedCargoCategory?.is_project_cargo;

  // Auto-DG logic based on Cargo Category
  useEffect(() => {
    if (selectedCargoCategory?.code === "DG") {
      setIsDg(true);
    } else {
      setIsDg(false);
    }
  }, [cargoCategoryId, selectedCargoCategory]);

  // Auto-calculate CBM and Weight
  useEffect(() => {
    if (!isLCL && selectedContainerType) {
      const qty = Number(containerCount) || 1;
      setWeight(String((selectedContainerType.capacity_weight || 0) * qty));
      setCbm(String((selectedContainerType.capacity_cbm || 0) * qty));
    }
  }, [containerTypeId, containerCount, selectedContainerType, isLCL]);

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

  useEffect(() => {
    if (addServices.length > 0 && serviceTypeId) {
      const codes = isFCL ? FCL_MANDATORY_CODES : isLCL ? LCL_MANDATORY_CODES : [];
      const mandatoryIds = addServices
        .filter((s) => s.code != null && codes.includes(s.code))
        .map((s) => s.id);
      setSelectedAddOns((prev) => {
        const others = prev.filter(
          (id) =>
            !ALL_MANDATORY_CODES.includes(
              addServices.find((s) => s.id === id)?.code ?? ""
            )
        );
        return Array.from(new Set([...others, ...mandatoryIds]));
      });
    }
  }, [serviceTypeId, addServices, isFCL, isLCL]);

  return {
    canCreate,
    loading,
    submitting,
    setSubmitting,
    error,
    setError,
    validationErrors,
    setValidationErrors,
    estimate,
    setEstimate,
    estimateBreakdown,
    setEstimateBreakdown,
    
    // Masters
    companies,
    locations,
    modes,
    serviceTypes,
    containerTypes,
    addServices,
    cargoCats,
    dgClasses,

    // State & Setters
    companyId, setCompanyId,
    originId, setOriginId,
    destId, setDestId,
    modeId, setModeId,
    serviceTypeId, setServiceTypeId,
    containerTypeId, setContainerTypeId,
    containerCount, setContainerCount,
    weight, setWeight,
    cbm, setCbm,
    itemLength, setItemLength,
    itemWidth, setItemWidth,
    itemHeight, setItemHeight,
    pickupDate, setPickupDate,
    cargo, setCargo,
    cargoCategoryId, setCargoCategoryId,
    shipper, setShipper,
    consignee, setConsignee,
    isDg, setIsDg,
    dgClassId, setDgClassId,
    unNumber, setUnNumber,
    msdsFile, setMsdsFile,
    equipmentCondition, setEquipmentCondition,
    temperature, setTemperature,
    selectedAddOns, setSelectedAddOns,

    // Derived
    selectedST,
    isFCL,
    isLCL,
    selectedContainerType,
    selectedCompany,
    selectedCargoCategory,
    showTemp,
    showProject,
  };
}
