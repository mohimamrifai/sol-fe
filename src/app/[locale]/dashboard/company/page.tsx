"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Building2, FileText, Activity, BadgeDollarSign } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerCompany } from "@/hooks/use-customer-company";
import { NotFoundState } from "@/components/shared/not-found-state";
import { CompanyInfoSection, type CompanyData } from "@/components/company/company-info-section";
import { CommercialInfoSection } from "@/components/company/commercial-info-section";
import { DocumentsSection } from "@/components/company/documents-section";
import { ActivityLogSection } from "@/components/company/activity-log-section";

const TABS = ["info", "commercial", "documents", "activities"] as const;
type Tab = (typeof TABS)[number];

export default function CompanyPage() {
  const t = useTranslations("Company");
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab = ((sp.get("tab") as Tab) || "info") as Tab;
  const safeTab: Tab = TABS.includes(tab) ? tab : "info";

  const setTab = (next: string) => {
    const params = new URLSearchParams(sp.toString());
    if (next === "info") params.delete("tab");
    else params.set("tab", next);
    const obj = Object.fromEntries(params);
    router.replace({ pathname, query: Object.keys(obj).length ? obj : undefined });
  };

  const { data, isLoading, isError, refetch } = useCustomerCompany();

  if (isLoading) {
    return (
      <div className="space-y-4 px-6 py-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <NotFoundState
        title={t("notFound.title")}
        description={t("notFound.description")}
        backLabel={t("notFound.back")}
        backHref="/dashboard"
      />
    );
  }

  const company = (data?.data ?? {}) as unknown as CompanyData;

  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t("title")}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t("subtitle")}</p>
      </div>

      <Tabs value={safeTab} onValueChange={setTab} className="w-full">
        <TabsList className="h-10 bg-zinc-100/80 border border-zinc-200 p-1 rounded-lg">
          <TabsTrigger value="info" className="gap-2 h-8 px-3 text-sm">
            <Building2 className="h-4 w-4" /> {t("tabs.info")}
          </TabsTrigger>
          <TabsTrigger value="commercial" className="gap-2 h-8 px-3 text-sm">
            <BadgeDollarSign className="h-4 w-4" /> {t("tabs.commercial")}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 h-8 px-3 text-sm">
            <FileText className="h-4 w-4" /> {t("tabs.documents")}
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2 h-8 px-3 text-sm">
            <Activity className="h-4 w-4" /> {t("tabs.activities")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <CompanyInfoSection company={company} onSaved={() => refetch()} />
        </TabsContent>
        <TabsContent value="commercial" className="mt-4">
          <CommercialInfoSection />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsSection />
        </TabsContent>
        <TabsContent value="activities" className="mt-4">
          <ActivityLogSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
