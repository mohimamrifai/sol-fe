"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useVendorJobOrder } from "@/hooks/use-vendor-job-orders";
import { ArrowLeft, CheckCircle2, FileUp } from "lucide-react";
import { VendorAcceptJobDialog } from "@/components/vendor/job-orders/dialogs/vendor-accept-job-dialog";
import { VendorRejectJobDialog } from "@/components/vendor/job-orders/dialogs/vendor-reject-job-dialog";
import { VendorSubmitProgressDialog } from "@/components/vendor/job-orders/dialogs/vendor-submit-progress-dialog";
import { VendorSubmitCompletionDialog } from "@/components/vendor/job-orders/dialogs/vendor-submit-completion-dialog";
import { XCircle } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  pending_acceptance: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  waiting_verification: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

type Props = { id: number };

export function VendorJobOrderDetail({ id }: Props) {
  const t = useTranslations("Vendor.jobOrders.detail");
  const tHeader = useTranslations("Vendor.jobOrders.detail.header");
  const tSections = useTranslations("Vendor.jobOrders.detail.sections");
  const tCommon = useTranslations("Vendor.common");
  const router = useRouter();
  const { data, isLoading } = useVendorJobOrder(id);
  const [showAccept, setShowAccept] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const job = data?.data;
  if (!job) {
    return (
      <div className="p-4 text-sm text-zinc-500">{tCommon("noData")}</div>
    );
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => router.push("/dashboard/vendor/job-orders")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon("back")}
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                {job.jo_number}
              </h1>
              <Badge className={`${STATUS_BADGE[job.vendor_status] ?? ""} border text-xs`}>
                {job.vendor_status_label}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500">
              {tHeader("assigned")}: {job.assigned_date} · {tHeader("due")}: {job.due_date}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.vendor_status === "pending_acceptance" && (
              <>
                <Button onClick={() => setShowAccept(true)} className="h-10">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t("accept")}
                </Button>
                <Button variant="outline" onClick={() => setShowReject(true)} className="h-10">
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("reject")}
                </Button>
              </>
            )}
            {(job.vendor_status === "accepted" || job.vendor_status === "in_progress") && (
              <Button variant="outline" onClick={() => setShowProgress(true)} className="h-10">
                <FileUp className="mr-2 h-4 w-4" />
                {t("submitProgress")}
              </Button>
            )}
            {job.vendor_status === "in_progress" && (
              <Button onClick={() => setShowCompletion(true)} className="h-10">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("submitCompletion")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tSections("jobInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-zinc-500">Shipment No.</dt><dd className="text-zinc-900">{job.shipment_number}</dd></div>
              <div><dt className="text-zinc-500">Customer</dt><dd className="text-zinc-900">{job.customer?.name ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">Service</dt><dd className="text-zinc-900">{job.service_type?.name ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">{t("priority")}</dt><dd className="text-zinc-900">{job.priority ?? "Normal"}</dd></div>
              <div><dt className="text-zinc-500">{t("assignedBy")}</dt><dd className="text-zinc-900">{job.assigned_by ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">Coverage</dt><dd className="text-zinc-900">{job.shipment_coverage}</dd></div>
              <div className="col-span-2"><dt className="text-zinc-500">{t("jobDescription")}</dt><dd className="text-zinc-900">{job.job_description ?? job.notes ?? "—"}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tSections("location")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-zinc-500">Origin</dt><dd className="text-zinc-900">{job.origin_location?.name ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">Destination</dt><dd className="text-zinc-900">{job.destination_location?.name ?? "—"}</dd></div>
              <div className="col-span-2"><dt className="text-zinc-500">{t("workLocation")}</dt><dd className="text-zinc-900">{job.work_location ?? "—"}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{tSections("jobDetail")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              <div><dt className="text-zinc-500">{t("containerNo")}</dt><dd className="text-zinc-900">{job.job_details?.containers?.[0]?.container_no ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">{t("containerType")}</dt><dd className="text-zinc-900">{job.job_details?.containers?.[0]?.container_type ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">{t("cargoDescription")}</dt><dd className="text-zinc-900">{job.job_details?.cargo_description ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">{t("pickupLocation")}</dt><dd className="text-zinc-900">{job.job_details?.pickup_location ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">{t("deliveryLocation")}</dt><dd className="text-zinc-900">{job.job_details?.delivery_location ?? "—"}</dd></div>
              <div className="col-span-2 md:col-span-3"><dt className="text-zinc-500">{t("specialInstruction")}</dt><dd className="text-zinc-900">{job.job_details?.special_instruction ?? job.notes ?? "—"}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tSections("supportingDocs")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const allDocs = [
                ...(job.internal_documents ?? []),
                ...job.supporting_documents,
              ];
              return allDocs.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("noDocuments")}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {allDocs.map((d) => (
                  <li key={`${d.id}-${d.name}`} className="flex items-center justify-between rounded-md border border-zinc-200 p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-zinc-900">{d.name}</p>
                      <p className="text-xs text-zinc-500">{(d.size / 1024).toFixed(1)} KB · {d.uploaded_by ?? "—"}</p>
                    </div>
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {tCommon("download")}
                    </a>
                  </li>
                ))}
              </ul>
            );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tSections("timeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            {job.timeline.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("noTimeline")}</p>
            ) : (
              <ol className="space-y-3">
                {job.timeline.map((tl, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-zinc-900" />
                      {i < job.timeline.length - 1 && <div className="my-1 h-full w-px bg-zinc-200" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-zinc-900">{tl.activity ?? tl.description}</p>
                      <p className="text-xs text-zinc-500">
                        {tl.status_label ?? tl.status} · {tl.updated_by ?? "—"} ·{" "}
                        {tl.occurred_at ? new Date(tl.occurred_at).toLocaleString("id-ID") : "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{tSections("progress")}</CardTitle>
          </CardHeader>
          <CardContent>
            {job.progress_updates.length === 0 ? (
              <p className="text-sm text-zinc-500">{tCommon("noData")}</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {job.progress_updates.map((p) => (
                  <li key={p.id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-900">{p.submitted_by}</span>
                      <span className="text-xs text-zinc-500">
                        {p.submitted_at ? new Date(p.submitted_at).toLocaleString("id-ID") : "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-700">{p.progress_notes}</p>
                    {p.completion_remark && (
                      <p className="mt-1 text-xs text-zinc-500">Completion: {p.completion_remark}</p>
                    )}
                    {p.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.attachments.map((a) => (
                          <a
                            key={a.id}
                            href={a.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-blue-600 hover:underline"
                          >
                            {a.original_name}
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{tSections("activityLog")}</CardTitle>
          </CardHeader>
          <CardContent>
            {job.activities.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("noActivities")}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {job.activities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                    <span className="text-zinc-700">{a.description}</span>
                    <span className="text-xs text-zinc-500">
                      {a.occurred_at ? new Date(a.occurred_at).toLocaleString("id-ID") : "—"}
                      {a.actor_name ? ` · ${a.actor_name}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <VendorAcceptJobDialog job={job} open={showAccept} onOpenChange={setShowAccept} />
      <VendorRejectJobDialog jobOrderId={job.id} open={showReject} onOpenChange={setShowReject} />
      <VendorSubmitProgressDialog job={job} open={showProgress} onOpenChange={setShowProgress} />
      <VendorSubmitCompletionDialog job={job} open={showCompletion} onOpenChange={setShowCompletion} />
    </div>
  );
}
