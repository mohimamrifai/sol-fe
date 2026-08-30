"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceDetailView } from "@/components/dashboard/admin/invoice-detail-view";
import { InvoiceEditDialog } from "@/components/dashboard/admin/invoice-edit-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import {
  cancelAdminInvoice,
  fetchAdminInvoice,
  issueAdminInvoice,
  viewAdminInvoicePdf,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { printPdfBlob } from "@/lib/pdf-blob";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import { useInvoiceStatusLabel } from "@/hooks/use-admin-status-labels";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";

type InvoiceDetail = Record<string, unknown>;

const formatDate = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(String(value)))
    : "—";

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("AdminInvoices");
  const tc = useTranslations("AdminCommon");
  const statusLabel = useInvoiceStatusLabel();
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const canManage =
    authHydrated && (user?.roles?.includes("super_admin") || user?.roles?.includes("finance"));
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);
  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    setLoading(true);
    try {
      const response = await fetchAdminInvoice(id);
      setData(response.data);
    } catch (error) {
      setData(null);
      toast.error(error instanceof ApiError ? error.message : t("toasts.detailLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: "issue" | "cancel") => {
    setActing(true);
    try {
      if (action === "issue") await issueAdminInvoice(id);
      else await cancelAdminInvoice(id);
      toast.success(action === "issue" ? t("toasts.issued") : t("toasts.cancelled"));
      if (action === "cancel") setCancelOpen(false);
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : action === "issue"
            ? t("toasts.issueFailed")
            : t("toasts.cancelFailed")
      );
    } finally {
      setActing(false);
    }
  };

  const printPdf = async () => {
    setActing(true);
    try {
      const blob = await viewAdminInvoicePdf(id);
      printPdfBlob(blob);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("toasts.pdfFailed"));
    } finally {
      setActing(false);
    }
  };

  const header = data?.header as InvoiceDetail | undefined;
  const actions = data?.actions as InvoiceDetail | undefined;
  const status = String(header?.status ?? "");

  return (
    <div className="space-y-6">
      <InvoiceEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoiceId={id}
        onSaved={() => void load()}
      />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <CardTitle>{t("detail.title")}</CardTitle>
          <div className="flex flex-wrap gap-2">
              {canManage && actions?.can_edit ? (
                <Button size="sm" variant="outline" disabled={acting} onClick={() => setEditOpen(true)}>
                  {t("actions.edit")}
                </Button>
              ) : null}
              {canManage && actions?.can_issue ? (
                <Button size="sm" disabled={acting} onClick={() => void act("issue")}>
                  {t("actions.issue")}
                </Button>
              ) : null}
              {canManage && actions?.can_cancel ? (
                <Button size="sm" variant="destructive" disabled={acting} onClick={() => setCancelOpen(true)}>
                  {t("actions.cancel")}
                </Button>
              ) : null}
              {actions?.can_print ? (
                <Button size="sm" disabled={acting} onClick={() => void printPdf()}>
                  {t("actions.printInvoice")}
                </Button>
              ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : data && header ? (
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <div><dt className="text-xs text-muted-foreground">{t("detail.invoiceNo")}</dt><dd className="mt-1 font-mono text-sm">{String(header.invoice_number ?? "—")}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("detail.customer")}</dt><dd className="mt-1 text-sm">{String(header.customer ?? "—")}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("detail.invoiceStatus")}</dt><dd className="mt-1"><Badge variant="outline" className={invoiceStatusBadgeClass(status)}>{statusLabel(status)}</Badge></dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("detail.invoiceDate")}</dt><dd className="mt-1 text-sm">{formatDate(header.invoice_date)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("detail.createdDate")}</dt><dd className="mt-1 text-sm">{formatDate(header.created_at)}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{t("detail.notFound")}</p>
          )}
        </CardContent>
      </Card>
      {data ? <InvoiceDetailView data={data} onReload={() => void load()} /> : null}
      <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/customer/invoices`)}>
        {t("detail.back")}
      </Button>

      <ConfirmDeleteDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("confirm.cancelTitle")}
        description={t("confirm.cancelDraft")}
        loading={acting}
        onConfirm={() => void act("cancel")}
      />
    </div>
  );
}
