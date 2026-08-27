"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Loader2 } from "lucide-react";
import { createAdminBooking, estimateAdminBookingPrice } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

import { RouteServiceSection } from "@/components/dashboard/booking/create/route-service-section";
import { PartyInfoSection } from "@/components/dashboard/booking/create/party-info-section";
import { CargoDetailSection } from "@/components/dashboard/booking/create/cargo-detail-section";
import { AttachmentSection } from "@/components/dashboard/booking/create/attachment-section";
import { AddOnServiceSection } from "@/components/dashboard/admin/bookings/create/add-on-service-section";
import { useAdminBookingForm } from "@/hooks/use-admin-booking-form";

function formatNumber(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString("id-ID", { maximumFractionDigits: 2 }) : "—";
}

export default function AdminCreateBookingPage() {
  const router = useRouter();
  const t = useTranslations("AdminBookings.create");
  const tForm = useTranslations("Bookings.create.form");
  const tDetailCost = useTranslations("Bookings.detail.section3");
  const tCommon = useTranslations("Bookings");
  const f = useAdminBookingForm();
  const [draftSubmitting, setDraftSubmitting] = useState(false);

  const companyOptions = useMemo(
    () => f.companies.map((c) => ({ value: String(c.id), label: c.name })),
    [f.companies]
  );

  const showDeliveryNotes = f.shipmentCoverage === "port_to_door" || f.shipmentCoverage === "door_to_door";
  const showPickupFields = f.shipmentCoverage === "door_to_port" || f.shipmentCoverage === "door_to_door";
  const coverageLabel = f.shipmentCoverage ? tCommon(`coverage.${f.shipmentCoverage}`) : "—";
  const originLabel = f.locations.find((x) => String(x.id) === f.originId)?.name ?? "—";
  const destinationLabel = f.locations.find((x) => String(x.id) === f.destId)?.name ?? "—";
  const serviceTypeLabel = f.serviceTypes.find((x) => String(x.id) === f.serviceTypeId)?.name ?? "—";

  const cargoSummaryLcl = useMemo(() => {
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
  }, [f.packages]);

  const includedServices = useMemo(() => {
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
  }, [showPickupFields, showDeliveryNotes, f.isFCL, tForm]);

  const onEstimate = async () => {
    f.setError(null);
    f.setEstimate(null);
    f.setEstimateBreakdown(null);
    try {
      const r = await estimateAdminBookingPrice({
        company_id: Number(f.companyId),
        origin_location_id: Number(f.originId),
        destination_location_id: Number(f.destId),
        transport_mode_id: Number(f.modeId),
        service_type_id: Number(f.serviceTypeId),
        shipment_coverage: f.shipmentCoverage,
        container_type_id: !f.isLCL && f.containerTypeId ? Number(f.containerTypeId) : null,
        container_count: !f.isLCL ? Number(f.containerCount) || 1 : null,
        estimated_weight: f.weight ? Number(f.weight) : null,
        estimated_cbm: f.cbm ? Number(f.cbm) : null,
        additional_services: f.selectedAddOns.map((id) => ({ id })),
      });
      const inner = (r as { data?: { estimated_price?: number; breakdown?: typeof f.estimateBreakdown } }).data;
      f.setEstimate(
        inner?.estimated_price != null
          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(inner.estimated_price))
          : t("noEstimate")
      );
      if (inner?.breakdown) f.setEstimateBreakdown(inner.breakdown);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t("estimateFailed");
      f.setError(msg);
      toast.error(msg);
    }
  };

  const onSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!asDraft && !f.confirmBooking) {
      f.setValidationErrors({ confirm_booking: [t("confirmRequired")] });
      f.setError(t("confirmRequired"));
      return;
    }
    f.setError(null);
    f.setValidationErrors(null);
    if (asDraft) setDraftSubmitting(true);
    else f.setSubmitting(true);
    try {
      await createAdminBooking(f.buildFormData(asDraft));
      toast.success(asDraft ? t("draftSaved") : t("submitted"));
      router.push("/dashboard/admin/customer/bookings");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]> };
        if (body.errors) {
          f.setValidationErrors(body.errors);
          f.setError(t("validationFailed"));
        } else {
          f.setError(err.message);
        }
      } else {
        f.setError(err instanceof ApiError ? err.message : t("saveFailed"));
      }
      toast.error(t("saveFailed"));
    } finally {
      if (asDraft) setDraftSubmitting(false);
      else f.setSubmitting(false);
    }
  };

  const isAnySubmitting = f.submitting || draftSubmitting;

  if (!f.canCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("accessDeniedTitle")}</CardTitle>
          <CardDescription>{t("accessDeniedDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/customer/bookings")}>
            {t("back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (f.loading) {
    return <p className="p-6 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>

      {f.error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{f.error}</p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e, false)} className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("customerSectionTitle")}</CardTitle>
            <CardDescription>{t("customerSectionSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-w-md">
              <Label>
                {t("customerLabel")} <span className="text-red-500">*</span>
              </Label>
              <Combobox
                items={companyOptions}
                value={companyOptions.find((x) => x.value === f.companyId) ?? null}
                onValueChange={(next) => {
                  f.setCompanyId(next?.value ?? "");
                  f.setShipperLocationId("");
                  f.setConsigneeLocationId("");
                }}
              >
                <ComboboxInput
                  className={cn("w-full", f.renderFieldError("company_id") && "[&_input]:border-red-500")}
                  placeholder={t("customerPlaceholder")}
                />
                <ComboboxContent>
                  <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {f.renderFieldError("company_id") ? (
                <p className="text-[11px] font-medium text-red-500">{f.renderFieldError("company_id")}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
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

          <PartyInfoSection
            kind="shipper"
            customerLocations={f.customerLocations}
            locationId={f.shipperLocationId}
            setLocationId={f.setShipperLocationId}
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
            customerLocations={f.customerLocations}
            locationId={f.consigneeLocationId}
            setLocationId={f.setConsigneeLocationId}
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

          <CargoDetailSection
            isLCL={f.isLCL}
            isFCL={f.isFCL}
            containerTypes={f.containerTypes}
            cargoCategories={f.cargoCats}
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

          <AddOnServiceSection
            isFCL={f.isFCL}
            isLCL={f.isLCL}
            addServices={f.addServices}
            selectedAddOns={f.selectedAddOns}
            setSelectedAddOns={f.setSelectedAddOns}
          />

          <AttachmentSection attachments={f.attachments} setAttachments={f.setAttachments} />
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border bg-zinc-50 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{tForm("reviewTitle")}</p>

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
                    f.containers.map((c, idx) => (
                      <div key={idx} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {c.container_type_id
                            ? f.containerTypes.find((x) => String(x.id) === c.container_type_id)?.name
                            : "—"}
                        </span>
                        <span className="font-medium tabular-nums">
                          {c.quantity} × {c.cargo_description || "—"} · {formatNumber(Number(c.gross_weight_kg) || 0)} kg
                        </span>
                      </div>
                    ))
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
            <div className="border-b px-4 py-3 text-sm font-semibold">{t("costEstimationTitle")}</div>
            <div className="space-y-2 px-4 py-3 text-sm">
              {f.estimateBreakdown ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tDetailCost("freight")}</span>
                    <span>{formatNumber(Number(f.estimateBreakdown.freight) || 0)}</span>
                  </div>
                  {showPickupFields ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tDetailCost("pickup")}</span>
                      <span>{formatNumber(Number(f.estimateBreakdown.pickup) || 0)}</span>
                    </div>
                  ) : null}
                  {showDeliveryNotes ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tDetailCost("delivery")}</span>
                      <span>{formatNumber(Number(f.estimateBreakdown.delivery) || 0)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tDetailCost("discount")}</span>
                    <span>{formatNumber(Number(f.estimateBreakdown.discount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tDetailCost("additionalServices")}</span>
                    <span>{formatNumber(Number(f.estimateBreakdown.additional_services) || 0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>{tDetailCost("total")}</span>
                    <span>{f.estimate ?? "—"}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">{t("noEstimate")}</p>
              )}
              <p className="text-xs text-muted-foreground pt-2">{t("costDisclaimer")}</p>
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

        <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-4 rounded-xl border bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={() => void onEstimate()} disabled={isAnySubmitting}>
            {t("estimateButton")}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/admin/customer/bookings")} disabled={isAnySubmitting}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="outline" disabled={isAnySubmitting} onClick={(e) => void onSubmit(e, true)}>
              {draftSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("saveDraft")}
            </Button>
            <Button type="submit" disabled={isAnySubmitting || !f.confirmBooking}>
              {f.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("submitBooking")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
