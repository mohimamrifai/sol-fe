"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import {
  fetchAdminProofOfDelivery,
  rejectAdminProofOfDelivery,
  submitAdminProofOfDelivery,
  verifyAdminProofOfDelivery,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { FileCheck } from "lucide-react";
import { useTranslations } from "next-intl";

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function AdminProofOfDeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/operations/proof-of-delivery`;
  const t = useTranslations("AdminFsdOperations.pod");
  const tc = useTranslations("AdminCommon");

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    receiver_name: "",
    receiver_position: "",
    received_at: "",
    remark: "",
    verification_notes: "",
  });
  const [signedPod, setSignedPod] = useState<File | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);

  const refresh = async () => {
    const res = await fetchAdminProofOfDelivery(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    setForm({
      receiver_name: String(d.receiver_name ?? ""),
      receiver_position: String(d.receiver_position ?? ""),
      received_at: d.received_at ? String(d.received_at).slice(0, 16) : "",
      remark: String(d.remark ?? ""),
      verification_notes: String(d.verification_notes ?? ""),
    });
  };

  useEffect(() => {
    void refresh()
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const submitPod = async () => {
    if (!signedPod) {
      toast.error(t("signedPodRequired"));
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("receiver_name", form.receiver_name);
      if (form.receiver_position) fd.append("receiver_position", form.receiver_position);
      fd.append("received_at", form.received_at);
      if (form.remark) fd.append("remark", form.remark);
      fd.append("signed_pod", signedPod);
      if (deliveryPhoto) fd.append("delivery_photo", deliveryPhoto);
      await submitAdminProofOfDelivery(id, fd);
      toast.success(t("submitted"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  const verifyPod = async () => {
    setSaving(true);
    try {
      await verifyAdminProofOfDelivery(id, { verification_notes: form.verification_notes || undefined });
      toast.success(t("verified"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  const rejectPod = async () => {
    setSaving(true);
    try {
      await rejectAdminProofOfDelivery(id, { verification_notes: form.verification_notes || undefined });
      toast.success(t("rejected"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">{tc("actions.loading")}</div>;
  }

  if (!detail) {
    return <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">{tc("table.empty")}</div>;
  }

  const shipment = detail.shipment as Record<string, unknown> | null;
  const canSubmit = detail.can_submit === true;
  const canVerify = detail.can_verify === true;
  const activityLog = (detail.activity_log as Array<Record<string, unknown>>) ?? [];

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        title={`${String(detail.shipment_number ?? "")} · ${String(detail.pod_number ?? "")}`}
        description={String(detail.status_label ?? "")}
        icon={FileCheck}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(basePath)}>{tc("actions.back")}</Button>
            {canSubmit ? (
              <Button disabled={saving} onClick={() => void submitPod()}>{t("actions.submit")}</Button>
            ) : null}
            {canVerify ? (
              <>
                <Button disabled={saving} onClick={() => void verifyPod()}>{t("actions.verify")}</Button>
                <Button variant="destructive" disabled={saving} onClick={() => void rejectPod()}>{t("actions.reject")}</Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("sections.shipment")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <ReadonlyField label={t("columns.shipmentNo")} value={String(shipment?.shipment_number ?? "—")} />
            <ReadonlyField label={t("columns.customer")} value={String(shipment?.customer ?? "—")} />
            <ReadonlyField label={t("fields.serviceType")} value={String(shipment?.service_type ?? "—")} />
            <ReadonlyField label={t("fields.coverage")} value={String(shipment?.shipment_coverage ?? "—")} />
            <ReadonlyField label={t("fields.origin")} value={String(shipment?.origin ?? "—")} />
            <ReadonlyField label={t("fields.destination")} value={String(shipment?.destination ?? "—")} />
            <ReadonlyField label={t("columns.deliveryDate")} value={shipment?.delivery_date ? new Date(String(shipment.delivery_date)).toLocaleString() : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("sections.podInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label={t("fields.podNumber")} value={String(detail.pod_number ?? "—")} />
            <ReadonlyField label={t("columns.podDate")} value={detail.pod_date ? new Date(String(detail.pod_date)).toLocaleString() : "—"} />
            {canSubmit || canVerify ? (
              <>
                <div className="space-y-2">
                  <Label>{t("fields.receiverName")}</Label>
                  <Input value={form.receiver_name} disabled={!canSubmit} onChange={(e) => setForm((f) => ({ ...f, receiver_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("fields.receiverPosition")}</Label>
                  <Input value={form.receiver_position} disabled={!canSubmit} onChange={(e) => setForm((f) => ({ ...f, receiver_position: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("fields.receivedAt")}</Label>
                  <Input type="datetime-local" value={form.received_at} disabled={!canSubmit} onChange={(e) => setForm((f) => ({ ...f, received_at: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("fields.remark")}</Label>
                  <Textarea value={form.remark} disabled={!canSubmit} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} />
                </div>
                {canSubmit ? (
                  <>
                    <div className="space-y-2">
                      <Label>{t("fields.signedPod")}</Label>
                      <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setSignedPod(e.target.files?.[0] ?? null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("fields.deliveryPhoto")}</Label>
                      <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setDeliveryPhoto(e.target.files?.[0] ?? null)} />
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <ReadonlyField label={t("fields.receiverName")} value={String(detail.receiver_name ?? "—")} />
                <ReadonlyField label={t("fields.receiverPosition")} value={String(detail.receiver_position ?? "—")} />
                <ReadonlyField label={t("fields.receivedAt")} value={detail.received_at ? new Date(String(detail.received_at)).toLocaleString() : "—"} />
                <ReadonlyField label={t("fields.remark")} value={String(detail.remark ?? "—")} />
              </>
            )}
            {detail.signed_pod_url ? (
              <a href={String(detail.signed_pod_url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{t("fields.viewSignedPod")}</a>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("sections.verification")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label={t("fields.verificationStatus")} value={<Badge variant="outline">{String(detail.verification_status_label ?? "—")}</Badge>} />
            <ReadonlyField label={t("fields.verifiedBy")} value={String(detail.verified_by ?? "—")} />
            <ReadonlyField label={t("fields.verifiedAt")} value={detail.verified_at ? new Date(String(detail.verified_at)).toLocaleString() : "—"} />
            {canVerify ? (
              <div className="space-y-2">
                <Label>{t("fields.verificationNotes")}</Label>
                <Textarea value={form.verification_notes} onChange={(e) => setForm((f) => ({ ...f, verification_notes: e.target.value }))} />
              </div>
            ) : (
              <ReadonlyField label={t("fields.verificationNotes")} value={String(detail.verification_notes ?? "—")} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("sections.activityLog")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tc("table.empty")}</p>
            ) : (
              activityLog.map((log, i) => (
                <div key={i} className="border-b pb-2 text-sm last:border-0">
                  <p>{String(log.description ?? "")}</p>
                  <p className="text-xs text-muted-foreground">{String(log.user ?? "System")} · {log.occurred_at ? new Date(String(log.occurred_at)).toLocaleString() : ""}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
