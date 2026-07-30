"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

import {
  checkCompanyCodeRequest,
  registerCompanyRequest,
} from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";
import { DEFAULT_COUNTRY } from "@/lib/countries";

import { StepCard } from "./step-card";
import { StepCompanyInfo } from "./step-company-info";
import { StepCompanyAddress } from "./step-company-address";
import { StepOperationalInfo } from "./step-operational-info";
import { StepAdminAccount } from "./step-admin-account";
import {
  RegisterTProvider,
  STEPS,
  type StepKey,
  type RegisterFormValues,
  createRegisterSchema,
} from "./types";

const DEFAULT_VALUES: RegisterFormValues = {
  business_entity_type: "PT",
  business_entity_other: "",
  company_name: "",
  company_code: "",
  npwp: "",
  company_email: "",
  company_phone: "",
  website: "",
  country: DEFAULT_COUNTRY,
  province: "",
  city: "",
  district: "",
  postal_code: "",
  address: "",
  business_category: "",
  business_category_other: "",
  monthly_shipment_estimate: "" as never,
  admin_name: "",
  admin_email: "",
  admin_phone: "",
  password: "",
  confirm_password: "",
  terms_accepted: false as unknown as true,
};

/**
 * Field groups validated when navigating forward between steps.
 * Keys are field names in the RegisterFormValues schema.
 */
const STEP_FIELDS: Record<StepKey, (keyof RegisterFormValues)[]> = {
  "company-info": [
    "business_entity_type",
    "business_entity_other",
    "company_name",
    "company_code",
    "npwp",
    "company_email",
    "company_phone",
    "website",
  ],
  "company-address": [
    "country",
    "province",
    "city",
    "district",
    "postal_code",
    "address",
  ],
  "operational-info": [
    "business_category",
    "business_category_other",
    "monthly_shipment_estimate",
  ],
  "admin-account": [
    "admin_name",
    "admin_email",
    "admin_phone",
    "password",
    "confirm_password",
    "terms_accepted",
  ],
};

export function RegisterStepper() {
  const router = useRouter();
  const t = useTranslations("Register");

  const [openStep, setOpenStep] = React.useState<StepKey>("company-info");
  const [formError, setFormError] = React.useState<string | null>(null);

  // Wrap next-intl t so it also supports {count}/{value} placeholders
  // (Zod messages). The keys already live under Register.validation.*
  // and Register.toast.* in the messages files.
  const schemaT = React.useCallback(
    (key: string, vars?: Record<string, unknown>) => {
      const translated = t(key as never, (vars ?? {}) as never);
      return typeof translated === "string" ? translated : key;
    },
    [t],
  );

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(createRegisterSchema(schemaT)),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    trigger,
    setError,
  } = form;

  // ----- Navigation -----
  const goNext = async (current: StepKey) => {
    const fields = STEP_FIELDS[current];
    const valid = await trigger(fields, { shouldFocus: true });
    if (!valid) return;
    // Block Next if customer code is "taken" (live check)
    if (current === "company-info" && errors.company_code) return;
    const idx = STEPS.findIndex((s) => s.key === current);
    const next = STEPS[idx + 1];
    if (next) {
      setOpenStep(next.key);
      setTimeout(() => {
        const el = document.getElementById(`step-${next.key}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  const goPrev = (current: StepKey) => {
    const idx = STEPS.findIndex((s) => s.key === current);
    const prev = STEPS[idx - 1];
    if (prev) setOpenStep(prev.key);
  };

  // ----- Submit -----
  const onSubmit = async (data: RegisterFormValues) => {
    setFormError(null);
    try {
      const codeCheck = await checkCompanyCodeRequest(
        (data.company_code ?? "").toUpperCase(),
      );
      if (codeCheck.exists) {
        setError("company_code", {
          type: "server",
          message: t("toast.customerCodeTaken"),
        });
        setOpenStep("company-info");
        return;
      }
    } catch {
      // network error → let the real submit report
    }

    try {
      await registerCompanyRequest({
        business_entity_type: data.business_entity_type,
        business_entity_other: data.business_entity_other || undefined,
        company_name: data.company_name,
        company_code: (data.company_code ?? "").toUpperCase(),
        npwp: data.npwp,
        company_email: data.company_email,
        company_phone: data.company_phone,
        website: data.website || undefined,
        country: data.country,
        province: data.province,
        city: data.city,
        district: data.district,
        postal_code: data.postal_code,
        address: data.address,
        business_category: data.business_category,
        business_category_other: data.business_category_other || undefined,
        monthly_shipment_estimate: data.monthly_shipment_estimate as string,
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        admin_phone: data.admin_phone,
        password: data.password,
        password_confirmation: data.confirm_password,
        terms_accepted: true,
      });
      toast.success(t("toast.registerSuccess"), { duration: 6000 });
      router.push("/login");
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as
          | { message?: string; errors?: Record<string, string[]> }
          | undefined;
        if (body?.errors) {
          for (const [k, msgs] of Object.entries(body.errors)) {
            setError(k as keyof RegisterFormValues, {
              type: "server",
              message: msgs[0],
            });
          }
        }
        setFormError(body?.message ?? e.message);
        return;
      }
      setFormError(t("toast.networkError"));
    }
  };

  const onInvalid = () => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const el = document.querySelector<HTMLElement>(
        `[name="${firstErrorKey}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const currentIdx = STEPS.findIndex((s) => s.key === openStep);
  const isLast = currentIdx === STEPS.length - 1;
  const isFirst = currentIdx === 0;
  const currentDescriptor = STEPS[currentIdx];

  return (
    <RegisterTProvider value={schemaT}>
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
          className="space-y-4"
        >
          {formError ? (
            <p className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </p>
          ) : null}

          <Accordion
            value={[openStep]}
            onValueChange={(v) => {
              const first = (v as Array<string | null>).find(Boolean);
              if (first) setOpenStep(first as StepKey);
            }}
            className="space-y-3"
          >
            <div id="step-company-info">
              <StepCard descriptor={STEPS[0]}>
                <StepCompanyInfo />
              </StepCard>
            </div>
            <div id="step-company-address">
              <StepCard descriptor={STEPS[1]}>
                <StepCompanyAddress />
              </StepCard>
            </div>
            <div id="step-operational-info">
              <StepCard descriptor={STEPS[2]}>
                <StepOperationalInfo />
              </StepCard>
            </div>
            <div id="step-admin-account">
              <StepCard descriptor={STEPS[3]}>
                <StepAdminAccount />
              </StepCard>
            </div>
          </Accordion>

          {/* Footer navigation */}
          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => goPrev(currentDescriptor.key)}
              disabled={isFirst || isSubmitting}
              className="h-10 rounded-lg border-zinc-200 px-4 text-sm font-medium"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t("button.previous")}
            </Button>

            {!isLast ? (
              <Button
                type="button"
                onClick={() => goNext(currentDescriptor.key)}
                disabled={isSubmitting}
                className="h-10 rounded-lg bg-black px-5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                {t("button.next")}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 rounded-lg bg-black px-5 text-sm font-bold text-white shadow-md shadow-black/10 hover:bg-zinc-800"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("button.submitting")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("button.submit")}
                  </span>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-zinc-500">
            <Lock className="h-3.5 w-3.5" />
            {t("footer.secureText")}
          </div>

          <div className="space-y-2 pt-2 text-center">
            <p className="text-xs text-zinc-500">
              {t("footer.alreadyHaveAccount")}
            </p>
            <Link href="/login" className="block w-full">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-transparent text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-50"
              >
                {t("button.login")}
              </Button>
            </Link>
          </div>
        </form>
      </FormProvider>
    </RegisterTProvider>
  );
}
