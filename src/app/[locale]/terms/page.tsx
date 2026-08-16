"use client";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("Terms");

  const sections = ["general", "review", "data", "service"] as const;

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50/50 px-4 py-28">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-200/50 sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandLogo size="md" />
          <h1 className="text-xl font-bold text-zinc-900">{t("pageTitle")}</h1>
          <p className="text-sm text-zinc-500">{t("pageSubtitle")}</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700">
          {sections.map((key) => (
            <section key={key}>
              <h2 className="mb-2 font-semibold text-zinc-900">{t(`sections.${key}.title`)}</h2>
              <p>{t(`sections.${key}.body`)}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/register">
            <Button type="button" variant="outline">
              {t("backToRegister")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
