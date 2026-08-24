"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import {
  cancelAdminTrainSchedule,
  fetchAdminRoutes,
  fetchAdminTrainSchedule,
  updateAdminTrainSchedule,
} from "@/lib/admin-api";
import { BUSINESS_ENTITY_OPTIONS, TRAIN_SCHEDULE_STATUS_OPTIONS } from "@/lib/admin-fsd-options";
import { ApiError } from "@/lib/api-client";
import { formatDateTimeId } from "@/lib/format";
import type { LaravelPaginated } from "@/lib/types-api";
import { Train } from "lucide-react";
import { useTranslations } from "next-intl";

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function TrainScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/master/train-schedule`;
  const t = useTranslations("AdminFsdMaster.trainSchedule");
  const tc = useTranslations("AdminCommon");

  const statusLabel = (value: string) => {
    const key = value as (typeof TRAIN_SCHEDULE_STATUS_OPTIONS)[number]["value"];
    if (t.has(`statuses.${key}`)) return t(`statuses.${key}` as "statuses.upcoming");
    return value;
  };

  const businessEntityLabel = (value: string) => {
    const key = value as (typeof BUSINESS_ENTITY_OPTIONS)[number]["value"];
    if (t.has(`businessEntities.${key}`)) return t(`businessEntities.${key}` as "businessEntities.company");
    return value;
  };

  const statusFormOptions = useMemo(
    () =>
      TRAIN_SCHEDULE_STATUS_OPTIONS.map((s) => ({
        value: s.value,
        label: t(`statuses.${s.value}` as "statuses.upcoming"),
      })),
    [t]
  );

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [routes, setRoutes] = useState<{ id: number; label: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    train_number: "",
    route_id: "",
    departure_at: "",
    estimated_arrival_at: "",
    max_containers: "",
    status: "upcoming",
    remark: "",
  });

  const refresh = async () => {
    const res = await fetchAdminTrainSchedule(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    setForm({
      train_number: String(d.train_number ?? ""),
      route_id: String(d.route_id ?? ""),
      departure_at: String(d.departure_at ?? "").slice(0, 16),
      estimated_arrival_at: String(d.eta_at ?? d.estimated_arrival_at ?? "").slice(0, 16),
      max_containers: d.max_containers != null ? String(d.max_containers) : "",
      status: String(d.status ?? "upcoming"),
      remark: String(d.remark ?? ""),
    });
  };

  useEffect(() => {
    void refresh().catch(() => setDetail(null));
    void fetchAdminRoutes({ perPage: 500, status: "active" }).then((res) => {
      setRoutes(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({
        id: Number(r.id),
        label: String(r.code ?? r.id),
      })));
    });
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminTrainSchedule(id, {
        train_number: form.train_number,
        route_id: Number(form.route_id),
        departure_at: form.departure_at,
        eta_at: form.estimated_arrival_at,
        max_containers: form.max_containers ? Number(form.max_containers) : undefined,
        status: form.status,
        remark: form.remark || undefined,
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

  const handleCancel = async () => {
    try {
      await cancelAdminTrainSchedule(id);
      toast.success(t("cancelled"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    }
  };

  if (!detail) return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;

  const status = String(detail.status ?? "upcoming");
  const shipments = (detail.assigned_shipments as Record<string, unknown>[] | undefined) ?? [];
  const containers = (detail.assigned_containers as Record<string, unknown>[] | undefined) ?? [];
  const canCancel = status === "upcoming";

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={Train}
        title={String(detail.train_number ?? "—")}
        description={String(detail.route ?? "—")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(basePath)}>
              {tc("actions.back")}
            </Button>
            {!editing ? (
              <Button variant="outline" onClick={() => setEditing(true)}>
                {t("edit")}
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="destructive" onClick={() => void handleCancel()}>
                {t("cancelSchedule")}
              </Button>
            ) : null}
          </div>
        }
      />

      <Badge variant="outline" className="w-fit">
        {statusLabel(status)}
      </Badge>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.general")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!editing ? (
            <>
              <ReadonlyField
                label={t("fields.businessEntity")}
                value={businessEntityLabel(String(detail.business_entity ?? "")) || "—"}
              />
              <ReadonlyField label={t("fields.trainNumber")} value={String(detail.train_number ?? "—")} />
              <ReadonlyField label={t("fields.route")} value={String(detail.route ?? "—")} />
              <ReadonlyField label={t("fields.departure")} value={formatDateTimeId(String(detail.departure_at ?? ""))} />
              <ReadonlyField label={t("fields.eta")} value={formatDateTimeId(String(detail.eta_at ?? detail.estimated_arrival_at ?? ""))} />
              <ReadonlyField label={t("fields.maxContainers")} value={String(detail.max_containers ?? "—")} />
              <ReadonlyField label={t("fields.remark")} value={String(detail.remark ?? "—")} />
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("fields.trainNumber")}</Label>
                <Input value={form.train_number} onChange={(e) => setForm((f) => ({ ...f, train_number: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("fields.route")}</Label>
                <Select value={form.route_id} onValueChange={(v) => v && setForm((f) => ({ ...f, route_id: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("fields.departure")}</Label>
                <Input type="datetime-local" value={form.departure_at} onChange={(e) => setForm((f) => ({ ...f, departure_at: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("fields.eta")}</Label>
                <Input type="datetime-local" value={form.estimated_arrival_at} onChange={(e) => setForm((f) => ({ ...f, estimated_arrival_at: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("fields.maxContainers")}</Label>
                <Input type="number" value={form.max_containers} onChange={(e) => setForm((f) => ({ ...f, max_containers: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{tc("table.status")}</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusFormOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("fields.remark")}</Label>
                <Textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
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

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.shipments")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("detail.shipmentNo")}</TableHead>
                <TableHead>{t("detail.customer")}</TableHead>
                <TableHead>{t("detail.service")}</TableHead>
                <TableHead>{t("detail.container")}</TableHead>
                <TableHead>{tc("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((s) => (
                <TableRow key={String(s.id ?? s.shipment_number)}>
                  <TableCell>
                    {s.id ? (
                      <Link href={`/${locale}/dashboard/admin/customer/shipments/${s.id}`} className="text-primary underline">
                        {String(s.shipment_number ?? s.id)}
                      </Link>
                    ) : (
                      String(s.shipment_number ?? "—")
                    )}
                  </TableCell>
                  <TableCell>{String(s.customer ?? "—")}</TableCell>
                  <TableCell>{String(s.service ?? "—")}</TableCell>
                  <TableCell>{String(s.container ?? "—")}</TableCell>
                  <TableCell>{String(s.status ?? "—")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {shipments.length === 0 ? <p className="text-sm text-muted-foreground">{tc("table.empty")}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.containers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("detail.containerNo")}</TableHead>
                <TableHead>{t("detail.type")}</TableHead>
                <TableHead>{t("detail.shipmentNo")}</TableHead>
                <TableHead>{t("detail.customer")}</TableHead>
                <TableHead>{tc("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((c) => (
                <TableRow key={String(c.id ?? c.container_number)}>
                  <TableCell>{String(c.container_number ?? "—")}</TableCell>
                  <TableCell>{String(c.type ?? "—")}</TableCell>
                  <TableCell>{String(c.shipment_number ?? "—")}</TableCell>
                  <TableCell>{String(c.customer ?? "—")}</TableCell>
                  <TableCell>{String(c.status ?? "—")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {containers.length === 0 ? <p className="text-sm text-muted-foreground">{tc("table.empty")}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
