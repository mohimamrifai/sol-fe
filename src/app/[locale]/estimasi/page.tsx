"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowRight, Search, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  fetchPublicMasterLocations,
  fetchPublicMasterTransportModes,
  fetchPublicMasterServiceTypes,
  fetchPublicMasterContainerTypes,
  fetchPublicMasterAdditionalServices,
  fetchPublicMasterCargoCategories,
  fetchPublicMasterDgClasses,
  publicEstimateBookingPrice,
} from "@/lib/public-api";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";

import { RouteServiceSection } from "../dashboard/booking/create/components/sections/route-service-section";
import { CargoDetailSection } from "../dashboard/booking/create/components/sections/cargo-detail-section";
import { AddOnServiceSection } from "../dashboard/booking/create/components/sections/add-on-service-section";

type Loc = { id: number; name: string; code?: string };
type TM = { id: number; name: string; code?: string };
type ST = { id: number; name: string; code?: string; transport_mode_id: number };
type CT = {
  id: number;
  name: string;
  size: string;
  length?: number;
  width?: number;
  height?: number;
  capacity_weight?: number;
  capacity_cbm?: number;
};
type AS = { id: number; name: string; category: string; code?: string | null };
type CC = {
  id: number;
  name: string;
  code: string;
  requires_temperature?: boolean;
  is_project_cargo?: boolean;
  is_liquid?: boolean;
  is_food?: boolean;
};
type DC = { id: number; name: string; code: string };

const FCL_MANDATORY_CODES = ["FREE_STORAGE_FCL", "LOLO", "CONTAINER_RENT"];
const LCL_MANDATORY_CODES = ["FREE_STORAGE_LCL"];
const ALL_MANDATORY_CODES = [...FCL_MANDATORY_CODES, ...LCL_MANDATORY_CODES];

export default function PublicEstimatePage() {
  const t = useTranslations("Estimate");
  const [locations, setLocations] = useState<Loc[]>([]);
  const [modes, setModes] = useState<TM[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ST[]>([]);
  const [containerTypes, setContainerTypes] = useState<CT[]>([]);
  const [addServices, setAddServices] = useState<AS[]>([]);
  const [cargoCategories, setCargoCategories] = useState<CC[]>([]);
  const [dgClasses, setDgClasses] = useState<DC[]>([]);

  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [modeId, setModeId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [containerCount, setContainerCount] = useState("1");
  const [weight, setWeight] = useState("");
  const [cbm, setCbm] = useState("");
  const [cargoCategoryId, setCargoCategoryId] = useState("");
  
  const [isDG, setIsDG] = useState(false);
  const [dgClassId, setDgClassId] = useState("");
  const [unNumber, setUnNumber] = useState("");
  const [equipmentCondition, setEquipmentCondition] = useState("");
  const [temperature, setTemperature] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [cargo, setCargo] = useState("");
  
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemHeight, setItemHeight] = useState("");
  
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [estimate, setEstimate] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<{
    base_freight: number;
    discount_amount: number;
    additional_services_total: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [locRes, mRes, ctRes, asRes, ccRes, dgRes] = await Promise.all([
          fetchPublicMasterLocations(),
          fetchPublicMasterTransportModes(),
          fetchPublicMasterContainerTypes(),
          fetchPublicMasterAdditionalServices(),
          fetchPublicMasterCargoCategories(),
          fetchPublicMasterDgClasses(),
        ]);
        if (c) return;
        setLocations(((locRes as LaravelPaginated<Loc>).data ?? []) as Loc[]);
        const rawModes = (mRes as { data: TM[] }).data ?? [];
        const railFirst = rawModes.filter((x) => x.code === "RAIL");
        setModes(railFirst.length ? railFirst : rawModes);
        setContainerTypes(((ctRes as { data: CT[] }).data ?? []) as CT[]);
        setAddServices(((asRes as { data: AS[] }).data ?? []) as AS[]);
        setCargoCategories(((ccRes as { data: CC[] }).data ?? []) as CC[]);
        setDgClasses(((dgRes as { data: DC[] }).data ?? []) as DC[]);
        const defaultMode = (railFirst[0] ?? rawModes[0])?.id;
        if (defaultMode) setModeId(String(defaultMode));
      } catch {
        setError(t("loadError"));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modeId) return;
    let c = false;
    (async () => {
      try {
        const r = await fetchPublicMasterServiceTypes(Number(modeId));
        if (c) return;
        const rows = (r as { data: ST[] }).data ?? [];
        setServiceTypes(rows);
        const first = rows[0]?.id;
        if (first) setServiceTypeId(String(first));
      } catch {
        setServiceTypes([]);
      }
    })();
    return () => { c = true; };
  }, [modeId]);

  const selectedST = serviceTypes.find((s) => String(s.id) === serviceTypeId);
  const isFCL = selectedST?.code === "FCL";
  const isLCL = selectedST?.code === "LCL";
  const selectedCT = containerTypes.find((c) => String(c.id) === containerTypeId);
  // const selectedOrigin = locations.find((l) => String(l.id) === originId);
  // const selectedDest = locations.find((l) => String(l.id) === destId);
  // const selectedMode = modes.find((m) => String(m.id) === modeId);
  const selectedCC = cargoCategories.find((c) => String(c.id) === cargoCategoryId);
  // const selectedDgClass = dgClasses.find((d) => String(d.id) === dgClassId);

  const showTemp = selectedCC?.requires_temperature;
  const showProject = selectedCC?.is_project_cargo;

  // const locationOptions: ComboOption[] = locations.map((l) => ({
  //   value: String(l.id),
  //   label: `${l.name}${l.code ? ` (${l.code})` : ""}`,
  // }));
  // const modeOptions: ComboOption[] = modes.map((m) => ({
  //   value: String(m.id),
  //   label: `${m.name}${m.code ? ` (${m.code})` : ""}`,
  // }));
  // const serviceOptions: ComboOption[] = serviceTypes.map((s) => ({
  //   value: String(s.id),
  //   label: `${s.name}${s.code ? ` (${s.code})` : ""}`,
  // }));
  // const containerOptions: ComboOption[] = containerTypes.map((c) => ({
  //   value: String(c.id),
  //   label: `${c.name} (${c.size})`,
  // }));
  // const cargoCategoryOptions: ComboOption[] = cargoCategories.map((c) => ({
  //   value: String(c.id),
  //   label: c.name,
  // }));
  // const dgClassOptions: ComboOption[] = dgClasses.map((d) => ({
  //   value: String(d.id),
  //   label: d.name,
  // }));

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

  useEffect(() => {
    if (equipmentCondition === "RESIDUAL" || selectedCC?.code === "DG") {
      setIsDG(true);
    } else {
      setIsDG(false);
    }
  }, [equipmentCondition, selectedCC]);

  const fmtIdr = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);

  const onEstimate = async () => {
    setError(null);
    setEstimate(null);
    setBreakdown(null);
    setEstimating(true);
    try {
      const payload = {
        origin_location_id: Number(originId),
        destination_location_id: Number(destId),
        transport_mode_id: Number(modeId),
        service_type_id: Number(serviceTypeId),
        cargo_category_id: cargoCategoryId ? Number(cargoCategoryId) : null,
        container_type_id: !isLCL && containerTypeId ? Number(containerTypeId) : null,
        container_count: !isLCL ? (Number(containerCount) || 1) : null,
        estimated_weight: weight ? Number(weight) : null,
        estimated_cbm: cbm ? Number(cbm) : null,
        is_dangerous_goods: isDG ? 1 : 0,
        dg_class_id: isDG && dgClassId ? Number(dgClassId) : null,
        un_number: isDG && unNumber ? unNumber : null,
        equipment_condition: showProject && equipmentCondition ? equipmentCondition : null,
        temperature: showTemp && temperature ? Number(temperature) : null,
        additional_services: selectedAddOns.map((id) => ({ id })),
      };
      const r = await publicEstimateBookingPrice(payload);
      const inner = (r as { data?: { estimated_price?: number; breakdown?: typeof breakdown } }).data;
      if (inner?.estimated_price != null) {
        setEstimate(fmtIdr(Number(inner.estimated_price)));
        if (inner.breakdown) setBreakdown(inner.breakdown as NonNullable<typeof breakdown>);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("estimateError"));
    } finally {
      setEstimating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b1b69] via-[#0d2280] to-[#162ea8] pb-16 pt-32 md:pb-20 md:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-[100px]" />
          <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-sky-300/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Calculator className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-indigo-200 sm:text-base">
            {t("subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tracking"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
              {t("goTracking")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-5xl px-6 md:mt-10 md:px-12">
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <RouteServiceSection
              locations={locations}
              modes={modes}
              serviceTypes={serviceTypes}
              originId={originId}
              setOriginId={setOriginId}
              destId={destId}
              setDestId={setDestId}
              modeId={modeId}
              setModeId={setModeId}
              serviceTypeId={serviceTypeId}
              setServiceTypeId={setServiceTypeId}
              renderFieldError={() => null}
            />

            <CargoDetailSection
              isLCL={isLCL}
              isFCL={isFCL}
              containerTypes={containerTypes}
              cargoCategories={cargoCategories}
              dgClasses={dgClasses}
              containerTypeId={containerTypeId}
              setContainerTypeId={setContainerTypeId}
              containerCount={containerCount}
              setContainerCount={setContainerCount}
              weight={weight}
              setWeight={setWeight}
              cbm={cbm}
              setCbm={setCbm}
              itemLength={itemLength}
              setItemLength={setItemLength}
              itemWidth={itemWidth}
              setItemWidth={setItemWidth}
              itemHeight={itemHeight}
              setItemHeight={setItemHeight}
              departureDate={departureDate}
              setDepartureDate={setDepartureDate}
              cargoCategoryId={cargoCategoryId}
              setCargoCategoryId={setCargoCategoryId}
              cargo={cargo}
              setCargo={setCargo}
              selectedCT={selectedCT}
              selectedCC={selectedCC}
              isDG={isDG}
              dgClassId={dgClassId}
              setDgClassId={setDgClassId}
              unNumber={unNumber}
              setUnNumber={setUnNumber}
              msdsFile={null}
              setMsdsFile={() => {}}
              equipmentCondition={equipmentCondition}
              setEquipmentCondition={setEquipmentCondition}
              temperature={temperature}
              setTemperature={setTemperature}
              showTemp={showTemp}
              showProject={showProject}
              renderFieldError={() => null}
            />

            <AddOnServiceSection
              isFCL={isFCL}
              isLCL={isLCL}
              addServices={addServices}
              selectedAddOns={selectedAddOns}
              setSelectedAddOns={setSelectedAddOns}
            />
          </div>

          <div className="flex flex-col gap-6 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Informasi Biaya</p>
                {estimate ? (
                  <p className="text-xl font-black text-emerald-700">{estimate}</p>
                ) : (
                  <p className="text-sm text-zinc-400 italic">Silakan klik tombol estimasi untuk melihat perkiraan harga.</p>
                )}
                {estimate && (
                   <p className="text-[10px] text-zinc-500">* Harga di atas bersifat estimasi dan akan dikonfirmasi kembali oleh operasional.</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  type="button"
                  className="gap-2 rounded-full bg-[#0b1b69] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0d2280]"
                  onClick={() => void onEstimate()}
                  disabled={estimating || !originId || !destId || !modeId || !serviceTypeId}
                >
                  {estimating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t("estimating")}</>
                  ) : (
                    <><Calculator className="h-4 w-4" /> {t("estimateCta")}</>
                  )}
                </Button>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 rounded-full px-5 py-3 text-sm font-medium text-zinc-600 transition-colors hover:text-[#0b1b69]"
                >
                  {t("registerHint")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            {breakdown ? (
              <div className="space-y-2 border-t border-zinc-200 pt-4 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>{t("breakdownBase")}</span>
                  <span>{fmtIdr(breakdown.base_freight)}</span>
                </div>
                {breakdown.discount_amount > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>{t("breakdownDiscount")}</span>
                    <span>-{fmtIdr(breakdown.discount_amount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-zinc-600">
                  <span>{t("breakdownAddOns")}</span>
                  <span>{fmtIdr(breakdown.additional_services_total)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
                  <span>{t("breakdownTotal")}</span>
                  <span>{fmtIdr(breakdown.total)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
