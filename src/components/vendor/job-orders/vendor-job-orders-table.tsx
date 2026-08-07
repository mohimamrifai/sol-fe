"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useVendorJobOrders } from "@/hooks/use-vendor-job-orders";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_BADGE: Record<string, string> = {
  pending_acceptance: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  waiting_verification: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

type Props = {
  filters: Record<string, unknown>;
  page: number;
  setPage: (page: number) => void;
};

export function VendorJobOrdersTable({ filters, page, setPage }: Props) {
  const t = useTranslations("Vendor.jobOrders.table");
  const tCommon = useTranslations("Vendor.common");
  const router = useRouter();
  const { data, isLoading } = useVendorJobOrders({ ...filters, page, per_page: 15 });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const rows = data?.data ?? [];
  const meta = data?.meta;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <ClipboardList className="h-10 w-10 text-zinc-300" />
          <p className="text-sm text-zinc-500">{tCommon("noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                <th className="px-4 py-3 font-medium">{t("jo")}</th>
                <th className="px-4 py-3 font-medium">{t("customer")}</th>
                <th className="px-4 py-3 font-medium">{t("shipment")}</th>
                <th className="px-4 py-3 font-medium">{t("service")}</th>
                <th className="px-4 py-3 font-medium">{t("assignedDate")}</th>
                <th className="px-4 py-3 font-medium">{t("dueDate")}</th>
                <th className="px-4 py-3 font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/dashboard/vendor/job-orders/${r.id}`)}
                  className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">{r.jo_number}</td>
                  <td className="px-4 py-3 text-zinc-900">{r.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.shipment_number}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.service_type?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.assigned_date}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.due_date}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_BADGE[r.vendor_status] ?? ""} border text-xs`}>
                      {r.vendor_status_label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/vendor/job-orders/${r.id}`);
                      }}
                    >
                      {tCommon("view")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-sm">
            <span className="text-zinc-500">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page <= 1}
                onClick={() => setPage(meta.current_page - 1)}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage(meta.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
