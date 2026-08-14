"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { fetchAdminContainer, updateAdminContainer } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import Link from "next/link";
import { Container as ContainerIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function AdminContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/container/containers`;
  const t = useTranslations("AdminFsdContainers");
  const tc = useTranslations("AdminCommon");

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const res = await fetchAdminContainer(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    setRemark(String((d.general as Record<string, unknown> | undefined)?.remark ?? d.remark ?? ""));
  };

  useEffect(() => { void refresh().catch(() => setDetail(null)); }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminContainer(id, { remark });
      toast.success(t("updateSuccess"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  if (!detail) return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;

  const general = (detail.general as Record<string, unknown> | undefined) ?? detail;
  const assignment = detail.current_assignment as Record<string, unknown> | null;
  const utilization = detail.utilization as Record<string, unknown> | undefined;
  const movements = (detail.movements as Record<string, unknown>[] | undefined) ?? [];
  const maintenances = (detail.maintenances as Record<string, unknown>[] | undefined) ?? [];
  const ownership = String(general.ownership ?? detail.ownership ?? "");
  const shipmentPath = assignment?.shipment_id
    ? `/${locale}/dashboard/admin/customer/shipments/${assignment.shipment_id}`
    : null;

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={ContainerIcon}
        title={String(general.container_number ?? detail.container_number)}
        description={t("detailSubtitle")}
        actions={<Button variant="outline" onClick={() => router.push(basePath)}>{tc("actions.back")}</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("detail.general")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label={t("columns.containerNo")} value={String(general.container_number ?? "—")} />
            <ReadonlyField label={t("columns.type")} value={String(general.container_type ?? detail.container_type ?? "—")} />
            <ReadonlyField label={t("columns.ownership")} value={ownership || "—"} />
            {ownership === "vendor" ? (
              <ReadonlyField label={t("filters.vendor")} value={String(general.vendor ?? detail.vendor ?? "—")} />
            ) : null}
            <ReadonlyField label={t("fields.maxPayload")} value={String(general.max_payload_kg ?? "—")} />
            <ReadonlyField label={t("fields.maxCapacity")} value={String(general.max_capacity_cbm ?? "—")} />
            <ReadonlyField label={t("columns.yard")} value={String(general.current_yard ?? detail.current_yard ?? "—")} />
            <ReadonlyField label={t("fields.manufactureYear")} value={String(general.manufacture_year ?? detail.manufacture_year ?? "—")} />
            <Badge variant="outline">{String(detail.status ?? "—")}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("detail.assignment")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assignment ? (
              <>
                <ReadonlyField
                  label={t("columns.shipment")}
                  value={
                    shipmentPath ? (
                      <Link href={shipmentPath} className="text-primary underline">
                        {String(assignment.shipment_number ?? "—")}
                      </Link>
                    ) : String(assignment.shipment_number ?? "—")
                  }
                />
                <ReadonlyField label={t("columns.customer")} value={String(assignment.customer ?? "—")} />
                <ReadonlyField label="Service" value={String(assignment.service ?? "—")} />
                <ReadonlyField label="Status" value={String(assignment.status ?? "—")} />
                <ReadonlyField label="Departure" value={String(assignment.departure ?? "—")} />
                <ReadonlyField label="ETA" value={String(assignment.eta ?? "—")} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("detail.noAssignment")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("detail.utilization")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {utilization?.mode === "fcl" ? (
              <p className="text-sm font-medium">{String(utilization.dedicated_message ?? t("detail.fclDedicated"))}</p>
            ) : utilization?.mode === "lcl" ? (
              <>
                <ReadonlyField label="Used CBM" value={String(utilization.used_cbm ?? 0)} />
                <ReadonlyField label="Remaining CBM" value={String(utilization.remaining_cbm ?? 0)} />
                <ReadonlyField label="Used Payload (Kg)" value={String(utilization.used_payload_kg ?? 0)} />
                <ReadonlyField label="Remaining Payload (Kg)" value={String(utilization.remaining_payload_kg ?? 0)} />
                <ReadonlyField label="Remaining %" value={`${String(utilization.remaining_pct ?? 0)}%`} />
              </>
            ) : (
              <>
                <ReadonlyField label="Used CBM" value="0" />
                <ReadonlyField label="Remaining %" value="100%" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("fields.remark")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={4} />
            <Button disabled={saving} onClick={() => void save()}>{saving ? tc("actions.saving") : tc("actions.save")}</Button>
          </CardContent>
        </Card>

        {maintenances.length > 0 ? (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>{t("detail.maintenance")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {maintenances.map((m) => (
                <div key={String(m.id)} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{String(m.maintenance_type ?? "—")} · {String(m.maintenance_date ?? "—")}</div>
                  <div className="text-muted-foreground">{String(m.vendor ?? "—")}</div>
                  <div className="text-xs">{String(m.remark ?? "")}</div>
                  <Badge variant="outline" className="mt-1">{String(m.status ?? "—")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {movements.length > 0 ? (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>{t("detail.movements")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {movements.map((m) => (
                <div key={String(m.id)} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{String(m.activity ?? "—")}</div>
                  <div className="text-muted-foreground">{String(m.location_from ?? "—")} → {String(m.location_to ?? "—")}</div>
                  <div className="text-xs text-muted-foreground">{m.occurred_at ? new Date(String(m.occurred_at)).toLocaleString("id-ID") : "—"}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
