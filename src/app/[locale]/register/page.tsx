"use client";

import { BrandLogo } from "@/components/brand-logo";
import { useTranslations } from "next-intl";

import { RegisterStepper } from "@/components/register";

export default function RegisterPage() {
  const t = useTranslations("Register");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50 p-4 pt-28 pb-10">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-100 bg-white p-6 shadow-2xl shadow-zinc-200/50 sm:p-10">
        <div className="mb-8 flex flex-col items-center space-y-3 text-center">
          <BrandLogo size="lg" />
          <p className="text-sm font-medium text-zinc-500">
            {t("page.brandTagline")}
          </p>
        </div>

        <div className="mb-6 space-y-1.5 text-center">
          <h2 className="text-lg font-bold text-zinc-900">{t("page.title")}</h2>
          <p className="mx-auto max-w-md text-sm text-zinc-500">
            {t("page.subtitle")}
          </p>
        </div>

        <RegisterStepper />
      </div>
    </div>
  );
}
