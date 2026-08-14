"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { changeAdminPassword, fetchAdminProfile, updateAdminProfile } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { customerStatusBadgeClass, customerStatusLabelFromApi } from "@/lib/customer-status";
import { internalRoleLabel } from "@/lib/admin-fsd-options";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminCompanyProfilePage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdSettings");
  const tc = useTranslations("AdminCommon");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("active");
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [featureAccess, setFeatureAccess] = useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;
    void fetchAdminProfile().then((res) => {
      const d = (res as { data: Record<string, unknown> }).data;
      setName(String(d.name ?? ""));
      setEmail(String(d.email ?? ""));
      setPhone(String(d.phone ?? ""));
      setStatus(String(d.status ?? "active"));
      const roles = d.roles as string[] | undefined;
      setRole(roles?.[0] ?? "");
      setLastLoginAt(d.last_login_at ? String(d.last_login_at) : null);
      setCreatedAt(d.created_at ? String(d.created_at) : null);
      const access = d.feature_access as string[] | undefined;
      const perms = d.permissions as string[] | undefined;
      setFeatureAccess(access?.length ? access : (perms ?? []));
    });
  }, [authHydrated]);

  const sortedFeatureAccess = useMemo(
    () => [...featureAccess].sort((a, b) => a.localeCompare(b)),
    [featureAccess]
  );

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateAdminProfile({ name, phone });
      toast.success(t("profile.saved"));
    } catch (e) { toast.error(e instanceof ApiError ? e.message : tc("actions.loading")); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    try {
      await changeAdminPassword({ current_password: currentPassword, password, password_confirmation: passwordConfirmation });
      toast.success(t("profile.passwordSaved"));
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (e) { toast.error(e instanceof ApiError ? e.message : tc("actions.loading")); }
    finally { setSavingPassword(false); }
  };

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={Building2} title={t("profile.title")} description={t("profile.subtitle")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("profile.section")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>{t("profile.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={email} disabled /></div>
            <div className="space-y-2"><Label>{t("profile.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <Button disabled={savingProfile} onClick={() => void saveProfile()}>{savingProfile ? tc("actions.saving") : tc("actions.save")}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("profile.accountSection")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("profile.role")}</span>
              <Badge variant="outline">{internalRoleLabel(role)}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">{tc("table.status")}</span>
              <Badge variant="outline" className={customerStatusBadgeClass(status)}>
                {customerStatusLabelFromApi(status)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("profile.lastLogin")}</span>
              <span>{lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "—"}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("profile.createdDate")}</span>
              <span>{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("profile.accessSection")}</CardTitle></CardHeader>
          <CardContent>
            {sortedFeatureAccess.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("profile.noAccess")}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sortedFeatureAccess.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm">
                    <Checkbox checked disabled />
                    <span>{perm}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("profile.changePassword")}</CardTitle></CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2"><Label>{t("profile.currentPassword")}</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("profile.newPassword")}</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("profile.confirmPassword")}</Label><Input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} /></div>
            <Button disabled={savingPassword} onClick={() => void savePassword()}>{savingPassword ? tc("actions.saving") : t("profile.changePassword")}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
