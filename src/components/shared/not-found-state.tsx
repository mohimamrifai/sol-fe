"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  titleKey?: string;
  descriptionKey?: string;
  backLabelKey?: string;
  title?: string;
  description?: string;
  backLabel?: string;
  backHref?: string;
  useHistoryBack?: boolean;
}

export function NotFoundState({
  titleKey,
  descriptionKey,
  backLabelKey = "common.back",
  title,
  description,
  backLabel,
  backHref,
  useHistoryBack = false,
}: Props) {
  const tRoot = useTranslations();
  const router = useRouter();

  const resolvedTitle = title ?? (titleKey ? tRoot(titleKey) : tRoot("common.notFoundTitle"));
  const resolvedDescription = description ?? (descriptionKey ? tRoot(descriptionKey) : tRoot("common.notFoundDescription"));
  const resolvedBack = backLabel ?? tRoot(backLabelKey);

  const handleBack = React.useCallback(() => {
    if (useHistoryBack) router.back();
    else if (backHref) router.push(backHref);
    else router.back();
  }, [router, backHref, useHistoryBack]);

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <SearchX className="h-6 w-6" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">{resolvedTitle}</h1>
        <p className="text-sm text-zinc-500">{resolvedDescription}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
      >
        {resolvedBack}
      </Button>
    </div>
  );
}
