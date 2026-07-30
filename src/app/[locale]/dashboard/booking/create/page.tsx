"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useBookingForm } from "./hooks/use-booking-form";
import { useQueryClient } from "@tanstack/react-query";
import { createCustomerBooking } from "@/lib/customer-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

// Section Components
import { RouteServiceSection } from "./components/sections/route-service-section";
import { PartyInfoSection } from "./components/sections/party-info-section";
import { CargoDetailSection } from "./components/sections/cargo-detail-section";
import { AddOnServiceSection } from "./components/sections/add-on-service-section";

export default function CreateBookingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("Bookings.create");
  const tCommon = useTranslations("Bookings");
  const f = useBookingForm();
  const locale = useLocale();
  const [draftSubmitting, setDraftSubmitting] = useState(false);

  if (f.loading) {
    return <p className="p-10 text-sm text-muted-foreground text-center">{t("loadingForm")}</p>;
  }

  const isAnySubmitting = f.submitting || draftSubmitting;

  const handleSaveAsDraft = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (f.mode === "edit") return; // Drafts only apply to new bookings.
    if (isAnySubmitting) return;
    setDraftSubmitting(true);
    try {
      // Rebuild the same payload the hook builds, with is_draft: true.
      const payload: Record<string, unknown> = {
        origin_location_id: f.originId ? Number(f.originId) : null,
        destination_location_id: f.destId ? Number(f.destId) : null,
        transport_mode_id: f.modeId ? Number(f.modeId) : null,
        service_type_id: f.serviceTypeId ? Number(f.serviceTypeId) : null,
        cargo_category_id: f.cargoCategoryId ? Number(f.cargoCategoryId) : null,
        container_type_id: !f.isLCL && f.containerTypeId ? Number(f.containerTypeId) : null,
        container_count: !f.isLCL ? Number(f.containerCount) || 1 : null,
        estimated_weight: f.weight ? Number(f.weight) : null,
        estimated_cbm: f.cbm ? Number(f.cbm) : null,
        length: f.isLCL && f.itemLength ? Number(f.itemLength) : null,
        width: f.isLCL && f.itemWidth ? Number(f.itemWidth) : null,
        height: f.isLCL && f.itemHeight ? Number(f.itemHeight) : null,
        departure_date: f.departureDate || null,
        cargo_description: f.cargo || null,
        is_dangerous_goods: f.isDG ? 1 : 0,
        dg_class_id: f.isDG && f.dgClassId ? Number(f.dgClassId) : null,
        un_number: f.isDG && f.unNumber ? f.unNumber : null,
        equipment_condition: f.showProject && f.equipmentCondition ? f.equipmentCondition : null,
        temperature: f.showTemp && f.temperature ? Number(f.temperature) : null,
        shipper_name: f.shipperName || null,
        shipper_address: f.shipperAddress || null,
        shipper_phone: f.shipperPhone || null,
        consignee_name: f.consigneeName || null,
        consignee_address: f.consigneeAddress || null,
        consignee_phone: f.consigneePhone || null,
        additional_services: f.selectedAddOns.map((id) => ({ id })),
        is_draft: true,
      };
      await createCustomerBooking(payload);
      toast.success(t("saveAsDraftSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["customer", "bookings", "stats"] });
      router.push("/dashboard/booking?status=draft");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : tCommon("loadError");
      toast.error(msg);
    } finally {
      setDraftSubmitting(false);
    }
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">
              {t("pageTitle")}
            </h1>
            <p className="mt-1 text-sm text-balance text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
      </div>

      {f.error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 space-y-2">
          <div className="flex items-start gap-2 font-semibold">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{f.error}</span>
          </div>
          {f.validationErrors && Object.keys(f.validationErrors).length > 0 && (
            <ul className="ml-6 space-y-0.5 list-disc text-[12px] font-normal text-red-500">
              {Object.entries(f.validationErrors).map(([field, msgs]) =>
                msgs.map((msg, i) => (
                  <li key={`${field}-${i}`}>{msg}</li>
                ))
              )}
            </ul>
          )}
        </div>
      ) : null}

      <form onSubmit={f.onSubmit} className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section 1: Route & Type */}
          <RouteServiceSection
            locations={f.locations}
            modes={f.modes}
            serviceTypes={f.serviceTypes}
            originId={f.originId}
            setOriginId={f.setOriginId}
            destId={f.destId}
            setDestId={f.setDestId}
            modeId={f.modeId}
            setModeId={f.setModeId}
            serviceTypeId={f.serviceTypeId}
            setServiceTypeId={f.setServiceTypeId}
            renderFieldError={f.renderFieldError}
          />

          {/* Section 2: Parties */}
          <PartyInfoSection
            type="Shipper"
            name={f.shipperName}
            setName={f.setShipperName}
            phone={f.shipperPhone}
            setPhone={f.setShipperPhone}
            address={f.shipperAddress}
            setAddress={f.setShipperAddress}
            isSameAsAccount={f.isShipperSameAsAccount}
            setIsSameAsAccount={f.setIsShipperSameAsAccount}
            renderFieldError={f.renderFieldError}
          />

          <PartyInfoSection
            type="Consignee"
            name={f.consigneeName}
            setName={f.setConsigneeName}
            phone={f.consigneePhone}
            setPhone={f.setConsigneePhone}
            address={f.consigneeAddress}
            setAddress={f.setConsigneeAddress}
            renderFieldError={f.renderFieldError}
          />

          {/* Section 3: Cargo */}
          <CargoDetailSection
            isLCL={f.isLCL}
            isFCL={f.isFCL}
            containerTypes={f.containerTypes}
            cargoCategories={f.cargoCategories}
            dgClasses={f.dgClasses}
            containerTypeId={f.containerTypeId}
            setContainerTypeId={f.setContainerTypeId}
            containerCount={f.containerCount}
            setContainerCount={f.setContainerCount}
            weight={f.weight}
            setWeight={f.setWeight}
            cbm={f.cbm}
            setCbm={f.setCbm}
            itemLength={f.itemLength}
            setItemLength={f.setItemLength}
            itemWidth={f.itemWidth}
            setItemWidth={f.setItemWidth}
            itemHeight={f.itemHeight}
            setItemHeight={f.setItemHeight}
            departureDate={f.departureDate}
            setDepartureDate={f.setDepartureDate}
            cargoCategoryId={f.cargoCategoryId}
            setCargoCategoryId={f.setCargoCategoryId}
            cargo={f.cargo}
            setCargo={f.setCargo}
            selectedCT={f.selectedCT}
            selectedCC={f.selectedCC}
            isDG={f.isDG}
            dgClassId={f.dgClassId}
            setDgClassId={f.setDgClassId}
            unNumber={f.unNumber}
            setUnNumber={f.setUnNumber}
            msdsFile={f.msdsFile}
            setMsdsFile={f.setMsdsFile}
            equipmentCondition={f.equipmentCondition}
            setEquipmentCondition={f.setEquipmentCondition}
            temperature={f.temperature}
            setTemperature={f.setTemperature}
            showTemp={f.showTemp}
            showProject={f.showProject}
            renderFieldError={f.renderFieldError}
          />

          {/* Section 4: Add-ons */}
          <AddOnServiceSection
            isFCL={f.isFCL}
            isLCL={f.isLCL}
            addServices={f.addServices}
            selectedAddOns={f.selectedAddOns}
            setSelectedAddOns={f.setSelectedAddOns}
          />
        </div>

        <div className="flex flex-col gap-6 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t("estimateLabel")}</p>
              {f.estimate ? (
                <p className="text-xl font-black text-emerald-700">{f.estimate}</p>
              ) : (
                <p className="text-sm text-zinc-400 italic">{t("noEstimate")}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="bg-white border-zinc-300"
                onClick={() => void f.onEstimate()}
                disabled={isAnySubmitting}
              >
                {t("estimateButton")}
              </Button>
              {f.mode === "create" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white border-zinc-300"
                  onClick={(e) => void handleSaveAsDraft(e)}
                  disabled={isAnySubmitting}
                >
                  {draftSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("saveAsDraft")}
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isAnySubmitting}
                className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
              >
                {f.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("submitNow")}
              </Button>
            </div>
          </div>
          {f.estimateBreakdown ? (
            <div className="space-y-2 border-t border-zinc-200 pt-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>{t("freight")}</span>
                <span className="tabular-nums">{formatIdrLocale(f.estimateBreakdown.freight, locale)}</span>
              </div>
              {f.estimateBreakdown.discount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>{t("discount")}</span>
                  <span className="tabular-nums">−{formatIdrLocale(f.estimateBreakdown.discount, locale)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-zinc-600">
                <span>{t("pickup")}</span>
                <span className="tabular-nums">{formatIdrLocale(f.estimateBreakdown.pickup ?? 0, locale)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>{t("delivery")}</span>
                <span className="tabular-nums">{formatIdrLocale(f.estimateBreakdown.delivery ?? 0, locale)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>{t("additionalServices")}</span>
                <span className="tabular-nums">{formatIdrLocale(f.estimateBreakdown.additional_services, locale)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
                <span>{t("total")}</span>
                <span className="tabular-nums">{formatIdrLocale(f.estimateBreakdown.total, locale)}</span>
              </div>
              <p className="pt-2 text-[10px] text-zinc-500">{t("estimateNote")}</p>
            </div>
          ) : (
            <p className="border-t border-zinc-200 pt-4 text-[10px] text-zinc-500">{t("estimateNote")}</p>
          )}
        </div>
      </form>

      <AlertDialog open={f.showSuccess} onOpenChange={f.setShowSuccess}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-emerald-100 text-emerald-600 rounded-full h-12 w-12 mx-auto mb-2">
              <CheckCircle className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-center text-xl font-bold">{t("submitNowSuccess")}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">{t("submitSuccessDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={async () => {
                await queryClient.invalidateQueries({ queryKey: ["customer", "bookings", "stats"] });
                await queryClient.invalidateQueries({ queryKey: ["customer", "bookings", "list"] });
                router.push("/dashboard/booking");
              }}
              className="w-full sm:w-auto px-10"
            >
              {t("viewList")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatIdrLocale(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

