"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";
import { useVendorPayment } from "@/hooks/use-vendor-payments";
import { getVendorPaymentReceiptUrl } from "@/lib/vendor/payments-api";
import { VendorPaymentInfoSection } from "@/components/vendor/payments/vendor-payment-info-section";
import { VendorPaymentSummarySection } from "@/components/vendor/payments/vendor-payment-summary-section";
import { VendorPaymentDocumentsSection } from "@/components/vendor/payments/vendor-payment-documents-section";
import { VendorPaymentHistorySection } from "@/components/vendor/payments/vendor-payment-history-section";
import { VendorPaymentActivitiesSection } from "@/components/vendor/payments/vendor-payment-activities-section";

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  partially_paid: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function VendorPaymentDetailPage() {
  const tCommon = useTranslations("Vendor.common");
  const tHeader = useTranslations("Vendor.payments.detail.header");
  const params = useParams<{ id: string }>();
  const id = Number(params?.id ?? 0);
  const router = useRouter();
  const { data, isLoading } = useVendorPayment(id);
  const token = typeof window !== "undefined" ? sessionStorage.getItem("sol_token") : null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const payment = data?.data;
  if (!payment) return <div className="p-4 text-sm text-zinc-500">{tCommon("noData")}</div>;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/dashboard/vendor/payments")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon("back")}
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{payment.payment_number}</CardTitle>
            <p className="mt-1 text-xs text-zinc-500">
              Invoice: {payment.invoice?.invoice_number ?? payment.vendor_invoice?.invoice_number ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${STATUS_BADGE[payment.status] ?? ""} border text-xs`}>
              {payment.status_label}
            </Badge>
            {payment.receipt_url && (
              <a
                href={`${getVendorPaymentReceiptUrl(payment.id)}?token=${token ?? ""}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
              >
                <Download className="mr-2 h-3.5 w-3.5" /> {tHeader("downloadReceipt")}
              </a>
            )}
          </div>
        </CardHeader>
      </Card>

      <VendorPaymentInfoSection paymentId={id} />
      <VendorPaymentSummarySection paymentId={id} />
      <VendorPaymentDocumentsSection paymentId={id} />
      <VendorPaymentHistorySection paymentId={id} />
      <VendorPaymentActivitiesSection paymentId={id} />
    </div>
  );
}
