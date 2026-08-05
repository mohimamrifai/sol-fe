"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CompanyError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error("[Company error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-3 pt-6 pb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-zinc-900">{t("error.title")}</h1>
            <p className="text-sm text-zinc-500">{t("error.description")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => history.back()} className="h-9 gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("error.back")}
            </Button>
            <Button size="sm" onClick={() => reset()} className="h-9 gap-1">
              <RefreshCcw className="h-3.5 w-3.5" />
              {t("error.retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
