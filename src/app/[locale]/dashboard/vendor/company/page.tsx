"use client";

import { useTranslations } from "next-intl";
import { VendorCompanyProfile } from "@/components/vendor/company/vendor-company-profile";

export default function VendorCompanyPage() {
  useTranslations("Vendor.company.title");
  return <VendorCompanyProfile />;
}
