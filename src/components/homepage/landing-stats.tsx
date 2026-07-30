import { getTranslations } from "next-intl/server";

const stats = ["s1", "s2", "s3", "s4"] as const;

export async function LandingStats() {
  const t = await getTranslations("LandingStats");

  return (
    <section className="border-y border-zinc-200/80 bg-zinc-50/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((key) => (
            <div key={key}>
              <p className="text-4xl font-bold tracking-tight text-[#0b1b69] md:text-5xl">
                {t(`${key}Value`)}
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {t(`${key}Label`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
