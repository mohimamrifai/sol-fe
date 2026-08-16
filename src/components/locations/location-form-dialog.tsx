"use client";

import * as React from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save, Loader2, Building2, Phone, Power } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useCreateLocation, useUpdateLocation } from "@/hooks/use-customer-locations-form";
import { AddressFields } from "@/components/shared/address-fields";
import type { LocationRow } from "./location-table";

export interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: LocationRow | null;
}

interface LocationFormValues {
  type: string;
  name: string;
  phone: string;
  status: string;
  pic_name: string;
  pic_email: string;
  pic_mobile: string;
  country: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  address: string;
}

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

export function LocationFormDialog({ open, onOpenChange, row }: LocationFormDialogProps) {
  const t = useTranslations("Locations");
  const isEdit = !!row;
  const create = useCreateLocation();
  const update = useUpdateLocation();
  const mutation = isEdit ? update : create;

  const defaultValues = React.useMemo<LocationFormValues>(() => ({
    type: row?.type ?? "branch_office",
    name: row?.name ?? "",
    phone: row?.phone ?? "",
    status: row?.status ?? "active",
    pic_name: row?.pic_name ?? "",
    pic_email: row?.pic_email ?? "",
    pic_mobile: row?.pic_mobile ?? "",
    country: row?.country ?? "Indonesia",
    province: row?.province ?? "",
    city: row?.city ?? "",
    district: row?.district ?? "",
    postal_code: row?.postal_code ?? "",
    address: row?.address ?? "",
  }), [row]);

  const methods = useForm<LocationFormValues>({ defaultValues });
  const { control, handleSubmit, reset, formState: { errors } } = methods;

  React.useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload: Record<string, unknown> = {
        type: values.type,
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        status: values.status,
        pic_name: values.pic_name.trim() || null,
        pic_email: values.pic_email.trim() || null,
        pic_mobile: values.pic_mobile.trim() || null,
        country: values.country,
        province: values.province,
        city: values.city,
        district: values.district,
        postal_code: values.postal_code,
        address: values.address,
      };
      if (isEdit && row) {
        await update.mutateAsync({ id: row.id, payload });
        toast.success("Location updated.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Location created.");
      }
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Save failed.";
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isEdit ? t("form.title.edit") : t("form.title.create")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t("form.title.edit") : t("form.title.create")}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("form.infoSection")}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={LABEL}>{t("form.type")} <span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="type"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom">
                        <SelectItem value="head_office">{t("type.head_office")}</SelectItem>
                        <SelectItem value="branch_office">{t("type.branch_office")}</SelectItem>
                        <SelectItem value="warehouse">{t("type.warehouse")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={LABEL}>{t("form.name")} <span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: "Required", minLength: { value: 2, message: "Min 2 characters" } }}
                  render={({ field }) => (
                    <Input {...field} className="h-10" placeholder="Location name" />
                  )}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className={LABEL}>{t("form.code")}</Label>
                <Input
                  value={isEdit ? (row?.code ?? "—") : t("form.codeAutoGenerate")}
                  readOnly
                  disabled
                  className="h-10 bg-zinc-50 font-mono text-zinc-500"
                />
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
                    <Input {...field} className="h-10" placeholder="021-XXXXXXX" />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={LABEL}>
                  <Power className="mr-1 inline h-3 w-3" />
                  {t("form.status")}
                </Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom">
                        <SelectItem value="active">{t("status.active")}</SelectItem>
                        <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("form.addressSection")}
              </p>
              <AddressFields namePrefix="" required={true} />
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("form.picSection")}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className={LABEL}>{t("form.picName")} <span className="text-red-500">*</span></Label>
                  <Controller
                    control={control}
                    name="pic_name"
                    rules={{ required: "Required", minLength: { value: 2, message: "Min 2 characters" } }}
                    render={({ field }) => (
                      <Input {...field} className="h-10" placeholder="John Doe" />
                    )}
                  />
                  {errors.pic_name && <p className="text-xs text-red-500">{errors.pic_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL}>{t("form.picEmail")} <span className="text-red-500">*</span></Label>
                  <Controller
                    control={control}
                    name="pic_email"
                    rules={{
                      required: "Required",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                    }}
                    render={({ field }) => (
                      <Input {...field} type="email" className="h-10" placeholder="email@company.com" />
                    )}
                  />
                  {errors.pic_email && <p className="text-xs text-red-500">{errors.pic_email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL}>{t("form.picMobile")} <span className="text-red-500">*</span></Label>
                  <Controller
                    control={control}
                    name="pic_mobile"
                    rules={{ required: "Required", minLength: { value: 6, message: "Min 6 characters" } }}
                    render={({ field }) => (
                      <Input {...field} className="h-10" placeholder="08XXXXXXXXX" />
                    )}
                  />
                  {errors.pic_mobile && <p className="text-xs text-red-500">{errors.pic_mobile.message}</p>}
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
                {t("common.cancel")}
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
