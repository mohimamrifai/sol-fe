import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

type SupportedLocale = (typeof routing.locales)[number];

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && routing.locales.includes(value as SupportedLocale);
}

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!isSupportedLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../src/messages/${locale}.json`)).default
  };
});
