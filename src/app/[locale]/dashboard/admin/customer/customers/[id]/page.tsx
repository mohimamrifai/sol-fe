"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAdminCompany } from "@/lib/admin-api";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { CustomerLocationManagement } from "@/components/dashboard/admin/customers/customer-location-management";
import { CustomerReviewSection } from "@/components/dashboard/admin/customers/customer-review-section";
import { CustomerUsersSection } from "@/components/dashboard/admin/customers/customer-users-section";
import { CustomerCompanyForm } from "@/components/dashboard/admin/customers/customer-company-form";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("AdminCustomers");
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const tab = searchParams.get("tab") ?? "company";

  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const caps = useMemo(() => getAdminCustomerCapabilities(user?.roles ?? []), [user?.roles]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) return;
    void fetchAdminCompany(id).then((res) => setDetail(res.data)).catch(() => setDetail(null));
  }, [id]);

  const onTabChange = (value: string) => {
    router.replace(`/${locale}/dashboard/admin/customer/customers/${id}?tab=${value}`);
  };

  if (!authHydrated) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{String(detail?.name ?? t("title"))}</CardTitle>
        <CardDescription>
          {String(detail?.company_code ?? "—")} · {String(detail?.status ?? "—")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
            <TabsTrigger value="company">{t("tabs.company")}</TabsTrigger>
            <TabsTrigger value="locations">{t("tabs.locations")}</TabsTrigger>
            <TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
            <TabsTrigger value="review">{t("tabs.review")}</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <CustomerCompanyForm embedded />
          </TabsContent>
          <TabsContent value="locations">
            <CustomerLocationManagement companyId={id} canManage={caps.canManageBranches} />
          </TabsContent>
          <TabsContent value="users">
            <CustomerUsersSection
              companyId={id}
              users={(detail?.users as Record<string, unknown>[]) ?? []}
              canManage={caps.canEditCompanyData}
              onRefresh={() => void fetchAdminCompany(id).then((res) => setDetail(res.data))}
            />
          </TabsContent>
          <TabsContent value="review">
            <CustomerReviewSection
              companyId={id}
              detail={detail}
              canEdit={caps.canEditCompanyData}
              onSaved={() => void fetchAdminCompany(id).then((res) => setDetail(res.data))}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/customer/customers`)}>
            {t("actions.back")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
