"use client";

import { ArrowRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-[#0b1b69]/10 blur-[100px]" />
        <div className="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-sky-200/30 blur-[80px]" />
      </div>
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-6 md:grid-cols-2 md:px-12 lg:gap-20">
        <div className="space-y-5 md:space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0b1b69]/15 bg-[#0b1b69]/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#0b1b69]">
            {t("badge")}
          </div>
          <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-[2.75rem] lg:text-5xl">
            {t("headline")}
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-zinc-600 md:text-lg">
            {t("subheadline")}
          </p>
          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b1b69] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0d2280] sm:text-base"
            >
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tracking"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 sm:text-base"
            >
              <Search className="h-4 w-4" />
              {t("ctaTrack")}
            </Link>
          </div>
        </div>

        <div className="relative hidden h-[420px] w-full md:block lg:h-[480px]">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0b1b69] via-[#162ea8] to-[#1e40af] p-px shadow-2xl">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-[#0b1b69]/95 via-[#162ea8]/90 to-[#1e40af]/85 p-10 text-center">
              <div className="space-y-2">
                <div className="mx-auto h-3 w-32 rounded-full bg-white/20" />
                <div className="mx-auto h-3 w-48 rounded-full bg-white/15" />
                <div className="mx-auto h-3 w-24 rounded-full bg-white/10" />
              </div>
              <div className="mt-8 grid w-full max-w-xs grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                    <div className="mx-auto h-8 w-8 rounded-lg bg-white/20" />
                    <div className="mx-auto mt-3 h-2 w-12 rounded-full bg-white/15" />
                  </div>
                ))}
              </div>
              <div className="mt-8 w-full max-w-xs space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
                  <div className="h-2 w-24 rounded-full bg-white/20" />
                  <div className="ml-auto h-2 w-12 rounded-full bg-white/15" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <div className="h-3 w-3 rounded-full bg-sky-400/60" />
                  <div className="h-2 w-20 rounded-full bg-white/20" />
                  <div className="ml-auto h-2 w-16 rounded-full bg-white/15" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <div className="h-3 w-3 rounded-full bg-amber-400/60" />
                  <div className="h-2 w-28 rounded-full bg-white/20" />
                  <div className="ml-auto h-2 w-10 rounded-full bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
