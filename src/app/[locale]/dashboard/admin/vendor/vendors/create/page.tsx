"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  VendorFormSections,
  vendorFormToPayload,
  useVendorForm,
} from "@/components/dashboard/admin/vendor/vendor-form-sections";
import { createAdminVendor } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";

export default function AdminVendorCreatePage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const listPath = `/${locale}/dashboard/admin/vendor/vendors`;
  const { values, onChange } = useVendorForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (values.vendor_types.length === 0) {
      setError("Pilih minimal satu Vendor Type.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await createAdminVendor(vendorFormToPayload(values));
      const id = (res as { data?: { id?: number } }).data?.id;
      toast.success("Vendor berhasil dibuat.");
      router.push(id ? `${listPath}/${id}` : listPath);
    } catch (e) {
      const msg = e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Vendor</CardTitle>
        <CardDescription>Lengkapi informasi vendor sesuai FSD.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <VendorFormSections values={values} onChange={onChange} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(listPath)}>Batal</Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Menyimpan…" : "Simpan Vendor"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
