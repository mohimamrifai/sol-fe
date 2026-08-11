"use client";

import { useState } from "react";
import { ControlledAddressRegionFields } from "@/components/shared/controlled-address-region-fields";

type BranchCityRegionFieldsProps = {
  city: string;
  onCityChange: (value: string) => void;
  disabled?: boolean;
};

/** Province is UI-only for cascading city search; only city is persisted on branch records. */
export function BranchCityRegionFields({
  city,
  onCityChange,
  disabled = false,
}: BranchCityRegionFieldsProps) {
  const [province, setProvince] = useState("");

  return (
    <ControlledAddressRegionFields
      className="grid-cols-1 gap-3"
      idPrefix="branch"
      value={{ province, city }}
      onChange={(patch) => {
        if (patch.province !== undefined) setProvince(patch.province);
        if (patch.city !== undefined) onCityChange(patch.city);
      }}
      disabled={disabled}
      showPostalCode={false}
      labels={{
        province: "Provinsi",
        city: "Kota",
      }}
    />
  );
}
