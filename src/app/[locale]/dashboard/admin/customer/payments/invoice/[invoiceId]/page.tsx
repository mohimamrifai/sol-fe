"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDetailView } from "@/components/dashboard/admin/payment-detail-view";
import { fetchAdminInvoicePaymentDetail } from "@/lib/admin-api";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useTranslations } from "next-intl";

/** FSD §5.3: unpaid invoices open on the payment detail screen, not invoice detail. */
export default function AdminInvoicePaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");
  const locale = String(params?.locale ?? "id");
  const invoiceId = Number(params?.invoiceId);
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManage = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(invoiceId) || invoiceId < 1) return;
    setLoading(true);
    try {
      const res = await fetchAdminInvoicePaymentDetail(invoiceId);
      setData((res as { data: Record<string, unknown> }).data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const actions = (data?.actions ?? {}) as Record<string, unknown>;
  const canRecord = Boolean(actions.can_record_payment);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <CardTitle>{t("detail.title")}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {canRecord ? (
            <Button size="sm" onClick={() => router.push("/dashboard/admin/customer/payments/record")}>
              {t("recordPayment")}
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
        <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/customer/payments`)}>
          {t("detail.back")}
        </Button>
      </CardContent>
    </Card>
  );
}
