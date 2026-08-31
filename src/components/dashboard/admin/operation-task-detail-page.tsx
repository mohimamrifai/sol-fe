"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  completeAdminOperationTask,
  fetchAdminOperationTask,
  startAdminOperationTask,
  updateAdminOperationTaskRemark,
  uploadAdminOperationTaskDocument,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { AdminActivityLogSection } from "@/components/dashboard/admin/shared/admin-activity-log-section";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ClipboardList, Truck } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ManualPickupAssignmentDialog } from "@/components/dashboard/admin/manual-pickup-assignment-dialog";

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

type ChecklistItem = { key: string; label: string; done: boolean };

type Props = {
  taskId: number;
  basePath: string;
  title: string;
};

export function OperationTaskDetailPage({ taskId, basePath, title }: Props) {
  const router = useRouter();
  const tc = useTranslations("AdminCommon");
  const t = useTranslations("AdminFsdOperations");
  const tBookings = useTranslations("AdminBookings");
  const fileRef = useRef<HTMLInputElement>(null);

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [remark, setRemark] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const refresh = async () => {
    const res = await fetchAdminOperationTask(taskId);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    setRemark(String(d.remark ?? ""));
    setChecklist((d.checklist as ChecklistItem[] | undefined) ?? []);
  };

  useEffect(() => { void refresh().catch(() => setDetail(null)); }, [taskId]);

  if (!detail) {
    return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;
  }

  const shipment = detail.shipment as Record<string, unknown> | null;
  const vjo = detail.vendor_job_order as Record<string, unknown> | null;
  const documents = (detail.documents as Record<string, unknown>[] | undefined) ?? [];
  const activityLog = (detail.activity_log as Array<{ description?: string; user?: string; occurred_at?: string }> | undefined) ?? [];
  const items = (shipment?.items as Record<string, unknown>[] | undefined) ?? [];
  const containers = (shipment?.containers as Record<string, unknown>[] | undefined) ?? [];
  const isFcl = Boolean(shipment?.is_fcl);
  const showContainers = isFcl && containers.length > 0;
  const coverageRaw = shipment?.shipment_coverage ? String(shipment.shipment_coverage) : "";
  const coverageLabel = coverageRaw
    ? tBookings(`coverageOptions.${coverageRaw}` as Parameters<typeof tBookings>[0])
    : "—";

  const runAction = async (action: "start" | "complete") => {
    setBusy(true);
    try {
      if (action === "start") await startAdminOperationTask(taskId);
      else await completeAdminOperationTask(taskId);
      toast.success(action === "start" ? t("actions.started") : t("actions.completed"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setBusy(false);
    }
  };

  const saveRemark = async () => {
    setSaving(true);
    try {
      await updateAdminOperationTaskRemark(taskId, { remark, checklist });
      toast.success(t("actions.remarkSaved"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklist = (key: string, done: boolean) => {
    setChecklist((prev) => prev.map((item) => (item.key === key ? { ...item, done } : item)));
  };

  const uploadDocument = async (file: File) => {
    setUploading(true);
    try {
      await uploadAdminOperationTaskDocument(taskId, file);
      toast.success(t("actions.documentUploaded"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={ClipboardList}
        title={title}
        description={String(detail.shipment_number ?? "")}
        actions={
          <div className="flex flex-wrap gap-2">
            {detail.can_reassign_vendor ? (
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <Truck className="mr-2 h-4 w-4" />
                {t("manualAssignment.reassign")}
              </Button>
            ) : null}
            {detail.can_start ? (
              <Button disabled={busy} onClick={() => void runAction("start")}>{t("actions.start")}</Button>
            ) : null}
            {detail.can_complete ? (
              <Button disabled={busy} onClick={() => void runAction("complete")}>{t("actions.complete")}</Button>
            ) : null}
            <Button variant="outline" onClick={() => router.push(basePath)}>{tc("actions.back")}</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("detail.shipmentInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label={t("columns.shipment")} value={String(shipment?.shipment_number ?? detail.shipment_number ?? "—")} />
            <ReadonlyField label="Booking" value={String(shipment?.booking_number ?? "—")} />
            <ReadonlyField label={t("columns.customer")} value={String(shipment?.customer ?? detail.customer ?? "—")} />
            <ReadonlyField label="Service" value={String(shipment?.service_type ?? "—")} />
            <ReadonlyField label="Coverage" value={coverageLabel} />
            <ReadonlyField label="Route" value={`${String(shipment?.origin ?? "—")} → ${String(shipment?.destination ?? "—")}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("detail.pickupInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label="Address" value={String(shipment?.pickup_address ?? shipment?.delivery_address ?? "—")} />
            <ReadonlyField label="PIC" value={String(shipment?.pickup_pic ?? shipment?.delivery_pic ?? "—")} />
            <ReadonlyField label="Phone" value={String(shipment?.pickup_phone ?? shipment?.delivery_phone ?? "—")} />
            <ReadonlyField label="Planned Date" value={String(shipment?.planned_pickup_date ?? shipment?.planned_delivery_date ?? detail.planned_date ?? "—")} />
            <ReadonlyField label={tc("table.status")} value={String(detail.status_label ?? detail.status ?? "—")} />
            <ReadonlyField label={t("detail.actualAt")} value={detail.actual_at ? new Date(String(detail.actual_at)).toLocaleString("id-ID") : "—"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("detail.cargoInfo")}</CardTitle></CardHeader>
          <CardContent>
            {showContainers ? (
              <div className="space-y-3">
                {containers.map((c, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-3 text-sm">
                    <ReadonlyField label="Container Type" value={String(c.container_type ?? "—")} />
                    <ReadonlyField label="Container No" value={String(c.container_number ?? "—")} />
                    <ReadonlyField label="Seal No" value={String(c.seal_number ?? "—")} />
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{String(item.description ?? item.name ?? "—")}</TableCell>
                        <TableCell className="text-right tabular-nums">{String(item.quantity ?? "—")}</TableCell>
                        <TableCell className="text-right tabular-nums">{String(item.gross_weight ?? "—")}</TableCell>
                        <TableCell className="text-right tabular-nums">{String(item.cbm ?? "—")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                  <ReadonlyField label="Total Weight" value={String(shipment?.total_weight ?? 0)} />
                  <ReadonlyField label="Total Volume" value={String(shipment?.total_volume ?? 0)} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("detail.noCargo")}</p>
            )}
          </CardContent>
        </Card>

        {vjo ? (
          <Card>
            <CardHeader><CardTitle>{t("detail.vendorJobOrder")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ReadonlyField label="JO No" value={String(vjo.job_order_number ?? "—")} />
              <ReadonlyField label={t("columns.vendor")} value={String(vjo.vendor ?? "—")} />
              <ReadonlyField label="Driver" value={String(vjo.driver_name ?? "—")} />
              <ReadonlyField label="Driver Phone" value={String(vjo.driver_phone ?? "—")} />
              <ReadonlyField label="Vehicle" value={String(vjo.vehicle_plate ?? "—")} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle>{t("detail.checklist")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <Checkbox
                  id={item.key}
                  checked={item.done}
                  disabled={!detail.is_editable}
                  onCheckedChange={(v) => toggleChecklist(item.key, v === true)}
                />
                <Label htmlFor={item.key} className="font-normal">{item.label}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("detail.remark")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} disabled={!detail.is_editable} rows={4} />
            {detail.is_editable ? (
              <Button disabled={saving} onClick={() => void saveRemark()}>{saving ? tc("actions.saving") : tc("actions.save")}</Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("detail.documents")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {detail.is_editable ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="max-w-xs" />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => {
                    const file = fileRef.current?.files?.[0];
                    if (file) void uploadDocument(file);
                  }}
                >
                  {uploading ? tc("actions.saving") : t("actions.uploadDocument")}
                </Button>
              </div>
            ) : null}
            {documents.length > 0 ? documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{String(doc.original_name ?? doc.document_type ?? `Document ${i + 1}`)}</span>
                {doc.url ? (
                  <a href={String(doc.url)} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {tc("actions.download")}
                  </a>
                ) : null}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">{t("detail.noDocuments")}</p>
            )}
          </CardContent>
        </Card>

        <AdminActivityLogSection entries={activityLog} />
      </div>

      <ManualPickupAssignmentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        taskId={taskId}
        taskLabel={String(detail.shipment_number ?? "")}
        onSuccess={() => void refresh()}
      />
    </div>
  );
}
