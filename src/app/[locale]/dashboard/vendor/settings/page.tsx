"use client";

import { useTranslations } from "next-intl";
import { VendorSettingsPage } from "@/components/vendor/settings/vendor-settings-page";

export default function VendorSettingsRoute() {
  useTranslations("Vendor.settings.title");
  return <VendorSettingsPage />;
}
