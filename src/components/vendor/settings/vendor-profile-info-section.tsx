"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, CheckCircle2, Mail, Phone, User } from "lucide-react";
import { useUpdateVendorMyProfile, useVendorMyProfile } from "@/hooks/use-vendor-my-profile";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

export function VendorProfileInfoSection() {
  const t = useTranslations("Vendor.settings.sections");
  const tF = useTranslations("Vendor.settings.fields");
  const { data } = useVendorMyProfile();
  const update = useUpdateVendorMyProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const user = data?.data;

  // Initialize once data is loaded
  useState(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  });
  if (user && !name && !phone && user.name) {
    setName(user.name);
    setPhone(user.phone ?? "");
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ name: name.trim(), phone: phone.trim() || undefined });
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profil berhasil diperbarui.");
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422
        ? firstLaravelError(e.body) ?? e.message
        : e instanceof ApiError ? e.message : "Gagal menyimpan.";
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-zinc-600" />
          {t("userInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={LABEL}>
                <Mail className="mr-1 inline h-3 w-3" /> Email
              </Label>
              <Input value={user?.email ?? ""} disabled className="h-10 bg-zinc-50 text-zinc-500" />
              <p className="text-xs text-zinc-500">Email tidak dapat diubah.</p>
            </div>
            <div className="space-y-1.5">
              <Label className={LABEL}>Nama *</Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setDirty(true); }}
                className="h-10"
                placeholder={tF("fullName")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={LABEL}>
                <Phone className="mr-1 inline h-3 w-3" /> Phone
              </Label>
              <Input
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setDirty(true); }}
                className="h-10"
                placeholder="08XXXXXXXXX"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            {saved ? (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Tersimpan
              </span>
            ) : null}
            <Button type="submit" disabled={update.isPending || !dirty} className="h-10 min-w-32 gap-2">
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {update.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
