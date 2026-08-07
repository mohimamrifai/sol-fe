"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useVendorDocuments, useVendorDocumentStats } from "@/hooks/use-vendor-documents";
import { VendorDocumentFilters } from "@/components/vendor/documents/vendor-documents-filters";
import { ClipboardList, FileText, FileCheck, Truck, FileBox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STATS_CONFIG = [
  { key: "job_order", icon: ClipboardList, tone: "indigo" },
  { key: "consignment_note", icon: FileText, tone: "blue" },
  { key: "delivery_order", icon: Truck, tone: "amber" },
  { key: "proof_of_completion", icon: FileCheck, tone: "emerald" },
] as const;

const TONE_CLASS = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export function VendorDocumentsList() {
  const t = useTranslations("Vendor.documents");
  const tCommon = useTranslations("Vendor.common");
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const { data: stats, isLoading: statsLoading } = useVendorDocumentStats();
  const { data, isLoading } = useVendorDocuments({ ...filters, page, per_page: 15 });

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <FileBox className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-500">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-zinc-200/60">
              <CardContent className="p-5">
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="h-7 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS_CONFIG.map(({ key, icon: Icon, tone }) => (
            <Card key={key} className="border-zinc-200/60">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${TONE_CLASS[tone]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-500">{t(`stats.${key}`)}</p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900">
                    {stats?.data?.[key] ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VendorDocumentFilters onChange={setFilters} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <FileBox className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">{tCommon("noData")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                    <th className="px-4 py-3 font-medium">{t("table.name")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.type")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.jo")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.uploadedBy")}</th>
                    <th className="px-4 py-3 font-medium">{t("table.uploadDate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => router.push(`/dashboard/vendor/documents/${doc.id}`)}
                      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 text-zinc-900">{doc.name}</td>
                      <td className="px-4 py-3 text-zinc-600">{doc.type_label}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">{doc.jo_number}</td>
                      <td className="px-4 py-3 text-zinc-600">{doc.uploaded_by}</td>
                      <td className="px-4 py-3 text-zinc-600">{doc.uploaded_at}</td>
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
                <button
                  disabled={data.meta.current_page <= 1}
                  onClick={() => setPage(data.meta.current_page - 1)}
                  className="rounded border border-zinc-200 px-3 py-1 text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={data.meta.current_page >= data.meta.last_page}
                  onClick={() => setPage(data.meta.current_page + 1)}
                  className="rounded border border-zinc-200 px-3 py-1 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
