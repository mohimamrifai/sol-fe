import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function LandingFooter() {
  const t = await getTranslations("Landing");

  return (
    <footer className="bg-[#070e33] text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-xl font-bold tracking-tight">{t("footerBrand")}</p>
            <p className="mt-3 text-sm leading-relaxed text-white">{t("footerTagline")}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm sm:flex sm:gap-x-10">
            <Link className="text-white transition-colors hover:text-white" href="/estimasi">
              {t("footerEstimasi")}
            </Link>
            <Link className="text-white transition-colors hover:text-white" href="/tracking">
              {t("footerTracking")}
            </Link>
            <Link className="text-white transition-colors hover:text-white" href="/login">
              {t("footerLogin")}
            </Link>
            <Link className="text-white transition-colors hover:text-white" href="/register">
              {t("footerRegister")}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white">
        {t("footerRights")}
      </div>
    </footer>
  );
}
