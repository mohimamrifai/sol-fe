"use client";

import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { createAdminBooking, estimateAdminBookingPrice } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { useRouter } from "@/i18n/routing";

import { ShipperConsigneeSection } from "@/components/dashboard/admin/bookings/create/shipper-consignee-section";
import { RouteServiceSection } from "./components/route-service-section";
import { CargoDetailSection } from "./components/cargo-detail-section";
import { AddOnServiceSection } from "./components/add-on-service-section";
import { useAdminBookingForm } from "@/hooks/use-admin-booking-form";

export default function AdminCreateBookingPage() {
  const router = useRouter();
  
  const form = useAdminBookingForm();

  const buildPayload = () => {
    const fd = new FormData();
    fd.append("company_id", form.companyId);
    fd.append("origin_location_id", form.originId);
    fd.append("destination_location_id", form.destId);
    fd.append("transport_mode_id", form.modeId);
    fd.append("service_type_id", form.serviceTypeId);
    if (!form.isLCL && form.containerTypeId) fd.append("container_type_id", form.containerTypeId);
    if (!form.isLCL && form.containerCount) fd.append("container_count", form.containerCount);
    fd.append("estimated_weight", form.weight ? form.weight : "0");
    fd.append("estimated_cbm", form.cbm ? form.cbm : "0");
    if (form.isLCL && form.itemLength) fd.append("length", form.itemLength);
    if (form.isLCL && form.itemWidth) fd.append("width", form.itemWidth);
    if (form.isLCL && form.itemHeight) fd.append("height", form.itemHeight);
    fd.append("cargo_category_id", form.cargoCategoryId);
    if (form.pickupDate) fd.append("departure_date", form.pickupDate);
    if (form.cargo) fd.append("cargo_description", form.cargo);
    
    if (form.shipper.name) fd.append("shipper_name", form.shipper.name);
    if (form.shipper.address) fd.append("shipper_address", form.shipper.address);
    if (form.shipper.phone) fd.append("shipper_phone", form.shipper.phone);
    if (form.consignee.name) fd.append("consignee_name", form.consignee.name);
    if (form.consignee.address) fd.append("consignee_address", form.consignee.address);
    if (form.consignee.phone) fd.append("consignee_phone", form.consignee.phone);
    
    fd.append("is_dangerous_goods", form.isDg ? "1" : "0");
    if (form.isDg && form.dgClassId) fd.append("dg_class_id", form.dgClassId);
    if (form.isDg && form.unNumber) fd.append("un_number", form.unNumber);
    if (form.isDg && form.msdsFile) fd.append("msds_file", form.msdsFile);
    if (form.showProject && form.equipmentCondition) fd.append("equipment_condition", form.equipmentCondition);
    if (form.showTemp && form.temperature) fd.append("temperature", form.temperature);
    
    fd.append("additional_services", JSON.stringify(form.selectedAddOns.map((id) => ({ id }))));
    
    return fd;
  };

  const onEstimate = async () => {
    form.setError(null);
    form.setEstimate(null);
    form.setEstimateBreakdown(null);
    try {
      const r = await estimateAdminBookingPrice({
        company_id: Number(form.companyId),
        origin_location_id: Number(form.originId),
        destination_location_id: Number(form.destId),
        transport_mode_id: Number(form.modeId),
        service_type_id: Number(form.serviceTypeId),
        container_type_id: !form.isLCL && form.containerTypeId ? Number(form.containerTypeId) : null,
        container_count: !form.isLCL ? (Number(form.containerCount) || 1) : null,
        estimated_weight: form.weight ? Number(form.weight) : null,
        estimated_cbm: form.cbm ? Number(form.cbm) : null,
        additional_services: form.selectedAddOns.map((id) => ({ id })),
      });
      const inner = (r as { data?: { estimated_price?: number; breakdown?: typeof form.estimateBreakdown } }).data;
      form.setEstimate(
        inner?.estimated_price != null
          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
              Number(inner.estimated_price)
            )
          : "Estimasi tidak tersedia"
      );
      if (inner?.breakdown) {
        form.setEstimateBreakdown(inner.breakdown);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal estimasi";
      form.setError(msg);
      toast.error(msg);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    form.setValidationErrors(null);
    form.setSubmitting(true);
    try {
      await createAdminBooking(buildPayload());
      toast.success("Booking berhasil dibuat.");
      router.push("/dashboard/admin/bookings");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]> };
        if (body.errors) {
          form.setValidationErrors(body.errors);
          form.setError("Terdapat kesalahan validasi. Silakan periksa kolom yang bertanda merah.");
        } else {
          form.setError(err.message);
        }
      } else {
        const msg = err instanceof ApiError ? err.message : "Gagal menyimpan";
        form.setError(msg);
      }
      toast.error("Gagal membuat booking.");
    } finally {
      form.setSubmitting(false);
    }
  };

  const renderError = (field: string) => {
    const msgs = form.validationErrors?.[field];
    if (!msgs || msgs.length === 0) return null;
    return <p className="mt-1 text-[11px] font-medium text-red-500">{msgs[0]}</p>;
  };

  if (!form.canCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses ditolak</CardTitle>
          <CardDescription>Role Anda tidak memiliki izin tambah booking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/bookings")}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (form.loading) {
    return <p className="p-6 text-sm text-muted-foreground">Memuat form…</p>;
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Tambah Booking</h1>
            <p className="mt-1 text-sm text-muted-foreground">Buat booking customer oleh tim internal.</p>
          </div>
        </div>
      </div>

      {form.error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{form.error}</p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-8">
          <RouteServiceSection
            companies={form.companies}
            companyId={form.companyId}
            setCompanyId={form.setCompanyId}
            selectedCompany={form.selectedCompany}
            locations={form.locations}
            originId={form.originId}
            setOriginId={form.setOriginId}
            destId={form.destId}
            setDestId={form.setDestId}
            modes={form.modes}
            modeId={form.modeId}
            setModeId={form.setModeId}
            serviceTypes={form.serviceTypes}
            serviceTypeId={form.serviceTypeId}
            setServiceTypeId={form.setServiceTypeId}
            validationErrors={form.validationErrors}
            renderError={renderError}
          />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">Informasi Pihak Terkait</h3>
            <ShipperConsigneeSection
              shipper={form.shipper}
              onShipperChange={(fields) => form.setShipper((prev) => ({ ...prev, ...fields }))}
              consignee={form.consignee}
              onConsigneeChange={(fields) => form.setConsignee((prev) => ({ ...prev, ...fields }))}
              renderError={renderError}
              validationErrors={form.validationErrors ?? undefined}
              companyData={form.selectedCompany}
            />
          </div>

          <CargoDetailSection
            isLCL={form.isLCL}
            isFCL={form.isFCL}
            containerTypes={form.containerTypes}
            cargoCategories={form.cargoCats}
            dgClasses={form.dgClasses}
            containerTypeId={form.containerTypeId}
            setContainerTypeId={form.setContainerTypeId}
            containerCount={form.containerCount}
            setContainerCount={form.setContainerCount}
            weight={form.weight}
            setWeight={form.setWeight}
            cbm={form.cbm}
            setCbm={form.setCbm}
            itemLength={form.itemLength}
            setItemLength={form.setItemLength}
            itemWidth={form.itemWidth}
            setItemWidth={form.setItemWidth}
            itemHeight={form.itemHeight}
            setItemHeight={form.setItemHeight}
            pickupDate={form.pickupDate}
            setPickupDate={form.setPickupDate}
            cargoCategoryId={form.cargoCategoryId}
            setCargoCategoryId={form.setCargoCategoryId}
            cargo={form.cargo}
            setCargo={form.setCargo}
            isDg={form.isDg}
            dgClassId={form.dgClassId}
            setDgClassId={form.setDgClassId}
            unNumber={form.unNumber}
            setUnNumber={form.setUnNumber}
            msdsFile={form.msdsFile}
            setMsdsFile={form.setMsdsFile}
            equipmentCondition={form.equipmentCondition}
            setEquipmentCondition={form.setEquipmentCondition}
            temperature={form.temperature}
            setTemperature={form.setTemperature}
            selectedContainerType={form.selectedContainerType}
            selectedCargoCategory={form.selectedCargoCategory}
            showTemp={form.showTemp}
            showProject={form.showProject}
            validationErrors={form.validationErrors}
            renderError={renderError}
          />

          <AddOnServiceSection
            isFCL={form.isFCL}
            isLCL={form.isLCL}
            addServices={form.addServices}
            selectedAddOns={form.selectedAddOns}
            setSelectedAddOns={form.setSelectedAddOns}
          />
        </div>

        {/* Floating Action Bar */}
        <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-4 rounded-xl border bg-white p-4 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onEstimate}
              disabled={form.submitting}
              className="w-full sm:w-auto font-medium"
            >
              Hitung Estimasi
            </Button>
            {form.estimate ? (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Estimasi Total</span>
                <span className="text-lg font-bold text-zinc-900 leading-none">{form.estimate}</span>
              </div>
            ) : null}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/admin/bookings")}
              disabled={form.submitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.submitting} className="w-full sm:w-auto bg-black text-white hover:bg-zinc-800">
              {form.submitting ? "Menyimpan..." : "Simpan Booking"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
