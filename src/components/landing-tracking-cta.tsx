"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

export function LandingTrackingCta() {
  const t = useTranslations("LandingTrackingCta");
  const router = useRouter();
  const [waybill, setWaybill] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = waybill.trim();
    if (!q) return;
    router.push(`/tracking?waybill=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1b69] via-[#0d2280] to-[#162ea8] py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-sky-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center md:px-12">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-indigo-200 sm:text-base">
          {t("lead")}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={waybill}
              onChange={(e) => setWaybill(e.target.value)}
              placeholder={t("placeholder")}
              className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-sm text-zinc-900 shadow-lg placeholder:text-zinc-400 focus:ring-2 focus:ring-sky-400 focus:outline-none sm:h-14 sm:text-base"
            />
          </div>
          <button
            type="submit"
            className="h-12 shrink-0 cursor-pointer rounded-xl bg-white px-7 text-sm font-semibold text-[#0b1b69] shadow-lg transition-colors hover:bg-zinc-100 sm:h-14 sm:text-base"
          >
            {t("cta")}
          </button>
        </form>
      </div>
    </section>
  );
}
