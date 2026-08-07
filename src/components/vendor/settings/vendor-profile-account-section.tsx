"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVendorMyProfile } from "@/hooks/use-vendor-my-profile";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

export function VendorProfileAccountSection() {
  const t = useTranslations("Vendor.settings.sections");
  const tF = useTranslations("Vendor.settings.fields");
  const { data, isLoading } = useVendorMyProfile();
  const u = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("account")}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!u) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-zinc-600" />
          {t("account")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={tF("companyName")} value={u.company?.name ?? "—"} />
          <Field label={tF("companyCode")} value={u.company?.company_code ?? "—"} mono />
          <Field label={tF("userType")} value={u.user_type.toUpperCase()} />
          <div>
            <Label className={LABEL}>Status</Label>
            <div>
              <Badge className={`${STATUS_BADGE[u.status] ?? ""} border text-xs`}>{u.status}</Badge>
            </div>
          </div>
          <Field label={tF("memberSince")} value={u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label className={LABEL}>{label}</Label>
      <Input value={value} readOnly className={`h-10 bg-zinc-50/50 ${mono ? "font-mono text-xs" : ""}`} />
    </div>
  );
}
