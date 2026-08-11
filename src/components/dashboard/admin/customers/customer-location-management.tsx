"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  changeAdminCompanyLocationStatus,
  createAdminCompanyLocation,
  fetchAdminCompanyLocations,
  updateAdminCompanyLocation,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { ControlledAddressRegionFields } from "@/components/shared/controlled-address-region-fields";

type Props = {
  companyId: number;
  canManage: boolean;
};

const EMPTY_FORM = {
  type: "head_office",
  name: "",
  phone: "",
  country: "Indonesia",
  province: "",
  city: "",
  district: "",
  postal_code: "",
  address: "",
  pic_name: "",
  pic_email: "",
  pic_mobile: "",
};

export function CustomerLocationManagement({ companyId, canManage }: Props) {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCompanyLocations(companyId, { perPage: 100 });
      setRows((res.data as Record<string, unknown>[]) ?? []);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("locations.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditId(Number(row.id));
    setForm({
      type: String(row.type ?? "head_office"),
      name: String(row.name ?? ""),
      phone: String(row.phone ?? ""),
      country: String(row.country ?? "Indonesia"),
      province: String(row.province ?? ""),
      city: String(row.city ?? ""),
      district: String(row.district ?? ""),
      postal_code: String(row.postal_code ?? ""),
      address: String(row.address ?? ""),
      pic_name: String(row.pic_name ?? ""),
      pic_email: String(row.pic_email ?? ""),
      pic_mobile: String(row.pic_mobile ?? ""),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      if (editId) {
        await updateAdminCompanyLocation(companyId, editId, form);
        toast.success(t("locations.updated"));
      } else {
        await createAdminCompanyLocation(companyId, form);
        toast.success(t("locations.created"));
      }
      resetForm();
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("locations.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row: Record<string, unknown>) => {
    if (!canManage) return;
    const id = Number(row.id);
    const current = String(row.status ?? "active");
    const next = current === "active" ? "inactive" : "active";
    try {
      await changeAdminCompanyLocationStatus(companyId, id, next);
      toast.success(t("locations.statusUpdated"));
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("locations.statusFailed"));
    }
  };

  const typeLabel = (type: string) =>
    t(`locationTypes.${type}` as Parameters<typeof t>[0], { defaultValue: type });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("locations.description")}</p>
        {canManage ? (
          <Button size="sm" onClick={openCreate}>
            {t("actions.addLocation")}
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("locations.type")}</Label>
            <Select value={form.type} onValueChange={(v) => v && setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="head_office">{typeLabel("head_office")}</SelectItem>
                <SelectItem value="branch_office">{typeLabel("branch_office")}</SelectItem>
                <SelectItem value="warehouse">{typeLabel("warehouse")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("locations.name")}</Label>
            <Input className="h-9" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("locations.address")}</Label>
            <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <ControlledAddressRegionFields
            className="md:col-span-2"
            idPrefix="loc"
            value={{
              country: form.country,
              province: form.province,
              city: form.city,
              district: form.district,
              postal_code: form.postal_code,
            }}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            showCountry
            showDistrict
            showPostalCode
            labels={{
              country: t("locations.country"),
              province: t("locations.province"),
              city: t("locations.city"),
              district: t("locations.district"),
              postalCode: t("locations.postalCode"),
            }}
          />
          <div className="space-y-2">
            <Label>{t("locations.picName")}</Label>
            <Input className="h-9" value={form.pic_name} onChange={(e) => setForm((f) => ({ ...f, pic_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("locations.picEmail")}</Label>
            <Input className="h-9" type="email" value={form.pic_email} onChange={(e) => setForm((f) => ({ ...f, pic_email: e.target.value }))} />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? tc("actions.saving") : tc("actions.save")}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>
              {tc("actions.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("locations.type")}</TableHead>
              <TableHead>{t("locations.name")}</TableHead>
              <TableHead>{t("locations.code")}</TableHead>
              <TableHead>{tc("table.status")}</TableHead>
              {canManage ? <TableHead className="text-right">{t("users.action")}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-muted-foreground">
                  {tc("actions.loading")}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-muted-foreground">
                  {t("locations.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell>{typeLabel(String(row.type ?? ""))}</TableCell>
                  <TableCell>{String(row.name ?? "—")}</TableCell>
                  <TableCell>{String(row.code ?? "—")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{String(row.status ?? "—")}</Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        {tc("actions.edit")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void toggleStatus(row)}>
                        {t("actions.deactivate")}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
