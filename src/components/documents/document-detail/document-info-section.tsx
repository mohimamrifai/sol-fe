"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

export function DocumentInfoSection({ document }: Props) {
  const t = useTranslations("Documents.detail.section1");
  const info = document.info;

  const fields: Array<[string, string | null | undefined]> = [
    [t("documentName"), info.document_name ?? document.name],
    [t("documentType"), info.document_type ?? null],
    [t("bookingNo"), info.booking_no ?? document.booking_no ?? null],
    [t("shipmentNo"), info.shipment_no ?? document.shipment_no ?? null],
    [t("customer"), info.customer ?? null],
    [t("uploadedBy"), info.uploaded_by ?? document.uploaded_by ?? null],
    [t("uploadDate"), formatDateTime(info.upload_date ?? document.upload_date)],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {label}
              </dt>
              <dd className="text-sm text-zinc-900 break-words">
                {value && value !== "" ? value : "—"}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("remark")}
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {info.remarks ? info.remarks : "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
