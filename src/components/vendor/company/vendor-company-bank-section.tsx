"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark } from "lucide-react";
import { useVendorCompany } from "@/hooks/use-vendor-company";

export function VendorCompanyBankSection() {
  const t = useTranslations("Vendor.company");
  const tf = useTranslations("Vendor.company.fields");
  const { data, isLoading } = useVendorCompany();
  const c = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sections.bank")}</CardTitle>
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
          <Landmark className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-base">{t("sections.bank")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Field label={tf("bankName")} value={c.bank_name ?? "—"} />
        <Field label={tf("accountNumber")} value={c.bank_account_number ?? "—"} mono />
        <div className="md:col-span-2">
          <Field label={tf("accountName")} value={c.bank_account_name ?? "—"} />
        </div>
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
