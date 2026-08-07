"use client";

import { useTranslations } from "next-intl";
import { VendorUsersList } from "@/components/vendor/users/vendor-users-list";

export default function VendorUsersPage() {
  useTranslations("Vendor.users.title");
  return <VendorUsersList />;
}
