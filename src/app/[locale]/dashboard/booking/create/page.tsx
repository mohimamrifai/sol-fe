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
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useBookingForm } from "@/hooks/use-booking-form";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

// Section Components
import { RouteServiceSection } from "@/components/dashboard/booking/create/route-service-section";
import { PartyInfoSection } from "@/components/dashboard/booking/create/party-info-section";
import { CargoDetailSection } from "@/components/dashboard/booking/create/cargo-detail-section";
import { AddOnServiceSection } from "@/components/dashboard/booking/create/add-on-service-section";
import { AttachmentSection } from "@/components/dashboard/booking/create/attachment-section";

export default function CreateBookingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("Bookings.create");
  const tForm = useTranslations("Bookings.create.form");
  const tCommon = useTranslations("Bookings");
  const f = useBookingForm();
  const locale = useLocale();
  const [draftSubmitting, setDraftSubmitting] = useState(false);

  if (f.loading) {
    return <p className="p-10 text-sm text-muted-foreground text-center">{t("loadingForm")}</p>;
  }

  const isAnySubmitting = f.submitting || draftSubmitting;
  const showDeliveryNotes = f.shipmentCoverage === "port_to_door" || f.shipmentCoverage === "door_to_door";
  const showPickupFields = f.shipmentCoverage === "door_to_port" || f.shipmentCoverage === "door_to_door";
  const coverageLabel = f.shipmentCoverage ? tCommon(`coverage.${f.shipmentCoverage}`) : "—";
  const originLabel = f.locations.find((x) => String(x.id) === f.originId)?.name ?? "—";
  const destinationLabel = f.locations.find((x) => String(x.id) === f.destId)?.name ?? "—";
  const serviceTypeLabel = f.serviceTypes.find((x) => String(x.id) === f.serviceTypeId)?.code ?? "—";

  const cargoSummaryLcl = (() => {
    const totalPackages = f.packages.length;
    const totalWeight = f.packages.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);
    const totalVolume = f.packages.reduce((acc, p) => {
      const l = Number(p.length_cm) || 0;
      const w = Number(p.width_cm) || 0;
      const h = Number(p.height_cm) || 0;
      const qty = Number(p.piece_count) || 1;
      if (!l || !w || !h) return acc;
      return acc + ((l * w * h) / 1_000_000) * qty;
    }, 0);
    const totalChargeable = f.packages.reduce((acc, p) => {
      const l = Number(p.length_cm) || 0;
      const w = Number(p.width_cm) || 0;
      const h = Number(p.height_cm) || 0;
      const qty = Number(p.piece_count) || 1;
      const volumeWeight = l && w && h ? ((l * w * h) / 5000) * qty : 0;
      const actual = Number(p.weight_kg) || 0;
      return acc + Math.max(actual, volumeWeight);
    }, 0);
    return { totalPackages, totalWeight, totalVolume, totalChargeable };
  })();

  const includedServices = (() => {
    const rows: string[] = [];
    if (showPickupFields) rows.push(tForm("includedPickup"));
    rows.push(tForm("includedRail"));
    rows.push(tForm("includedLiftOnOrigin"));
    rows.push(tForm("includedLiftOffOrigin"));
    rows.push(tForm("includedLiftOnDestination"));
    rows.push(tForm("includedLiftOffDestination"));
    if (showDeliveryNotes) rows.push(tForm("includedDelivery"));
    if (f.isFCL) {
      rows.push(tForm("includedFreeStorageOrigin"));
      rows.push(tForm("includedFreeStorageDestination"));
    }
    return rows;
  })();

  const handleSaveAsDraft = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (f.mode === "edit") return; // Drafts only apply to new bookings.
    if (isAnySubmitting) return;
    setDraftSubmitting(true);
    try {
      await f.submitDraft();
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
            coverages={f.coverages}
            originId={f.originId}
            setOriginId={f.setOriginId}
            destId={f.destId}
            setDestId={f.setDestId}
            modeId={f.modeId}
            setModeId={f.setModeId}
            serviceTypeId={f.serviceTypeId}
            setServiceTypeId={f.setServiceTypeId}
            shipmentCoverage={f.shipmentCoverage}
            setShipmentCoverage={f.setShipmentCoverage}
            pickupDate={f.pickupDate}
            setPickupDate={f.setPickupDate}
            pickupTime={f.pickupTime}
            setPickupTime={f.setPickupTime}
            pickupNotes={f.pickupNotes}
            setPickupNotes={f.setPickupNotes}
            renderFieldError={f.renderFieldError}
          />

          {/* Section 2: Parties */}
          <PartyInfoSection
            kind="shipper"
            branches={f.branches}
            branchId={f.shipperBranchId}
            setBranchId={f.setShipperBranchId}
            company={f.shipperName}
            setCompany={f.setShipperName}
            picName={f.shipperPicName}
            setPicName={f.setShipperPicName}
            picEmail={f.shipperPicEmail}
            setPicEmail={f.setShipperPicEmail}
            picMobile={f.shipperPicMobile}
            setPicMobile={f.setShipperPicMobile}
            setPhone={f.setShipperPhone}
            provinceId={f.shipperProvinceId}
            setProvinceId={f.setShipperProvinceId}
            cityId={f.shipperCityId}
            setCityId={f.setShipperCityId}
            districtId={f.shipperDistrictId}
            setDistrictId={f.setShipperDistrictId}
            postalCode={f.shipperPostalCode}
            setPostalCode={f.setShipperPostalCode}
            address={f.shipperAddress}
            setAddress={f.setShipperAddress}
            renderFieldError={f.renderFieldError}
          />

          <PartyInfoSection
            kind="consignee"
            branches={f.branches}
            branchId={f.consigneeBranchId}
            setBranchId={f.setConsigneeBranchId}
            destinationType={f.consigneeType}
            setDestinationType={f.setConsigneeType}
            showDeliveryNotes={showDeliveryNotes}
            company={f.consigneeName}
            setCompany={f.setConsigneeName}
            picName={f.consigneePicName}
            setPicName={f.setConsigneePicName}
            picEmail={f.consigneePicEmail}
            setPicEmail={f.setConsigneePicEmail}
            picMobile={f.consigneePicMobile}
            setPicMobile={f.setConsigneePicMobile}
            setPhone={f.setConsigneePhone}
            provinceId={f.consigneeProvinceId}
            setProvinceId={f.setConsigneeProvinceId}
            cityId={f.consigneeCityId}
            setCityId={f.setConsigneeCityId}
            districtId={f.consigneeDistrictId}
            setDistrictId={f.setConsigneeDistrictId}
            postalCode={f.consigneePostalCode}
            setPostalCode={f.setConsigneePostalCode}
            address={f.consigneeAddress}
            setAddress={f.setConsigneeAddress}
            deliveryNotes={f.deliveryNotes}
            setDeliveryNotes={f.setDeliveryNotes}
            renderFieldError={f.renderFieldError}
          />

          {/* Section 3: Cargo */}
          <CargoDetailSection
            isLCL={f.isLCL}
            isFCL={f.isFCL}
            containerTypes={f.containerTypes}
            cargoCategories={f.cargoCategories}
            dgClasses={f.dgClasses}
            departureDate={f.departureDate}
            setDepartureDate={f.setDepartureDate}
            cargoCategoryId={f.cargoCategoryId}
            setCargoCategoryId={f.setCargoCategoryId}
            cargo={f.cargo}
            setCargo={f.setCargo}
            equipmentCondition={f.equipmentCondition}
            setEquipmentCondition={f.setEquipmentCondition}
            temperature={f.temperature}
            setTemperature={f.setTemperature}
            showTemp={f.showTemp}
            showProject={f.showProject}
            containerResponsibility={f.containerResponsibility}
            setContainerResponsibility={f.setContainerResponsibility}
            packages={f.packages}
            setPackages={f.setPackages}
            containers={f.containers}
            setContainers={f.setContainers}
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

          <AttachmentSection attachments={f.attachments} setAttachments={f.setAttachments} />
        </div>

        <div className="flex flex-col gap-6 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-inner">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{tForm("reviewTitle")}</p>
              <div className="rounded-xl border bg-white">
                <div className="border-b px-4 py-3 text-sm font-semibold">{tForm("shipmentInfoTitle")}</div>
                <div className="grid gap-0 text-sm">
                  <div className="flex justify-between gap-4 px-4 py-2">
                    <span className="text-muted-foreground">{tForm("originStation")}</span>
                    <span className="font-medium">{originLabel}</span>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-2">
                    <span className="text-muted-foreground">{tForm("destinationStation")}</span>
                    <span className="font-medium">{destinationLabel}</span>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-2">
                    <span className="text-muted-foreground">{tForm("serviceType")}</span>
                    <span className="font-medium">{serviceTypeLabel}</span>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-2">
                    <span className="text-muted-foreground">{tForm("shipmentCoverage")}</span>
                    <span className="font-medium">{coverageLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-white">
                <div className="border-b px-4 py-3 text-sm font-semibold">{tForm("shipperTitle")}</div>
                <div className="space-y-1 px-4 py-3 text-sm">
                  <p className="font-medium">{f.shipperName || "—"}</p>
                  <p className="text-muted-foreground">{f.shipperPicName || "—"}</p>
                  <p className="text-muted-foreground">{f.shipperPicMobile || "—"}</p>
                  <p className="text-muted-foreground whitespace-pre-line">{f.shipperAddress || "—"}</p>
                </div>
              </div>
              <div className="rounded-xl border bg-white">
                <div className="border-b px-4 py-3 text-sm font-semibold">{tForm("consigneeTitle")}</div>
                <div className="space-y-1 px-4 py-3 text-sm">
                  <p className="font-medium">{f.consigneeName || "—"}</p>
                  <p className="text-muted-foreground">{f.consigneePicName || "—"}</p>
                  <p className="text-muted-foreground">{f.consigneePicMobile || "—"}</p>
                  <p className="text-muted-foreground whitespace-pre-line">{f.consigneeAddress || "—"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3 text-sm font-semibold">{tForm("cargoSummaryTitle")}</div>
              <div className="px-4 py-3 text-sm">
                {f.isLCL ? (
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{tForm("totalPackage")}</p>
                      <p className="font-semibold tabular-nums">{cargoSummaryLcl.totalPackages}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{tForm("totalActualWeight")}</p>
                      <p className="font-semibold tabular-nums">{formatNumber(cargoSummaryLcl.totalWeight)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{tForm("totalVolume")}</p>
                      <p className="font-semibold tabular-nums">{formatNumber(cargoSummaryLcl.totalVolume)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{tForm("totalChargeableWeight")}</p>
                      <p className="font-semibold tabular-nums">{formatNumber(cargoSummaryLcl.totalChargeable)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {f.containers.length ? (
                      <div className="grid gap-2">
                        {f.containers.map((c, idx) => (
                          <div key={idx} className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              {c.container_type_id ? f.containerTypes.find((x) => String(x.id) === c.container_type_id)?.name : "—"}
                            </span>
                            <span className="font-medium tabular-nums">
                              {c.quantity} × {c.cargo_description || "—"} · {formatNumber(Number(c.gross_weight_kg) || 0)} kg
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{tForm("containersEmpty")}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3 text-sm font-semibold">{tForm("includedServicesTitle")}</div>
              <div className="grid gap-2 px-4 py-3 text-sm">
                {includedServices.map((x) => (
                  <div key={x} className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-600">✓</span>
                    <span>{x}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3 text-sm font-semibold">{tForm("termsTitle")}</div>
              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={f.confirmBooking}
                    onCheckedChange={(v) => f.setConfirmBooking(v === true)}
                    aria-invalid={!f.confirmBooking}
                  />
                  <div className="space-y-1">
                    <p className="text-sm">{tForm("confirmBookingLabel")}</p>
                    {f.renderFieldError("confirm_booking") ? (
                      <p className="text-[11px] font-medium text-red-500">{f.renderFieldError("confirm_booking")}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                disabled={isAnySubmitting || !f.confirmBooking}
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(Number.isFinite(value) ? value : 0);
}
