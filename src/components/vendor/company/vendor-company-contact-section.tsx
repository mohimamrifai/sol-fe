"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog } from "lucide-react";
import { useVendorCompany } from "@/hooks/use-vendor-company";

export function VendorCompanyContactSection() {
  const t = useTranslations("Vendor.company");
  const tf = useTranslations("Vendor.company.fields");
  const { data, isLoading } = useVendorCompany();
  const c = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sections.contact")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!c) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-base">{t("sections.contact")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Field label={tf("picName")} value={c.pic_name ?? "—"} />
        <Field label={tf("picEmail")} value={c.pic_email ?? "—"} />
        <Field label={tf("picMobile")} value={c.pic_mobile ?? "—"} />
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
