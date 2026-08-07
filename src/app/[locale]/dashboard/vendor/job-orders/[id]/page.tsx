"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { VendorJobOrderDetail } from "@/components/vendor/job-orders/vendor-job-order-detail";

export default function VendorJobOrderDetailPage() {
  useTranslations("Vendor.jobOrders.title");
  const params = useParams<{ id: string }>();
  const id = Number(params?.id ?? 0);
  return <VendorJobOrderDetail id={id} />;
}
