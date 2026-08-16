"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchVendorDocument, getVendorDocumentDownloadUrl } from "@/lib/vendor/documents-api";
import { ArrowLeft, Download } from "lucide-react";

export default function VendorDocumentDetailPage() {
  const t = useTranslations("Vendor.documents.detail");
  const tCommon = useTranslations("Vendor.common");
  const params = useParams<{ id: string }>();
  const documentId = decodeURIComponent(params?.id ?? "");
  const router = useRouter();
  const token = typeof window !== "undefined" ? sessionStorage.getItem("sol_token") : null;

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", "documents", "detail", documentId],
    queryFn: () => fetchVendorDocument(documentId),
    enabled: !!documentId,
  });

  const doc = data?.data;
  const isPdf = doc?.mime_type === "application/pdf";
  const isImage = doc?.mime_type?.startsWith("image/");
  const downloadUrl = `${getVendorDocumentDownloadUrl(documentId)}${token ? `?token=${token}` : ""}`;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => router.push("/dashboard/vendor/documents")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon("back")}
      </Button>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !doc ? (
        <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
          {tCommon("noData")}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{doc.name}</CardTitle>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Download className="mr-2 h-4 w-4" />
                {tCommon("download")}
              </a>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-zinc-500">{t("type")}</dt><dd>{doc.document_type_label ?? doc.type_label}</dd></div>
                <div><dt className="text-zinc-500">{t("format")}</dt><dd>{doc.format ?? doc.mime_type}</dd></div>
                <div><dt className="text-zinc-500">{t("size")}</dt><dd>{Math.round((doc.size ?? 0) / 1024)} KB</dd></div>
                <div><dt className="text-zinc-500">{t("joNo")}</dt><dd className="font-mono text-xs">{doc.jo_number}</dd></div>
                <div><dt className="text-zinc-500">{t("shipmentNo")}</dt><dd className="font-mono text-xs">{doc.shipment_number}</dd></div>
                <div><dt className="text-zinc-500">{t("uploadedBy")}</dt><dd>{doc.uploaded_by}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {isPdf ? (
                <iframe
                  src={`${downloadUrl}#toolbar=0`}
                  className="h-[600px] w-full rounded-b-lg"
                  title={doc.name}
                />
              ) : isImage && doc.file_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doc.file_url} alt={doc.name} className="mx-auto max-h-[600px]" />
              ) : (
                <div className="p-8 text-center text-sm text-zinc-500">
                  {t("previewUnavailable")}
                </div>
              )}
            </CardContent>
          </Card>

          {doc.activities && doc.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("activityLog")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {doc.activities.map((a) => (
                    <li key={a.id} className="flex justify-between border-b border-zinc-100 pb-2 last:border-0">
                      <span>{a.description}</span>
                      <span className="text-xs text-zinc-500">
                        {a.occurred_at ? new Date(a.occurred_at).toLocaleString("id-ID") : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
