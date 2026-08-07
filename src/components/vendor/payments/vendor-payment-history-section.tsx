"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVendorPayment } from "@/hooks/use-vendor-payments";

const CURRENCY = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  partially_paid: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type Props = { paymentId: number };

export function VendorPaymentHistorySection({ paymentId }: Props) {
  const t = useTranslations("Vendor.payments.detail.sections");
  const { data, isLoading } = useVendorPayment(paymentId);
  const history = data?.data?.history ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("history")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-zinc-600" />
          {t("history")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">No history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500">
                  <th className="px-2 py-2 font-medium">Payment No.</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 text-right font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.payment_number} className="border-b border-zinc-100 last:border-0">
                    <td className="px-2 py-2 font-mono text-xs">{h.payment_number}</td>
                    <td className="px-2 py-2 text-zinc-600">{h.payment_date}</td>
                    <td className="px-2 py-2 text-right">{CURRENCY.format(h.amount)}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${STATUS_BADGE[h.status] ?? ""}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
