"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { OperationTaskDetailPage } from "@/components/dashboard/admin/operation-task-detail-page";
import { adminOperationApiType, isAdminOperationSlug } from "@/lib/admin-operation-types";
import { useTranslations } from "next-intl";

const TITLE_KEYS: Record<string, string> = {
  pickup: "pickup",
  "gate-in-origin": "gateInOrigin",
  loading: "loading",
  "train-departure": "trainDeparture",
  "train-arrival": "trainArrival",
  "gate-out-destination": "gateOutDestination",
  delivery: "delivery",
  "proof-of-delivery": "proofOfDelivery",
};

export default function AdminOperationTaskDetailRoutePage() {
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const slug = String(params?.type ?? "");
  const id = Number(params?.id);
  const t = useTranslations("AdminFsdOperations.pages");

  if (!isAdminOperationSlug(slug) || !adminOperationApiType(slug) || !Number.isFinite(id)) {
    notFound();
  }

  const titleKey = TITLE_KEYS[slug];
  const basePath = `/${locale}/dashboard/admin/operations/${slug}`;

  return (
    <OperationTaskDetailPage
      taskId={id}
      basePath={basePath}
      title={titleKey ? t(titleKey as "pickup") : slug}
    />
  );
}
