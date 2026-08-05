"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useChangeMyPassword } from "@/hooks/use-customer-my-profile";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

export function ProfilePasswordSection() {
  const t = useTranslations("Profile");
  const change = useChangeMyPassword();
  const [form, setForm] = React.useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const submit = async () => {
    if (form.next.length < 8) {
      toast.error(t("password.errors.minLength"));
      return;
    }
    if (form.next !== form.confirm) {
      toast.error(t("password.errors.mismatch"));
      return;
    }
    try {
      await change.mutateAsync({
        current_password: form.current,
        password: form.next,
        password_confirmation: form.confirm,
      });
      toast.success(t("password.changed"));
      setForm({ current: "", next: "", confirm: "" });
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Failed.";
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <Lock className="h-4 w-4 text-zinc-600" />
          {t("sections.changePassword")}
        </CardTitle>
        <CardDescription className="text-xs">Ensure your new password is at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:max-w-md">
          <div className="space-y-1.5">
            <Label className={LABEL}>
              <ShieldCheck className="mr-1 inline h-3 w-3" />
              {t("password.current")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={form.current}
                onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowCurrent((s) => !s)}
                className="absolute right-0 top-0 h-10 w-10"
              >
                {showCurrent ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-zinc-500" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>
              <Lock className="mr-1 inline h-3 w-3" />
              {t("password.new")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showNext ? "text" : "password"}
                value={form.next}
                onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowNext((s) => !s)}
                className="absolute right-0 top-0 h-10 w-10"
              >
                {showNext ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-zinc-500" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              {t("password.confirm")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-0 top-0 h-10 w-10"
              >
                {showConfirm ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-zinc-500" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={() => void submit()}
            disabled={change.isPending || !form.current || !form.next || !form.confirm}
            className="h-10 gap-2"
          >
            {change.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {change.isPending ? t("password.submitting") : t("password.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
