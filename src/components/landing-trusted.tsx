import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";

export async function LandingTrusted() {
  const t = await getTranslations("LandingTrusted");

  return (
    <section className="border-b border-zinc-200/60 bg-white py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {t("label")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {(["a", "b", "c", "d", "e"] as const).map((k) => (
            <div
              key={k}
              className="flex items-center gap-2 text-zinc-300 transition-colors hover:text-zinc-500"
            >
              <Building2 className="h-5 w-5" aria-hidden />
              <span className="text-sm font-semibold tracking-tight">
                {t(k)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
