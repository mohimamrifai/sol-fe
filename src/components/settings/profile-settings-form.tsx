"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Save, Loader2, User, Mail, Phone, Camera, Trash2, Lock, ShieldCheck, CheckCircle2, Eye, EyeOff,
  Building2, BadgeCheck, Clock, Calendar, MapPin,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import {
  useCustomerMyProfile,
  useUpdateMyProfile,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
  useChangeMyPassword,
} from "@/hooks/use-customer-my-profile";
import type { AuthUser } from "@/lib/auth-api";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

const FEATURE_KEYS = [
  "view_company", "manage_company",
  "view_locations", "manage_locations",
  "view_users", "create_users", "edit_users",
  "view_bookings", "create_bookings", "manage_bookings",
  "view_shipments", "view_invoices", "view_payments",
  "view_documents", "manage_documents",
];

interface ProfileData {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: string;
  role?: string;
  roles?: Array<{ name: string }>;
  last_login_at?: string | null;
  created_at?: string | null;
  company?: { name?: string };
  locations?: Array<{ id: number; name: string }>;
  location_access?: Array<{ id: number; name: string }>;
  feature_access?: string[];
  profile_photo_url?: string | null;
}

interface FormValues {
  name: string;
  phone: string;
  current_password: string;
  password: string;
  password_confirmation: string;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function ProfileSettingsForm() {
  const t = useTranslations("Profile");
  const tRole = useTranslations("Users.role");
  const tFeature = useTranslations("Users.featureAccess");
  const tStatus = useTranslations("Profile.accountStatus");
  const { user, setUser } = useAuthStore();

  const { data, isLoading, isError } = useCustomerMyProfile();
  const profile = (data?.data ?? null) as ProfileData | null;

  const update = useUpdateMyProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();
  const changePassword = useChangeMyPassword();

  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const defaultValues = React.useMemo<FormValues>(() => ({
    name: profile?.name ?? user?.name ?? "",
    phone: profile?.phone ?? user?.phone ?? "",
    current_password: "",
    password: "",
    password_confirmation: "",
  }), [profile, user]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  React.useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("photo.tooLarge"));
      return;
    }
    setPendingPhoto(file);
    setRemovePhoto(false);
    setPhotoPreview(URL.createObjectURL(file));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const onSubmit = handleSubmit(async (values) => {
    const pwdFields = [values.current_password, values.password, values.password_confirmation];
    const anyPassword = pwdFields.some((v) => v.trim() !== "");
    const allPassword = pwdFields.every((v) => v.trim() !== "");

    if (anyPassword && !allPassword) {
      toast.error(t("password.errors.allRequired"));
      return;
    }
    if (anyPassword && values.password.length < 8) {
      toast.error(t("password.errors.minLength"));
      return;
    }
    if (anyPassword && values.password !== values.password_confirmation) {
      toast.error(t("password.errors.mismatch"));
      return;
    }

    try {
      const res = await update.mutateAsync({
        name: values.name.trim(),
        phone: values.phone.trim() || undefined,
      });

      let nextUser: AuthUser | null = user ? { ...user, name: values.name.trim(), phone: values.phone.trim() || null } : null;

      if (removePhoto) {
        await deletePhoto.mutateAsync();
        if (nextUser) nextUser = { ...nextUser, profile_photo_url: null, profile_photo_path: null };
      } else if (pendingPhoto) {
        const uploaded = await uploadPhoto.mutateAsync(pendingPhoto);
        const url = uploaded?.data?.profile_photo_url ?? nextUser?.profile_photo_url ?? null;
        if (nextUser) nextUser = { ...nextUser, profile_photo_url: url };
        setPendingPhoto(null);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }

      if (anyPassword) {
        await changePassword.mutateAsync({
          current_password: values.current_password,
          password: values.password,
          password_confirmation: values.password_confirmation,
        });
        reset({ ...values, current_password: "", password: "", password_confirmation: "" });
      }

      const updated = (res?.data ?? profile) as ProfileData;
      if (nextUser && updated) {
        setUser({
          ...nextUser,
          name: updated.name ?? nextUser.name,
          phone: updated.phone ?? nextUser.phone,
        });
      }

      setRemovePhoto(false);
      toast.success(anyPassword ? t("form.savedWithPassword") : t("form.saved"));
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422
        ? firstLaravelError(e.body) ?? e.message
        : e instanceof ApiError ? e.message : t("common.error");
      toast.error(msg);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-zinc-500">
        {t("common.error")}
      </div>
    );
  }

  const roleName = profile.role ?? profile.roles?.[0]?.name ?? "";
  const locations = profile.locations ?? profile.location_access ?? [];
  const features = profile.feature_access ?? [];
  const displayPhoto = removePhoto
    ? null
    : photoPreview ?? profile.profile_photo_url ?? user?.profile_photo_url ?? null;
  const initials = (profile.name ?? "?").substring(0, 2).toUpperCase();

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
  };

  const isSaving = update.isPending || uploadPhoto.isPending || deletePhoto.isPending || changePassword.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Section 1 – User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
            <User className="h-4 w-4 text-zinc-600" />
            {t("sections.userInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={LABEL}>{t("form.name")} <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="name"
                rules={{ required: true, minLength: { value: 2, message: "Min 2 characters" } }}
                render={({ field }) => <Input {...field} className="h-10" />}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className={LABEL}>
                <Mail className="mr-1 inline h-3 w-3" />
                {t("form.email")}
              </Label>
              <Input value={profile.email ?? ""} disabled readOnly className="h-10 bg-zinc-50 text-zinc-500" />
              <p className="text-xs text-zinc-500">{t("form.emailReadonly")}</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={LABEL}>
                <Phone className="mr-1 inline h-3 w-3" />
                {t("form.phone")}
              </Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => <Input {...field} className="h-10" placeholder="08XXXXXXXXX" />}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className={LABEL}>{t("photo.title")}</Label>
            <p className="mt-1 text-xs text-zinc-500">{t("photo.hint")}</p>
            <div className="mt-3 flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {displayPhoto ? <AvatarImage src={displayPhoto} alt={profile.name ?? ""} /> : null}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={onPickPhoto}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  className="h-9 gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {t("photo.upload")}
                </Button>
                {(displayPhoto && !removePhoto) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRemovePhoto(true);
                      setPendingPhoto(null);
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
                    }}
                    className="h-9 gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("photo.remove")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 – Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
            <Building2 className="h-4 w-4 text-zinc-600" />
            {t("sections.accountInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: <Building2 className="h-4 w-4 text-zinc-500" />, label: t("account.company"), value: profile.company?.name ?? "—" },
              {
                icon: <ShieldCheck className="h-4 w-4 text-zinc-500" />,
                label: t("account.role"),
                value: roleName ? <Badge variant="secondary">{tRole(roleName as "company_admin" | "ops_pic" | "finance_pic" | "viewer")}</Badge> : "—",
              },
              {
                icon: <BadgeCheck className="h-4 w-4 text-zinc-500" />,
                label: t("account.status"),
                value: profile.status ? (
                  <Badge variant="outline" className={profile.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60" : "bg-zinc-100 text-zinc-600"}>
                    {statusLabel(profile.status)}
                  </Badge>
                ) : "—",
              },
              { icon: <Clock className="h-4 w-4 text-zinc-500" />, label: t("account.lastLogin"), value: <span className="font-mono text-xs">{fmtDate(profile.last_login_at)}</span> },
              { icon: <Calendar className="h-4 w-4 text-zinc-500" />, label: t("account.createdAt"), value: <span className="font-mono text-xs">{fmtDate(profile.created_at)}</span> },
            ].map((row, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2.5">
                <div className="mt-0.5">{row.icon}</div>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-medium text-zinc-500">{row.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-900 break-words">{row.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Section 3 – Access Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
            <MapPin className="h-4 w-4 text-zinc-600" />
            {t("sections.accessInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <p className={LABEL}>{t("access.locations")}</p>
            {locations.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("access.noLocations")}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {locations.map((l) => (
                  <Badge key={l.id} variant="outline" className="text-xs">{l.name}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className={LABEL}>{t("access.features")}</p>
            <div className="grid grid-cols-1 gap-2 rounded-md border bg-zinc-50/50 p-3 sm:grid-cols-2">
              {FEATURE_KEYS.map((key) => {
                const checked = features.includes(key);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} readOnly disabled className="h-4 w-4 rounded border-zinc-300" />
                    <span className="text-xs">{tFeature(key as `featureAccess.${string}`)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 – Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
            <Lock className="h-4 w-4 text-zinc-600" />
            {t("sections.changePassword")}
          </CardTitle>
          <CardDescription className="text-xs">{t("password.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:max-w-md">
          {(["current_password", "password", "password_confirmation"] as const).map((fieldName, idx) => {
            const labels = [t("password.current"), t("password.new"), t("password.confirm")];
            const show = [showCurrent, showNew, showConfirm][idx];
            const setShow = [setShowCurrent, setShowNew, setShowConfirm][idx];
            const icons = [ShieldCheck, Lock, CheckCircle2];
            const Icon = icons[idx];
            return (
              <div key={fieldName} className="space-y-1.5">
                <Label className={LABEL}>
                  <Icon className="mr-1 inline h-3 w-3" />
                  {labels[idx]}
                </Label>
                <div className="relative">
                  <Controller
                    control={control}
                    name={fieldName}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type={show ? "text" : "password"}
                        className="h-10 pr-10"
                        autoComplete={fieldName === "current_password" ? "current-password" : "new-password"}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-0 top-0 h-10 w-10"
                  >
                    {show ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-zinc-500" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} className="h-10 min-w-40 gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  );
}
