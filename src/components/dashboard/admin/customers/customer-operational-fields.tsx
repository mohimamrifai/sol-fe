"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUSINESS_CATEGORY_OPTIONS,
  MONTHLY_SHIPMENT_ESTIMATE_OPTIONS,
} from "@/lib/customer-operational-options";

type Props = {
  businessCategory: string;
  businessCategoryOther: string;
  monthlyShipmentEstimate: string;
  onBusinessCategoryChange: (value: string) => void;
  onBusinessCategoryOtherChange: (value: string) => void;
  onMonthlyShipmentEstimateChange: (value: string) => void;
  disabled?: boolean;
};

export function CustomerOperationalFields({
  businessCategory,
  businessCategoryOther,
  monthlyShipmentEstimate,
  onBusinessCategoryChange,
  onBusinessCategoryOtherChange,
  onMonthlyShipmentEstimateChange,
  disabled = false,
}: Props) {
  const t = useTranslations("Company");

  return (
    <>
      <div className="space-y-2">
        <Label>{t("form.businessCategory")}</Label>
        <Select value={businessCategory} onValueChange={(v) => v && onBusinessCategoryChange(v)} disabled={disabled}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder={t("form.businessCategory")}>
              {businessCategory
                ? t(`businessCategory.${businessCategory}` as `businessCategory.${string}`)
                : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(`businessCategory.${opt.labelKey}` as `businessCategory.${string}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {businessCategory === "others" ? (
        <div className="space-y-2">
          <Label>{t("form.businessCategory")} (Lainnya)</Label>
          <Input
            className="h-9 max-w-md"
            value={businessCategoryOther}
            onChange={(e) => onBusinessCategoryOtherChange(e.target.value)}
            disabled={disabled}
            placeholder="Jelaskan kategori bisnis"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>{t("form.monthlyShipmentEstimate")}</Label>
        <Select
          value={monthlyShipmentEstimate}
          onValueChange={(v) => v && onMonthlyShipmentEstimateChange(v)}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder={t("form.monthlyShipmentEstimate")}>
              {monthlyShipmentEstimate
                ? t(`monthlyEstimate.${monthlyShipmentEstimate}` as `monthlyEstimate.${string}`)
                : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MONTHLY_SHIPMENT_ESTIMATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(`monthlyEstimate.${opt.labelKey}` as `monthlyEstimate.${string}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
