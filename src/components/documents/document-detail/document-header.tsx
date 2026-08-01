"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { fetchCustomerDocumentBlob } from "@/lib/customer-api";
import { downloadBlob } from "@/lib/download-blob";
import type { DocumentDetail } from "@/lib/document-types";

interface Props {
  document: DocumentDetail;
}

export function DocumentHeader({ document }: Props) {
  const t = useTranslations("Documents.detail.header");
  const tType = useTranslations("Documents.type");
  const tBucket = useTranslations("Documents.bucket");
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

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
        <div className="space-y-1">
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
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span className="font-medium text-zinc-900">{document.name}</span>
            <span className="text-zinc-300">·</span>
            <span>{tType(document.document_type)}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-xs uppercase tracking-wider text-zinc-400">
              {tBucket(document.bucket)}
            </span>
          </div>
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
