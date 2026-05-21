import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

export async function LandingCtaFinal() {
  const t = await getTranslations("LandingCtaFinal");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1b69] via-[#0d2280] to-[#162ea8] py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-sky-300/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center md:px-12">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-indigo-200">
          {t("lead")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-[#0b1b69] shadow-xl transition-colors hover:bg-zinc-100 sm:text-base"
          >
            {t("ctaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:text-base"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
