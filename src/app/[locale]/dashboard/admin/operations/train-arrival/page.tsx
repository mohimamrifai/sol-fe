"use client";

import { useParams } from "next/navigation";
import { OperationTaskListPage } from "@/components/dashboard/admin/operation-task-list-page";
import { adminOperationApiType } from "@/lib/admin-operation-types";
import { Train } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminTrainArrivalOperationsPage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminFsdOperations.pages");

  return (
    <OperationTaskListPage
      operationType={adminOperationApiType("train-arrival")!}
      title={t("trainArrival")}
      description={t("trainArrivalDesc")}
      basePath={`/${locale}/dashboard/admin/operations/train-arrival`}
      icon={Train}
    />
  );
}
