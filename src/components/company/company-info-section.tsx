"use client";

import * as React from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save, Loader2, CheckCircle2, Building2, Mail, Phone, Globe, Hash, MapPin, Briefcase, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useUpdateCustomerCompany } from "@/hooks/use-update-customer-company";
import { AddressFields } from "@/components/shared/address-fields";
import { CompanyLogoField } from "@/components/company/company-logo-field";

export interface CompanyData {
  id: number;
  name?: string;
  company_code?: string;
  business_entity_type?: string;
  npwp?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string | null;
  business_category?: string;
  monthly_shipment_estimate?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  address?: string;
  status?: string;
  billing_cycle?: string;
}

interface Props {
  company: CompanyData;
  onSaved?: () => void;
}

interface CompanyFormValues {
  name: string;
  npwp: string;
  email: string;
  phone: string;
  website: string;
  business_category: string;
  monthly_shipment_estimate: string;
  country: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  address: string;
}

const labelCls = "text-xs font-semibold uppercase tracking-wider text-zinc-500";
const readonlyInputCls = "h-10 bg-zinc-50 text-zinc-500";

export function CompanyInfoSection({ company, onSaved }: Props) {
  const t = useTranslations("Company");
  const update = useUpdateCustomerCompany();
  const [saved, setSaved] = React.useState(false);

  const defaultValues = React.useMemo<CompanyFormValues>(
    () => ({
      name: company.name ?? "",
      npwp: company.npwp ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
      website: company.website ?? "",
      business_category: company.business_category ?? "",
      monthly_shipment_estimate: company.monthly_shipment_estimate ?? "",
      country: company.country ?? "Indonesia",
      province: company.province ?? "",
      city: company.city ?? "",
      district: company.district ?? "",
      postal_code: company.postal_code ?? "",
      address: company.address ?? "",
    }),
    [company]
  );

  const methods = useForm<CompanyFormValues>({ defaultValues });
  const { control, handleSubmit, reset, formState: { isDirty, errors } } = methods;

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
        npwp: values.npwp.trim() || null,
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        website: values.website.trim() || null,
        business_category: values.business_category || null,
        monthly_shipment_estimate: values.monthly_shipment_estimate || null,
        country: values.country,
        province: values.province,
        city: values.city,
        district: values.district,
        postal_code: values.postal_code,
        address: values.address,
      });
      toast.success(t("form.saved"));
      setSaved(true);
      onSaved?.();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Failed to update company.";
      toast.error(msg);
    }
  });

  const businessCategoryOptions = ["trading", "manufacturing", "retail", "distributor", "e_commerce", "logistics", "others"];
  const monthlyEstimateOptions = ["under_10", "10_to_50", "50_to_100", "over_100"];

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-600" />
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
                {t("sections.companyInfo")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={labelCls}>{t("form.businessEntity")}</Label>
                <Input
                  value={company.business_entity_type ?? "—"}
                  readOnly
                  disabled
                  className={readonlyInputCls}
                />
                <p className="text-xs text-zinc-500">{t("form.readonlyHint")}</p>
              </div>

              <CompanyLogoField logoUrl={company.logo_url} onUpdated={onSaved} />

              <div className="space-y-1.5">
                <Label className={labelCls}>{t("form.name")} <span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: "Required", minLength: { value: 2, message: "Min 2 characters" } }}
                  render={({ field }) => (
                    <Input {...field} placeholder="PT Example Indonesia" className="h-10" />
                  )}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Hash className="mr-1 inline h-3 w-3" />
                  {t("form.companyCode")}
                </Label>
                <Input
                  value={company.company_code ?? "—"}
                  readOnly
                  disabled
                  className={`${readonlyInputCls} font-mono`}
                />
                <p className="text-xs text-zinc-500">{t("form.readonlyHint")}</p>
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>{t("form.npwp")}</Label>
                <Controller
                  control={control}
                  name="npwp"
                  render={({ field }) => (
                    <Input {...field} placeholder="XX.XXX.XXX.X-XXX.XXX" className="h-10 font-mono" />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Mail className="mr-1 inline h-3 w-3" />
                  {t("form.email")}
                </Label>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email format",
                    },
                  }}
                  render={({ field }) => (
                    <Input {...field} type="email" placeholder="info@company.com" className="h-10" />
                  )}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Phone className="mr-1 inline h-3 w-3" />
                  {t("form.phone")}
                </Label>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <Input {...field} placeholder="021-XXXXXXX" className="h-10" />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Globe className="mr-1 inline h-3 w-3" />
                  {t("form.website")}
                </Label>
                <Controller
                  control={control}
                  name="website"
                  rules={{
                    pattern: {
                      value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/,
                      message: "Invalid URL",
                    },
                  }}
                  render={({ field }) => (
                    <Input {...field} placeholder="https://company.com" className="h-10" />
                  )}
                />
                {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-600" />
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
                {t("sections.companyAddress")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AddressFields namePrefix="" required />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-zinc-600" />
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
                {t("sections.operationalInformation")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={labelCls}>{t("form.businessCategory")}</Label>
                <Controller
                  control={control}
                  name="business_category"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select">
                          {field.value
                            ? t(`businessCategory.${field.value}` as `businessCategory.${string}`)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent side="bottom">
                        {businessCategoryOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {t(`businessCategory.${opt}` as `businessCategory.${string}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <BarChart3 className="mr-1 inline h-3 w-3" />
                  {t("form.monthlyShipmentEstimate")}
                </Label>
                <Controller
                  control={control}
                  name="monthly_shipment_estimate"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select">
                          {field.value
                            ? t(`monthlyEstimate.${field.value}` as `monthlyEstimate.${string}`)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent side="bottom">
                        {monthlyEstimateOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {t(`monthlyEstimate.${opt}` as `monthlyEstimate.${string}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
            {update.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {update.isPending ? t("form.saving") : t("form.save")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
