"use client";

import { useTranslations } from "next-intl";
import { VendorPaymentsList } from "@/components/vendor/payments/vendor-payments-list";

export default function VendorPaymentsPage() {
  useTranslations("Vendor.payments.title");
  return <VendorPaymentsList />;
}
