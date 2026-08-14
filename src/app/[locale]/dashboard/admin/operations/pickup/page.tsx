"use client";

import { useParams } from "next/navigation";
import { OperationTaskListPage } from "@/components/dashboard/admin/operation-task-list-page";
import { adminOperationApiType } from "@/lib/admin-operation-types";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminPickupOperationsPage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminFsdOperations.pages");

  return (
    <OperationTaskListPage
      operationType={adminOperationApiType("pickup")!}
      title={t("pickup")}
      description={t("pickupDesc")}
      basePath={`/${locale}/dashboard/admin/operations/pickup`}
      icon={Package}
    />
  );
}
