"use client";

import { useParams } from "next/navigation";
import { OperationTaskListPage } from "@/components/dashboard/admin/operation-task-list-page";
import { adminOperationApiType } from "@/lib/admin-operation-types";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminDeliveryOperationsPage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminFsdOperations.pages");

  return (
    <OperationTaskListPage
      operationType={adminOperationApiType("delivery")!}
      title={t("delivery")}
      description={t("deliveryDesc")}
      basePath={`/${locale}/dashboard/admin/operations/delivery`}
      icon={Truck}
    />
  );
}
