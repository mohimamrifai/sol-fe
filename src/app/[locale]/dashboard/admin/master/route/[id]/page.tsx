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
import { deactivateAdminRoute, fetchAdminRoute, fetchAllAdminStations, updateAdminRoute } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { Route } from "lucide-react";
import { useTranslations } from "next-intl";

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function MasterRouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/master/route`;
  const t = useTranslations("AdminFsdMaster.route");
  const tc = useTranslations("AdminCommon");

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [stations, setStations] = useState<{ id: number; label: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    origin_station_id: "",
    destination_station_id: "",
    distance_km: "",
    transit_days: "1",
    status: "active",
    remark: "",
  });

  const refresh = async () => {
    const res = await fetchAdminRoute(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    const origin = d.origin_station as Record<string, unknown> | undefined;
    const dest = d.destination_station as Record<string, unknown> | undefined;
    setForm({
      origin_station_id: String(d.origin_station_id ?? origin?.id ?? ""),
      destination_station_id: String(d.destination_station_id ?? dest?.id ?? ""),
      distance_km: String(d.distance_km ?? ""),
      transit_days: String(d.transit_days ?? "1"),
      status: String(d.status ?? "active"),
      remark: String(d.remark ?? ""),
    });
  };

  useEffect(() => {
    void refresh().catch(() => setDetail(null));
    void fetchAllAdminStations({ status: "active" }).then((rows) => {
      setStations(rows.map((s) => ({
        id: Number(s.id),
        label: `${s.code ?? ""} · ${s.name ?? s.id}`.trim(),
      })));
    });
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminRoute(id, {
        ...form,
        distance_km: Number(form.distance_km),
        transit_days: Number(form.transit_days),
        origin_station_id: Number(form.origin_station_id),
        destination_station_id: Number(form.destination_station_id),
      });
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

  const origin = detail.origin_station as Record<string, unknown> | undefined;
  const dest = detail.destination_station as Record<string, unknown> | undefined;

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={Route}
        title={String(detail.code ?? "—")}
        description={`${String(origin?.name ?? "—")} → ${String(dest?.name ?? "—")}`}
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
                  void deactivateAdminRoute(id)
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
              <ReadonlyField label={t("columns.origin")} value={String(origin?.name ?? "—")} />
              <ReadonlyField label={t("columns.destination")} value={String(dest?.name ?? "—")} />
              <ReadonlyField label={t("columns.distance")} value={`${String(detail.distance_km ?? "—")} km`} />
              <ReadonlyField label={t("columns.transitDays")} value={String(detail.transit_days ?? "—")} />
              <ReadonlyField label={tc("table.status")} value={<MasterActiveBadge active={detail.status === "active"} />} />
              <ReadonlyField label="Remark" value={String(detail.remark ?? "—")} />
            </>
          ) : (
            <div className="grid gap-3 max-w-lg">
              <div className="space-y-2">
                <Label>{t("columns.origin")}</Label>
                <Select value={form.origin_station_id} onValueChange={(v) => v && setForm((f) => ({ ...f, origin_station_id: v }))}>
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
                <Label>{t("columns.destination")}</Label>
                <Select value={form.destination_station_id} onValueChange={(v) => v && setForm((f) => ({ ...f, destination_station_id: v }))}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("columns.distance")}</Label>
                  <Input type="number" value={form.distance_km} onChange={(e) => setForm((f) => ({ ...f, distance_km: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("columns.transitDays")}</Label>
                  <Input type="number" value={form.transit_days} onChange={(e) => setForm((f) => ({ ...f, transit_days: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tc("table.status")}</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
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
