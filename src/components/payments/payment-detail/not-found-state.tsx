"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** i18n namespace used for the title/description/back labels. */
  namespace?: string;
  /** Override the namespace keys. Defaults to "Payments.detail". */
  backHref?: string;
  /** If true, the back button calls router.back() instead of pushing backHref. */
  useHistoryBack?: boolean;
}

/**
 * Generic "data not found / access denied" state.
 *
 * Security note: this component is used for ALL error paths on detail pages
 * (invalid id, 404, 403, 500, network error). It never renders raw error
 * messages from the API, so a probing user cannot distinguish "not found"
 * from "forbidden" from "internal error".
 */
export function NotFoundState({
  namespace = "Payments.detail",
  backHref = "/dashboard/payments",
  useHistoryBack = false,
}: Props) {
  const t = useTranslations(namespace);
  const router = useRouter();

  const handleBack = React.useCallback(() => {
    if (useHistoryBack) {
      router.back();
    } else {
      router.push(backHref);
    }
  }, [router, backHref, useHistoryBack]);

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <SearchX className="h-6 w-6" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">
          {t("notFoundTitle")}
        </h1>
        <p className="text-sm text-zinc-500">
          {t("notFoundDescription")}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
      >
        {t("back")}
      </Button>
    </div>
  );
}
