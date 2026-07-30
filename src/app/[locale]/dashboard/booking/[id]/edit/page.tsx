"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ClipboardList, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useBookingForm } from "@/app/[locale]/dashboard/booking/create/hooks/use-booking-form";
import { fetchCustomerBooking } from "@/lib/customer-api";
import { RouteServiceSection } from "@/app/[locale]/dashboard/booking/create/components/sections/route-service-section";
import { PartyInfoSection } from "@/app/[locale]/dashboard/booking/create/components/sections/party-info-section";
import { CargoDetailSection } from "@/app/[locale]/dashboard/booking/create/components/sections/cargo-detail-section";
import { AddOnServiceSection } from "@/app/[locale]/dashboard/booking/create/components/sections/add-on-service-section";
import { ApiError } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle } from "lucide-react";
import { useRouter as useIntlRouter } from "@/i18n/routing";

export default function EditBookingPage() {
  const params = useParams<{ locale: string; id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("Bookings.create");
  const tCommon = useTranslations("Bookings");
  const tAction = useTranslations("Bookings.detail.actions");
  const intlRouter = useIntlRouter();
  const f = useBookingForm({ editId: id });

  // Pre-flight: make sure the booking exists and is editable.
  const probe = useQuery({
    queryKey: ["customer", "booking", id, "edit-probe"],
    queryFn: () => fetchCustomerBooking(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  useEffect(() => {
    if (probe.isError) {
      if (probe.error instanceof ApiError && probe.error.status === 404) {
        router.replace("/dashboard/booking");
      }
    }
  }, [probe.isError, probe.error, router]);

  if (probe.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-sm text-zinc-600">{tCommon("loadError")}</p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/booking" />}
          className="mt-6"
        >
          {tAction("backToList")}
        </Button>
      </div>
    );
  }

  if (f.loading || !f.locations.length) {
    return (
      <div className="flex min-w-0 w-full flex-1 flex-col items-center justify-center gap-2 py-20 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t("loadingForm")}</span>
      </div>
    );
  }

  const handleSuccessClick = () => {
    void queryClient.invalidateQueries({ queryKey: ["customer", "bookings", "stats"] });
    void queryClient.invalidateQueries({ queryKey: ["customer", "bookings", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["customer", "booking", id] });
    intlRouter.push("/dashboard/booking");
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
              {t("editPageTitle")}
            </h1>
            <p className="mt-1 text-sm text-balance text-muted-foreground">{t("editPageSubtitle")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/dashboard/booking/${id}`} />}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {tAction("backToList")}
        </Button>
      </div>

      {f.error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 space-y-2">
          <div className="flex items-start gap-2 font-semibold">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{f.error}</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={f.onSubmit} className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-2">
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

          <AddOnServiceSection
            isFCL={f.isFCL}
            isLCL={f.isLCL}
            addServices={f.addServices}
            selectedAddOns={f.selectedAddOns}
            setSelectedAddOns={f.setSelectedAddOns}
          />
        </div>

        <div className="flex flex-col gap-3 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-inner sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="submit"
            disabled={f.submitting}
            className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
          >
            {f.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("submitNow")}
          </Button>
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
            <AlertDialogAction onClick={handleSuccessClick} className="w-full sm:w-auto px-10">
              {t("viewList")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
