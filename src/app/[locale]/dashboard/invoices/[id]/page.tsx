"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerInvoiceDetail } from "@/hooks/use-customer-invoice-detail";
import { InvoiceHeader } from "@/components/invoices/invoice-detail/invoice-header";
import { InvoiceInfoSection } from "@/components/invoices/invoice-detail/invoice-info-section";
import { ShipmentInfoSection } from "@/components/invoices/invoice-detail/shipment-info-section";
import { InvoiceItemsSection } from "@/components/invoices/invoice-detail/invoice-items-section";
import { SupportingDocumentsSection } from "@/components/invoices/invoice-detail/supporting-documents-section";
import { PaymentSummarySection } from "@/components/invoices/invoice-detail/payment-summary-section";
import { PaymentHistorySection } from "@/components/invoices/invoice-detail/payment-history-section";
import { ActivityTimelineSection } from "@/components/invoices/invoice-detail/activity-timeline-section";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerInvoiceDetailPage({ params }: PageProps) {
  const t = useTranslations("Invoices.detail");
  const queryClient = useQueryClient();
  const { id: rawId } = use(params);
  const invoiceId = Number(decodeURIComponent(rawId));

  const { data: invoice, isLoading, error } = useCustomerInvoiceDetail(invoiceId);

  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
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

  if (error || !invoice) {
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
      <InvoiceHeader
        invoice={invoice}
        onPaid={() => {
          void queryClient.invalidateQueries({ queryKey: ["customer", "invoices"] });
          void queryClient.invalidateQueries({ queryKey: ["customer", "payments"] });
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InvoiceInfoSection invoice={invoice} />
        <ShipmentInfoSection invoice={invoice} />
      </div>

      <InvoiceItemsSection invoice={invoice} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SupportingDocumentsSection invoice={invoice} />
        <PaymentSummarySection invoice={invoice} />
      </div>

      <PaymentHistorySection invoice={invoice} />
      <ActivityTimelineSection invoice={invoice} />
    </div>
  );
}
