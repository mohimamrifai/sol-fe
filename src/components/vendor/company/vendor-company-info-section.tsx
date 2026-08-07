"use client";

import { useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useVendorCompany } from "@/hooks/use-vendor-company";

export function VendorCompanyInfoSection() {
  const t = useTranslations("Vendor.company");
  const tf = useTranslations("Vendor.company.fields");
  const { data, isLoading } = useVendorCompany();
  const c = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sections.companyInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!c) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-base">{t("sections.companyInfo")}</CardTitle>
        </div>
        <Badge className="border bg-zinc-100 text-zinc-700 text-xs">{c.status}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Field label={tf("companyCode")} value={c.company_code} mono />
        <Field label={tf("companyName")} value={c.name} />
        <Field label={tf("businessEntity")} value={c.business_entity_type ?? "—"} />
        <Field label={tf("npwp")} value={c.npwp ?? "—"} mono />
        <Field label={tf("nib")} value={c.nib ?? "—"} mono />
        <Field label={tf("businessCategory")} value={c.business_category ?? "—"} />
        <Field label={tf("serviceCategories")} value={c.service_categories.join(", ") || "—"} />
        <Field label={tf("website")} value={c.website ?? "—"} />
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Input value={value} readOnly className={`h-10 bg-zinc-50/50 ${mono ? "font-mono text-xs" : ""}`} />
    </div>
  );
}
