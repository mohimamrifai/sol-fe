"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useShipmentDetail } from "@/hooks/use-shipment-detail";
import { ShipmentHeader } from "./components/shipment-header";
import { AdminShipmentInfoCard } from "./components/sections/admin-shipment-info-card";
import { ShipmentPlanningCard } from "./components/sections/shipment-planning-card";
import { ContainerAssignmentCard } from "./components/sections/container-assignment-card";
import { AssignContainerDialog } from "./components/dialogs/assign-container-dialog";
import { ShipmentTransportCard } from "./components/sections/shipment-transport-card";
import { ShipmentDocumentsCard } from "./components/sections/shipment-documents-card";
import { ShipmentActivityLogCard } from "./components/sections/shipment-activity-log-card";
import { PartySection, type PartyData } from "@/components/shipments/shipment-detail/party-section";
import { CargoSection, type CargoData } from "@/components/shipments/shipment-detail/cargo-section";
import { AdminTrackingTimelineCard } from "./components/sections/admin-tracking-timeline-card";
import {
  addAdminShipmentContainer,
  cancelAdminShipment,
  generateAdminConsignmentNote,
  readyAdminShipmentForDeparture,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import {
  resolveFsdShipmentStatus,
  isFsdPlanningStatus,
  canEditShipmentInfo,
  canModifyContainerTransport,
} from "@/lib/shipment-fsd-status";
import { toast } from "sonner";

export default function AdminShipmentDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const shipmentId = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const s = useShipmentDetail(shipmentId);
  const planningRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSlot, setAssignSlot] = useState<Record<string, unknown> | null>(null);
  const [preselectedAsset, setPreselectedAsset] = useState<Record<string, unknown> | null>(null);
  const [printing, setPrinting] = useState(false);
  const [generatingCn, setGeneratingCn] = useState(false);

  if (!Number.isFinite(shipmentId) || shipmentId < 1) {
    return <p className="p-6 text-sm text-red-600">ID shipment tidak valid.</p>;
  }

  if (s.loading) {
    return <p className="p-6 text-sm text-muted-foreground">Memuat data shipment…</p>;
  }

  if (s.error || !s.data) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-red-600">{s.error ?? "Shipment tidak ditemukan."}</p>
      </div>
    );
  }

  const operationalStatus = String(s.data.status ?? "");
  const detail = s.data as Record<string, unknown>;
  const fsdStatus = resolveFsdShipmentStatus(operationalStatus, String(s.data.fsd_status ?? ""));
  const isPlanning = isFsdPlanningStatus(fsdStatus);
  const capabilities = detail.capabilities as
    | {
        can_edit_planning?: boolean;
        can_edit_shipment_info?: boolean;
        can_modify_container?: boolean;
        can_modify_transport?: boolean;
        can_upload_documents?: boolean;
      }
    | undefined;
  const canEditInfo = canEditShipmentInfo(fsdStatus, capabilities);
  const canModifyContainer = canModifyContainerTransport(fsdStatus, capabilities);
  const canModifyTransport = capabilities?.can_modify_transport ?? isPlanning;
  const canUploadDocs = capabilities?.can_upload_documents ?? isPlanning;
  const canEditPlanning = capabilities?.can_edit_planning ?? isPlanning;

  const coverage = String(s.data.shipment_coverage ?? "");
  const serviceCode = String(
    (s.data.service_type as { code?: string } | undefined)?.code ??
      (s.data.serviceType as { code?: string } | undefined)?.code ??
      (s.data.cargo as { service_code?: string } | undefined)?.service_code ??
      ""
  );
  const containerResponsibility = String(
    (detail.booking as { container_responsibility?: string } | undefined)?.container_responsibility ?? ""
  );

  const shipper: PartyData = (s.data.shipper_snapshot as PartyData) ?? {
    name: String(s.data.shipper_name ?? (detail.booking as { shipper_name?: string })?.shipper_name ?? ""),
    phone: String(s.data.shipper_phone ?? (detail.booking as { shipper_phone?: string })?.shipper_phone ?? ""),
    address: String(s.data.shipper_address ?? (detail.booking as { shipper_address?: string })?.shipper_address ?? ""),
  };
  const consignee: PartyData = (s.data.consignee_snapshot as PartyData) ?? {
    name: String(s.data.consignee_name ?? (detail.booking as { consignee_name?: string })?.consignee_name ?? ""),
    phone: String(s.data.consignee_phone ?? (detail.booking as { consignee_phone?: string })?.consignee_phone ?? ""),
    address: String(
      s.data.consignee_address ?? (detail.booking as { consignee_address?: string })?.consignee_address ?? ""
    ),
  };

  const cargo = s.data.cargo as CargoData | undefined;
  const documents = (s.data.documents ?? s.data.Documents) as
    | Parameters<typeof ShipmentDocumentsCard>[0]["documents"]
    | undefined;
  const activityLog = (s.data.activity_log ?? s.data.activityLog) as
    | Parameters<typeof ShipmentActivityLogCard>[0]["entries"]
    | undefined;

  const trackings = (s.data.tracking_timeline as Array<Record<string, unknown>> | undefined) ?? [];

  const shipmentNo = String(s.data.display_number ?? s.data.shipment_number ?? `SHP-${shipmentId}`);
  const cnNumber = String(s.data.waybill_number ?? "");
  const hasCn = Boolean(cnNumber && cnNumber !== "—");
  const booking = detail.booking as { id?: number | string; booking_number?: string } | undefined;
  const company = detail.company as { name?: string } | undefined;
  const createdAt = String(s.data.created_at ?? "");

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAssignContainer = () => {
    const isLcl = String(serviceCode).toUpperCase() === "LCL";

    if (isLcl) {
      void (async () => {
        try {
          let slot = s.containers[0] as Record<string, unknown> | undefined;
          if (!slot?.id) {
            const firstType = s.containerTypes[0];
            if (!firstType?.id) {
              toast.error("Tipe container belum tersedia.");
              return;
            }
            await addAdminShipmentContainer(shipmentId, { container_type_id: Number(firstType.id) });
            await s.reload();
            slot = s.containers[0] as Record<string, unknown> | undefined;
          }
          if (!slot?.id) {
            toast.error("Slot container LCL belum tersedia.");
            return;
          }
          setPreselectedAsset(null);
          setAssignSlot(slot);
          setAssignOpen(true);
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Gagal membuka assign container.");
        }
      })();
      return;
    }

    scrollTo(containerRef);
  };

  const handleGenerateCn = () => {
    setGeneratingCn(true);
    void generateAdminConsignmentNote(shipmentId)
      .then(() => {
        toast.success("Consignment Note berhasil dibuat.");
        void s.reload();
      })
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Gagal membuat CN."))
      .finally(() => setGeneratingCn(false));
  };

  const handlePrintCn = async () => {
    setPrinting(true);
    try {
      await s.pdf();
    } finally {
      setPrinting(false);
    }
  };

  const handleReadyForDeparture = () => {
    void readyAdminShipmentForDeparture(shipmentId)
      .then(() => {
        toast.success("Shipment siap berangkat.");
        void s.reload();
      })
      .catch((e) => {
        if (e instanceof ApiError && e.body && typeof e.body === "object") {
          const errors = (e.body as { errors?: Record<string, string> }).errors;
          if (errors) {
            toast.error(Object.values(errors).join(" "));
            return;
          }
        }
        toast.error(e instanceof ApiError ? e.message : "Gagal update status.");
      });
  };

  const handleLclPickAvailable = (assetId: number, asset: Record<string, unknown>) => {
    void (async () => {
      try {
        let slot = s.containers[0] as Record<string, unknown> | undefined;
        if (!slot?.id) {
          const firstType = s.containerTypes[0];
          if (!firstType?.id) {
            toast.error("Tipe container belum tersedia.");
            return;
          }
          await addAdminShipmentContainer(shipmentId, { container_type_id: Number(firstType.id) });
          await s.reload();
          slot = s.containers[0] as Record<string, unknown> | undefined;
        }
        if (!slot?.id) {
          toast.error("Slot container LCL belum tersedia.");
          return;
        }
        setAssignSlot(slot);
        setPreselectedAsset({ ...asset, id: assetId });
        setAssignOpen(true);
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Gagal membuka assign container.");
      }
    })();
  };

  const handleCancelShipment = () => {
    const reason = prompt("Alasan pembatalan shipment:");
    if (!reason?.trim()) return;
    void cancelAdminShipment(shipmentId, reason.trim())
      .then(() => {
        toast.success("Shipment dibatalkan.");
        void s.reload();
      })
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Gagal membatalkan."));
  };

  const hasDoorService = coverage.includes("door");

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-20">
      <ShipmentHeader
        shipmentNo={shipmentNo}
        cnNumber={cnNumber || "—"}
        fsdStatus={fsdStatus}
        bookingNumber={booking?.booking_number}
        bookingId={booking?.id}
        customerName={company?.name}
        createdAt={createdAt}
        onGenerateCn={isPlanning && !hasCn ? handleGenerateCn : undefined}
        generatingCn={generatingCn}
        onPrintCn={hasCn ? () => void handlePrintCn() : undefined}
        onEditPlanning={isPlanning ? () => scrollTo(planningRef) : undefined}
        onAssignContainer={canModifyContainer ? handleAssignContainer : undefined}
        canModifyContainer={canModifyContainer}
        onReadyForDeparture={isPlanning ? handleReadyForDeparture : undefined}
        onCancelShipment={isPlanning ? handleCancelShipment : undefined}
        printing={printing}
      />

      <AdminShipmentInfoCard
        shipmentId={shipmentId}
        data={detail}
        canEdit={canEditInfo}
        onSaved={() => void s.reload()}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PartySection data={shipper} variant="shipper" />
        <PartySection data={consignee} variant="consignee" />
      </div>

      <CargoSection data={cargo ?? null} />

      <div ref={planningRef}>
        <ShipmentPlanningCard
          shipmentId={shipmentId}
          data={detail}
          canEdit={canEditPlanning}
          onSaved={() => void s.reload()}
        />
      </div>

      <div ref={containerRef}>
        <ContainerAssignmentCard
          shipmentId={shipmentId}
          containers={s.containers}
          containerResponsibility={containerResponsibility}
          serviceCode={serviceCode}
          canEdit={canModifyContainer}
          onAssign={(container) => {
            setPreselectedAsset(null);
            setAssignSlot(container as Record<string, unknown>);
            setAssignOpen(true);
          }}
          onPickAvailable={handleLclPickAvailable}
        />
      </div>

      {hasDoorService ? (
        <ShipmentTransportCard
          shipmentId={shipmentId}
          coverage={coverage}
          data={detail}
          canEdit={canModifyTransport}
          onSaved={() => void s.reload()}
        />
      ) : null}

      <AdminTrackingTimelineCard entries={trackings} />

      <ShipmentDocumentsCard
        shipmentId={shipmentId}
        documents={documents}
        canUpload={canUploadDocs}
        cnAvailable={hasCn}
        onPrintCn={hasCn ? () => void handlePrintCn() : undefined}
        onUploaded={() => void s.reload()}
      />

      <ShipmentActivityLogCard entries={activityLog} />

      <AssignContainerDialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setPreselectedAsset(null);
        }}
        shipmentId={shipmentId}
        slot={assignSlot as Parameters<typeof AssignContainerDialog>[0]["slot"]}
        isLcl={String(serviceCode).toUpperCase() === "LCL"}
        isCustomerProvided={containerResponsibility.toUpperCase() === "SOC"}
        containerTypeId={
          assignSlot?.container_type_id
            ? Number(assignSlot.container_type_id)
            : (assignSlot?.container_type as { id?: number } | undefined)?.id
        }
        defaultYardId={
          (detail.origin_yard as { id?: number } | undefined)?.id ??
          (detail.originYard as { id?: number } | undefined)?.id
        }
        preselectedAsset={preselectedAsset as Parameters<typeof AssignContainerDialog>[0]["preselectedAsset"]}
        onSaved={() => void s.reload()}
      />
    </div>
  );
}
