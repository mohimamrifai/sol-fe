import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";
import { resolveLegacyAdminRedirect } from "./src/lib/admin-legacy-redirects";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(en|id)(\/dashboard\/admin(?:\/.*)?)$/);

  if (localeMatch) {
    const [, locale, adminPath] = localeMatch;
    const target = resolveLegacyAdminRedirect(adminPath);
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${target}`;
      return NextResponse.redirect(url, 308);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(en|id)/:path*"],
};
