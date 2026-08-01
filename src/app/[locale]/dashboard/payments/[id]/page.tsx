"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerPaymentDetail } from "@/hooks/use-customer-payment-detail";
import { PaymentHeader } from "@/components/payments/payment-detail/payment-header";
import { InvoiceInfoSection } from "@/components/payments/payment-detail/invoice-info-section";
import { PaymentHistorySection } from "@/components/payments/payment-detail/payment-history-section";
import { OnlinePaymentSection } from "@/components/payments/payment-detail/online-payment-section";
import { ManualPaymentSection } from "@/components/payments/payment-detail/manual-payment-section";
import { SupportingDocumentsSection } from "@/components/payments/payment-detail/supporting-documents-section";
import { ActivityTimelineSection } from "@/components/payments/payment-detail/activity-timeline-section";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerPaymentDetailPage({ params }: PageProps) {
  const t = useTranslations("Payments.detail");
  const qc = useQueryClient();
  const { id: rawId } = use(params);
  const paymentId = Number(decodeURIComponent(rawId));

  const { data: paymentEnvelope, isLoading, error, refetch } = useCustomerPaymentDetail(
    Number.isFinite(paymentId) && paymentId > 0 ? paymentId : null
  );
  const payment = paymentEnvelope?.data;

  if (!Number.isFinite(paymentId) || paymentId <= 0) {
    return (
      <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("notFound")}</AlertTitle>
          <AlertDescription>{t("notFound")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error ? t("loadError") : t("notFound")}</AlertTitle>
          <AlertDescription>{error ? (error as Error).message : t("notFound")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <PaymentHeader
        payment={payment}
        onSynced={() => {
          void refetch();
          void qc.invalidateQueries({ queryKey: ["customer", "payments"] });
        }}
        onPaid={() => {
          void refetch();
          void qc.invalidateQueries({ queryKey: ["customer", "invoices"] });
          void qc.invalidateQueries({ queryKey: ["customer", "payments"] });
        }}
      />

      <InvoiceInfoSection payment={payment} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentHistorySection payment={payment} />
        <OnlinePaymentSection payment={payment} />
      </div>

      <ManualPaymentSection payment={payment} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SupportingDocumentsSection payment={payment} />
        <ActivityTimelineSection payment={payment} />
      </div>
    </div>
  );
}
