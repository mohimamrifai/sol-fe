"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { BUSINESS_ENTITY_OPTIONS } from "@/lib/customer-form-options";

type Props = {
  value: string;
  otherValue: string;
  onChange: (value: string) => void;
  onOtherChange: (value: string) => void;
  disabled?: boolean;
  entityLabel: string;
  otherLabel: string;
};

export function BusinessEntityField({
  value,
  otherValue,
  onChange,
  onOtherChange,
  disabled = false,
  entityLabel,
  otherLabel,
}: Props) {
  const options = BUSINESS_ENTITY_OPTIONS.map((e) => ({ value: e, label: e }));

  return (
    <>
      <div className="space-y-2">
        <Label>{entityLabel}</Label>
        <SearchableCombobox
          value={value}
          onChange={onChange}
          options={options}
          disabled={disabled}
          className="h-9"
        />
      </div>
      {value === "Lainnya" ? (
        <div className="space-y-2 md:col-span-2">
          <Label>{otherLabel}</Label>
          <Input
            className="h-9"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      ) : null}
    </>
  );
}
