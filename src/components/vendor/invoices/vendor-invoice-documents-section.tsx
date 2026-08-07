"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useVendorInvoice } from "@/hooks/use-vendor-invoices";

type Props = { invoiceId: number };

export function VendorInvoiceDocumentsSection({ invoiceId }: Props) {
  const t = useTranslations("Vendor.invoices.detail.sections");
  const tF = useTranslations("Vendor.invoices.form.fields");
  const { data, isLoading } = useVendorInvoice(invoiceId);
  const inv = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("documents")}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }
  if (!inv) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-zinc-600" />
          {t("documents")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2">
          {inv.file_url ? (
            <DocRow label="Vendor Invoice (PDF)" url={inv.file_url} name={`${inv.invoice_number}.pdf`} />
          ) : (
            <EmptyRow label="Vendor Invoice (PDF)" />
          )}
          {inv.tax_invoice_url ? (
            <DocRow label={tF("taxInvoice")} url={inv.tax_invoice_url} name={`${inv.invoice_number}-tax.pdf`} />
          ) : (
            <EmptyRow label={tF("taxInvoice")} optional />
          )}
        </div>
        {inv.attachments && inv.attachments.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{tF("supporting")}</p>
            <ul className="space-y-2 text-sm">
              {inv.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border border-zinc-200 p-2">
                  <span className="truncate text-zinc-900">{a.original_name}</span>
                  <a href={a.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
                    Unduh
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocRow({ label, url, name }: { label: string; url: string; name: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 p-2 hover:bg-zinc-100"
    >
      <span className="text-sm text-zinc-700">{label}</span>
      <span className="text-xs font-medium text-blue-600">Unduh {name}</span>
    </a>
  );
}

function EmptyRow({ label, optional = false }: { label: string; optional?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-dashed border-zinc-200 bg-zinc-50/50 p-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-xs text-zinc-400">{optional ? "Opsional" : "Belum diupload"}</span>
    </div>
  );
}
