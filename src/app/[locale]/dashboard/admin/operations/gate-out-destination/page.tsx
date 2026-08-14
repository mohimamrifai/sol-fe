"use client";

import { useParams } from "next/navigation";
import { OperationTaskListPage } from "@/components/dashboard/admin/operation-task-list-page";
import { adminOperationApiType } from "@/lib/admin-operation-types";
import { MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminGateOutDestinationOperationsPage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminFsdOperations.pages");

  return (
    <OperationTaskListPage
      operationType={adminOperationApiType("gate-out-destination")!}
      title={t("gateOutDestination")}
      description={t("gateOutDestinationDesc")}
      basePath={`/${locale}/dashboard/admin/operations/gate-out-destination`}
      icon={MapPinned}
    />
  );
}
