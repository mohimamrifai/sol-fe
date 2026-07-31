"use client";

import { useTranslations } from "next-intl";
import { Download, Eye, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface DocumentItem {
  key: string;
  label: string;
  available: boolean;
  has_endpoint?: boolean;
  reference_id?: number | null;
  items?: Array<{ id: number; name?: string; path?: string; url?: string; category?: string }>;
}

interface Props {
  documents: DocumentItem[];
  cnDownloadUrl?: string;
  onDownloadCn?: () => void;
}

export function DocumentsSection({ documents, cnDownloadUrl, onDownloadCn }: Props) {
  const t = useTranslations("Shipments.detail.section6");
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
            {documents.map((doc) => {
              const isCn = doc.key === "consignment_note";
              const label = isCn ? t("types.consignmentNote") : doc.label;
              return (
                <li
                  key={doc.key}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{label}</p>
                      {!doc.available ? (
                        <p className="text-xs text-zinc-500">{t("unavailable")}</p>
                      ) : null}
                    </div>
                  </div>
                  {doc.available ? (
                    <div className="flex items-center gap-2">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onDownloadCn}
                          className="h-8 gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t("download")}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-8 gap-1 text-zinc-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("download")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
