"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRegisterSchema, type RegisterSchema } from "@/lib/validations/auth";
import { registerCompanyRequest } from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const t = useTranslations("Register");
  const BUSINESS_ENTITY_OPTIONS = useMemo(
    () => [
      { value: "PT", label: "PT" },
      { value: "CV", label: "CV" },
      { value: "Firma", label: "Firma" },
      { value: "UD", label: "UD" },
      { value: "Koperasi", label: "Koperasi" },
      { value: "Yayasan", label: "Yayasan" },
      { value: "Lainnya", label: t("otherEntityType") },
    ],
    [t]
  );
  
  // Use a state to trigger schema updates when locale changes (implicitly handled by re-render)
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(createRegisterSchema((key) => t(key))),
    defaultValues: {
      accountType: "company",
      companyEntityType: "PT",
      companyName: "",
      companyCode: "",
      companyNpwp: "",
      companyNib: "",
      companyAddress: "",
      companyCity: "",
      companyProvince: "",
      companyPostalCode: "",
      companyEmail: "",
      companyPhone: "",
      picName: "",
      picEmail: "",
      picPhone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onChange" // Validate on change for better UX on complex forms
  });

  const { register, control, handleSubmit, trigger, setValue, formState: { errors, isSubmitting } } = form;
  const accountType = useWatch({ control, name: "accountType" });
  const companyName = useWatch({ control, name: "companyName" });
  const isPersonal = accountType === "personal";

  // Re-validate when account type changes to clear/set errors for hidden fields
  useEffect(() => {
    if (accountType === "personal") {
      // Clear company errors if switching to personal
      trigger(); 
    }
  }, [accountType, trigger]);

  const derivedCompanyCode = useMemo(() => {
    const raw = (companyName ?? "").trim();
    if (!raw) return "";

    const normalized = raw
      .toUpperCase()
      .replace(/[^A-Z0-9\s\-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const tokens = normalized.split(/[\s\-_]+/).filter(Boolean);
    const lettersOnly = normalized.replace(/[^A-Z]/g, "");

    let code = "";
    for (const token of tokens) {
      const ch = token.replace(/[^A-Z]/g, "").slice(0, 1);
      if (ch) code += ch;
      if (code.length >= 3) break;
    }

    if (code.length < 3) {
      code += lettersOnly.slice(code.length, 3);
    }

    code = code.slice(0, 3);
    return code.length === 3 ? code : "";
  }, [companyName]);

  useEffect(() => {
    if (accountType !== "company") return;
    setValue("companyCode", derivedCompanyCode, { shouldValidate: true, shouldDirty: true });
  }, [accountType, derivedCompanyCode, setValue]);

  const onSubmit = async (data: RegisterSchema) => {
    setFormError(null);
    if (data.accountType === "personal") {
      setFormError(
        "Registrasi perorangan belum tersedia."
      );
      return;
    }
    try {
      await registerCompanyRequest({
        company_entity_type: data.companyEntityType ?? "PT",
        company_name: data.companyName ?? "",
        company_code: data.companyCode ?? undefined,
        npwp: data.companyNpwp ?? undefined,
        nib: data.companyNib ?? undefined,
        company_address: data.companyAddress ?? undefined,
        city: data.companyCity ?? undefined,
        province: data.companyProvince ?? undefined,
        postal_code: data.companyPostalCode ?? undefined,
        company_phone: data.companyPhone,
        name: data.picName,
        email: data.picEmail,
        password: data.password,
        password_confirmation: data.confirmPassword,
        phone: data.picPhone,
      });
      toast.success(t("registerSubmittedToast"), { duration: 6000 });
      router.push("/login");
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as { message?: string } | undefined;
        setFormError(body?.message ?? e.message);
        return;
      }
      setFormError("Gagal menghubungi server. Periksa NEXT_PUBLIC_API_URL.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50 p-4 font-sans pt-28 pb-10">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl shadow-zinc-200/50 sm:p-10 border border-zinc-100">
        <div className="mb-8 flex flex-col items-center space-y-3 text-center">
          <BrandLogo size="lg" />
          <p className="text-sm font-medium text-zinc-500">
            Logistik Multimoda, Transparan & Berkelanjutan
          </p>
        </div>

        <div className="mb-8 space-y-1.5 text-center">
          <h2 className="text-lg font-bold text-zinc-900">{t("title")}</h2>
          <p className="text-sm text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
          {isPersonal && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Registrasi perorangan belum tersedia.
            </p>
          )}
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Controller
              control={control}
              name="accountType"
              render={({ field }) => (
                <RadioGroup 
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-6 justify-center"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal" className="font-medium text-sm text-zinc-700">{t("personal")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="company" />
                    <Label htmlFor="company" className="font-medium text-sm text-zinc-700">{t("company")}</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {accountType === "company" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">{t("companyInfo")}</h3>
                
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4 space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      {t("companyEntityType")}
                    </Label>
                    <Controller
                      control={control}
                      name="companyEntityType"
                      render={({ field }) => (
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <SelectTrigger
                            className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white text-sm ${errors.companyEntityType ? "border-red-500 focus:ring-red-500" : ""}`}
                            disabled={isPersonal}
                          >
                            <SelectValue placeholder={t("selectEntityType")} />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_ENTITY_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.companyEntityType && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">
                        {errors.companyEntityType.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-5 space-y-1.5">
                    <Label htmlFor="companyName" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      {t("companyName")}
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      disabled={isPersonal}
                      className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...register("companyName")}
                    />
                    {errors.companyName && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="col-span-3 space-y-1.5">
                    <Label htmlFor="companyCode" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      {t("companyCode")}
                    </Label>
                    <Input
                      id="companyCode"
                      type="text"
                      readOnly
                      disabled={isPersonal}
                      className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...register("companyCode")}
                    />
                    {errors.companyCode && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyCode.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyEmail" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("companyEmail")}</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    disabled={isPersonal}
                    className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyEmail ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    {...register("companyEmail")}
                  />
                  {errors.companyEmail && (
                    <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyEmail.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyPhone" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("companyPhone")}</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    disabled={isPersonal}
                    className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyPhone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    {...register("companyPhone")}
                  />
                  {errors.companyPhone && (
                    <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyPhone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyNpwp" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      {t("npwp")}
                    </Label>
                    <Input
                      id="companyNpwp"
                      type="text"
                      disabled={isPersonal}
                      className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyNpwp ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...register("companyNpwp")}
                    />
                    {errors.companyNpwp && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyNpwp.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="companyNib" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      {t("nib")}
                    </Label>
                    <Input
                      id="companyNib"
                      type="text"
                      disabled={isPersonal}
                      className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyNib ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...register("companyNib")}
                    />
                    {errors.companyNib && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyNib.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyAddress" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                    {t("address")}
                  </Label>
                  <Textarea
                    id="companyAddress"
                    disabled={isPersonal}
                    className={`min-h-24 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyAddress ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    {...register("companyAddress")}
                  />
                  {errors.companyAddress && (
                    <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyAddress.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyCity" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                      {t("city")}
                    </Label>
                    <Input
                      id="companyCity"
                      type="text"
                      disabled={isPersonal}
                      className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyCity ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...register("companyCity")}
                    />
                    {errors.companyCity && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyCity.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="companyProvince"
                      className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1"
                    >
                      {t("province")}
                    </Label>
                    <Input
                      id="companyProvince"
                      type="text"
                      disabled={isPersonal}
                      className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyProvince ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...register("companyProvince")}
                    />
                    {errors.companyProvince && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyProvince.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="companyPostalCode"
                      className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1"
                    >
                      {t("postalCode")}
                    </Label>
                    <Input
                      id="companyPostalCode"
                      type="text"
                      inputMode="numeric"
                      disabled={isPersonal}
                      className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.companyPostalCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...register("companyPostalCode")}
                    />
                    {errors.companyPostalCode && (
                      <p className="text-[10px] font-medium text-red-500 ml-1">{errors.companyPostalCode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">{t("picData")}</h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="picName" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("fullName")}</Label>
                <Input
                  id="picName"
                  type="text"
                  disabled={isPersonal}
                  className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.picName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("picName")}
                />
                {errors.picName && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{errors.picName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="picEmail" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("workEmail")}</Label>
                <Input
                  id="picEmail"
                  type="email"
                  disabled={isPersonal}
                  className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.picEmail ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("picEmail")}
                />
                {errors.picEmail && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{errors.picEmail.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="picPhone" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("mobileNumber")}</Label>
                <Input
                  id="picPhone"
                  type="tel"
                  disabled={isPersonal}
                  className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.picPhone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("picPhone")}
                />
                {errors.picPhone && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{errors.picPhone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isPersonal}
                    className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 pr-9 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPersonal}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50 disabled:hover:text-zinc-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={isPersonal}
                    className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 pr-9 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPersonal}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50 disabled:hover:text-zinc-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4 max-w-md mx-auto">
            <div className="flex items-start space-x-2">
              <Controller
                control={control}
                name="terms"
                render={({ field }) => (
                  <Checkbox 
                    id="terms" 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                    disabled={isPersonal}
                  />
                )}
              />
              <Label htmlFor="terms" className="text-xs font-medium text-zinc-500 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-0.5">
                {t("terms")}
              </Label>
            </div>
            {errors.terms && (
              <p className="text-[10px] font-medium text-red-500">{errors.terms.message}</p>
            )}

            <div className="w-full space-y-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || isPersonal}
                className="h-10 w-full rounded-lg bg-black text-sm font-bold text-white hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Loading..." : (accountType === "company" ? t("createAccount") : t("createAccountPersonal"))}
              </Button>

              <div className="relative flex items-center py-2">
                <div className="grow border-t border-zinc-200"></div>
                <span className="mx-4 shrink text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{t("or")}</span>
                <div className="grow border-t border-zinc-200"></div>
              </div>

              <div className="space-y-3 pt-0 text-center">
                <p className="text-xs text-zinc-500">{t("haveAccount")}</p>
                <Link href="/login" className="block w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-transparent text-sm font-bold text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                  >
                    {t("login")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
