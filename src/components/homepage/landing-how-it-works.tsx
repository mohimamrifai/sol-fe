import { getTranslations } from "next-intl/server";
import { ClipboardCheck, Package, MapPin, CreditCard } from "lucide-react";

const steps = [
  { key: "s1", icon: ClipboardCheck },
  { key: "s2", icon: Package },
  { key: "s3", icon: MapPin },
  { key: "s4", icon: CreditCard },
] as const;

export async function LandingHowItWorks() {
  const t = await getTranslations("LandingHowItWorks");

  return (
    <section className="relative overflow-hidden bg-zinc-50/60 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-indigo-100/40 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-100/40 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("lead")}</p>
        </div>

        <div className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="pointer-events-none absolute top-10 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent lg:block"
            aria-hidden
          />
          {steps.map(({ key, icon: Icon }, i) => (
            <div key={key} className="relative text-center">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-zinc-200/60">
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow">
                  {i + 1}
                </span>
                <Icon className="h-8 w-8 text-indigo-600" aria-hidden />
              </div>
              <h3 className="mt-6 text-base font-semibold text-zinc-900">
                {t(`${key}Title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`${key}Body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
