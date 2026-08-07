"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVendorMyProfile } from "@/hooks/use-vendor-my-profile";

function humanizePermissionKey(p: string): string {
  return p
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function VendorProfileAccessSection() {
  const t = useTranslations("Vendor.settings.sections");
  const tP = useTranslations("Vendor.settings.permissions");
  const tPL = useTranslations("Vendor.settings.permissions.labels");
  const { data, isLoading } = useVendorMyProfile();
  const u = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("access")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!u) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-zinc-600" />
          {t("access")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{tP("roles")}</p>
          <div className="flex flex-wrap gap-1.5">
            {u.roles.map((r) => (
              <Badge key={r} className="border bg-blue-50 text-blue-700 text-xs">{r}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{tP("list")}</p>
          <div className="flex flex-wrap gap-1.5">
            {u.permissions.length === 0 ? (
              <p className="text-sm text-zinc-500">{tP("none")}</p>
            ) : (
              u.permissions.map((p) => {
                // Permission keys pakai '.' (e.g. "vendor.access") tapi next-intl
                // tidak boleh ada '.' di namespace key, jadi lookup pakai '_'.
                const lookup = p.replace(/\./g, "_");
                let label: string;
                try {
                  const msg = tPL(lookup as never);
                  // next-intl di strict mode return key mentah kalau missing (prefix sama).
                  // Fallback ke humanized key supaya tidak menampilkan identifier mentah.
                  label = msg && !msg.startsWith("Vendor.settings.permissions.labels.")
                    ? msg
                    : humanizePermissionKey(p);
                } catch {
                  label = humanizePermissionKey(p);
                }
                return (
                  <Badge key={p} className="border bg-zinc-50 text-zinc-700 text-xs">
                    {label}
                  </Badge>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
