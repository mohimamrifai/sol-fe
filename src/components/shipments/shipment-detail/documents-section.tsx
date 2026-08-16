"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Download, Eye, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { fetchCustomerDocumentBlob } from "@/lib/customer-api";
import { downloadBlob } from "@/lib/download-blob";
import { toast } from "sonner";

export interface DocumentItem {
  key: string;
  label: string;
  available: boolean;
  has_endpoint?: boolean;
  reference_id?: number | null;
  document_id?: string | null;
  items?: Array<{
    id: number;
    name?: string;
    path?: string;
    url?: string;
    category?: string;
    document_id?: string;
  }>;
}

interface Props {
  documents: DocumentItem[];
  cnDownloadUrl?: string;
  onDownloadCn?: () => void;
}

const DOC_LABEL_KEYS: Record<string, string> = {
  consignment_note: "consignmentNote",
  pod: "pod",
  delivery_order: "deliveryOrder",
  invoice: "invoice",
  tax_invoice: "taxInvoice",
  other: "other",
};

export function DocumentsSection({ documents, cnDownloadUrl, onDownloadCn }: Props) {
  const t = useTranslations("Shipments.detail.section6");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function handleDocumentAction(documentId: string, mode: "preview" | "download", filename: string) {
    setBusyId(`${documentId}-${mode}`);
    try {
      const blob = await fetchCustomerDocumentBlob(documentId, mode);
      if (mode === "download") {
        downloadBlob(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch {
      toast.error("Gagal memuat dokumen.");
    } finally {
      setBusyId(null);
    }
  }

  function docLabel(doc: DocumentItem): string {
    const key = DOC_LABEL_KEYS[doc.key];
    return key ? t(`types.${key}` as never) : doc.label;
  }

  function renderActions(doc: DocumentItem) {
    const isCn = doc.key === "consignment_note";
    const isInvoice = doc.key === "invoice" || doc.key === "tax_invoice";
    const isOther = doc.key === "other";

    if (isOther && doc.available && (doc.items?.length ?? 0) > 0) {
      return (
        <ul className="flex flex-col gap-1.5">
          {doc.items!.map((item) => (
            <li key={item.document_id ?? item.id} className="flex items-center justify-end gap-2">
              <span className="max-w-[160px] truncate text-xs text-zinc-500">{item.name ?? "—"}</span>
              {item.document_id ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === `${item.document_id}-download`}
                  onClick={() =>
                    handleDocumentAction(
                      item.document_id!,
                      "download",
                      item.name ?? "document"
                    )
                  }
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Download className="h-3 w-3" />
                  {t("download")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      );
    }

    if (!doc.available) {
      return (
        <Button variant="ghost" size="sm" disabled className="h-8 gap-1 text-zinc-400">
          <Download className="h-3.5 w-3.5" />
          {t("download")}
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {isInvoice && doc.reference_id ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="h-8 gap-1"
            render={
              <Link href={`/dashboard/invoices/${doc.reference_id}` as never}>
                <Eye className="h-3.5 w-3.5" />
                {t("view")}
              </Link>
            }
          />
        ) : null}
        {isCn && cnDownloadUrl ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="h-8 gap-1"
            render={<a href={cnDownloadUrl} target="_blank" rel="noopener" />}
          >
            <Eye className="h-3.5 w-3.5" />
            {t("view")}
          </Button>
        ) : null}
        {isCn && onDownloadCn ? (
          <Button variant="outline" size="sm" onClick={onDownloadCn} className="h-8 gap-1">
            <Download className="h-3.5 w-3.5" />
            {t("download")}
          </Button>
        ) : null}
        {!isCn && doc.document_id ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={busyId === `${doc.document_id}-preview`}
              onClick={() =>
                handleDocumentAction(doc.document_id!, "preview", `${doc.key}.pdf`)
              }
              className="h-8 gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              {t("view")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busyId === `${doc.document_id}-download`}
              onClick={() =>
                handleDocumentAction(doc.document_id!, "download", `${doc.key}.pdf`)
              }
              className="h-8 gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              {t("download")}
            </Button>
          </>
        ) : null}
        {isInvoice && doc.document_id ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busyId === `${doc.document_id}-download`}
            onClick={() =>
              handleDocumentAction(doc.document_id!, "download", `${doc.key}.pdf`)
            }
            className="h-8 gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            {t("download")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">{t("noEntries")}</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {documents.map((doc) => (
              <li
                key={doc.key}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{docLabel(doc)}</p>
                    {!doc.available ? (
                      <p className="text-xs text-zinc-500">{t("unavailable")}</p>
                    ) : null}
                  </div>
                </div>
                {renderActions(doc)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
