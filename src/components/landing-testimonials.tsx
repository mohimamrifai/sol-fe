import { getTranslations } from "next-intl/server";
import { Quote } from "lucide-react";

const testimonials = ["t1", "t2", "t3"] as const;

export async function LandingTestimonials() {
  const t = await getTranslations("LandingTestimonials");

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((key) => (
            <div
              key={key}
              className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-7 transition-shadow hover:shadow-lg"
            >
              <Quote className="h-8 w-8 text-indigo-100" aria-hidden />
              <blockquote className="mt-4 text-sm leading-relaxed text-zinc-700">
                &ldquo;{t(`${key}Quote`)}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {t(`${key}Name`).charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {t(`${key}Name`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`${key}Role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
