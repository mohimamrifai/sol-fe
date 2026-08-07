"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileWarning, ArrowRight } from "lucide-react";
import { useVendorDashboard } from "@/hooks/use-vendor-dashboard";

function humanizeKey(key: string): string {
  return key
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function resolveRowLabel(tRows: ReturnType<typeof useTranslations>, key: string): string {
  try {
    const msg = tRows(key as never);
    if (msg && !msg.startsWith("Vendor.dashboard.pendingDocuments.rows.")) {
      return msg;
    }
  } catch {
    /* fall through to humanizer */
  }
  return humanizeKey(key);
}

export function VendorPendingDocuments() {
  const t = useTranslations("Vendor.dashboard");
  const tRows = useTranslations("Vendor.dashboard.pendingDocuments.rows");
  const router = useRouter();
  const { data, isLoading } = useVendorDashboard();
  const items = data?.data?.pending_documents ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileWarning className="h-4 w-4 text-zinc-600" />
          {t("pendingDocuments.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("pendingDocuments.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500">
                  <th className="px-2 py-2 font-medium">{t("pendingDocuments.joNo")}</th>
                  <th className="px-2 py-2 font-medium">{t("pendingDocuments.document")}</th>
                  <th className="px-2 py-2 font-medium">{t("pendingDocuments.status")}</th>
                  <th className="px-2 py-2 text-right font-medium">{t("pendingDocuments.action")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-2 py-2 font-mono text-xs">{it.jo_number}</td>
                    <td className="px-2 py-2 text-zinc-700">{resolveRowLabel(tRows, it.document_key)}</td>
                    <td className="px-2 py-2">
                      <Badge className="border bg-amber-100 text-amber-700 text-xs">
                        {resolveRowLabel(tRows, it.status_key)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => router.push(it.action_url)}
                      >
                        {resolveRowLabel(tRows, it.action_key)}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
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
