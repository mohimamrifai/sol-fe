"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminActivityLogSection } from "@/components/dashboard/admin/shared/admin-activity-log-section";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useAuthStore } from "@/lib/store";
import {
  fetchAdminSystemSettings,
  testAdminSystemEmail,
  updateAdminSystemSettings,
  type SystemSettingField,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { Mail, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

const GROUP_LABELS: Record<string, string> = {
  general: "General Configuration",
  booking: "Booking Configuration",
  finance: "Finance Configuration",
  integration: "Integration",
  email: "Email Configuration",
};

export default function AdminSystemConfigurationPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const isSuperAdmin = authHydrated && roles.includes("super_admin");
  const t = useTranslations("AdminFsdSettings");
  const tc = useTranslations("AdminCommon");
  const [schema, setSchema] = useState<SystemSettingField[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [activityLog, setActivityLog] = useState<Array<Record<string, unknown>>>([]);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");

  useEffect(() => {
    if (!authHydrated || !isSuperAdmin) return;
    void fetchAdminSystemSettings().then((res) => {
      setSchema(res.data.schema ?? []);
      setValues(res.data.values ?? {});
      setActivityLog((res.data.activity_log as Array<Record<string, unknown>>) ?? []);
    });
  }, [authHydrated, isSuperAdmin]);

  const groups = useMemo(
    () => Array.from(new Set(schema.map((field) => field.group))),
    [schema]
  );

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateAdminSystemSettings({
        settings: schema.map((field) => ({
          key: field.key,
          value: values[field.key] ?? null,
          group: field.group,
        })),
      }) as Awaited<ReturnType<typeof fetchAdminSystemSettings>>;
      setSchema(res.data.schema ?? []);
      setValues(res.data.values ?? {});
      setActivityLog((res.data.activity_log as Array<Record<string, unknown>>) ?? []);
      toast.success(t("system.saved"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    if (!testRecipient) return;
    setTestingEmail(true);
    try {
      await testAdminSystemEmail(testRecipient);
      toast.success(t("system.testEmailSuccess"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("system.testEmailError"));
    } finally {
      setTestingEmail(false);
    }
  };

  const renderField = (field: SystemSettingField) => {
    const value = values[field.key];
    const setValue = (next: unknown) => setValues((prev) => ({ ...prev, [field.key]: next }));

    if (field.type === "boolean") {
      return (
        <div key={field.key} className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id={field.key}
            checked={Boolean(value)}
            onCheckedChange={(checked) => setValue(Boolean(checked))}
          />
          <Label htmlFor={field.key}>{field.label}</Label>
        </div>
      );
    }

    if (field.type === "select") {
      const options = field.options ?? [];
      const entries = Array.isArray(options)
        ? options.map((option) => [option, option] as const)
        : Object.entries(options);

      return (
        <div key={field.key} className="space-y-2">
          <Label>{field.label}</Label>
          <Select value={String(value ?? "")} onValueChange={(v) => v && setValue(v)}>
            <SelectTrigger><SelectValue placeholder={field.label} /></SelectTrigger>
            <SelectContent>
              {entries.map(([optionValue, optionLabel]) => (
                <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-2">
        <Label>{field.label}</Label>
        <Input
          type={field.type === "password" ? "password" : field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
          value={value == null ? "" : String(value)}
          onChange={(e) => setValue(field.type === "number" ? Number(e.target.value) : e.target.value)}
        />
      </div>
    );
  };

  if (!authHydrated) {
    return null;
  }

  if (!isSuperAdmin) {
    return <p className="text-sm text-muted-foreground">{t("system.restricted")}</p>;
  }

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={SlidersHorizontal}
        title={t("system.title")}
        description={t("system.subtitle")}
        actions={
          <Button disabled={saving || schema.length === 0} onClick={() => void save()}>
            {saving ? tc("actions.saving") : tc("actions.save")}
          </Button>
        }
      />
      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group}>
            <CardHeader><CardTitle>{GROUP_LABELS[group] ?? group}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {schema.filter((field) => field.group === group).map(renderField)}
              {group === "email" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("system.testEmailRecipient")}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      className="max-w-sm"
                      type="email"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      placeholder="admin@example.com"
                    />
                    <Button type="button" variant="outline" disabled={testingEmail || !testRecipient} onClick={() => void testEmail()}>
                      <Mail className="mr-2 h-4 w-4" />
                      {testingEmail ? t("system.testingEmail") : t("system.testEmail")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {schema.length === 0 ? <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p> : null}
      </div>
      <AdminActivityLogSection entries={activityLog as Array<{ description?: string; user?: string; occurred_at?: string }>} />
    </div>
  );
}
