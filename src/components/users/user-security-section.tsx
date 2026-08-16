"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KeyRound, Lock } from "lucide-react";

export function UserSecuritySection() {
  const t = useTranslations("Users.detail.sections");
  const tForm = useTranslations("Users.form");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <Lock className="h-4 w-4 text-zinc-600" />
          {t("security")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
          <KeyRound className="mt-0.5 h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-sm font-medium text-zinc-900">{tForm("password")}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{tForm("passwordHint")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
