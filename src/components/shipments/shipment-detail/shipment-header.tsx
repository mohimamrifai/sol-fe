"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shipmentStatusBadgeClass, shipmentStatusCardLabelKey } from "@/lib/shipment-status";
import { useRouter } from "@/i18n/routing";

interface Props {
  shipment: {
    id: number | string;
    display_number?: string;
    shipment_number?: string;
    waybill_number?: string;
    high_level_status?: string;
  };
  cnAvailable: boolean;
  onDownloadCn?: () => void;
  downloading?: boolean;
}

export function ShipmentHeader({ shipment, cnAvailable, onDownloadCn, downloading }: Props) {
  const t = useTranslations("Shipments.detail.header");
  const tStatus = useTranslations("Shipments.card");
  const router = useRouter();
  const status = shipment.high_level_status ?? "planning";
  const labelKey = shipmentStatusCardLabelKey(status).split(".")[1] ?? "planning";

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/shipments")}
            className="h-7 -ml-2 gap-1 px-2 text-xs text-zinc-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToList")}
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="font-medium text-zinc-900">
              {shipment.display_number ?? shipment.shipment_number ?? `SHP-${shipment.id}`}
            </span>
            <span className="text-zinc-300">·</span>
            <span className="font-mono text-xs">{shipment.waybill_number ?? "—"}</span>
            <span className="text-zinc-300">·</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                shipmentStatusBadgeClass(status)
              )}
            >
              {tStatus(labelKey)}
            </span>
          </div>
        </div>
        {cnAvailable ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadCn}
            disabled={downloading}
            className="h-9 gap-2"
          >
            <Download className="h-4 w-4" />
            {t("downloadCn")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
