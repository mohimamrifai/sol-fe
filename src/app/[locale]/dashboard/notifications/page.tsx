"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Bell } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationTimeline } from "@/components/dashboard/notifications/notification-timeline";
import {
  fetchCustomerNotifications,
  type CustomerDashboardNotification,
  type CustomerNotificationsMeta,
} from "@/lib/dashboard-api";

export default function CustomerNotificationsPage() {
  const t = useTranslations("Dashboard.notificationsPage");
  const tEmpty = useTranslations("Dashboard.empty");
  const [items, setItems] = useState<CustomerDashboardNotification[]>([]);
  const [meta, setMeta] = useState<CustomerNotificationsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await fetchCustomerNotifications(targetPage, 15);
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{t("description")}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1.5"
          render={
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("back")}
            </Link>
          }
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t("title")}</CardTitle>
          <CardDescription className="text-xs">{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t("loading")}</p>
          ) : (
            <NotificationTimeline items={items} emptyText={tEmpty("notifications")} />
          )}
        </CardContent>
      </Card>

      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            {t("page", { page: meta.current_page, lastPage: meta.last_page })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
