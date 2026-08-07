"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { useChangeVendorPassword } from "@/hooks/use-vendor-my-profile";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

export function VendorProfilePasswordSection() {
  const t = useTranslations("Vendor.settings.sections");
  const mutate = useChangeVendorPassword();
  const [current, setCurrent] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("Password baru minimal 8 karakter.");
      return;
    }
    if (pwd !== confirm) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    try {
      await mutate.mutateAsync({
        current_password: current,
        new_password: pwd,
        new_password_confirmation: confirm,
      });
      toast.success("Password berhasil diganti.");
      setCurrent(""); setPwd(""); setConfirm("");
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422
        ? firstLaravelError(e.body) ?? e.message
        : e instanceof ApiError ? e.message : "Gagal mengganti password.";
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-zinc-600" />
          {t("password")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className={LABEL}>Current Password</Label>
            <Input
              type={show ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="h-10"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={LABEL}>New Password *</Label>
              <Input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className={LABEL}>Confirm New Password *</Label>
              <Input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-10"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {show ? "Sembunyikan" : "Tampilkan"}
            </button>
            <Button type="submit" disabled={mutate.isPending || !current || !pwd || !confirm} className="h-10 gap-2">
              {mutate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {mutate.isPending ? "Menyimpan…" : "Ganti Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
