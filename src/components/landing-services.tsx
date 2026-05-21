import { getTranslations } from "next-intl/server";
import {
  Container,
  Boxes,
  TrainFront,
  Wrench,
} from "lucide-react";

const services = [
  { key: "fcl", icon: Container, accent: "bg-indigo-50 text-indigo-600" },
  { key: "lcl", icon: Boxes, accent: "bg-sky-50 text-sky-600" },
  { key: "rail", icon: TrainFront, accent: "bg-emerald-50 text-emerald-600" },
  { key: "addon", icon: Wrench, accent: "bg-amber-50 text-amber-600" },
] as const;

export async function LandingServices() {
  const t = await getTranslations("LandingServices");

  return (
    <section id="layanan" className=" border-y border-zinc-200/80 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("lead")}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ key, icon: Icon, accent }) => (
            <div
              key={key}
              className="group relative rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-7 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
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
