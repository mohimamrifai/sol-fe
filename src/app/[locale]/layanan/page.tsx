import { getTranslations } from "next-intl/server";

export default async function LayananPage() {
  const t = await getTranslations("PlaceholderPages");

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{t("servicesTitle")}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{t("servicesBody")}</p>
    </div>
  );
}
