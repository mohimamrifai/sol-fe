"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { MasterActiveBadge } from "@/components/shared/master-active-badge";
import { deactivateAdminStation, fetchAdminStation, updateAdminStation } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function MasterStationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/master/station`;
  const t = useTranslations("AdminFsdMaster.station");
  const tc = useTranslations("AdminCommon");

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", province: "", address: "", status: "active", remark: "" });

  const refresh = async () => {
    const res = await fetchAdminStation(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    setForm({
      name: String(d.name ?? ""),
      code: String(d.code ?? ""),
      city: String(d.city ?? ""),
      province: String(d.province ?? ""),
      address: String(d.address ?? ""),
      status: String(d.status ?? "active"),
      remark: String(d.remark ?? ""),
    });
  };

  useEffect(() => {
    void refresh().catch(() => setDetail(null));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminStation(id, form);
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

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={MapPin}
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
                  void deactivateAdminStation(id)
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
              <ReadonlyField label={t("columns.city")} value={String(detail.city ?? "—")} />
              <ReadonlyField label="Province" value={String(detail.province ?? "—")} />
              <ReadonlyField label="Address" value={String(detail.address ?? "—")} />
              <ReadonlyField label={tc("table.status")} value={<MasterActiveBadge active={detail.status === "active"} />} />
              <ReadonlyField label="Remark" value={String(detail.remark ?? "—")} />
            </>
          ) : (
            <div className="grid gap-3 max-w-lg">
              <div className="space-y-2">
                <Label>{t("columns.name")}</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("columns.code")}</Label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("columns.city")}</Label>
                  <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Input value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
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
