"use client";

import { useTranslations } from "next-intl";
import { VendorDocumentsList } from "@/components/vendor/documents/vendor-documents-list";

export default function VendorDocumentsPage() {
  useTranslations("Vendor.documents.title");
  return <VendorDocumentsList />;
}
