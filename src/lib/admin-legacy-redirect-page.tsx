import { redirect } from "next/navigation";

type LegacyRedirectPageProps = {
  params: Promise<{ locale: string }>;
};

export function createLegacyRedirectPage(targetPath: string) {
  return async function LegacyRedirectPage({ params }: LegacyRedirectPageProps) {
    const { locale } = await params;
    redirect(`/${locale}${targetPath}`);
  };
}

export function createLegacyRedirectPageWithId(baseTargetPath: string) {
  return async function LegacyRedirectPageWithId({
    params,
  }: {
    params: Promise<{ locale: string; id: string }>;
  }) {
    const { locale, id } = await params;
    redirect(`/${locale}${baseTargetPath}/${id}`);
  };
}

export function createLegacyRedirectPageWithIdAndSuffix(baseTargetPath: string, suffix: string) {
  return async function LegacyRedirectPageWithIdAndSuffix({
    params,
  }: {
    params: Promise<{ locale: string; id: string }>;
  }) {
    const { locale, id } = await params;
    redirect(`/${locale}${baseTargetPath}/${id}${suffix}`);
  };
}
