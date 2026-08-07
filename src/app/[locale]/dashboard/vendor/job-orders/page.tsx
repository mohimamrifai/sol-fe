"use client";

import { useTranslations } from "next-intl";
import { VendorJobOrdersList } from "@/components/vendor/job-orders/vendor-job-orders-list";

export default function VendorJobOrdersPage() {
  useTranslations("Vendor.jobOrders.title");
  return <VendorJobOrdersList />;
}
