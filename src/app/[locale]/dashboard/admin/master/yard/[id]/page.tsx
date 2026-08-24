"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { MasterActiveBadge } from "@/components/shared/master-active-badge";
import { deactivateAdminYard, fetchAdminStations, fetchAdminYard, updateAdminYard } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";
import { Warehouse } from "lucide-react";
import { useTranslations } from "next-intl";

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function MasterYardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/master/yard`;
  const t = useTranslations("AdminFsdMaster.yard");
  const tc = useTranslations("AdminCommon");

  const yardTypeLabel = (value: string) => t(`yardTypes.${value}` as "yardTypes.origin_yard");

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [stations, setStations] = useState<{ id: number; label: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", station_id: "", yard_type: "origin_yard", status: "active", remark: "" });

  const refresh = async () => {
    const res = await fetchAdminYard(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    setForm({
      name: String(d.name ?? ""),
      station_id: String(d.station_id ?? ""),
      yard_type: String(d.yard_type ?? "origin_yard"),
      status: String(d.status ?? "active"),
      remark: String(d.remark ?? ""),
    });
  };

  useEffect(() => {
    void refresh().catch(() => setDetail(null));
    void fetchAdminStations({ perPage: 500, status: "active" }).then((res) => {
      setStations(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((s) => ({
        id: Number(s.id),
        label: `${s.code ?? ""} · ${s.name ?? s.id}`.trim(),
      })));
    });
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminYard(id, { ...form, station_id: Number(form.station_id) });
      toast.success(t("saved"));
      setEditing(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  if (!detail) return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;

  const station = detail.station as Record<string, unknown> | undefined;

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={Warehouse}
        title={String(detail.name ?? "—")}
        description={String(detail.code ?? "—")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(basePath)}>
              {tc("actions.back")}
            </Button>
            {!editing ? <Button onClick={() => setEditing(true)}>{t("edit")}</Button> : null}
            {detail.status === "active" ? (
              <Button
                variant="destructive"
                onClick={() =>
                  void deactivateAdminYard(id)
                    .then(refresh)
                    .then(() => toast.success(t("saved")))
                }
              >
                {tc("actions.deactivate")}
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("edit")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!editing ? (
            <>
              <ReadonlyField label={t("columns.code")} value={String(detail.code ?? "—")} />
              <ReadonlyField label={t("columns.name")} value={String(detail.name ?? "—")} />
              <ReadonlyField label="Station" value={String(station?.name ?? "—")} />
              <ReadonlyField label={t("columns.type")} value={yardTypeLabel(String(detail.yard_type ?? ""))} />
              <ReadonlyField label={tc("table.status")} value={<MasterActiveBadge active={detail.status === "active"} />} />
              <ReadonlyField label="Remark" value={String(detail.remark ?? "—")} />
            </>
          ) : (
            <div className="grid gap-3 max-w-lg">
              <div className="space-y-2">
                <Label>{t("columns.name")}</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <Select value={form.station_id} onValueChange={(v) => v && setForm((f) => ({ ...f, station_id: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("columns.type")}</Label>
                <Select value={form.yard_type} onValueChange={(v) => v && setForm((f) => ({ ...f, yard_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="origin_yard">{t("yardTypes.origin_yard")}</SelectItem>
                    <SelectItem value="destination_yard">{t("yardTypes.destination_yard")}</SelectItem>
                    <SelectItem value="hub_yard">{t("yardTypes.hub_yard")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Remark</Label>
                <Textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  {tc("actions.cancel")}
                </Button>
                <Button disabled={saving} onClick={() => void save()}>
                  {saving ? tc("actions.saving") : tc("actions.save")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
