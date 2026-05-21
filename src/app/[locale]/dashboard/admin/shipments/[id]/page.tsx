"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Download, Package, Plus } from "lucide-react";
import { useShipmentDetail } from "./hooks/use-shipment-detail";
import { ShipmentHeader } from "./components/shipment-header";
import { ShipmentSummaryCard } from "./components/sections/shipment-summary-card";
import { TrackingTimelineCard } from "./components/sections/tracking-timeline-card";
import { ContainerRackCard } from "./components/sections/container-rack-card";
import { ItemCargoCard } from "./components/sections/item-cargo-card";

// Dialogs
import { EditShipmentDialog } from "./components/dialogs/edit-shipment-dialog";
import { TrackingUpdateDialog } from "./components/dialogs/tracking-update-dialog";
import { ContainerDialog } from "./components/dialogs/container-add-dialog";
import { RackDialog } from "./components/dialogs/rack-add-dialog";
import { ItemAdminDialog } from "./components/dialogs/item-admin-dialog";
import { BookingDetailDialog } from "@/components/dashboard/admin/bookings/booking-detail-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { fetchAdminBooking } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { BookingDetail } from "@/components/dashboard/admin/bookings/types";

type ShipmentDetailData = {
  company?: { name?: string };
  booking?: { booking_number?: string; id?: number | string };
  originLocation?: { name?: string };
  origin_location?: { name?: string };
  destinationLocation?: { name?: string };
  destination_location?: { name?: string };
  transportMode?: { name?: string };
  transport_mode?: { name?: string };
  serviceType?: { name?: string };
  service_type?: { name?: string };
  estimated_departure?: string;
  estimated_arrival?: string;
  notes?: string;
};

type TrackingRow = {
  id: number | string;
  status: string;
  tracked_at?: string;
  notes?: string;
  location?: string;
  photos?: Array<{ id?: number | string; path?: string; url?: string }>;
};

export default function AdminShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const shipmentId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const s = useShipmentDetail(shipmentId);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingDetail | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleOpenBooking = async (bId: number | string) => {
    setBookingDialogOpen(true);
    setBookingLoading(true);
    setBookingData(null);
    try {
      const res = await fetchAdminBooking(Number(bId));
      setBookingData((res as { data: BookingDetail }).data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail booking.");
      setBookingDialogOpen(false);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!Number.isFinite(shipmentId) || shipmentId < 1) {
    return <p className="text-sm text-red-600 p-6">ID shipment tidak valid.</p>;
  }

  if (s.loading) {
    return <p className="text-sm text-muted-foreground p-6">Memuat data shipment…</p>;
  }

  if (s.error || !s.data) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-red-600">{s.error ?? "Shipment tidak ditemukan."}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  const cnNum = String(s.data.waybill_number ?? s.data.shipment_number ?? "Shipment");
  const st = String(s.data.status ?? "");
  const detail = s.data as ShipmentDetailData;

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-20">
      <ShipmentHeader cnNumber={cnNum} status={st} />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void s.pdf()}>
          <Download className="h-4 w-4" />
          Cetak Consignment Note (CN)
        </Button>
        <Button type="button" size="sm" onClick={s.openEditShipment}>
          Edit Jadwal
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => s.setTrackOpen(true)}>
          Update Tracking
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={s.openAddContainer}>
          <Plus className="h-4 w-4 mr-1" />
          Kontainer
        </Button>
        <Button type="button" size="sm" onClick={s.openNewItem}>
          <Package className="h-4 w-4 mr-1" />
          Item Cargo
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ShipmentSummaryCard
          companyName={String(detail.company?.name ?? "—")}
          bookingNumber={detail.booking?.booking_number ? String(detail.booking.booking_number) : undefined}
          bookingId={detail.booking?.id}
          origin={String(detail.origin_location?.name ?? detail.originLocation?.name ?? "—")}
          destination={String(detail.destination_location?.name ?? detail.destinationLocation?.name ?? "—")}
          transportMode={String(detail.transport_mode?.name ?? detail.transportMode?.name ?? "—")}
          serviceType={String(detail.service_type?.name ?? detail.serviceType?.name ?? "—")}
          containerInfo={
            s.containers.length > 0 
              ? `${s.containers.length} Kontainer` 
              : undefined
          }
          departure={s.data.estimated_departure ? String(s.data.estimated_departure).slice(0, 10) : "—"}
          arrival={s.data.estimated_arrival ? String(s.data.estimated_arrival).slice(0, 10) : "—"}
          booking={detail.booking as Record<string, unknown>}
          notes={detail.notes ? String(detail.notes) : undefined}
          onOpenBooking={() => {
            if (detail.booking?.id) handleOpenBooking(detail.booking.id);
          }}
        />

        <TrackingTimelineCard trackings={s.trackings as TrackingRow[]} />

        <ContainerRackCard
          containers={s.containers}
          onAddRack={s.openRack}
          onEditContainer={s.openEditContainer}
          onEditRack={s.openEditRack}
          onDeleteRack={(rack) => {
            s.setDeleteRackRow(rack);
            s.setDeleteRackOpen(true);
          }}
        />

        <div className="lg:col-span-2">
          <ItemCargoCard items={s.items} onEdit={s.openEditItem} onDelete={(it) => {
            s.setDeleteItemRow(it);
            s.setDeleteItemOpen(true);
          }} />
        </div>
      </div>

      <EditShipmentDialog
        open={s.editOpen}
        onOpenChange={s.setEditOpen}
        estDep={s.estDep}
        setEstDep={s.setEstDep}
        estArr={s.estArr}
        setEstArr={s.setEstArr}
        notes={s.notes}
        setNotes={s.setNotes}
        saving={s.savingEdit}
        onSave={() => void s.saveEdit()}
      />

      <TrackingUpdateDialog
        open={s.trackOpen}
        onOpenChange={s.setTrackOpen}
        status={s.trackStatus}
        setStatus={s.setTrackStatus}
        trackedAt={s.trackAt}
        setTrackedAt={s.setTrackAt}
        notes={s.trackNotes}
        setNotes={s.setTrackNotes}
        setFiles={s.setTrackFiles}
        saving={s.savingTrack}
        onSave={() => void s.saveTracking()}
      />

      <ContainerDialog
        open={s.contOpen}
        onOpenChange={s.setContOpen}
        mode={s.contMode}
        containerTypes={s.containerTypes}
        contTypeId={s.contTypeId}
        setContTypeId={s.setContTypeId}
        contNum={s.contNum}
        setContNum={s.setContNum}
        contSeal={s.contSeal}
        setContSeal={s.setContSeal}
        saving={s.savingCont}
        onSave={() => void s.saveContainer()}
      />

      <RackDialog
        open={s.rackOpen}
        onOpenChange={s.setRackOpen}
        mode={s.rackMode}
        rackName={s.rackName}
        setRackName={s.setRackName}
        saving={s.savingRack}
        onSave={() => void s.saveRack()}
      />

      <ItemAdminDialog
        open={s.itemOpen}
        onOpenChange={s.setItemOpen}
        mode={s.itemMode}
        values={{
          itemName: s.itemName,
          itemDesc: s.itemDesc,
          itemQty: s.itemQty,
          itemWeight: s.itemWeight,
          itemPlacement: s.itemPlacement,
          itemContainerId: s.itemContainerId,
          itemRackId: s.itemRackId,
          itemFragile: s.itemFragile,
          itemStack: s.itemStack,
          itemLength: s.itemLength,
          itemWidth: s.itemWidth,
          itemHeight: s.itemHeight,
          itemCbm: s.itemCbm,
        }}
        setters={{
          setItemName: s.setItemName,
          setItemDesc: s.setItemDesc,
          setItemQty: s.setItemQty,
          setItemWeight: s.setItemWeight,
          setItemPlacement: s.setItemPlacement,
          setItemContainerId: s.setItemContainerId,
          setItemRackId: s.setItemRackId,
          setItemFragile: s.setItemFragile,
          setItemStack: s.setItemStack,
          setItemLength: s.setItemLength,
          setItemWidth: s.setItemWidth,
          setItemHeight: s.setItemHeight,
          setItemCbm: s.setItemCbm,
        }}
        containers={s.containers}
        rackOptions={s.rackOptions}
        saving={s.savingItem}
        onSave={() => void s.saveItem()}
      />

      <ConfirmDeleteDialog
        open={s.deleteItemOpen}
        onOpenChange={s.setDeleteItemOpen}
        title="Hapus Item Cargo?"
        description={`Anda akan menghapus item "${s.deleteItemRow?.name ?? ""}". Tindakan ini tidak dapat dibatalkan.`}
        loading={s.deleteItemLoading}
        onConfirm={() => void s.handleDeleteItem()}
      />

      <ConfirmDeleteDialog
        open={s.deleteRackOpen}
        onOpenChange={s.setDeleteRackOpen}
        title="Hapus Rack?"
        description={`Anda akan menghapus rack "${s.deleteRackRow?.name ?? ""}". Tindakan ini tidak dapat dibatalkan.`}
        loading={s.deleteRackLoading}
        onConfirm={() => void s.handleDeleteRack()}
      />

      <BookingDetailDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        loading={bookingLoading}
        data={bookingData}
      />
    </div>
  );
}
