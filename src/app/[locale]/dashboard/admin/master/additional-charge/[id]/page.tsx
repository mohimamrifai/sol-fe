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
import {
  deactivateAdminAdditionalCharge,
  fetchAdminAdditionalCharge,
  updateAdminAdditionalCharge,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { PackagePlus } from "lucide-react";
import { useTranslations } from "next-intl";

const CATEGORIES = ["handling", "storage", "documentation", "container", "trucking", "rail", "other"];
const PRICING_BASES = ["per_shipment", "per_container", "per_trip", "per_ton", "per_kg", "per_cbm", "per_day", "per_hour", "per_seal", "per_document"];

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function MasterAdditionalChargeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/master/additional-charge`;
  const t = useTranslations("AdminFsdMaster.additionalCharge");
  const tc = useTranslations("AdminCommon");

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    charge_category: "other",
    pricing_basis: "per_shipment",
    description: "",
    is_active: true,
  });

  const refresh = async () => {
    const res = await fetchAdminAdditionalCharge(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    setForm({
      name: String(d.name ?? ""),
      charge_category: String(d.charge_category ?? "other"),
      pricing_basis: String(d.pricing_basis ?? "per_shipment"),
      description: String(d.description ?? ""),
      is_active: d.is_active !== false,
    });
  };

  useEffect(() => {
    void refresh().catch(() => setDetail(null));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminAdditionalCharge(id, form);
      toast.success(t("saved"));
      setEditing(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setSaving(true);
    try {
      await deactivateAdminAdditionalCharge(id);
      toast.success(t("deactivated"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  if (!detail) {
    return <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">{tc("actions.loading")}</div>;
  }

  const activityLog = (detail.activity_log as Array<Record<string, unknown>>) ?? [];

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        title={String(detail.name ?? "")}
        description={String(detail.code ?? "")}
        icon={PackagePlus}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(basePath)}>{tc("actions.back")}</Button>
            {!editing ? (
              <>
                <Button onClick={() => setEditing(true)}>{t("edit")}</Button>
                {detail.is_active !== false ? (
                  <Button variant="outline" disabled={saving} onClick={() => void deactivate()}>{t("deactivate")}</Button>
                ) : null}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>{tc("actions.cancel")}</Button>
                <Button disabled={saving} onClick={() => void save()}>{saving ? tc("actions.saving") : tc("actions.save")}</Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("detail.general")}</CardTitle>
            <MasterActiveBadge active={detail.is_active !== false} />
          </CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label={t("columns.code")} value={<span className="font-mono text-xs">{String(detail.code ?? "—")}</span>} />
            {editing ? (
              <>
                <div className="space-y-2"><Label>{t("columns.name")}</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>{t("columns.category")}</Label>
                  <Select value={form.charge_category} onValueChange={(v) => v && setForm((f) => ({ ...f, charge_category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`categories.${c}` as "categories.other")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("columns.pricingBasis")}</Label>
                  <Select value={form.pricing_basis} onValueChange={(v) => v && setForm((f) => ({ ...f, pricing_basis: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRICING_BASES.map((p) => <SelectItem key={p} value={p}>{t(`pricingBasis.${p}` as "pricingBasis.per_shipment")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>{t("fields.description")}</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              </>
            ) : (
              <>
                <ReadonlyField label={t("columns.name")} value={String(detail.name ?? "—")} />
                <ReadonlyField label={t("columns.category")} value={String(detail.charge_category_label ?? detail.charge_category ?? "—")} />
                <ReadonlyField label={t("columns.pricingBasis")} value={String(detail.pricing_basis_label ?? detail.pricing_basis ?? "—")} />
                <ReadonlyField label={t("fields.description")} value={String(detail.description ?? "—")} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("detail.activityLog")}</CardTitle></CardHeader>
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
