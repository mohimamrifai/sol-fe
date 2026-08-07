"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { useVendorCompany } from "@/hooks/use-vendor-company";

export function VendorCompanyAddressSection() {
  const t = useTranslations("Vendor.company");
  const tf = useTranslations("Vendor.company.fields");
  const { data, isLoading } = useVendorCompany();
  const c = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sections.address")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!c) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-base">{t("sections.address")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label className="text-xs text-zinc-500">{tf("address")}</Label>
          <Input value={c.address ?? "—"} readOnly className="h-10 bg-zinc-50/50" />
        </div>
        <Field label={tf("city")} value={c.city ?? "—"} />
        <Field label={tf("province")} value={c.province ?? "—"} />
        <Field label={tf("district")} value={c.district ?? "—"} />
        <Field label={tf("postalCode")} value={c.postal_code ?? "—"} />
        <Field label={tf("country")} value={c.country ?? "—"} />
        <Field label={tf("email")} value={c.email ?? "—"} />
        <Field label={tf("phone")} value={c.phone ?? "—"} />
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Input value={value} readOnly className="h-10 bg-zinc-50/50" />
    </div>
  );
}
