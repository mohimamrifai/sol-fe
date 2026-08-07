"use client";

import { UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { VendorProfileInfoSection } from "@/components/vendor/settings/vendor-profile-info-section";
import { VendorProfilePhotoSection } from "@/components/vendor/settings/vendor-profile-photo-section";
import { VendorProfileAccountSection } from "@/components/vendor/settings/vendor-profile-account-section";
import { VendorProfileAccessSection } from "@/components/vendor/settings/vendor-profile-access-section";
import { VendorProfilePasswordSection } from "@/components/vendor/settings/vendor-profile-password-section";
import { VendorProfileActivitySection } from "@/components/vendor/settings/vendor-profile-activity-section";

export function VendorSettingsPage() {
  const t = useTranslations("Vendor.settings");
  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
          <UserCircle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{t("title")}</h1>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VendorProfileInfoSection />
        <VendorProfilePhotoSection />
      </div>
      <VendorProfileAccountSection />
      <VendorProfileAccessSection />
      <VendorProfilePasswordSection />
      <VendorProfileActivitySection />
    </div>
  );
}
