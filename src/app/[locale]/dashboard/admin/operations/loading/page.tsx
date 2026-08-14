"use client";

import { useParams } from "next/navigation";
import { OperationTaskListPage } from "@/components/dashboard/admin/operation-task-list-page";
import { adminOperationApiType } from "@/lib/admin-operation-types";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminLoadingOperationsPage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminFsdOperations.pages");

  return (
    <OperationTaskListPage
      operationType={adminOperationApiType("loading")!}
      title={t("loading")}
      description={t("loadingDesc")}
      basePath={`/${locale}/dashboard/admin/operations/loading`}
      icon={Upload}
    />
  );
}
