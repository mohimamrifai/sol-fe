"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Wallet, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useVendorPayments, useVendorPaymentStats } from "@/hooks/use-vendor-payments";
import type { VendorPaymentStats } from "@/lib/vendor/payments-api";
import { VendorPaymentFilters } from "@/components/vendor/payments/vendor-payments-filters";

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  partially_paid: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATS_CONFIG = [
  { key: "pending_payment", icon: Clock, tone: "amber" },
  { key: "partially_paid", icon: AlertCircle, tone: "blue" },
  { key: "paid", icon: CheckCircle2, tone: "emerald" },
] as const;

const TONE_CLASS = {
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

const CURRENCY = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function VendorPaymentsList() {
  const t = useTranslations("Vendor.payments");
  const tCommon = useTranslations("Vendor.common");
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const { data: stats, isLoading: statsLoading } = useVendorPaymentStats();
  const { data, isLoading } = useVendorPayments({ ...filters, page, per_page: 15 });

  const formatStat = (key: string, value: number) => {
    if (key === "pending_payment") return CURRENCY.format(value);
    return value.toLocaleString("id-ID");
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-500">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-zinc-200/60">
              <CardContent className="p-5">
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="h-7 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS_CONFIG.map(({ key, icon: Icon, tone }) => (
            <Card key={key} className="border-zinc-200/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${TONE_CLASS[tone]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">{t(`stats.${key}`)}</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {formatStat(key, stats?.data?.[key as keyof VendorPaymentStats] ?? 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VendorPaymentFilters onChange={setFilters} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Wallet className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">{tCommon("noData")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                    <th className="px-4 py-3 font-medium">{t("table.paymentNo")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.invoiceNo")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.jo")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.paymentDate")}</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 text-right font-medium">{t("table.amount")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.status")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/dashboard/vendor/payments/${p.id}`)}
                      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">{p.payment_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                        {p.invoice?.invoice_number ?? p.vendor_invoice?.invoice_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                        {(p.invoice as { jo_number?: string } | undefined)?.jo_number
                          ?? p.vendor_invoice?.jo_number
                          ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{p.payment_date}</td>
                      <td className="px-4 py-3 text-zinc-600">{p.payment_method_label}</td>
                      <td className="px-4 py-3 text-right text-zinc-900">{CURRENCY.format(p.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_BADGE[p.status] ?? ""} border text-xs`}>
                          {p.status_label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/vendor/payments/${p.id}`);
                          }}
                        >
                          {tCommon("detail")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data?.meta && data.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-sm">
              <span className="text-zinc-500">
                Page {data.meta.current_page} of {data.meta.last_page}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.current_page <= 1}
                  onClick={() => setPage(data.meta.current_page - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.current_page >= data.meta.last_page}
                  onClick={() => setPage(data.meta.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
