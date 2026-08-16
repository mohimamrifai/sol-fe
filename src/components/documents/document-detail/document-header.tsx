"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { fetchCustomerDocumentBlob } from "@/lib/customer-api";
import { downloadBlob } from "@/lib/download-blob";
import type { DocumentDetail } from "@/lib/document-types";

interface Props {
  document: DocumentDetail;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentHeader({ document }: Props) {
  const t = useTranslations("Documents.detail.header");
  const tType = useTranslations("Documents.type");
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const info = document.info;
  const shipmentNo = info.shipment_no ?? document.shipment_no ?? document.shipment_number;
  const bookingNo = info.booking_no ?? document.booking_no;
  const uploadDate = info.upload_date ?? document.upload_date;
  const uploadedBy = info.uploaded_by ?? document.uploaded_by;

  async function onDownload() {
    setDownloading(true);
    try {
      const blob = await fetchCustomerDocumentBlob(document.id, "download");
      const filename = `${document.name || "document"}.${document.format || "pdf"}`;
      downloadBlob(blob, filename);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/documents")}
            className="h-7 -ml-2 gap-1 px-2 text-xs text-zinc-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToList")}
          </Button>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <FileText className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {t("title")}
            </h1>
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-zinc-900">{document.name}</p>
            <p className="text-sm text-zinc-500">{tType(document.document_type)}</p>
          </div>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <HeaderField label={t("shipmentNo")} value={shipmentNo} />
            <HeaderField
              label={t("bookingNo")}
              value={
                document.booking_id && bookingNo ? (
                  <Link
                    href={`/dashboard/booking/${document.booking_id}` as never}
                    className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
                  >
                    {bookingNo}
                  </Link>
                ) : (
                  bookingNo
                )
              }
            />
            <HeaderField label={t("uploadDate")} value={formatDateTime(uploadDate)} />
            <HeaderField label={t("uploadedBy")} value={uploadedBy} />
          </dl>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={downloading}
          className="h-9 gap-2"
        >
          <Download className="h-4 w-4" />
          {t("download")}
        </Button>
      </div>
    </div>
  );
}

function HeaderField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-zinc-900">{value ?? "—"}</dd>
    </div>
  );
}
