"use client";

import { useParams } from "next/navigation";
import { OperationTaskListPage } from "@/components/dashboard/admin/operation-task-list-page";
import { adminOperationApiType } from "@/lib/admin-operation-types";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminTrainDepartureOperationsPage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminFsdOperations.pages");

  return (
    <OperationTaskListPage
      operationType={adminOperationApiType("train-departure")!}
      title={t("trainDeparture")}
      description={t("trainDepartureDesc")}
      basePath={`/${locale}/dashboard/admin/operations/train-departure`}
      icon={LogOut}
    />
  );
}
