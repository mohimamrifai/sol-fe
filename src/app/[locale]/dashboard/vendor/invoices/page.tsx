"use client";

import { useTranslations } from "next-intl";
import { VendorInvoicesList } from "@/components/vendor/invoices/vendor-invoices-list";

export default function VendorInvoicesPage() {
  useTranslations("Vendor.invoices.title");
  return <VendorInvoicesList />;
}
