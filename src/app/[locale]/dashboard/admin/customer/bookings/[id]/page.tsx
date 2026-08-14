"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  confirmAdminBooking,
  convertBookingToShipment,
  deleteAdminBooking,
  duplicateAdminBooking,
  fetchAdminBooking,
  rejectBooking,
  submitAdminBooking,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { BookingDetailView } from "@/components/dashboard/admin/bookings/booking-detail-view";
import { BookingEditDialog } from "@/components/dashboard/admin/bookings/booking-edit-dialog";
import { BookingRejectDialog } from "@/components/dashboard/admin/bookings/booking-reject-dialog";
import type { BookingDetail } from "@/components/dashboard/admin/bookings/types";
import { updateAdminBooking } from "@/lib/admin-api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("AdminBookings");
  const tc = useTranslations("AdminCommon");
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);

  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canProcess =
    authHydrated && (roles.includes("super_admin") || roles.includes("operations"));

  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectSaving, setRejectSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    setLoading(true);
    try {
      const res = await fetchAdminBooking(id);
      setData((res as { data: BookingDetail }).data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("detailPage.loadFailed"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const st = (data?.status ?? "").toLowerCase();
  const hasShipment = data?.shipment_exists === true || typeof data?.shipment_id === "number";

  const headerActions = useMemo(() => {
    if (!canProcess || !data) return null;
    const actions: Array<{ label: string; onClick: () => void; variant?: "outline" | "destructive" }> = [];

    if (st === "draft") {
      actions.push({
        label: t("actions.submit"),
        onClick: () =>
          void submitAdminBooking(id).then(() => {
            toast.success(t("toasts.submitted"));
            void load();
          }).catch((e) => toast.error(e instanceof ApiError ? e.message : tc("errors.loadFailed"))),
      });
      actions.push({
        label: t("actions.delete"),
        variant: "destructive",
        onClick: () => {
          if (!confirm(t("confirm.deleteDraft"))) return;
          void deleteAdminBooking(id).then(() => {
            toast.success(t("toasts.deleted"));
            router.push(`/${locale}/dashboard/admin/customer/bookings`);
          }).catch((e) => toast.error(e instanceof ApiError ? e.message : tc("errors.deleteFailed")));
        },
      });
    }
    if (st === "submitted" || st === "under_review") {
      actions.push({
        label: t("actions.confirm"),
        onClick: () =>
          void confirmAdminBooking(id).then(() => {
            toast.success(t("toasts.confirmed"));
            void load();
          }).catch((e) => toast.error(e instanceof ApiError ? e.message : t("toasts.confirmFailed"))),
      });
      actions.push({
        label: t("actions.reject"),
        variant: "destructive",
        onClick: () => setRejectOpen(true),
      });
    }
    if (st === "approved" && !hasShipment) {
      actions.push({
        label: t("actions.convert"),
        onClick: () =>
          void convertBookingToShipment(id).then((res) => {
            toast.success(t("toasts.converted"));
            const sid = (res as { data?: { id?: number } })?.data?.id;
            if (typeof sid === "number") {
              router.push(`/${locale}/dashboard/admin/customer/shipments/${sid}`);
            } else {
              void load();
            }
          }).catch((e) => toast.error(e instanceof ApiError ? e.message : t("toasts.convertFailed"))),
      });
    }
    if (hasShipment && data.shipment_id) {
      actions.push({
        label: t("actions.viewShipment"),
        onClick: () => router.push(`/${locale}/dashboard/admin/customer/shipments/${data.shipment_id}`),
      });
    }
    actions.push({
      label: t("actions.duplicate"),
      variant: "outline",
      onClick: () =>
        void duplicateAdminBooking(id).then((res) => {
          toast.success(t("toasts.duplicated"));
          const newId = (res as { data?: { id?: number } })?.data?.id;
          if (typeof newId === "number") {
            router.push(`/${locale}/dashboard/admin/customer/bookings/${newId}`);
          }
        }).catch((e) => toast.error(e instanceof ApiError ? e.message : tc("errors.loadFailed"))),
    });
    if (!hasShipment && st !== "cancelled" && st !== "rejected") {
      actions.push({
        label: t("actions.edit"),
        variant: "outline",
        onClick: () => setEditOpen(true),
      });
    }
    return actions;
  }, [canProcess, data, st, hasShipment, id, load, locale, router, t, tc]);

  if (!authHydrated) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{data?.booking_number ?? "—"}</CardDescription>
          </div>
          {headerActions?.length ? (
            <div className="flex flex-wrap gap-2">
              {headerActions.map((a) => (
                <Button
                  key={a.label}
                  size="sm"
                  variant={a.variant === "destructive" ? "destructive" : a.variant ?? "default"}
                  onClick={a.onClick}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <BookingDetailView data={data} loading={loading} />
          <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/customer/bookings`)}>
            {t("detailPage.back")}
          </Button>
        </CardContent>
      </Card>

      <BookingRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        loading={rejectSaving}
        onSubmit={async (reason) => {
          setRejectSaving(true);
          try {
            await rejectBooking(id, reason);
            setRejectOpen(false);
            toast.success(t("toasts.rejected"));
            void load();
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : t("toasts.rejectFailed"));
          } finally {
            setRejectSaving(false);
          }
        }}
      />

      <BookingEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={data}
        loading={loading}
        saving={editSaving}
        onSave={async (payload) => {
          setEditSaving(true);
          try {
            const res = await updateAdminBooking(id, payload);
            setData((res as { data: BookingDetail }).data);
            setEditOpen(false);
            toast.success(t("toasts.updated"));
            void load();
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : t("toasts.updateFailed"));
            throw e;
          } finally {
            setEditSaving(false);
          }
        }}
      />
    </>
  );
}
