"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceDetailView } from "@/components/dashboard/admin/invoice-detail-view";
import { fetchAdminInvoice, generateAdminMidtransLink, issueAdminInvoice, updateAdminInvoice, downloadAdminInvoicePdf } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("AdminInvoices");
  const tc = useTranslations("AdminCommon");
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const canManage = authHydrated && (user?.roles?.includes("super_admin") || user?.roles?.includes("finance"));
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    setLoading(true);
    try {
      const res = await fetchAdminInvoice(id);
      setData((res as { data: Record<string, unknown> }).data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleIssue = async () => {
    setActing(true);
    try {
      await issueAdminInvoice(id);
      toast.success(t("toasts.issued"));
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.issueFailed"));
    } finally {
      setActing(false);
    }
  };

  const handleMidtransLink = async () => {
    setActing(true);
    try {
      const res = await generateAdminMidtransLink(id);
      const url = (res as { data?: { payment_url?: string } }).data?.payment_url;
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success(t("toasts.linkCopied"));
      } else {
        toast.success((res as { message?: string }).message ?? "Link created.");
      }
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.linkFailed"));
    } finally {
      setActing(false);
    }
  };

  const handleCancelDraft = async () => {
    if (!confirm(t("confirm.cancelDraft"))) return;
    setActing(true);
    try {
      await updateAdminInvoice(id, { status: "cancelled" });
      toast.success(t("toasts.cancelled"));
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.cancelFailed"));
    } finally {
      setActing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setActing(true);
    try {
      const blob = await downloadAdminInvoicePdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${String(data?.invoice_number ?? id)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("toasts.pdfDownloaded"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.pdfFailed"));
    } finally {
      setActing(false);
    }
  };

  const activities = (data?.activities ?? data?.Activities) as Array<Record<string, unknown>> | undefined;
  const status = String(data?.status ?? "");

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>{t("detail.title")}</CardTitle>
          <CardDescription>{String(data?.invoice_number ?? "—")}</CardDescription>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {status === "draft" ? (
              <>
                <Button size="sm" disabled={acting} onClick={() => void handleIssue()}>
                  {t("actions.issue")}
                </Button>
                <Button size="sm" variant="outline" disabled={acting} onClick={() => void handleCancelDraft()}>
                  {t("actions.cancelDraft")}
                </Button>
              </>
            ) : null}
            {["issued", "partially_paid", "paid"].includes(status) ? (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void handleDownloadPdf()}>
                {t("actions.downloadPdf")}
              </Button>
            ) : null}
            {["issued", "partially_paid"].includes(status) ? (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void handleMidtransLink()}>
                {t("generatePaymentLink")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
        ) : (
          <>
            <InvoiceDetailView data={data} />
            {Array.isArray(activities) && activities.length > 0 ? (
              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground">{t("detail.activityLog")}</p>
                <ul className="space-y-2 text-sm">
                  {activities.map((act, i) => {
                    const actor = (act.actor_user ?? act.actorUser) as { name?: string } | undefined;
                    return (
                      <li key={String(act.id ?? i)} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                        <span>
                          {String(act.description ?? act.event_key ?? "—")}
                          {actor?.name ? ` · ${actor.name}` : ""}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {act.occurred_at ? String(act.occurred_at).slice(0, 16).replace("T", " ") : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard/admin/customer/invoices`)}
        >
          {t("detail.back")}
        </Button>
      </CardContent>
    </Card>
  );
}
