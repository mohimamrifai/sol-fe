"use client";

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
import { ClipboardList, CheckCircle } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useBookingForm } from "./hooks/use-booking-form";
import { useQueryClient } from "@tanstack/react-query";

// Section Components
import { RouteServiceSection } from "./components/sections/route-service-section";
import { PartyInfoSection } from "./components/sections/party-info-section";
import { CargoDetailSection } from "./components/sections/cargo-detail-section";
import { AddOnServiceSection } from "./components/sections/add-on-service-section";

export default function CreateBookingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const f = useBookingForm();
  const fmtIdr = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);

  if (f.loading) {
    return <p className="p-10 text-sm text-muted-foreground text-center">Menyiapkan formulir booking…</p>;
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">Buat Booking Baru</h1>
            <p className="mt-1 text-sm text-balance text-muted-foreground">Silakan melengkapi detail pengiriman Anda di bawah ini.</p>
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
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Informasi Biaya</p>
              {f.estimate ? (
                <p className="text-xl font-black text-emerald-700">{f.estimate}</p>
              ) : (
                <p className="text-sm text-zinc-400 italic">Silakan klik tombol estimasi untuk melihat perkiraan harga.</p>
              )}
              {f.estimate && (
                 <p className="text-[10px] text-zinc-500">* Harga di atas bersifat estimasi dan akan dikonfirmasi kembali oleh operasional.</p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="bg-white border-zinc-300" onClick={() => void f.onEstimate()}>
                Hitung Estimasi
              </Button>
              <Button type="submit" disabled={f.submitting} className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-md">
                {f.submitting ? "Memproses..." : "Kirim Booking Sekarang"}
              </Button>
            </div>
          </div>
          {f.estimateBreakdown ? (
            <div className="space-y-2 border-t border-zinc-200 pt-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Base Freight</span>
                <span>{fmtIdr(f.estimateBreakdown.base_freight)}</span>
              </div>
              {f.estimateBreakdown.discount_amount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon</span>
                  <span>-{fmtIdr(f.estimateBreakdown.discount_amount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-zinc-600">
                <span>Layanan Tambahan</span>
                <span>{fmtIdr(f.estimateBreakdown.additional_services_total)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
                <span>Total</span>
                <span>{fmtIdr(f.estimateBreakdown.total)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </form>

      <AlertDialog open={f.showSuccess} onOpenChange={f.setShowSuccess}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-emerald-100 text-emerald-600 rounded-full h-12 w-12 mx-auto mb-2">
              <CheckCircle className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-center text-xl font-bold">Booking Berhasil Dikirim!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Permintaan pengiriman Anda telah diterima oleh sistem. Tim kami akan segera memverifikasi kargo dan jadwal Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={async () => { 
                await queryClient.invalidateQueries({ queryKey: ["customerBookings"] });
                router.push("/dashboard/booking"); 
              }} className="w-full sm:w-auto px-10">
              Lihat My Bookings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
