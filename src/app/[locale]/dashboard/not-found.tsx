"use client";

import { useTranslations } from "next-intl";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardNotFound() {
  const t = useTranslations("Common");

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-3 pt-6 pb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <Compass className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-zinc-900">{t("notFound.title")}</h1>
            <p className="text-sm text-zinc-500">{t("notFound.description")}</p>
          </div>
          <Button size="sm" onClick={() => location.assign("/dashboard")} className="h-9 gap-1">
            <Home className="h-3.5 w-3.5" />
            {t("notFound.home")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
