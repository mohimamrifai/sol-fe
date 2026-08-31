"use client";

import * as React from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save, Loader2, UserPlus, Edit, Mail, User, Phone, Lock, MapPin, ShieldCheck, ListChecks } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useCreateUser, useUpdateUser } from "@/hooks/use-customer-users-form";
import { fetchAllCustomerLocations } from "@/lib/customer-api";
import type { UserRow } from "./user-table";

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: UserRow | null;
}

interface UserFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  status: string;
  location_ids: number[];
  use_default_features: boolean;
  feature_access: string[];
}

const ROLES = ["company_admin", "ops_pic", "finance_pic", "viewer"];

const FEATURE_KEYS = [
  "view_company", "manage_company",
  "view_locations", "manage_locations",
  "view_users", "create_users", "edit_users",
  "view_bookings", "create_bookings", "manage_bookings",
  "view_shipments", "view_invoices", "view_payments",
  "view_documents", "manage_documents",
];

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

const ROLE_DEFAULT_FEATURES: Record<string, string[]> = {
  company_admin: [
    "view_company", "manage_company",
    "view_locations", "manage_locations",
    "view_users", "create_users", "edit_users",
    "view_bookings", "create_bookings", "manage_bookings",
    "view_shipments", "view_invoices", "view_payments",
    "view_documents", "manage_documents",
  ],
  ops_pic: [
    "view_company", "view_locations",
    "view_bookings", "create_bookings", "view_shipments",
  ],
  finance_pic: [
    "view_company", "view_invoices", "view_payments", "view_documents",
  ],
  viewer: [
    "view_company", "view_locations", "view_users",
    "view_bookings", "view_shipments", "view_invoices", "view_payments",
    "view_documents",
  ],
};

export function UserFormDialog({ open, onOpenChange, row }: UserFormDialogProps) {
  const t = useTranslations("Users");
  const isEdit = !!row;
  const create = useCreateUser();
  const update = useUpdateUser();

  const defaultValues = React.useMemo<UserFormValues>(() => ({
    name: row?.name ?? "",
    email: row?.email ?? "",
    phone: row?.phone ?? "",
    password: "",
    role: row?.role ?? row?.roles?.[0]?.name ?? "ops_pic",
    status: row?.status ?? "active",
    location_ids: row?.location_ids ?? row?.locations?.map((l) => l.id) ?? row?.location_access?.map((l) => l.id) ?? [],
    use_default_features: !row ? true : JSON.stringify(row.feature_access ?? []) === JSON.stringify(ROLE_DEFAULT_FEATURES[row?.role ?? row?.roles?.[0]?.name ?? "ops_pic"] ?? []),
    feature_access: row?.feature_access ?? ROLE_DEFAULT_FEATURES["ops_pic"],
  }), [row]);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserFormValues>({
    defaultValues,
  });

  const role = useWatch({ control, name: "role" }) as string;
  const useDefault = useWatch({ control, name: "use_default_features" }) as boolean;

  React.useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  React.useEffect(() => {
    if (useDefault) {
      setValue("feature_access", ROLE_DEFAULT_FEATURES[role] ?? []);
    }
  }, [role, useDefault, setValue]);

  const [locationOptions, setLocationOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [loadingLocations, setLoadingLocations] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingLocations(true);
    fetchAllCustomerLocations({ status: "active" })
      .then((rows) => {
        if (cancelled) return;
        setLocationOptions(
          rows.map((l) => ({ value: String(l.id), label: (l.name as string) ?? `Location #${l.id}` }))
        );
      })
      .finally(() => !cancelled && setLoadingLocations(false));
    return () => { cancelled = true; };
  }, [open]);

  const onSubmit = handleSubmit(async (values) => {
    if ((values.location_ids?.length ?? 0) < 1) {
      toast.error(t("form.locationAccessRequired"));
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        role: values.role,
        status: values.status,
        location_ids: values.location_ids,
        feature_access: values.feature_access,
      };
      if (isEdit) {
        if (values.password) payload.password = values.password;
      } else {
        payload.email = values.email.trim();
        payload.password = values.password;
      }
      if (isEdit && row) {
        await update.mutateAsync({ id: row.id, payload });
        toast.success("User updated.");
      } else {
        await create.mutateAsync(payload);
        toast.success("User created.");
      }
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Save failed.";
      toast.error(msg);
    }
  });

  const mutation = isEdit ? update : create;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Edit className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isEdit ? t("form.title.edit") : t("form.title.create")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t("form.title.edit") : t("form.title.create")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Section 1 – User Information */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <User className="mr-1 inline h-3 w-3" />
              {t("form.sections.info")}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={LABEL}>
                  {t("form.name")} <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: "Required", minLength: { value: 2, message: "Min 2 characters" } }}
                  render={({ field }) => (
                    <Input {...field} className="h-10" placeholder="John Doe" />
                  )}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className={LABEL}>
                  <Mail className="mr-1 inline h-3 w-3" />
                  {t("form.email")} {!isEdit && <span className="text-red-500">*</span>}
                </Label>
                <Controller
                  control={control}
                  name="email"
                  rules={isEdit ? {} : {
                    required: "Required",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      disabled={isEdit}
                      className="h-10 disabled:bg-zinc-50 disabled:text-zinc-500"
                      placeholder="user@company.com"
                    />
                  )}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                {isEdit ? <p className="text-xs text-zinc-500">{t("form.emailReadonly")}</p> : null}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className={LABEL}>
                  <Phone className="mr-1 inline h-3 w-3" />
                  {t("form.mobileNumber")}
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
          </div>

          {/* Section 2 – Configuration */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <ShieldCheck className="mr-1 inline h-3 w-3" />
              {t("form.sections.configuration")}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={LABEL}>{t("form.role")} <span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="role"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit && row?.is_last_company_admin}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom">
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {t(`role.${r}` as `role.${string}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={LABEL}>{t("form.status")}</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit && (row?.is_last_company_admin || row?.is_current_user)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom">
                        <SelectItem value="active">{t("userStatus.active")}</SelectItem>
                        <SelectItem value="inactive">{t("userStatus.inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL}>
                <MapPin className="mr-1 inline h-3 w-3" />
                {t("form.locationAccess")}
              </Label>
              <Controller
                control={control}
                name="location_ids"
                render={({ field }) => (
                  <div className="rounded-md border bg-zinc-50/50 p-3 max-h-48 overflow-y-auto space-y-1.5">
                    {loadingLocations ? (
                      <p className="text-xs text-zinc-500">Loading locations…</p>
                    ) : locationOptions.length === 0 ? (
                      <p className="text-xs text-zinc-500">No active locations available.</p>
                    ) : (
                      locationOptions.map((opt) => {
                        const id = Number(opt.value);
                        const checked = field.value?.includes(id) ?? false;
                        return (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? Array.from(new Set([...(field.value ?? []), id]))
                                  : (field.value ?? []).filter((x) => x !== id);
                                field.onChange(next);
                              }}
                              className="h-4 w-4 rounded border-zinc-300"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              />
              <p className="text-xs text-zinc-500">{t("form.locationAccessHint")}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className={LABEL}>
                  <ListChecks className="mr-1 inline h-3 w-3" />
                  {t("form.featureAccess")}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{t("form.useDefaultFeatures")}</span>
                  <Controller
                    control={control}
                    name="use_default_features"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
              <Controller
                control={control}
                name="feature_access"
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 rounded-md border bg-zinc-50/50 p-3">
                    {FEATURE_KEYS.map((key) => {
                      const checked = field.value?.includes(key) ?? false;
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={useDefault}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(new Set([...(field.value ?? []), key]))
                                : (field.value ?? []).filter((k) => k !== key);
                              field.onChange(next);
                            }}
                            className="h-4 w-4 rounded border-zinc-300"
                          />
                          <span className="text-xs">{t(`featureAccess.${key}` as `featureAccess.${string}`)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              <p className="text-xs text-zinc-500">{t("form.featureAccessHint")}</p>
            </div>
          </div>

          {/* Section 3 – Security */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Lock className="mr-1 inline h-3 w-3" />
              {t("form.sections.security")}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={LABEL}>
                  {t("form.password")} {!isEdit && <span className="text-red-500">*</span>}
                </Label>
                <Controller
                  control={control}
                  name="password"
                  rules={isEdit ? {
                    minLength: { value: 8, message: "Min 8 characters" },
                  } : {
                    required: "Required",
                    minLength: { value: 8, message: "Min 8 characters" },
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      className="h-10"
                      placeholder={isEdit ? "Leave blank to keep current" : "Min 8 characters"}
                    />
                  )}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                {isEdit ? <p className="text-xs text-zinc-500">{t("form.passwordHint")}</p> : null}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-2">
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mutation.isPending ? t("form.saving") : t("form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
