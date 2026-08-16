"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundState } from "@/components/shared/not-found-state";
import { useCustomerLocationDetail } from "@/hooks/use-customer-location-detail";
import { LocationFormDialog } from "@/components/locations/location-form-dialog";
import { LocationInfoSection } from "@/components/locations/location-info-section";
import { LocationAddressSection } from "@/components/locations/location-address-section";
import { LocationPicSection } from "@/components/locations/location-pic-section";
import { LocationActivitySection } from "@/components/locations/location-activity-section";
import type { LocationRow } from "@/components/locations/location-table";

const statusBadgeClass: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200/60",
};

export default function LocationDetailPage() {
  const t = useTranslations("Locations");
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);

  const { data, isLoading, isError } = useCustomerLocationDetail(
    Number.isFinite(id) && id > 0 ? id : null
  );
  const location: LocationRow | null = (data?.data ?? null) as unknown as LocationRow | null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <NotFoundState
        title={t("notFound.title")}
        description={t("notFound.description")}
        backLabel={t("notFound.back")}
        backHref="/dashboard/locations"
      />
    );
  }

  const statusLabel = location.status
    ? t.has(`status.${location.status}` as "status.active")
      ? t(`status.${location.status}` as "status.active" | "status.inactive")
      : location.status
    : "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/dashboard/locations")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {location.name ?? "—"}
            </h1>
            <p className="text-xs font-mono text-zinc-500">{location.code ?? "—"}</p>
          </div>
          <Badge variant="outline" className={statusBadgeClass[location.status ?? ""] ?? ""}>
            {statusLabel}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="h-9 gap-2">
          <Pencil className="h-4 w-4" />
          {t("detail.actions.edit")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LocationInfoSection location={location} />
        <LocationAddressSection location={location} />
      </div>
      <LocationPicSection location={location} />
      <LocationActivitySection locationId={location.id} />

      <LocationFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        row={location}
      />
    </div>
  );
}
