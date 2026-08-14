"use client";

import { useParams } from "next/navigation";
import { OperationTaskListPage } from "@/components/dashboard/admin/operation-task-list-page";
import { adminOperationApiType } from "@/lib/admin-operation-types";
import { DoorOpen } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminGateInOriginOperationsPage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminFsdOperations.pages");

  return (
    <OperationTaskListPage
      operationType={adminOperationApiType("gate-in-origin")!}
      title={t("gateInOrigin")}
      description={t("gateInOriginDesc")}
      basePath={`/${locale}/dashboard/admin/operations/gate-in-origin`}
      icon={DoorOpen}
    />
  );
}
