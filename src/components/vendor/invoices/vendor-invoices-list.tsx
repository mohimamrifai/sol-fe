"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt, Plus, FileText, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useVendorInvoices, useVendorInvoiceStats } from "@/hooks/use-vendor-invoices";
import { Badge } from "@/components/ui/badge";
import type { VendorInvoiceStats } from "@/lib/vendor/invoices-api";
import { VendorInvoiceFilters } from "@/components/vendor/invoices/vendor-invoices-filters";
import { VendorInvoiceFormDialog } from "@/components/vendor/invoices/dialogs/vendor-invoice-form-dialog";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700 border-neutral-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  paid: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const STATS_CONFIG = [
  { key: "draft", icon: FileText, tone: "neutral" },
  { key: "submitted", icon: FileText, tone: "blue" },
  { key: "approved", icon: CheckCircle2, tone: "emerald" },
  { key: "rejected", icon: XCircle, tone: "red" },
  { key: "paid", icon: Wallet, tone: "indigo" },
] as const;

const TONE_CLASS = {
  neutral: "bg-zinc-50 text-zinc-700 border-zinc-200",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  red: "bg-red-50 text-red-600 border-red-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

const CURRENCY = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function VendorInvoicesList() {
  const t = useTranslations("Vendor.invoices");
  const tCommon = useTranslations("Vendor.common");
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { data: stats, isLoading: statsLoading } = useVendorInvoiceStats();
  const { data, isLoading } = useVendorInvoices({ ...filters, page, per_page: 15 });

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Receipt className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-500">{t("subtitle")}</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-10">
            <Plus className="mr-2 h-4 w-4" /> {t("create")}
          </Button>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-zinc-200/60">
              <CardContent className="p-5">
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="h-7 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STATS_CONFIG.map(({ key, icon: Icon, tone }) => (
            <Card key={key} className="border-zinc-200/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${TONE_CLASS[tone]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">{t(`stats.${key}`)}</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {stats?.data?.[key as keyof VendorInvoiceStats] ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VendorInvoiceFilters onChange={setFilters} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Receipt className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">{tCommon("noData")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                    <th className="px-4 py-3 font-medium">{t("table.invoiceNo")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.jo")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.invoiceDate")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.dueDate")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("table.amount")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/dashboard/vendor/invoices/${inv.id}`)}
                      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">{inv.job_order ? `JO-${String(inv.job_order.id).padStart(5, "0")}` : "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{inv.invoice_date}</td>
                      <td className="px-4 py-3 text-zinc-600">{inv.due_date}</td>
                      <td className="px-4 py-3 text-right text-zinc-900">{CURRENCY.format(inv.total_amount)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_BADGE[inv.status] ?? ""} border text-xs`}>
                          {inv.status_label}
                        </Badge>
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

      <VendorInvoiceFormDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
