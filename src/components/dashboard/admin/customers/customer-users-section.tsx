"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
  changeAdminUserStatus,
  fetchAdminCompanyLocations,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";

const CUSTOMER_ROLES = [
  { value: "company_admin", label: "Company Admin" },
  { value: "ops_pic", label: "Ops PIC" },
  { value: "finance_pic", label: "Finance PIC" },
  { value: "viewer", label: "Viewer" },
];

const FEATURE_KEYS = [
  "view_company", "manage_company",
  "view_locations", "manage_locations",
  "view_users", "create_users", "edit_users",
  "view_bookings", "create_bookings", "manage_bookings",
  "view_shipments", "view_invoices", "view_payments",
  "view_documents", "manage_documents",
];

const ROLE_DEFAULT_FEATURES: Record<string, string[]> = {
  company_admin: [
    "view_company", "manage_company",
    "view_locations", "manage_locations",
    "view_users", "create_users", "edit_users",
    "view_bookings", "create_bookings", "manage_bookings",
    "view_shipments", "view_invoices", "view_payments",
    "view_documents", "manage_documents",
  ],
  ops_pic: [
    "view_company", "view_locations",
    "view_bookings", "create_bookings",
    "view_shipments",
  ],
  finance_pic: [
    "view_company",
    "view_invoices", "view_payments",
    "view_documents",
  ],
  viewer: [
    "view_company",
    "view_locations",
    "view_users",
    "view_bookings",
    "view_shipments",
    "view_invoices", "view_payments",
    "view_documents",
  ],
};

type Props = {
  companyId: number;
  users: Record<string, unknown>[];
  canManage: boolean;
  onRefresh: () => void;
};

export function CustomerUsersSection({ companyId, users, canManage, onRefresh }: Props) {
  const t = useTranslations("AdminCustomers");
  const tFeature = useTranslations("Users.featureAccess");
  const tc = useTranslations("AdminCommon");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("company_admin");
  const [status, setStatus] = useState("active");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [locationOptions, setLocationOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [useDefaultFeatures, setUseDefaultFeatures] = useState(true);
  const [featureAccess, setFeatureAccess] = useState<string[]>(ROLE_DEFAULT_FEATURES.company_admin);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingLocations(true);
    void fetchAdminCompanyLocations(companyId, { perPage: 200 })
      .then((res) => {
        if (cancelled) return;
        const rows = ((res as LaravelPaginated<Record<string, unknown>>).data ?? []) as Record<string, unknown>[];
        setLocationOptions(
          rows.map((row) => ({
            id: Number(row.id),
            label: `${String(row.name ?? row.id)}${row.code ? ` (${String(row.code)})` : ""}`,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setLocationOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLocations(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, companyId]);

  useEffect(() => {
    if (useDefaultFeatures) {
      setFeatureAccess(ROLE_DEFAULT_FEATURES[role] ?? []);
    }
  }, [role, useDefaultFeatures]);

  const reset = () => {
    setEditId(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("company_admin");
    setStatus("active");
    setPassword("");
    setLocationIds([]);
    setUseDefaultFeatures(true);
    setFeatureAccess(ROLE_DEFAULT_FEATURES.company_admin);
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (user: Record<string, unknown>) => {
    setEditId(Number(user.id));
    setName(String(user.name ?? ""));
    setEmail(String(user.email ?? ""));
    setPhone(String(user.phone ?? ""));
    const roles = user.roles as { name?: string }[] | undefined;
    const nextRole = roles?.[0]?.name ?? "company_admin";
    setRole(nextRole);
    setStatus(String(user.status ?? "active"));
    setPassword("");
    const locs = (user.location_access ?? user.locationAccess) as Array<{ id?: number }> | undefined;
    setLocationIds(Array.isArray(locs) ? locs.map((l) => Number(l.id)).filter((id) => Number.isFinite(id)) : []);
    const features = user.feature_access as string[] | undefined;
    const defaults = ROLE_DEFAULT_FEATURES[nextRole] ?? [];
    const hasCustom = Array.isArray(features) && JSON.stringify([...features].sort()) !== JSON.stringify([...defaults].sort());
    setUseDefaultFeatures(!hasCustom);
    setFeatureAccess(Array.isArray(features) && features.length > 0 ? features : defaults);
    setOpen(true);
  };

  const toggleLocation = (id: number, checked: boolean) => {
    setLocationIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const toggleFeature = (key: string, checked: boolean) => {
    setFeatureAccess((prev) => (checked ? [...prev, key] : prev.filter((f) => f !== key)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
        status,
        location_ids: locationIds,
        feature_access: featureAccess,
      };
      if (editId) {
        if (password.trim()) payload.password = password.trim();
        await updateAdminUser(editId, payload);
        toast.success(t("users.updated"));
      } else {
        await createAdminUser({
          ...payload,
          password: password.trim(),
          user_type: "customer",
          company_id: companyId,
        });
        toast.success(t("users.created"));
      }
      setOpen(false);
      reset();
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("users.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: Record<string, unknown>) => {
    const uid = Number(user.id);
    const next = String(user.status) === "active" ? "inactive" : "active";
    try {
      await changeAdminUserStatus(uid, next);
      toast.success(t("users.statusUpdated"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("users.statusFailed"));
    }
  };

  const resetPassword = async (user: Record<string, unknown>) => {
    const pwd = prompt(t("users.resetPasswordPrompt"));
    if (!pwd || pwd.length < 8) return;
    const confirm = prompt(t("users.resetPasswordConfirm"));
    if (pwd !== confirm) {
      toast.error(t("users.passwordMismatch"));
      return;
    }
    try {
      await resetAdminUserPassword(Number(user.id), pwd, confirm);
      toast.success(t("users.passwordReset"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("users.passwordResetFailed"));
    }
  };

  const removeUser = async (user: Record<string, unknown>) => {
    if (!confirm(t("users.deleteConfirm"))) return;
    try {
      await deleteAdminUser(Number(user.id));
      toast.success(t("users.deleted"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("users.deleteFailed"));
    }
  };

  const locationAccessLabel = (user: Record<string, unknown>) => {
    const locs = (user.location_access ?? user.locationAccess) as Array<{ code?: string; name?: string }> | undefined;
    if (!Array.isArray(locs) || locs.length === 0) return t("users.allLocations");
    return locs.map((l) => l.code ?? l.name).filter(Boolean).join(", ");
  };

  const featureAccessLabel = (user: Record<string, unknown>) => {
    const features = user.feature_access as string[] | undefined;
    if (!Array.isArray(features) || features.length === 0) return "—";
    if (features.length <= 3) {
      return features
        .map((f) => (FEATURE_KEYS.includes(f) ? tFeature(f as `featureAccess.${string}`) : f))
        .join(", ");
    }
    return t("users.featureCount", { count: features.length });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("users.description")}</p>
        {canManage ? (
          <Button size="sm" onClick={openCreate}>
            {t("users.addUser")}
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.name")}</TableHead>
              <TableHead>{t("users.email")}</TableHead>
              <TableHead>{t("users.role")}</TableHead>
              <TableHead>{t("users.locationAccess")}</TableHead>
              <TableHead>{t("users.featureAccess")}</TableHead>
              <TableHead>{tc("table.status")}</TableHead>
              {canManage ? <TableHead className="text-right">{t("users.action")}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-muted-foreground">
                  {t("users.empty")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={String(user.id)}>
                  <TableCell className="font-medium">{String(user.name ?? "—")}</TableCell>
                  <TableCell>{String(user.email ?? "—")}</TableCell>
                  <TableCell>
                    {((user.roles as { name?: string }[]) ?? []).map((r) => r.name).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-xs">{locationAccessLabel(user)}</TableCell>
                  <TableCell className="text-xs">{featureAccessLabel(user)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{String(user.status ?? "—")}</Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                        {tc("actions.edit")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void resetPassword(user)}>
                        {t("users.resetPassword")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void toggleStatus(user)}>
                        {String(user.status) === "active" ? t("users.deactivate") : t("users.activate")}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => void removeUser(user)}>
                        {tc("actions.delete")}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? t("users.editUser") : t("users.addUser")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t("users.name")}</Label>
              <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.email")}</Label>
              <Input className="h-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!editId} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.mobile")}</Label>
              <Input className="h-9" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.role")}</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <Label>{t("users.locationAccess")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("users.locationAccessHint")}
              </p>
              {loadingLocations ? (
                <p className="text-xs text-muted-foreground">{tc("actions.loading")}</p>
              ) : locationOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("users.noLocations")}</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {locationOptions.map((loc) => (
                    <label key={loc.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={locationIds.includes(loc.id)}
                        onCheckedChange={(checked) => toggleLocation(loc.id, checked === true)}
                      />
                      <span>{loc.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <Label>{t("users.featureAccess")}</Label>
                <div className="flex items-center gap-2 text-xs">
                  <span>{t("users.useRoleDefault")}</span>
                  <Switch checked={useDefaultFeatures} onCheckedChange={setUseDefaultFeatures} />
                </div>
              </div>
              {!useDefaultFeatures ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {FEATURE_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={featureAccess.includes(key)}
                        onCheckedChange={(checked) => toggleFeature(key, checked === true)}
                      />
                      <span>{tFeature(key as `featureAccess.${string}`)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {featureAccess.length} {t("users.permissionsEnabled")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{editId ? t("users.passwordNew") : t("users.passwordTemp")}</Label>
              <Input className="h-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc("actions.cancel")}</Button>
            <Button disabled={saving || !name.trim() || !email.trim() || (!editId && password.length < 8)} onClick={() => void save()}>
              {saving ? tc("actions.saving") : tc("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
