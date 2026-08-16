"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  onRetry: () => void;
}

export function ListErrorBanner({ message, onRetry }: Props) {
  const t = useTranslations("Dashboard.common");

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="h-8 shrink-0 gap-1 px-2 text-xs">
        <RefreshCcw className="h-3 w-3" />
        {t("retry")}
      </Button>
    </div>
  );
}
