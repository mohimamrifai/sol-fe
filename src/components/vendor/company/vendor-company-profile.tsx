"use client";

import { useState } from "react";
import { Building2, Edit } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { VendorCompanyInfoSection } from "@/components/vendor/company/vendor-company-info-section";
import { VendorCompanyAddressSection } from "@/components/vendor/company/vendor-company-address-section";
import { VendorCompanyContactSection } from "@/components/vendor/company/vendor-company-contact-section";
import { VendorCompanyBankSection } from "@/components/vendor/company/vendor-company-bank-section";
import { VendorCompanyBusinessSection } from "@/components/vendor/company/vendor-company-business-section";
import { VendorCompanyActivitySection } from "@/components/vendor/company/vendor-company-activity-section";
import { VendorCompanyFormDialog } from "@/components/vendor/company/dialogs/vendor-company-form-dialog";

export function VendorCompanyProfile() {
  const t = useTranslations("Vendor.company");
  const { user } = useAuthStore();
  const [editOpen, setEditOpen] = useState(false);
  const canEdit = (user?.roles ?? []).some((r) => ["vendor_company_admin", "vendor_finance_pic"].includes(r));

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            {t("title")}
          </h1>
        </div>
        {canEdit && (
          <Button onClick={() => setEditOpen(true)} variant="outline" className="h-10">
            <Edit className="mr-2 h-4 w-4" /> {t("edit")}
          </Button>
        )}
      </div>
      <VendorCompanyInfoSection />
      <VendorCompanyAddressSection />
      <VendorCompanyContactSection />
      <VendorCompanyBusinessSection />
      <VendorCompanyBankSection />
      <VendorCompanyActivitySection />
      <VendorCompanyFormDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
