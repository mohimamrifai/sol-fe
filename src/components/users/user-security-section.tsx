"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Lock } from "lucide-react";

interface Props {
  onResetPassword: () => void;
}

export function UserSecuritySection({ onResetPassword }: Props) {
  const t = useTranslations("Users.detail.sections");
  const tAction = useTranslations("Users.detail.actions");
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
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <KeyRound className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900">{tForm("password")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{tForm("passwordHint")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onResetPassword}
            className="h-9 gap-2"
          >
            <KeyRound className="h-4 w-4" />
            {tAction("resetPassword")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
