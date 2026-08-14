"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  VendorFormSections,
  vendorDetailToForm,
  vendorFormToPayload,
  useVendorForm,
} from "@/components/dashboard/admin/vendor/vendor-form-sections";
import {
  deactivateAdminVendor,
  fetchAdminVendor,
  updateAdminVendor,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { vendorTypesLabel } from "@/lib/vendor-fsd-options";
import { toast } from "sonner";

export default function AdminVendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);
  const listPath = `/${locale}/dashboard/admin/vendor/vendors`;
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { values, onChange, reset } = useVendorForm();

  const refresh = async () => {
    if (!Number.isFinite(id)) return;
    setLoading(true);
    try {
      const res = await fetchAdminVendor(id);
      const d = (res as { data: Record<string, unknown> }).data;
      setDetail(d);
      reset(vendorDetailToForm(d));
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [id]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateAdminVendor(id, vendorFormToPayload(values));
      toast.success("Vendor diperbarui.");
      setEditing(false);
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    try {
      await deactivateAdminVendor(id);
      toast.success("Vendor dinonaktifkan.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menonaktifkan.");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  if (!detail) return <p className="text-sm text-red-600">Vendor tidak ditemukan.</p>;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{String(detail.name ?? "—")}</CardTitle>
            <CardDescription className="mt-1 space-y-1">
              <span className="block font-mono text-xs">{String(detail.code ?? "—")}</span>
              <span className="block">{vendorTypesLabel(detail.vendor_types as string[])}</span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={detail.is_active !== false ? "default" : "secondary"}>
              {detail.is_active !== false ? "Active" : "Inactive"}
            </Badge>
            {!editing ? (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                {detail.is_active !== false ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void deactivate()}>Inactive</Button>
                ) : null}
              </>
            ) : (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(false); reset(vendorDetailToForm(detail)); }}>Batal</Button>
                <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>{saving ? "Menyimpan…" : "Simpan"}</Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <VendorFormSections
          values={values}
          onChange={onChange}
          readonly={!editing}
          vendorCode={String(detail.code ?? "")}
        />
        <Button type="button" variant="outline" onClick={() => router.push(listPath)}>Kembali</Button>
      </CardContent>
    </Card>
  );
}
