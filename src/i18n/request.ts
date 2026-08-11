import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type SupportedLocale = (typeof routing.locales)[number];

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && routing.locales.includes(value as SupportedLocale);
}

const NAMESPACE_PATHS: Record<string, string> = {
  Auth: "auth",
  Login: "auth",
  Register: "register",
  Bookings: "bookings",
  Shipments: "shipments",
  Documents: "documents",
  Invoices: "invoices",
  Payments: "payments",
  Dashboard: "dashboard",
  DashboardAdmin: "dashboard",
  Hero: "landing",
  Landing: "landing",
  LandingCtaFinal: "landing",
  LandingEstimateCta: "landing",
  LandingFaq: "landing",
  LandingHowItWorks: "landing",
  LandingServices: "landing",
  LandingStats: "landing",
  LandingTestimonials: "landing",
  LandingTrackingCta: "landing",
  LandingTrusted: "landing",
  LandingWhy: "landing",
  Navbar: "landing",
  Estimate: "estimate",
  Tracking: "tracking",
  PlaceholderPages: "placeholder",
  Company: "company",
  Locations: "locations",
  Users: "users",
  Profile: "settings",
  Vendor: "vendor",
  AdminNav: "admin",
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!isSupportedLocale(locale)) {
    locale = routing.defaultLocale;
  }

  const messages: Record<string, unknown> = {};
  await Promise.all(
    Object.entries(NAMESPACE_PATHS).map(async ([ns, page]) => {
      const mod = (await import(`../../src/messages/${locale}/${page}/${ns}.json`)) as {
        default: Record<string, unknown>;
      };
      Object.assign(messages, mod.default);
    })
  );

  return { locale, messages };
});
