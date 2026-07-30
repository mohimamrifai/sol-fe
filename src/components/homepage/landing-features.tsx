import { getTranslations } from "next-intl/server";
import {
  Calculator,
  TrainFront,
  MapPinned,
  Wallet,
  Building2,
  Layers,
} from "lucide-react";

const icons = [Calculator, TrainFront, MapPinned, Wallet, Building2, Layers] as const;

export async function LandingFeatures() {
  const t = await getTranslations("Landing");
  const keys = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;

  return (
    <section className="relative border-y border-zinc-200/80 bg-white/80 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {t("featuresTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("featuresLead")}</p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((key, i) => {
            const Icon = icons[i];
            return (
              <li
                key={key}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900/5 text-zinc-900">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900">{t(`${key}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`${key}Body`)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
