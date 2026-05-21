import { getTranslations } from "next-intl/server";
import { LandingFaqAccordion } from "./landing-faq-accordion";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export async function LandingFaq() {
  const t = await getTranslations("LandingFaq");

  const items = faqKeys.map((key) => ({
    question: t(`${key}Q`),
    answer: t(`${key}A`),
  }));

  return (
    <section id="informasi" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 md:px-12">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-12">
          <LandingFaqAccordion items={items} />
        </div>
      </div>
    </section>
  );
}
