"use client";

import { Construction } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "./admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type AdminModulePlaceholderProps = {
  menuKey: string;
  icon: LucideIcon;
  fsdRef: string;
};

export function AdminModulePlaceholder({ menuKey, icon, fsdRef }: AdminModulePlaceholderProps) {
  const t = useTranslations("AdminNav");
  const title = t(`items.${menuKey}` as Parameters<typeof t>[0]);

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <AdminPageHeader icon={icon} title={title} description={t("placeholder.description")} />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">{t("placeholder.title")}</CardTitle>
          </div>
          <CardDescription>{t("placeholder.hint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t("placeholder.fsdLabel")}:</span> {fsdRef}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
