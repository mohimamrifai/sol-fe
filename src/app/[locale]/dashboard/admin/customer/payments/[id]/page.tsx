"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetailView } from "@/components/dashboard/admin/payment-detail-view";
import { RecordPaymentDialog } from "@/components/dashboard/admin/payments/record-payment-dialog";
import { downloadAdminPaymentReceipt, fetchAdminPayment } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManage = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordOpen, setRecordOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    setLoading(true);
    try {
      const res = await fetchAdminPayment(id);
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

  const actions = (data?.actions ?? {}) as Record<string, unknown>;
  const canRecord = Boolean(actions.can_record_payment);
  const canPrint = Boolean(actions.can_print_receipt);

  const printReceipt = async () => {
    setPrinting(true);
    try {
      const blob = await downloadAdminPaymentReceipt(id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-receipt-${String(data?.payment_number ?? id)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("detail.receiptDownloaded"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("detail.receiptFailed"));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{t("detail.title")}</CardTitle>
          <CardDescription>{String(data?.payment_number ?? data?.midtrans_order_id ?? "—")}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {canRecord ? (
            <Button size="sm" onClick={() => setRecordOpen(true)}>
              {t("recordPayment")}
            </Button>
          ) : null}
          {canPrint ? (
            <Button size="sm" variant="outline" disabled={printing} onClick={() => void printReceipt()}>
              {printing ? tc("actions.loading") : t("detail.printReceipt")}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
        ) : (
          <PaymentDetailView data={data} locale={locale} canManage={canManage} onRefresh={() => void load()} />
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard/admin/customer/payments`)}
        >
          {t("detail.back")}
        </Button>
      </CardContent>

      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        onRecorded={() => void load()}
      />
    </Card>
  );
}
