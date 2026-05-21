import { getTranslations } from "next-intl/server";
import {
  Eye,
  DollarSign,
  Camera,
  CreditCard,
  Users,
  ArrowUpRight,
} from "lucide-react";

const points = [
  { key: "w1", icon: Eye },
  { key: "w2", icon: DollarSign },
  { key: "w3", icon: Camera },
  { key: "w4", icon: CreditCard },
  { key: "w5", icon: Users },
  { key: "w6", icon: ArrowUpRight },
] as const;

export async function LandingWhy() {
  const t = await getTranslations("LandingWhy");

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              {t("eyebrow")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t("lead")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {points.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-5 transition-shadow hover:shadow-md"
              >
                <Icon className="h-5 w-5 text-indigo-600" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-zinc-900">
                  {t(`${key}Title`)}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`${key}Body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
