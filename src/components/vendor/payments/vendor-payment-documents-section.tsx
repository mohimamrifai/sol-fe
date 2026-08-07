"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVendorPayment } from "@/hooks/use-vendor-payments";

type Props = { paymentId: number };

export function VendorPaymentDocumentsSection({ paymentId }: Props) {
  const t = useTranslations("Vendor.payments.detail.sections");
  const tF = useTranslations("Vendor.payments.detail.fields");
  const tC = useTranslations("Vendor.common");
  const { data, isLoading } = useVendorPayment(paymentId);
  const p = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("documents")}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!p) return null;

  const docs = [
    { label: tF("paymentReceipt"), url: p.receipt_url },
    { label: tF("transferReceipt"), url: p.transfer_receipt_url },
    { label: tF("withholdingTax"), url: p.withholding_tax_url },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-zinc-600" />
          {t("documents")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-3">
          {docs.map((d) => (
            <div key={d.label} className={`flex items-center justify-between rounded-md border p-2 ${d.url ? "border-zinc-200 bg-zinc-50" : "border-dashed border-zinc-200 bg-zinc-50/50"}`}>
              <span className="text-sm text-zinc-700">{d.label}</span>
              {d.url ? (
                <a href={d.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
                  {tC("download")}
                </a>
              ) : (
                <span className="text-xs text-zinc-400">—</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
