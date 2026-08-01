"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useCustomerDocumentDetail } from "@/hooks/use-customer-document-detail";
import { DocumentHeader } from "@/components/documents/document-detail/document-header";
import { DocumentInfoSection } from "@/components/documents/document-detail/document-info-section";
import { DocumentPreviewSection } from "@/components/documents/document-detail/document-preview-section";
import { DocumentRelatedShipmentSection } from "@/components/documents/document-detail/document-related-shipment-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDocumentDetailPage({ params }: PageProps) {
  const t = useTranslations("Documents.detail");
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);

  const { data: document, isLoading, error } = useCustomerDocumentDetail(id);

  if (isLoading) {
    return (
      <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error ? t("loadError") : t("notFound")}</AlertTitle>
          <AlertDescription>
            {error ? (error as Error).message : t("notFound")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <DocumentHeader document={document} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DocumentInfoSection document={document} />
        <DocumentRelatedShipmentSection document={document} />
      </div>

      <DocumentPreviewSection document={document} />
    </div>
  );
}
