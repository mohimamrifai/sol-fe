"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit3,
  Send,
  XCircle,
  Copy,
  ExternalLink,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelCustomerBooking,
  deleteCustomerBookingAttachment,
  duplicateCustomerBooking,
  fetchCustomerBooking,
  fetchCustomerBookingActivities,
  submitCustomerBooking,
  uploadCustomerBookingAttachment,
} from "@/lib/customer-api";
import { SHIPMENT_COVERAGE_LABELS, bookingStatusBadgeClass, bookingStatusLabelFromApi } from "@/lib/booking-status";
import { formatIdr, formatRelative, formatShortDate } from "@/components/dashboard/format";
import { ApiError } from "@/lib/api-client";
import { useRouter } from "@/i18n/routing";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";

type BookingDetail = {
  id: number;
  booking_number: string;
  status: string;
  created_at?: string | null;
  departure_date?: string | null;
  shipment_coverage?: string | null;
  shipper_name?: string | null;
  shipper_address?: string | null;
  shipper_phone?: string | null;
  consignee_name?: string | null;
  consignee_address?: string | null;
  consignee_phone?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  estimated_price?: number | string | null;
  cost_breakdown?: {
    freight?: number;
    pickup?: number;
    delivery?: number;
    discount?: number;
    additional_services?: number;
    total?: number;
  } | null;
  available_actions?: string[];
  packages?: Array<{
    id: number;
    sequence?: number;
    description?: string | null;
    package_type?: string;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    weight_kg?: number | null;
    volume_cbm?: number | null;
    piece_count?: number;
    remark?: string | null;
    cargo_category?: { name?: string; code?: string } | null;
    is_dangerous_goods?: boolean;
    dg_class?: { name?: string; code?: string } | null;
    un_number?: string | null;
    msds_url?: string | null;
  }>;
  containers?: Array<{
    id: number;
    sequence?: number;
    container_type?: { name?: string; size?: string } | null;
    container_number?: string | null;
    seal_number?: string | null;
    gross_weight_kg?: number | null;
    volume_cbm?: number | null;
    cargo_description?: string | null;
    remark?: string | null;
    cargo_category?: { name?: string; code?: string } | null;
    equipment_condition?: string | null;
    temperature?: number | null;
    is_dangerous_goods?: boolean;
    dg_class?: { name?: string; code?: string } | null;
    un_number?: string | null;
    msds_url?: string | null;
  }>;
  total_volume_cbm?: number | null;
  volume_weight_kg?: number | null;
  chargeable_weight_kg?: number | null;
  attachments?: Array<{
    id: number;
    original_name: string;
    file_size: number;
    uploader?: { name?: string } | null;
    created_at?: string;
    url?: string;
  }>;
};

type Activity = {
  id: number;
  title: string;
  description?: string | null;
  actor_role?: "customer" | "internal" | "system" | string | null;
  actor?: { name?: string } | null;
  occurred_at?: string;
  created_at?: string;
};

const CANCEL_REASONS = ["wrongService", "noShipment", "competitor", "incomplete", "other"] as const;
type CancelReasonKey = (typeof CANCEL_REASONS)[number];

export default function CustomerBookingDetailPage() {
  const params = useParams<{ locale: string; id: string }>();
  const id = Number(params.id);
  const locale = params.locale ?? "id";
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("Bookings.detail");
  const tSection1 = useTranslations("Bookings.detail.section1");
  const tSection2 = useTranslations("Bookings.detail.section2");
  const tSection3 = useTranslations("Bookings.detail.section3");
  const tSection4 = useTranslations("Bookings.detail.section4");
  const tSection5 = useTranslations("Bookings.detail.section5");
  const tCancel = useTranslations("Bookings.cancelDialog");
  const tAction = useTranslations("Bookings.detail.actions");
  const tReject = useTranslations("Bookings.detail.rejection");
  const tCancellation = useTranslations("Bookings.detail.cancellation");
  const tCommon = useTranslations("Bookings");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<CancelReasonKey | "">("");
  const [cancelOther, setCancelOther] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const detailQuery = useQuery({
    queryKey: ["customer", "booking", id],
    queryFn: () => fetchCustomerBooking(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const activitiesQuery = useQuery({
    queryKey: ["customer", "booking", id, "activities"],
    queryFn: () => fetchCustomerBookingActivities(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["customer", "booking", id] });
    void queryClient.invalidateQueries({ queryKey: ["customer", "booking", id, "activities"] });
    void queryClient.invalidateQueries({ queryKey: ["customer", "bookings", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["customer", "bookings", "stats"] });
  };

  const submitMutation = useMutation({
    mutationFn: () => submitCustomerBooking(id),
    onSuccess: () => {
      toast.success(tAction("submit") + " ✓");
      invalidateAll();
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to submit";
      toast.error(msg);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateCustomerBooking(id),
    onSuccess: (resp: { data?: { id?: number } }) => {
      const newId = resp?.data?.id;
      toast.success(tCommon("duplicateSuccess"));
      invalidateAll();
      if (newId) router.push(`/dashboard/booking/${newId}`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to duplicate";
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelCustomerBooking(id, reason),
    onSuccess: () => {
      toast.success(tAction("cancel") + " ✓");
      setCancelOpen(false);
      setCancelReason("");
      setCancelOther("");
      setCancelError(null);
      invalidateAll();
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to cancel";
      toast.error(msg);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCustomerBookingAttachment(id, file),
    onSuccess: () => {
      toast.success("Attachment uploaded");
      invalidateAll();
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to upload";
      toast.error(msg);
    },
  });

  const deleteAttMutation = useMutation({
    mutationFn: (attachmentId: number) => deleteCustomerBookingAttachment(id, attachmentId),
    onSuccess: () => {
      toast.success("Attachment deleted");
      setDeleteAttachmentId(null);
      invalidateAll();
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to delete";
      toast.error(msg);
    },
  });

  if (detailQuery.isError) {
    const err = detailQuery.error;
    if (err instanceof ApiError && err.status === 404) {
      return (
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className="text-sm text-zinc-600">{t("notFound")}</p>
          <Button
            className="mt-6"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/booking" />}
          >
            {tAction("backToList")}
          </Button>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-sm text-zinc-600">{t("loadError")}</p>
        <Button
          className="mt-6"
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/booking" />}
        >
          {tAction("backToList")}
        </Button>
      </div>
    );
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return <DetailSkeleton />;
  }

  const data = (detailQuery.data as { data?: BookingDetail }).data ?? (detailQuery.data as unknown as BookingDetail);
  const activities = ((activitiesQuery.data as { data?: Activity[] } | undefined)?.data ?? []) as Activity[];
  const actions = new Set(data.available_actions ?? []);

  const handleCancelSubmit = () => {
    setCancelError(null);
    if (!cancelReason) {
      setCancelError(tCancel("errorReason"));
      return;
    }
    const finalReason = cancelReason === "other" ? cancelOther.trim() : cancelReason;
    if (cancelReason === "other" && !finalReason) {
      setCancelError(tCancel("errorReason"));
      return;
    }
    cancelMutation.mutate(finalReason);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-zinc-500 hover:text-zinc-900"
            nativeButton={false}
            render={<Link href="/dashboard/booking" />}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            {tAction("backToList")}
          </Button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t("header.title")}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Booking #</span>
              <span className="font-mono text-xs text-zinc-700">{data.booking_number}</span>
              <Badge className={bookingStatusBadgeClass(data.status)} variant="secondary">
                {bookingStatusLabelFromApi(data.status)}
              </Badge>
              <span className="text-zinc-300">·</span>
              <span className="text-xs text-zinc-500">
                {t("header.createdDateLabel")} {data.created_at ? formatShortDate(data.created_at, locale) : "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {actions.has("edit") ? (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/booking/${id}/edit`} />}
              >
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                {tAction("edit")}
              </Button>
            ) : null}
            {actions.has("submit") ? (
              <Button
                type="button"
                size="sm"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {submitMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                {tAction("submit")}
              </Button>
            ) : null}
            {actions.has("cancel") ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                {tAction("cancel")}
              </Button>
            ) : null}
            {actions.has("duplicate") ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => duplicateMutation.mutate()}
                disabled={duplicateMutation.isPending}
              >
                {duplicateMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {tAction("duplicate")}
              </Button>
            ) : null}
          </div>
        </div>

        {data.status === "rejected" && data.rejection_reason ? (
          <Card className="border-red-200 bg-red-50/50 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-700">{tReject("title")}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-red-700/90">{data.rejection_reason}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {data.status === "cancelled" && data.cancellation_reason ? (
          <Card className="border-red-200 bg-red-50/50 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-700">{tCancellation("title")}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-red-700/90">{data.cancellation_reason}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Section 1: Booking Information */}
      <DetailSectionCard title={t("section1.title")}>
        <BookingInfoGrid data={data} t={tSection1} locale={locale} />
      </DetailSectionCard>

      {/* Section 2: Cargo Information */}
      <DetailSectionCard title={t("section2.title")}>
        <CargoSection data={data} t={tSection2} locale={locale} />
      </DetailSectionCard>

      {/* Section 3: Cost Estimation */}
      <DetailSectionCard title={t("section3.title")}>
        <CostSection data={data} t={tSection3} locale={locale} />
      </DetailSectionCard>

      {/* Section 4: Attachments */}
      <DetailSectionCard
        title={t("section4.title")}
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              {tSection4("uploadButton")}
            </Button>
          </>
        }
      >
        <AttachmentsSection
          items={data.attachments ?? []}
          t={tSection4}
          locale={locale}
          onDelete={(attachmentId) => setDeleteAttachmentId(attachmentId)}
          pendingId={deleteAttMutation.variables}
        />
      </DetailSectionCard>

      {/* Section 5: Booking Timeline */}
      <DetailSectionCard title={t("section5.title")}>
        <TimelineSection activities={activities} t={tSection5} locale={locale} />
      </DetailSectionCard>

      {/* Section 6: Activity Log */}
      <DetailSectionCard title={t("section6.title")}>
        <ActivityLogSection activities={activities} t={tSection5} locale={locale} />
      </DetailSectionCard>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCancel("title")}</DialogTitle>
            <DialogDescription>{tCancel("description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{tCancel("reasonLabel")}</label>
              <Select
                value={cancelReason || "__none__"}
                onValueChange={(v) => setCancelReason(v === "__none__" ? "" : (v as CancelReasonKey))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tCancel("reasonPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{tCancel(`reasons.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cancelReason === "other" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">{tCancel("otherLabel")}</label>
                <Textarea
                  value={cancelOther}
                  onChange={(e) => setCancelOther(e.target.value)}
                  rows={3}
                />
              </div>
            ) : null}
            {cancelError ? (
              <p className="text-xs text-red-600">{cancelError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCancelOpen(false)}>
              {tCancel("back")}
            </Button>
            <Button
              type="button"
              onClick={handleCancelSubmit}
              disabled={cancelMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {cancelMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {tCancel("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteAttachmentId != null}
        onOpenChange={(open) => !open && setDeleteAttachmentId(null)}
        title={tSection4("deleteDialog.title")}
        description={tSection4("deleteDialog.description")}
        loading={deleteAttMutation.isPending}
        onConfirm={() => {
          if (deleteAttachmentId != null) deleteAttMutation.mutate(deleteAttachmentId);
        }}
      />
    </div>
  );
}

function DetailSectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="min-w-0 overflow-hidden border-zinc-200 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">{title}</CardTitle>
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-6 sm:px-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function BookingInfoGrid({ data, t, locale }: { data: BookingDetail; t: ReturnType<typeof useTranslations>; locale: string }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <InfoRow label={t("bookingNumber")} value={<span className="font-mono text-xs">{data.booking_number}</span>} />
      <InfoRow label={t("status")} value={<Badge className={bookingStatusBadgeClass(data.status)} variant="secondary">{bookingStatusLabelFromApi(data.status)}</Badge>} />
      <InfoRow label={t("createdAt")} value={data.created_at ? formatShortDate(data.created_at, locale) : "—"} />
      <InfoRow label={t("departureDate")} value={data.departure_date ? formatShortDate(data.departure_date, locale) : "—"} />
      <InfoRow label={t("shipmentCoverage")} value={data.shipment_coverage ? SHIPMENT_COVERAGE_LABELS[data.shipment_coverage] ?? data.shipment_coverage : "—"} />
      <InfoRow label={`${t("shipper")} (${t("phone")})`} value={data.shipper_phone ?? "—"} />
      <InfoRow label={t("shipper")} value={data.shipper_name ?? "—"} />
      <InfoRow label={t("address")} value={data.shipper_address ?? "—"} fullWidth />
      <InfoRow label={`${t("consignee")} (${t("phone")})`} value={data.consignee_phone ?? "—"} />
      <InfoRow label={t("consignee")} value={data.consignee_name ?? "—"} />
      <InfoRow label={t("address")} value={data.consignee_address ?? "—"} fullWidth />
      {data.notes ? (
        <InfoRow label={t("notes")} value={<span className="whitespace-pre-line">{data.notes}</span>} fullWidth />
      ) : null}
    </dl>
  );
}

function InfoRow({ label, value, fullWidth }: { label: string; value: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "sm:col-span-2 lg:col-span-3" : ""}>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900">{value}</dd>
    </div>
  );
}

function CargoSection({ data, t }: { data: BookingDetail; t: ReturnType<typeof useTranslations>; locale: string }) {
  const hasLCL = (data.packages?.length ?? 0) > 0;
  const hasFCL = (data.containers?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {hasLCL ? (
        <SubTable title={t("lclTitle")}>
          <thead className="bg-zinc-50/60 text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-semibold">{t("sequence")}</th>
              <th className="px-3 py-2 font-semibold">{t("description")}</th>
              <th className="px-3 py-2 font-semibold">{t("packageType")}</th>
              <th className="px-3 py-2 font-semibold">{t("dimensions")}</th>
              <th className="px-3 py-2 font-semibold">{t("weight")}</th>
              <th className="px-3 py-2 font-semibold">{t("volume")}</th>
              <th className="px-3 py-2 font-semibold">{t("chargeableWeight")}</th>
              <th className="px-3 py-2 font-semibold">{t("pieces")}</th>
              <th className="px-3 py-2 font-semibold">{t("dg")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.packages ?? []).map((p) => (
              <tr key={p.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 text-zinc-700">{p.sequence ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">{p.description ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">{p.package_type ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700 tabular-nums">
                  {p.length ?? "—"} × {p.width ?? "—"} × {p.height ?? "—"}
                </td>
                <td className="px-3 py-2 text-zinc-700 tabular-nums">{p.weight_kg ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700 tabular-nums">{p.volume_cbm ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700 tabular-nums">{calcPackageChargeableWeight(p)}</td>
                <td className="px-3 py-2 text-zinc-700 tabular-nums">{p.piece_count ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">
                  {p.is_dangerous_goods ? (
                    <span className="inline-flex items-center gap-1 text-xs">
                      {p.dg_class?.name ?? "DG"}
                      {p.un_number ? <span className="text-zinc-500">· UN {p.un_number}</span> : null}
                      {p.msds_url ? (
                        <a href={p.msds_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          MSDS
                        </a>
                      ) : null}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </SubTable>
      ) : null}

      {hasFCL ? (
        <SubTable title={t("fclTitle")}>
          <thead className="bg-zinc-50/60 text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-semibold">{t("sequence")}</th>
              <th className="px-3 py-2 font-semibold">{t("containerType")}</th>
              <th className="px-3 py-2 font-semibold">{t("containerNumber")}</th>
              <th className="px-3 py-2 font-semibold">{t("sealNumber")}</th>
              <th className="px-3 py-2 font-semibold">{t("weight")}</th>
              <th className="px-3 py-2 font-semibold">{t("cargoDescription")}</th>
              <th className="px-3 py-2 font-semibold">{t("cargoCategory")}</th>
              <th className="px-3 py-2 font-semibold">{t("remark")}</th>
              <th className="px-3 py-2 font-semibold">{t("dg")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.containers ?? []).map((c) => (
              <tr key={c.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 text-zinc-700">{c.sequence ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">{c.container_type?.name ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-700">{c.container_number ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-700">{c.seal_number ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700 tabular-nums">{c.gross_weight_kg ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">{c.cargo_description ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">{c.cargo_category?.name ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">{c.remark ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">
                  {c.is_dangerous_goods ? (
                    <span className="inline-flex items-center gap-1 text-xs">
                      {c.dg_class?.name ?? "DG"}
                      {c.un_number ? <span className="text-zinc-500">· UN {c.un_number}</span> : null}
                      {c.msds_url ? (
                        <a href={c.msds_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          MSDS
                        </a>
                      ) : null}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </SubTable>
      ) : null}

      {!hasLCL && !hasFCL ? (
        <p className="text-sm text-zinc-500">{t("noItems")}</p>
      ) : null}

      {(hasLCL || hasFCL) ? (
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/40 p-3">
          <AutoMetric label={t("autoVolume")} value={data.total_volume_cbm != null ? `${data.total_volume_cbm.toFixed(3)} m³` : "—"} />
          <AutoMetric label={t("autoVolumeWeight")} value={data.volume_weight_kg != null ? `${data.volume_weight_kg.toFixed(2)} kg` : "—"} />
          <AutoMetric label={t("autoChargeable")} value={data.chargeable_weight_kg != null ? `${data.chargeable_weight_kg.toFixed(2)} kg` : "—"} />
        </div>
      ) : null}
    </div>
  );
}

function SubTable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function AutoMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-zinc-900 tabular-nums">{value}</p>
    </div>
  );
}

function CostSection({ data, t }: { data: BookingDetail; t: ReturnType<typeof useTranslations>; locale: string }) {
  if (data.estimated_price == null) {
    return <p className="text-sm text-zinc-500">{t("waiting")}</p>;
  }
  const breakdown = data.cost_breakdown ?? {};
  const freight = breakdown.freight;
  const pickup = breakdown.pickup;
  const delivery = breakdown.delivery;
  const discount = breakdown.discount;
  const additional = breakdown.additional_services;
  const total = breakdown.total ?? Number(data.estimated_price);

  // Detect legacy bookings (no pickup/delivery breakdown yet) so the UI can
  // show the "no chargeable" placeholder as documented.
  const isLegacyBooking = breakdown.freight == null || breakdown.pickup == null || breakdown.delivery == null;

  const row = (label: string, value: number, opts?: { sign?: "minus"; isChargeable?: boolean }) => {
    if (opts?.isChargeable && isLegacyBooking) {
      return (
        <div className="flex items-center justify-between text-zinc-400">
          <span>{label}</span>
          <span className="text-xs italic">{t("noChargeable")}</span>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-between ${opts?.sign === "minus" ? "text-red-600" : "text-zinc-700"}`}>
        <span>{label}</span>
        <span className="tabular-nums">{opts?.sign === "minus" ? "−" : ""}{formatIdr(value)}</span>
      </div>
    );
  };

  return (
    <dl className="space-y-2 text-sm">
      {row(t("freight"), Number(freight ?? 0))}
      {row(t("pickup"), Number(pickup ?? 0), { isChargeable: true })}
      {row(t("delivery"), Number(delivery ?? 0), { isChargeable: true })}
      {discount && Number(discount) > 0 ? row(t("discount"), Number(discount), { sign: "minus" }) : null}
      {row(t("additionalServices"), Number(additional ?? 0))}
      <div className="flex items-center justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
        <span>{t("total")}</span>
        <span className="tabular-nums">{formatIdr(Number(total))}</span>
      </div>
    </dl>
  );
}

function AttachmentsSection({
  items,
  t,
  locale,
  onDelete,
  pendingId,
}: {
  items: NonNullable<BookingDetail["attachments"]>;
  t: ReturnType<typeof useTranslations>;
  locale: string;
  onDelete: (id: number) => void;
  pendingId?: number;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{t("empty")}</p>;
  }
  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
            <Upload className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{a.original_name}</p>
            <p className="text-[11px] text-zinc-500">
              {formatFileSize(a.file_size)} · {a.uploader?.name ?? "—"} · {a.created_at ? formatRelative(a.created_at, locale) : ""}
            </p>
          </div>
          {a.url ? (
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={<a href={a.url} target="_blank" rel="noreferrer" aria-label="Open" />}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(a.id)}
            disabled={pendingId === a.id}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {pendingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            <span className="ml-1.5 hidden sm:inline">{t("delete")}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}

function TimelineSection({ activities, t, locale }: { activities: Activity[]; t: ReturnType<typeof useTranslations>; locale: string }) {
  if (activities.length === 0) {
    return <p className="text-sm text-zinc-500">—</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-zinc-200 pl-5">
      {activities.map((a) => {
        const ts = a.occurred_at ?? a.created_at ?? "";
        const date = new Date(ts);
        const dateStr = isNaN(date.getTime()) ? ts : formatShortDate(ts, locale);
        const timeStr = isNaN(date.getTime()) ? "" : date.toLocaleTimeString(locale === "en" ? "en-US" : "id-ID", { hour: "2-digit", minute: "2-digit" });
        const actorLabel = a.actor_role === "customer"
          ? t("actorCustomer")
          : a.actor_role === "internal"
            ? t("actorInternal")
            : a.actor_role === "system"
              ? t("actorSystem")
              : a.actor?.name ?? "—";
        return (
          <li key={a.id} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-300 ring-4 ring-white" />
            <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-[140px_1fr_140px] sm:items-center">
              <p className="text-xs tabular-nums text-zinc-500">{dateStr} {timeStr ? `· ${timeStr}` : ""}</p>
              <p className="font-medium text-zinc-900">{a.title}</p>
              <p className="text-right text-xs text-zinc-500">{actorLabel}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ActivityLogSection({ activities, locale }: { activities: Activity[]; t: ReturnType<typeof useTranslations>; locale: string }) {
  if (activities.length === 0) {
    return <p className="text-sm text-zinc-500">—</p>;
  }
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
      {activities.map((a) => {
        const ts = a.occurred_at ?? a.created_at ?? "";
        return (
        <li key={`log-${a.id}`}>
          <span className="font-medium text-zinc-900">{a.title}</span>
          {a.description ? <> — <span>{a.description}</span> <span className="text-zinc-400">({formatShortDate(ts, locale)})</span></> : <span className="text-zinc-400"> ({formatShortDate(ts, locale)})</span>}
        </li>
        );
      })}
    </ul>
  );
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function calcPackageChargeableWeight(p: {
  weight_kg?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  piece_count?: number;
}): string {
  const actual = Number(p.weight_kg) || 0;
  const l = Number(p.length) || 0;
  const w = Number(p.width) || 0;
  const h = Number(p.height) || 0;
  const qty = Number(p.piece_count) || 1;
  const volumeWeight = l && w && h ? ((l * w * h) / 5000) * qty : 0;
  const chargeable = Math.max(actual, volumeWeight);
  return chargeable > 0 ? chargeable.toFixed(2) : "—";
}
