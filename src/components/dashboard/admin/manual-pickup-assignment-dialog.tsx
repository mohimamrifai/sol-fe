"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignAdminOperationTaskVendor, fetchAdminOperationTasks, fetchAllAdminVendors } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: number | null;
  taskLabel?: string;
  onSuccess?: () => void;
};

export function ManualPickupAssignmentDialog({
  open,
  onOpenChange,
  taskId: initialTaskId,
  taskLabel,
  onSuccess,
}: Props) {
  const t = useTranslations("AdminFsdOperations");
  const tc = useTranslations("AdminCommon");

  const [taskId, setTaskId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [tasks, setTasks] = useState<{ id: number; label: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTaskId(initialTaskId ? String(initialTaskId) : "");
    setVendorId("");
    setLoading(true);
    void Promise.all([
      fetchAdminOperationTasks("pickup", { status: "waiting", perPage: 100 }),
      fetchAdminOperationTasks("pickup", { status: "in_progress", perPage: 100 }),
      fetchAllAdminVendors(),
    ])
      .then(([waitingRes, inProgressRes, vendorRows]) => {
        const waiting = ((waitingRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
        const inProgress = ((inProgressRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
        const merged = [...waiting, ...inProgress];
        const unique = new Map<number, { id: number; label: string }>();
        for (const row of merged) {
          const id = Number(row.id);
          if (!Number.isFinite(id)) continue;
          unique.set(id, {
            id,
            label: `${row.shipment_number ?? "—"} · ${row.customer ?? "—"}`,
          });
        }
        setTasks(Array.from(unique.values()));
        setVendors(
          vendorRows.map((v) => ({
            id: Number(v.id),
            label: String(v.name ?? v.code ?? v.id),
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [open, initialTaskId]);

  const submit = async () => {
    const parsedTaskId = Number(taskId);
    const parsedVendorId = Number(vendorId);
    if (!Number.isFinite(parsedTaskId) || !Number.isFinite(parsedVendorId)) {
      toast.error(t("manualAssignment.validation"));
      return;
    }

    setSubmitting(true);
    try {
      await assignAdminOperationTaskVendor(parsedTaskId, parsedVendorId);
      toast.success(t("manualAssignment.success"));
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("manualAssignment.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("manualAssignment.title")}</DialogTitle>
          <DialogDescription>{t("manualAssignment.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {initialTaskId ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("columns.shipment")}: </span>
              <span className="font-medium">{taskLabel ?? `#${initialTaskId}`}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("manualAssignment.pickupTask")}</Label>
              <Select value={taskId} onValueChange={(v) => setTaskId(v ?? "")} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={t("manualAssignment.selectTask")} />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={String(task.id)}>
                      {task.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("manualAssignment.vendor")}</Label>
            <Select value={vendorId} onValueChange={(v) => setVendorId(v ?? "")} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={t("manualAssignment.selectVendor")} />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.cancel")}
          </Button>
          <Button disabled={submitting || loading} onClick={() => void submit()}>
            {submitting ? tc("actions.saving") : t("manualAssignment.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
