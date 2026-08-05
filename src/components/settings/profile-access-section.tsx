"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ListChecks } from "lucide-react";

const FEATURE_KEYS = [
  "view_company", "manage_company",
  "view_locations", "manage_locations",
  "view_users", "create_users", "edit_users",
  "view_bookings", "create_bookings", "manage_bookings",
  "view_shipments", "view_invoices", "view_payments",
  "view_documents", "manage_documents",
];

export function ProfileAccessSection() {
  const t = useTranslations("Profile");
  const tFeature = useTranslations("Users.featureAccess");
  const { user } = useAuthStore();
  const locations = user?.location_access ?? [];
  const features = user?.feature_access ?? [];

  const featureLabel = (f: string): string => {
    return FEATURE_KEYS.includes(f) ? tFeature(f as `featureAccess.${string}`) : f;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <MapPin className="h-4 w-4 text-zinc-600" />
          {t("sections.accessInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <MapPin className="mr-1 inline h-3 w-3" />
            {t("access.locations")}
          </p>
          {locations.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("access.noLocations")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {locations.map((l) => (
                <Badge key={l.id} variant="outline" className="text-xs">
                  {l.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <ListChecks className="mr-1 inline h-3 w-3" />
            {t("access.features")}
          </p>
          {features.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("access.noFeatures")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {features.map((f) => (
                <Badge key={f} variant="secondary" className="text-[10px]">
                  {featureLabel(f)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
