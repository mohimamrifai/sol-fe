"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useVendorInvoice } from "@/hooks/use-vendor-invoices";

type Props = { invoiceId: number };

export function VendorInvoiceApprovalSection({ invoiceId }: Props) {
  const t = useTranslations("Vendor.invoices.detail.sections");
  const { data, isLoading } = useVendorInvoice(invoiceId);
  const inv = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("approval")}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }
  if (!inv) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">{t("approval")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <Step
            label="Draft Created"
            timestamp={inv.created_at}
            icon={Clock}
            done
          />
          <Step
            label="Submitted for Review"
            timestamp={inv.submitted_at}
            icon={CheckCircle2}
            done={!!inv.submitted_at}
          />
          <Step
            label={inv.status === "rejected" ? "Rejected" : inv.status === "approved" || inv.status === "paid" ? "Approved" : "Pending Review"}
            timestamp={inv.reviewed_at}
            icon={inv.status === "rejected" ? XCircle : CheckCircle2}
            done={inv.status === "approved" || inv.status === "paid" || inv.status === "rejected"}
            tone={inv.status === "rejected" ? "red" : inv.status === "approved" || inv.status === "paid" ? "emerald" : "amber"}
          />
        </div>
        {inv.rejection_reason && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">Rejection Reason:</p>
            <p>{inv.rejection_reason}</p>
            {inv.reviewed_by && (
              <p className="mt-1 text-xs">by {inv.reviewed_by}{inv.reviewed_at ? ` on ${new Date(inv.reviewed_at).toLocaleString("id-ID")}` : ""}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Step({
  label,
  timestamp,
  icon: Icon,
  done,
  tone = "amber",
}: {
  label: string;
  timestamp: string | null;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
  tone?: "amber" | "emerald" | "red";
}) {
  const toneClass = done
    ? tone === "emerald"
      ? "bg-emerald-100 text-emerald-600"
      : tone === "red"
        ? "bg-red-100 text-red-600"
        : "bg-emerald-100 text-emerald-600"
    : "bg-zinc-100 text-zinc-400";
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-zinc-900">{label}</p>
      <p className="text-xs text-zinc-500">{timestamp ? new Date(timestamp).toLocaleString("id-ID") : "—"}</p>
    </div>
  );
}
