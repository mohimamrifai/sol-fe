"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Send, Download } from "lucide-react";
import { useState } from "react";
import { useVendorInvoice, useSubmitVendorInvoice } from "@/hooks/use-vendor-invoices";
import { useAuthStore } from "@/lib/store";
import { getVendorInvoiceDownloadUrl } from "@/lib/vendor/invoices-api";
import { VendorInvoiceFormDialog } from "@/components/vendor/invoices/dialogs/vendor-invoice-form-dialog";
import { VendorInvoiceInfoSection } from "@/components/vendor/invoices/vendor-invoice-info-section";
import { VendorInvoiceBillingSection } from "@/components/vendor/invoices/vendor-invoice-billing-section";
import { VendorInvoiceDocumentsSection } from "@/components/vendor/invoices/vendor-invoice-documents-section";
import { VendorInvoiceApprovalSection } from "@/components/vendor/invoices/vendor-invoice-approval-section";
import { VendorInvoiceActivitiesSection } from "@/components/vendor/invoices/vendor-invoice-activities-section";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function VendorInvoiceDetailPage() {
  const tCommon = useTranslations("Vendor.common");
  const tDetail = useTranslations("Vendor.invoices.detail");
  const params = useParams<{ id: string }>();
  const id = Number(params?.id ?? 0);
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { data, isLoading } = useVendorInvoice(id);
  const submitMut = useSubmitVendorInvoice();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const inv = data?.data;
  if (!inv) return <div className="p-4 text-sm text-zinc-500">{tCommon("noData")}</div>;

  const canEdit = inv.is_editable && (currentUser?.roles ?? []).some((r) => ["vendor_company_admin", "vendor_finance_pic"].includes(r));
  const canSubmit = inv.is_submittable && (currentUser?.roles ?? []).some((r) => ["vendor_company_admin", "vendor_finance_pic"].includes(r));

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/dashboard/vendor/invoices")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon("back")}
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{inv.invoice_number}</CardTitle>
            <p className="mt-1 text-xs text-zinc-500">JO: {inv.job_order?.shipment_number ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${STATUS_BADGE[inv.status] ?? ""}`}>
              {inv.status_label}
            </span>
            {inv.file_url && (
              <a
                href={`${getVendorInvoiceDownloadUrl(inv.id)}?token=${typeof window !== "undefined" ? sessionStorage.getItem("sol_token") ?? "" : ""}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
              >
                <Download className="mr-2 h-3.5 w-3.5" /> {tDetail("downloadInvoice")}
              </a>
            )}
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Edit className="mr-1 h-3.5 w-3.5" /> {tDetail("edit")}
              </Button>
            )}
            {canSubmit && (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await submitMut.mutateAsync(inv.id);
                    toast.success("Invoice disubmit untuk review.");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Gagal submit invoice.");
                  }
                }}
                disabled={submitMut.isPending}
              >
                <Send className="mr-1 h-3.5 w-3.5" /> {tDetail("submit")}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <VendorInvoiceInfoSection invoiceId={id} />
      <VendorInvoiceBillingSection invoiceId={id} />
      <VendorInvoiceDocumentsSection invoiceId={id} />
      <VendorInvoiceApprovalSection invoiceId={id} />
      <VendorInvoiceActivitiesSection invoiceId={id} />

      {editOpen && (
        <VendorInvoiceFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          editInvoice={inv}
        />
      )}
    </div>
  );
}
