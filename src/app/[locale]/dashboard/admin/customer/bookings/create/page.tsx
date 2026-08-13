"use client";

import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { createAdminBooking, estimateAdminBookingPrice } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { useRouter } from "@/i18n/routing";

import { ShipperConsigneeSection } from "@/components/dashboard/admin/bookings/create/shipper-consignee-section";
import { RouteServiceSection } from "@/components/dashboard/admin/bookings/create/route-service-section";
import { CargoDetailSection } from "@/components/dashboard/booking/create/cargo-detail-section";
import { AttachmentSection } from "@/components/dashboard/booking/create/attachment-section";
import { AddOnServiceSection } from "@/components/dashboard/admin/bookings/create/add-on-service-section";
import { useAdminBookingForm } from "@/hooks/use-admin-booking-form";

export default function AdminCreateBookingPage() {
  const router = useRouter();
  
  const form = useAdminBookingForm();

  const buildPayload = (asDraft: boolean) => {
    const pkgRows = form.packages.map((p) => ({
      description: p.description || null,
      package_type: p.package_type || null,
      piece_count: Number(p.piece_count) || 1,
      weight_kg: Number(p.weight_kg) || null,
      length: Number(p.length_cm) || null,
      width: Number(p.width_cm) || null,
      height: Number(p.height_cm) || null,
      remark: p.remark || null,
      is_dangerous_goods: p.is_dangerous_goods ? 1 : 0,
      dg_class_id: p.is_dangerous_goods && p.dg_class_id ? Number(p.dg_class_id) : null,
      un_number: p.is_dangerous_goods ? p.un_number || null : null,
      packing_group: p.is_dangerous_goods ? p.packing_group || null : null,
      proper_shipping_name: p.is_dangerous_goods ? p.proper_shipping_name || null : null,
      flash_point: p.is_dangerous_goods && p.flash_point_c ? Number(p.flash_point_c) : null,
      dg_remark: p.is_dangerous_goods ? p.dg_remark || null : null,
    }));

    const ctrRows = form.containers.map((c) => ({
      container_type_id: c.container_type_id ? Number(c.container_type_id) : null,
      quantity: Number(c.quantity) || 1,
      gross_weight_kg: Number(c.gross_weight_kg) || null,
      cargo_description: c.cargo_description || null,
      remark: c.remark || null,
      is_dangerous_goods: c.is_dangerous_goods ? 1 : 0,
      dg_class_id: c.is_dangerous_goods && c.dg_class_id ? Number(c.dg_class_id) : null,
      un_number: c.is_dangerous_goods ? c.un_number || null : null,
      packing_group: c.is_dangerous_goods ? c.packing_group || null : null,
      proper_shipping_name: c.is_dangerous_goods ? c.proper_shipping_name || null : null,
      flash_point: c.is_dangerous_goods && c.flash_point_c ? Number(c.flash_point_c) : null,
      dg_remark: c.is_dangerous_goods ? c.dg_remark || null : null,
    }));

    const pkgTotalCbm = form.packages.reduce((acc, p) => {
      const qty = Number(p.piece_count) || 1;
      const l = Number(p.length_cm) || 0;
      const w = Number(p.width_cm) || 0;
      const h = Number(p.height_cm) || 0;
      if (!l || !w || !h) return acc;
      return acc + ((l * w * h) / 1_000_000) * qty;
    }, 0);
    const pkgTotalWeight = form.packages.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);
    const ctrTotalQty = form.containers.reduce((acc, c) => acc + (Number(c.quantity) || 1), 0);
    const ctrFirstType = form.containers[0]?.container_type_id;

    const payload: Record<string, unknown> = {
      company_id: form.companyId ? Number(form.companyId) : null,
      origin_location_id: form.originId ? Number(form.originId) : null,
      destination_location_id: form.destId ? Number(form.destId) : null,
      transport_mode_id: form.modeId ? Number(form.modeId) : null,
      service_type_id: form.serviceTypeId ? Number(form.serviceTypeId) : null,
      shipment_coverage: form.shipmentCoverage || null,
      is_draft: asDraft ? 1 : 0,
      container_responsibility: form.isFCL ? form.containerResponsibility : null,
      container_type_id:
        form.isFCL && ctrFirstType
          ? Number(ctrFirstType)
          : !form.isLCL && form.containerTypeId
            ? Number(form.containerTypeId)
            : null,
      container_count: form.isFCL ? ctrTotalQty : !form.isLCL ? Number(form.containerCount) || 1 : null,
      estimated_weight: form.isLCL ? pkgTotalWeight || null : form.weight ? Number(form.weight) : null,
      estimated_cbm: form.isLCL ? pkgTotalCbm || null : form.cbm ? Number(form.cbm) : null,
      cargo_category_id: form.cargoCategoryId ? Number(form.cargoCategoryId) : null,
      departure_date: form.departureDate || form.pickupDate || null,
      pickup_date: form.pickupDate || null,
      pickup_time: form.pickupTime || null,
      pickup_notes: form.pickupNotes || null,
      cargo_description: form.cargo || null,
      shipper_name: form.shipper.name || null,
      shipper_address: form.shipper.address || null,
      shipper_phone: form.shipper.phone || null,
      consignee_name: form.consignee.name || null,
      consignee_address: form.consignee.address || null,
      consignee_phone: form.consignee.phone || null,
      is_dangerous_goods: form.isDg ? 1 : 0,
      dg_class_id: form.isDg && form.dgClassId ? Number(form.dgClassId) : null,
      un_number: form.isDg ? form.unNumber || null : null,
      equipment_condition: form.showProject && form.equipmentCondition ? form.equipmentCondition : null,
      temperature: form.showTemp && form.temperature ? Number(form.temperature) : null,
      packages: pkgRows.length ? pkgRows : null,
      containers: ctrRows.length ? ctrRows : null,
      additional_services: form.selectedAddOns.map((id) => ({ id })),
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
    form.packages.forEach((p, i) => {
      if (p.msds_file) fd.append(`packages_msds_files[${i}]`, p.msds_file);
    });
    form.containers.forEach((c, i) => {
      if (c.msds_file) fd.append(`containers_msds_files[${i}]`, c.msds_file);
    });
    form.attachments.forEach((a, i) => {
      fd.append(`attachments[${i}]`, a.file);
    });
    if (form.attachments.length) {
      fd.append(
        "attachments_meta",
        JSON.stringify(
          form.attachments.map((a) => ({
            document_type: a.document_type || null,
            remarks: a.remarks || null,
          }))
        )
      );
    }
    if (form.isDg && form.msdsFile) fd.append("msds_file", form.msdsFile);

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

  const onSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    form.setError(null);
    form.setValidationErrors(null);
    form.setSubmitting(true);
    try {
      await createAdminBooking(buildPayload(asDraft));
      toast.success(asDraft ? "Draft booking disimpan." : "Booking berhasil dibuat.");
      router.push("/dashboard/admin/customer/bookings");
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

  const renderFieldError = (field: string): string | null => {
    return form.validationErrors?.[field]?.[0] ?? null;
  };

  const renderError = (field: string) => {
    const msg = renderFieldError(field);
    if (!msg) return null;
    return <p className="mt-1 text-[11px] font-medium text-red-500">{msg}</p>;
  };

  if (!form.canCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses ditolak</CardTitle>
          <CardDescription>Role Anda tidak memiliki izin tambah booking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/customer/bookings")}>
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

      <form onSubmit={(e) => void onSubmit(e, false)} className="space-y-8">
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
            departureDate={form.departureDate}
            setDepartureDate={form.setDepartureDate}
            cargoCategoryId={form.cargoCategoryId}
            setCargoCategoryId={form.setCargoCategoryId}
            cargo={form.cargo}
            setCargo={form.setCargo}
            equipmentCondition={form.equipmentCondition}
            setEquipmentCondition={form.setEquipmentCondition}
            temperature={form.temperature}
            setTemperature={form.setTemperature}
            showTemp={form.showTemp}
            showProject={form.showProject}
            containerResponsibility={form.containerResponsibility}
            setContainerResponsibility={form.setContainerResponsibility}
            packages={form.packages}
            setPackages={form.setPackages}
            containers={form.containers}
            setContainers={form.setContainers}
            renderFieldError={renderFieldError}
          />

          <AddOnServiceSection
            isFCL={form.isFCL}
            isLCL={form.isLCL}
            addServices={form.addServices}
            selectedAddOns={form.selectedAddOns}
            setSelectedAddOns={form.setSelectedAddOns}
          />

          <AttachmentSection
            attachments={form.attachments}
            setAttachments={form.setAttachments}
          />

          <div className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Shipment Coverage</Label>
              <Select value={form.shipmentCoverage} onValueChange={(v) => v && form.setShipmentCoverage(v)}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="door_to_door">Door to Door</SelectItem>
                  <SelectItem value="door_to_port">Door to Port</SelectItem>
                  <SelectItem value="port_to_door">Port to Door</SelectItem>
                  <SelectItem value="port_to_port">Port to Port</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pickup Time</Label>
              <Input className="h-9" value={form.pickupTime} onChange={(e) => form.setPickupTime(e.target.value)} placeholder="08:00" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pickup Notes</Label>
              <Input className="h-9" value={form.pickupNotes} onChange={(e) => form.setPickupNotes(e.target.value)} />
            </div>
          </div>
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
              onClick={() => router.push("/dashboard/admin/customer/bookings")}
              disabled={form.submitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={form.submitting}
              className="w-full sm:w-auto"
              onClick={(e) => void onSubmit(e, true)}
            >
              {form.submitting ? "Menyimpan..." : "Simpan Draft"}
            </Button>
            <Button type="submit" disabled={form.submitting} className="w-full sm:w-auto bg-black text-white hover:bg-zinc-800">
              {form.submitting ? "Menyimpan..." : "Submit Booking"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
