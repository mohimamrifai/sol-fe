"use client";

import { useTranslations } from "next-intl";
import { UserCircle } from "lucide-react";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default function ProfilePage() {
  const t = useTranslations("Profile");

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
          <UserCircle className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{t("title")}</h1>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
      </header>

      <ProfileSettingsForm />
    </div>
  );
}
