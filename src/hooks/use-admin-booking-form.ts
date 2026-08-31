import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import type { AttachmentDraft, ContainerRow, CustomerLoc, PackageRow } from "@/hooks/use-booking-form";
import {
  fetchAdminAdditionalServices,
  fetchAdminCompanies,
  fetchAdminCompanyLocations,
  fetchAdminContainerTypes,
  fetchAdminLocations,
  fetchAdminServiceTypes,
  fetchAdminTransportModes,
  fetchAdminCargoCategories,
  fetchAdminDgClasses,
  estimateAdminBookingPrice,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import {
  deriveBookingCargoCategoryId,
  mapContainerRowsForApi,
  mapPackageRowsForApi,
} from "@/lib/admin-booking-payload";

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
export type Coverage = { value: string };
export type EstimateBreakdown = {
  freight?: number;
  pickup?: number;
  delivery?: number;
  discount?: number;
  additional_services?: number;
  total?: number;
};

const PER_PAGE = 100;
const FCL_MANDATORY_CODES = ["FREE_STORAGE_FCL", "LOLO", "CONTAINER_RENT"];
const LCL_MANDATORY_CODES = ["FREE_STORAGE_LCL"];
const COVERAGE_ADDON_CODES = ["PICKUP", "DELIVERY"] as const;
export const ALL_MANDATORY_CODES = [...FCL_MANDATORY_CODES, ...LCL_MANDATORY_CODES, ...COVERAGE_ADDON_CODES];

export const ADMIN_SHIPMENT_COVERAGES: Coverage[] = [
  { value: "port_to_port" },
  { value: "door_to_port" },
  { value: "port_to_door" },
  { value: "door_to_door" },
];

const FSD_SERVICE_TYPE_CODES = new Set(["FCL", "LCL"]);

function filterFsdServiceTypes(rows: ST[]): ST[] {
  return rows.filter((s) => FSD_SERVICE_TYPE_CODES.has(s.code ?? ""));
}

const DEFAULT_COUNTRY = "Indonesia";

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
  const [customerLocations, setCustomerLocations] = useState<CustomerLoc[]>([]);

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
  const [departureDate, setDepartureDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [shipmentCoverage, setShipmentCoverage] = useState("port_to_port");
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

  const [isDg, setIsDg] = useState(false);
  const [dgClassId, setDgClassId] = useState("");
  const [unNumber, setUnNumber] = useState("");
  const [msdsFile, setMsdsFile] = useState<File | null>(null);

  const [equipmentCondition, setEquipmentCondition] = useState("");
  const [temperature, setTemperature] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [containerResponsibility, setContainerResponsibility] = useState("COC");
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [confirmBooking, setConfirmBooking] = useState(false);

  const [estimate, setEstimate] = useState<string | null>(null);
  const [estimateBreakdown, setEstimateBreakdown] = useState<EstimateBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;
    let c = false;
    (async () => {
      try {
        const [coRes, locRes, mRes, stRes, ctRes, asRes, ccRes, dgRes] = await Promise.all([
          fetchAdminCompanies({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminLocations({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminTransportModes({ page: 1, perPage: PER_PAGE, status: "active" }),
          fetchAdminServiceTypes({ page: 1, perPage: PER_PAGE, status: "active" }),
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
        const modeList = railFirst.length ? railFirst : rawModes;
        setModes(modeList);
        if (modeList[0]) setModeId(String(modeList[0].id));
        const rows = filterFsdServiceTypes(((stRes as LaravelPaginated<ST>).data ?? []) as ST[]);
        setServiceTypes(rows);
        const defaultSt = rows.find((s) => s.code === "FCL") ?? rows[0];
        if (defaultSt) setServiceTypeId(String(defaultSt.id));
        setContainerTypes(((ctRes as LaravelPaginated<CT>).data ?? []) as CT[]);
        setAddServices(((asRes as LaravelPaginated<AS>).data ?? []) as AS[]);
        setCargoCats(((ccRes as LaravelPaginated<CC>).data ?? []) as CC[]);
        setDgClasses(((dgRes as LaravelPaginated<DC>).data ?? []) as DC[]);
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

  useEffect(() => {
    if (!authHydrated || !companyId) {
      setCustomerLocations([]);
      return;
    }
    let c = false;
    (async () => {
      try {
        const res = await fetchAdminCompanyLocations(Number(companyId), {
          page: 1,
          perPage: PER_PAGE,
          status: "active",
        });
        if (c) return;
        setCustomerLocations(
          (((res as LaravelPaginated<Record<string, unknown>>).data ?? []) as CustomerLoc[]).filter(
            (loc) => loc
          )
        );
      } catch {
        if (!c) setCustomerLocations([]);
      }
    })();
    return () => {
      c = true;
    };
  }, [authHydrated, companyId]);

  const selectedST = serviceTypes.find((s) => String(s.id) === serviceTypeId);

  useEffect(() => {
    if (!selectedST?.transport_mode_id) return;
    setModeId(String(selectedST.transport_mode_id));
  }, [serviceTypeId, selectedST?.transport_mode_id]);

  const isFCL = selectedST?.code === "FCL";
  const isLCL = selectedST?.code === "LCL";
  const selectedContainerType = containerTypes.find((c) => String(c.id) === containerTypeId);
  const selectedCompany = companies.find((c) => String(c.id) === companyId);
  const selectedCargoCategory = cargoCats.find((c) => String(c.id) === cargoCategoryId);
  const showTemp = selectedCargoCategory?.requires_temperature;
  const showProject = selectedCargoCategory?.is_project_cargo;

  useEffect(() => {
    if (selectedCompany?.name) {
      setShipperName(selectedCompany.name);
    }
  }, [companyId, selectedCompany?.name]);

  useEffect(() => {
    setIsDg(selectedCargoCategory?.code === "DG");
  }, [cargoCategoryId, selectedCargoCategory]);

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
      if (l && w && h) setCbm(String((l * w * h) / 1_000_000));
    }
  }, [isLCL, itemLength, itemWidth, itemHeight]);

  useEffect(() => {
    if (addServices.length > 0 && serviceTypeId) {
      const codes = [
        ...(isFCL ? FCL_MANDATORY_CODES : isLCL ? LCL_MANDATORY_CODES : []),
        ...(shipmentCoverage === "door_to_port" || shipmentCoverage === "door_to_door" ? ["PICKUP"] : []),
        ...(shipmentCoverage === "port_to_door" || shipmentCoverage === "door_to_door" ? ["DELIVERY"] : []),
      ];
      const mandatoryIds = addServices.filter((s) => s.code != null && codes.includes(s.code)).map((s) => s.id);
      setSelectedAddOns((prev) => {
        const others = prev.filter(
          (id) => !ALL_MANDATORY_CODES.includes(addServices.find((s) => s.id === id)?.code ?? "")
        );
        return Array.from(new Set([...others, ...mandatoryIds]));
      });
    }
  }, [serviceTypeId, addServices, isFCL, isLCL, shipmentCoverage]);

  const showPickupFields = shipmentCoverage === "door_to_port" || shipmentCoverage === "door_to_door";
  const showDeliveryFields = shipmentCoverage === "port_to_door" || shipmentCoverage === "door_to_door";

  useEffect(() => {
    if (!authHydrated || loading || !companyId || !originId || !destId || !modeId || !serviceTypeId) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const pkgTotalWeight = packages.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);
          const pkgTotalCbm = packages.reduce((acc, p) => {
            const qty = Number(p.piece_count) || 1;
            const l = Number(p.length_cm) || 0;
            const w = Number(p.width_cm) || 0;
            const h = Number(p.height_cm) || 0;
            if (!l || !w || !h) return acc;
            return acc + ((l * w * h) / 1_000_000) * qty;
          }, 0);
          const ctrTotalQty = containers.reduce((acc, c) => acc + (Number(c.quantity) || 1), 0);
          const ctrFirstType = containers[0]?.container_type_id;
          const derivedCategory = deriveBookingCargoCategoryId(packages, containers, cargoCategoryId);

          const r = await estimateAdminBookingPrice({
            company_id: Number(companyId),
            origin_location_id: Number(originId),
            destination_location_id: Number(destId),
            transport_mode_id: Number(modeId),
            service_type_id: Number(serviceTypeId),
            shipment_coverage: shipmentCoverage,
            cargo_category_id: derivedCategory ? Number(derivedCategory) : null,
            container_type_id: isFCL && ctrFirstType ? Number(ctrFirstType) : !isLCL && containerTypeId ? Number(containerTypeId) : null,
            container_count: isFCL ? ctrTotalQty : !isLCL ? Number(containerCount) || 1 : null,
            estimated_weight: isLCL ? pkgTotalWeight || null : weight ? Number(weight) : null,
            estimated_cbm: isLCL ? pkgTotalCbm || null : cbm ? Number(cbm) : null,
            additional_services: selectedAddOns.map((id) => ({ id })),
          });
          if (cancelled) return;
          const inner = (r as { data?: { estimated_price?: number; breakdown?: EstimateBreakdown } }).data;
          setEstimate(
            inner?.estimated_price != null
              ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(inner.estimated_price))
              : null
          );
          setEstimateBreakdown(inner?.breakdown ?? null);
        } catch {
          if (!cancelled) {
            setEstimate(null);
            setEstimateBreakdown(null);
          }
        }
      })();
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    authHydrated,
    loading,
    companyId,
    originId,
    destId,
    modeId,
    serviceTypeId,
    shipmentCoverage,
    isFCL,
    isLCL,
    containerTypeId,
    containerCount,
    weight,
    cbm,
    packages,
    containers,
    selectedAddOns,
    cargoCategoryId,
  ]);

  const renderFieldError = useCallback(
    (field: string): string | null => validationErrors?.[field]?.[0] ?? null,
    [validationErrors]
  );

  const buildFormData = useCallback(
    (asDraft: boolean): FormData => {
      const pkgRows = mapPackageRowsForApi(packages, cargoCats);
      const ctrRows = mapContainerRowsForApi(containers, cargoCats);
      const derivedCargoCategoryId = deriveBookingCargoCategoryId(packages, containers, cargoCategoryId);

      const pkgTotalCbm = packages.reduce((acc, p) => {
        const qty = Number(p.piece_count) || 1;
        const l = Number(p.length_cm) || 0;
        const w = Number(p.width_cm) || 0;
        const h = Number(p.height_cm) || 0;
        if (!l || !w || !h) return acc;
        return acc + ((l * w * h) / 1_000_000) * qty;
      }, 0);
      const pkgTotalWeight = packages.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);
      const ctrTotalQty = containers.reduce((acc, c) => acc + (Number(c.quantity) || 1), 0);
      const ctrFirstType = containers[0]?.container_type_id;

      const payload: Record<string, unknown> = {
        company_id: companyId ? Number(companyId) : null,
        origin_location_id: originId ? Number(originId) : null,
        destination_location_id: destId ? Number(destId) : null,
        transport_mode_id: modeId ? Number(modeId) : null,
        service_type_id: serviceTypeId ? Number(serviceTypeId) : null,
        shipment_coverage: shipmentCoverage || null,
        pickup_date: pickupDate || null,
        pickup_time: pickupTime || null,
        pickup_notes: pickupNotes || null,
        delivery_notes: deliveryNotes || null,
        is_draft: asDraft ? 1 : 0,
        container_responsibility: isFCL ? containerResponsibility : null,
        container_type_id:
          isFCL && ctrFirstType ? Number(ctrFirstType) : !isLCL && containerTypeId ? Number(containerTypeId) : null,
        container_count: isFCL ? ctrTotalQty : !isLCL ? Number(containerCount) || 1 : null,
        estimated_weight: isLCL ? pkgTotalWeight || null : weight ? Number(weight) : null,
        estimated_cbm: isLCL ? pkgTotalCbm || null : cbm ? Number(cbm) : null,
        cargo_category_id: derivedCargoCategoryId ? Number(derivedCargoCategoryId) : null,
        shipper_name: shipperName || null,
        shipper_address: shipperAddress || null,
        shipper_phone: shipperPhone || null,
        shipper_location_id: shipperLocationId ? Number(shipperLocationId) : null,
        shipper_snapshot: {
          company: shipperName || null,
          pic_name: shipperPicName || null,
          pic_email: shipperPicEmail || null,
          pic_mobile: shipperPicMobile || null,
          country: DEFAULT_COUNTRY,
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
        consignee_location_id:
          consigneeType === "customer_location" && consigneeLocationId ? Number(consigneeLocationId) : null,
        consignee_snapshot: {
          company: consigneeName || null,
          pic_name: consigneePicName || null,
          pic_email: consigneePicEmail || null,
          pic_mobile: consigneePicMobile || null,
          country: DEFAULT_COUNTRY,
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
      };

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

      return fd;
    },
    [
      packages,
      containers,
      cargoCats,
      companyId,
      originId,
      destId,
      modeId,
      serviceTypeId,
      shipmentCoverage,
      pickupDate,
      pickupTime,
      pickupNotes,
      deliveryNotes,
      isFCL,
      containerResponsibility,
      isLCL,
      containerTypeId,
      containerCount,
      weight,
      cbm,
      shipperName,
      shipperAddress,
      shipperPhone,
      shipperLocationId,
      shipperPicName,
      shipperPicEmail,
      shipperPicMobile,
      shipperProvinceId,
      shipperCityId,
      shipperDistrictId,
      shipperPostalCode,
      consigneeName,
      consigneeAddress,
      consigneePhone,
      consigneeType,
      consigneeLocationId,
      consigneePicName,
      consigneePicEmail,
      consigneePicMobile,
      consigneeProvinceId,
      consigneeCityId,
      consigneeDistrictId,
      consigneePostalCode,
      cargoCategoryId,
      selectedAddOns,
      attachments,
    ]
  );

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
    confirmBooking,
    setConfirmBooking,
    coverages: ADMIN_SHIPMENT_COVERAGES,
    customerLocations,
    companies,
    locations,
    modes,
    serviceTypes,
    containerTypes,
    addServices,
    cargoCats,
    dgClasses,
    companyId,
    setCompanyId,
    originId,
    setOriginId,
    destId,
    setDestId,
    modeId,
    setModeId,
    serviceTypeId,
    setServiceTypeId,
    containerTypeId,
    setContainerTypeId,
    containerCount,
    setContainerCount,
    weight,
    setWeight,
    cbm,
    setCbm,
    itemLength,
    setItemLength,
    itemWidth,
    setItemWidth,
    itemHeight,
    setItemHeight,
    pickupDate,
    setPickupDate,
    departureDate,
    setDepartureDate,
    pickupTime,
    setPickupTime,
    pickupNotes,
    setPickupNotes,
    deliveryNotes,
    setDeliveryNotes,
    shipmentCoverage,
    setShipmentCoverage,
    cargo,
    setCargo,
    cargoCategoryId,
    setCargoCategoryId,
    shipperName,
    setShipperName,
    shipperAddress,
    setShipperAddress,
    shipperPhone,
    setShipperPhone,
    shipperLocationId,
    setShipperLocationId,
    shipperPicName,
    setShipperPicName,
    shipperPicEmail,
    setShipperPicEmail,
    shipperPicMobile,
    setShipperPicMobile,
    shipperProvinceId,
    setShipperProvinceId,
    shipperCityId,
    setShipperCityId,
    shipperDistrictId,
    setShipperDistrictId,
    shipperPostalCode,
    setShipperPostalCode,
    consigneeName,
    setConsigneeName,
    consigneeAddress,
    setConsigneeAddress,
    consigneePhone,
    setConsigneePhone,
    consigneeType,
    setConsigneeType,
    consigneeLocationId,
    setConsigneeLocationId,
    consigneePicName,
    setConsigneePicName,
    consigneePicEmail,
    setConsigneePicEmail,
    consigneePicMobile,
    setConsigneePicMobile,
    consigneeProvinceId,
    setConsigneeProvinceId,
    consigneeCityId,
    setConsigneeCityId,
    consigneeDistrictId,
    setConsigneeDistrictId,
    consigneePostalCode,
    setConsigneePostalCode,
    isDg,
    setIsDg,
    dgClassId,
    setDgClassId,
    unNumber,
    setUnNumber,
    msdsFile,
    setMsdsFile,
    equipmentCondition,
    setEquipmentCondition,
    temperature,
    setTemperature,
    selectedAddOns,
    setSelectedAddOns,
    containerResponsibility,
    setContainerResponsibility,
    packages,
    setPackages,
    containers,
    setContainers,
    attachments,
    setAttachments,
    selectedST,
    isFCL,
    isLCL,
    selectedContainerType,
    selectedCompany,
    selectedCargoCategory,
    showTemp,
    showProject,
    showPickupFields,
    showDeliveryFields,
    renderFieldError,
    buildFormData,
  };
}
