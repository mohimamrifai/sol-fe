"use client";

import * as React from "react";
import { use } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import { useCustomerShipmentDetail, downloadCustomerConsignmentNotePdf } from "@/hooks/use-customer-shipment-detail";
import { ShipmentHeader } from "@/components/shipments/shipment-detail/shipment-header";
import { ShipmentInfoSection } from "@/components/shipments/shipment-detail/shipment-info-section";
import { PartySection, type PartyData } from "@/components/shipments/shipment-detail/party-section";
import { CargoSection, type CargoData } from "@/components/shipments/shipment-detail/cargo-section";
import { TrackingSection, type TrackingEntry } from "@/components/shipments/shipment-detail/tracking-section";
import { DocumentsSection, type DocumentItem } from "@/components/shipments/shipment-detail/documents-section";
import { ActivityLogSection, type ActivityEntry } from "@/components/shipments/shipment-detail/activity-log-section";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerShipmentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations("Shipments.detail");
  const tCommon = useTranslations("Dashboard.common");
  const router = useRouter();
  const [downloading, setDownloading] = React.useState(false);
  const query = useCustomerShipmentDetail(id);

  const data = query.data;

  const onDownloadCn = React.useCallback(async () => {
    setDownloading(true);
    try {
      await downloadCustomerConsignmentNotePdf(id);
      toast.success("CN berhasil diunduh.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunduh CN.");
    } finally {
      setDownloading(false);
    }
  }, [id]);

  if (query.isLoading) {
    return <PageSkeleton />;
  }

  if (query.error || !data) {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/shipments")}
          className="h-7 -ml-2 gap-1 px-2 text-xs text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("header.backToList")}
        </Button>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{t("loadError")}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            className="h-8 gap-1 px-2 text-xs"
          >
            <RefreshCcw className="h-3 w-3" />
            {tCommon("retry")}
          </Button>
        </div>
      </div>
    );
  }

  const shipper: PartyData = (data.shipper_snapshot as PartyData) ?? {
    name: data.shipper_name as string | null,
    phone: data.shipper_phone as string | null,
    address: data.shipper_address as string | null,
  };
  const consignee: PartyData = (data.consignee_snapshot as PartyData) ?? {
    name: data.consignee_name as string | null,
    phone: data.consignee_phone as string | null,
    address: data.consignee_address as string | null,
  };
  const documents = (data.documents as DocumentItem[] | undefined) ?? [];
  const cargo = data.cargo as CargoData | undefined;
  const trackings = (data.tracking_timeline as TrackingEntry[] | undefined) ?? [];
  const activity = (data.activity_log as ActivityEntry[] | undefined) ?? [];

  const booking = (data.booking as Record<string, unknown> | undefined) ?? {};
  const origin = data.origin_location as { name?: string; code?: string } | undefined;
  const destination = data.destination_location as { name?: string; code?: string } | undefined;
  const serviceType = data.service_type as { name?: string; code?: string } | undefined;

  return (
    <div className="space-y-5">
      <ShipmentHeader
        shipment={data as unknown as Parameters<typeof ShipmentHeader>[0]["shipment"]}
        cnAvailable={!!data.waybill_number}
        onDownloadCn={onDownloadCn}
        downloading={downloading}
      />

      <ShipmentInfoSection
        data={{
          company_name: (data.company as { name?: string } | undefined)?.name,
          display_number: data.display_number as string | undefined,
          shipment_number: data.shipment_number as string | undefined,
          waybill_number: data.waybill_number as string | undefined,
          booking_id: booking.id as number | string | undefined,
          booking_number: booking.booking_number as string | undefined,
          service_type_name: serviceType?.name ?? serviceType?.code,
          shipment_coverage: data.shipment_coverage as string | undefined,
          origin_station: origin?.code ?? origin?.name,
          destination_station: destination?.code ?? destination?.name,
          etd: data.estimated_departure as string | null,
          eta: data.estimated_arrival as string | null,
          high_level_status: data.high_level_status as string | undefined,
        }}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PartySection data={shipper} variant="shipper" />
        <PartySection data={consignee} variant="consignee" />
      </div>

      <CargoSection data={cargo ?? null} />

      <TrackingSection entries={trackings} />

      <DocumentsSection
        documents={documents}
        cnDownloadUrl={
          data.waybill_number
            ? `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/customer/shipments/${data.id}/consignment-note-pdf`
            : undefined
        }
        onDownloadCn={onDownloadCn}
      />

      <ActivityLogSection entries={activity} />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-32 animate-pulse rounded-xl bg-zinc-100" />
      <div className="h-48 animate-pulse rounded-xl bg-zinc-100" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-zinc-100" />
        <div className="h-40 animate-pulse rounded-xl bg-zinc-100" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
    </div>
  );
}
