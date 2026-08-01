"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileWarning } from "lucide-react";
import { fetchCustomerDocumentBlob } from "@/lib/customer-api";
import { downloadBlob } from "@/lib/download-blob";
import type { DocumentDetail } from "@/lib/document-types";

interface Props {
  document: DocumentDetail;
}

export function DocumentPreviewSection({ document }: Props) {
  const t = useTranslations("Documents.detail.section2");
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  async function onDownload() {
    const blob = await fetchCustomerDocumentBlob(document.id, "download");
    const filename = `${document.name || "document"}.${document.format || "pdf"}`;
    downloadBlob(blob, filename);
  }

  const previewQuery = useQuery({
    queryKey: ["customer", "document", "preview", document.id],
    queryFn: () => fetchCustomerDocumentBlob(document.id, "preview"),
    enabled: document.preview_supported,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (!previewQuery.data) return;
    const url = URL.createObjectURL(previewQuery.data);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewQuery.data]);

  const isImage = ["jpg", "jpeg", "png"].includes((document.format ?? "").toLowerCase());

  if (!document.preview_supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
            <FileWarning className="h-8 w-8 text-zinc-400" />
            <p className="max-w-md text-sm text-zinc-600">{t("unsupported")}</p>
            <Button variant="outline" size="sm" onClick={onDownload} className="h-9 gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onDownload} className="h-8 gap-1 text-xs">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        {previewQuery.isLoading ? (
          <div className="flex h-[480px] items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
            {t("loading")}
          </div>
        ) : previewQuery.isError ? (
          <div className="flex h-[480px] flex-col items-center justify-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
            <FileWarning className="h-7 w-7" />
            {t("failed")}
          </div>
        ) : blobUrl ? (
          isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt={document.name}
              className="mx-auto max-h-[640px] w-auto rounded-md object-contain"
            />
          ) : (
            <iframe
              src={blobUrl}
              title={document.name}
              className="h-[640px] w-full rounded-md border border-zinc-200 bg-white"
            />
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
