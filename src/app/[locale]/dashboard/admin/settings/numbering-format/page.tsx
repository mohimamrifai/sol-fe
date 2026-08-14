"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminActivityLogSection } from "@/components/dashboard/admin/shared/admin-activity-log-section";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import {
  fetchAdminNumberingFormat,
  fetchAdminNumberingFormats,
  previewAdminNumberingFormat,
  updateAdminNumberingFormat,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { Hash } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminNumberingFormatPage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdSettings");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [activityLog, setActivityLog] = useState<Array<Record<string, unknown>>>([]);
  const [prefix, setPrefix] = useState("");
  const [runningDigits, setRunningDigits] = useState("5");
  const [separator, setSeparator] = useState("-");
  const [resetPeriod, setResetPeriod] = useState("never");
  const [livePreview, setLivePreview] = useState("—");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;
    void fetchAdminNumberingFormats().then((res) => setRows((res as { data: Record<string, unknown>[] }).data ?? []));
  }, [authHydrated]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setActivityLog([]);
      return;
    }
    void fetchAdminNumberingFormat(selectedId).then((res) => {
      const d = (res as { data: Record<string, unknown> }).data;
      setDetail(d);
      setActivityLog((d.activity_log as Array<Record<string, unknown>>) ?? []);
      setPrefix(String(d.prefix ?? ""));
      setRunningDigits(String(d.running_digits ?? "5"));
      setSeparator(String(d.separator ?? "-"));
      setResetPeriod(String(d.reset_period ?? "never"));
      setLivePreview(String(d.preview ?? "—"));
    });
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      void previewAdminNumberingFormat({
        prefix,
        running_digits: Number(runningDigits),
        separator,
        reset_period: resetPeriod,
      })
        .then((res) => setLivePreview(res.preview))
        .catch(() => setLivePreview("—"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [selectedId, prefix, runningDigits, separator, resetPeriod]);

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await updateAdminNumberingFormat(selectedId, {
        prefix,
        running_digits: Number(runningDigits),
        separator,
        reset_period: resetPeriod,
      });
      toast.success(t("numbering.saved"));
      const updated = (res as { data: Record<string, unknown> }).data;
      setDetail(updated);
      setActivityLog((updated.activity_log as Array<Record<string, unknown>>) ?? []);
      setLivePreview(String(updated.preview ?? livePreview));
      const listRes = await fetchAdminNumberingFormats();
      setRows((listRes as { data: Record<string, unknown>[] }).data ?? []);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  const resetLabel = useMemo(
    () => ({ never: "Never", monthly: "Monthly", yearly: "Yearly" } as Record<string, string>),
    []
  );

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={Hash} title={t("numbering.title")} description={t("numbering.subtitle")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("numbering.listTitle")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("numbering.columns.type")}</TableHead>
                  <TableHead>{t("numbering.columns.prefix")}</TableHead>
                  <TableHead>{t("numbering.columns.runningDigits")}</TableHead>
                  <TableHead>{t("numbering.columns.reset")}</TableHead>
                  <TableHead>{t("numbering.columns.lastNumber")}</TableHead>
                  <TableHead>{t("numbering.columns.preview")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={String(r.id)} className="cursor-pointer" onClick={() => setSelectedId(Number(r.id))}>
                    <TableCell className="font-medium">{String(r.document_type ?? "—")}</TableCell>
                    <TableCell>{String(r.prefix ?? "—")}</TableCell>
                    <TableCell>{String(r.running_digits ?? "—")}</TableCell>
                    <TableCell>{resetLabel[String(r.reset_period ?? "")] ?? String(r.reset_period ?? "—")}</TableCell>
                    <TableCell className="tabular-nums">{String(r.last_number ?? 0)}</TableCell>
                    <TableCell className="font-mono text-xs">{String(r.preview ?? "—")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t("numbering.editTitle")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!detail ? (
                <p className="text-sm text-muted-foreground">{t("numbering.selectHint")}</p>
              ) : (
                <>
                  <div className="space-y-2"><Label>{t("numbering.columns.type")}</Label><Input value={String(detail.document_type ?? "")} disabled /></div>
                  <div className="space-y-2"><Label>Prefix</Label><Input value={prefix} onChange={(e) => setPrefix(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Running Digits</Label><Input type="number" value={runningDigits} onChange={(e) => setRunningDigits(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Separator</Label>
                    <Select value={separator} onValueChange={(v) => v && setSeparator(v)}>
                      <SelectTrigger><SelectValue placeholder="Separator">{separator}</SelectValue></SelectTrigger>
                      <SelectContent><SelectItem value="-">-</SelectItem><SelectItem value="/">/</SelectItem><SelectItem value="none">none</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reset Period</Label>
                    <Select value={resetPeriod} onValueChange={(v) => v && setResetPeriod(v)}>
                      <SelectTrigger><SelectValue placeholder="Reset">{resetPeriod}</SelectValue></SelectTrigger>
                      <SelectContent><SelectItem value="never">never</SelectItem><SelectItem value="monthly">monthly</SelectItem><SelectItem value="yearly">yearly</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("numbering.lastRunningNumber")}</Label>
                    <Input value={String(detail.last_number ?? 0)} disabled />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("numbering.preview")}: <span className="font-mono">{livePreview}</span>
                  </p>
                  <Button disabled={saving} onClick={() => void save()}>{saving ? tc("actions.saving") : tc("actions.save")}</Button>
                </>
              )}
            </CardContent>
          </Card>
          {detail ? (
            <AdminActivityLogSection entries={activityLog as Array<{ description?: string; user?: string; occurred_at?: string }>} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
