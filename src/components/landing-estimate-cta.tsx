import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calculator, ArrowRight } from "lucide-react";

export async function LandingEstimateCta() {
  const t = await getTranslations("LandingEstimateCta");

  return (
    <section className="border-y border-zinc-200/80 bg-zinc-50/60 py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
          <Calculator className="h-8 w-8 text-indigo-600" aria-hidden />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          {t("lead")}
        </p>
        <div className="mt-8">
          <Link
            href="/estimasi"
            className="inline-flex items-center gap-2 rounded-full bg-[#0b1b69] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0d2280] sm:text-base"
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
