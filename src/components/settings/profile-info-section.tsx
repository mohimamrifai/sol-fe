"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Save, Loader2, CheckCircle2, User, Mail, Phone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useUpdateMyProfile } from "@/hooks/use-customer-my-profile";

interface ProfileFormValues {
  name: string;
  phone: string;
}

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

export function ProfileInfoSection() {
  const t = useTranslations("Profile");
  const { user, setUser } = useAuthStore();
  const update = useUpdateMyProfile();
  const [saved, setSaved] = React.useState(false);

  const defaultValues = React.useMemo<ProfileFormValues>(() => ({
    name: user?.name ?? "",
    phone: (user?.phone as string) ?? "",
  }), [user]);

  const { control, handleSubmit, reset, formState: { isDirty, errors } } = useForm<ProfileFormValues>({
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  React.useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(id);
  }, [saved]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        name: values.name.trim(),
        phone: values.phone.trim() || undefined,
      });
      if (user) {
        setUser({ ...user, name: values.name.trim(), phone: values.phone.trim() || null });
      }
      toast.success(t("form.saved"));
      setSaved(true);
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Failed to save.";
      toast.error(msg);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <User className="h-4 w-4 text-zinc-600" />
          {t("sections.userInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={LABEL}>
                <Mail className="mr-1 inline h-3 w-3" />
                {t("form.email")}
              </Label>
              <Input value={user?.email ?? ""} disabled className="h-10 bg-zinc-50 text-zinc-500" />
              <p className="text-xs text-zinc-500">{t("form.emailReadonly")}</p>
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL}>{t("form.name")} <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="name"
                rules={{ required: "Required", minLength: { value: 2, message: "Min 2 characters" } }}
                render={({ field }) => (
                  <Input {...field} className="h-10" placeholder="Full Name" />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL}>
                <Phone className="mr-1 inline h-3 w-3" />
                {t("form.phone")}
              </Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input {...field} className="h-10" placeholder="08XXXXXXXXX" />
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved ? (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {t("form.saved")}
              </span>
            ) : null}
            <Button
              type="submit"
              disabled={update.isPending || !isDirty}
              className="h-10 min-w-32 gap-2"
            >
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {update.isPending ? t("form.saving") : t("form.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
