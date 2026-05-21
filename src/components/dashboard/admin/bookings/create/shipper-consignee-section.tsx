"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactFields {
  name: string;
  address: string;
  phone: string;
}

interface ShipperConsigneeSectionProps {
  shipper: ContactFields;
  onShipperChange: (fields: Partial<ContactFields>) => void;
  consignee: ContactFields;
  onConsigneeChange: (fields: Partial<ContactFields>) => void;
  renderError: (field: string) => React.ReactNode;
  validationErrors?: Record<string, string[]>;
  companyData?: { name?: string; address?: string; phone?: string; };
}

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export function ShipperConsigneeSection({
  shipper,
  onShipperChange,
  consignee,
  onConsigneeChange,
  renderError,
  validationErrors,
  companyData,
}: ShipperConsigneeSectionProps) {
  const [useCompanyData, setUseCompanyData] = useState(false);

  const handleUseCompanyDataChange = (checked: boolean) => {
    setUseCompanyData(checked);
    if (checked && companyData) {
      onShipperChange({
        name: companyData.name || "",
        address: companyData.address || "",
        phone: companyData.phone || "",
      });
    } else {
      onShipperChange({
        name: "",
        address: "",
        phone: "",
      });
    }
  };

  return (
    <>
      <div className="sm:col-span-1 space-y-4 rounded-lg border p-4 bg-zinc-50/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Data Pengirim (Shipper)</h3>
          {companyData && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-company-data"
                checked={useCompanyData}
                onCheckedChange={handleUseCompanyDataChange}
              />
              <label
                htmlFor="use-company-data"
                className="text-[11px] font-medium leading-none cursor-pointer"
              >
                Sama dengan Customer
              </label>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Nama Pengirim</Label>
          <Input
            value={shipper.name}
            onChange={(e) => onShipperChange({ name: e.target.value })}
            required
            className={cn(
              "h-9",
              validationErrors?.shipper_name ? "border-red-500" : ""
            )}
          />
          {renderError("shipper_name")}
        </div>
        <div className="space-y-2">
          <Label>Alamat Pengirim</Label>
          <Textarea
            value={shipper.address}
            onChange={(e) => onShipperChange({ address: e.target.value })}
            rows={2}
            required
            className={cn(
              "min-h-[60px]",
              validationErrors?.shipper_address ? "border-red-500" : ""
            )}
          />
          {renderError("shipper_address")}
        </div>
        <div className="space-y-2">
          <Label>Telepon Pengirim</Label>
          <Input
            value={shipper.phone}
            onChange={(e) => onShipperChange({ phone: e.target.value })}
            required
            className={cn(
              "h-9",
              validationErrors?.shipper_phone ? "border-red-500" : ""
            )}
          />
          {renderError("shipper_phone")}
        </div>
      </div>

      <div className="sm:col-span-1 space-y-4 rounded-lg border p-4 bg-zinc-50/50">
        <h3 className="text-sm font-semibold">Data Penerima (Consignee)</h3>
        <div className="space-y-2">
          <Label>Nama Penerima</Label>
          <Input
            value={consignee.name}
            onChange={(e) => onConsigneeChange({ name: e.target.value })}
            required
            className={cn(
              "h-9",
              validationErrors?.consignee_name ? "border-red-500" : ""
            )}
          />
          {renderError("consignee_name")}
        </div>
        <div className="space-y-2">
          <Label>Alamat Penerima</Label>
          <Textarea
            value={consignee.address}
            onChange={(e) => onConsigneeChange({ address: e.target.value })}
            rows={2}
            required
            className={cn(
              "min-h-[60px]",
              validationErrors?.consignee_address ? "border-red-500" : ""
            )}
          />
          {renderError("consignee_address")}
        </div>
        <div className="space-y-2">
          <Label>Telepon Penerima</Label>
          <Input
            value={consignee.phone}
            onChange={(e) => onConsigneeChange({ phone: e.target.value })}
            required
            className={cn(
              "h-9",
              validationErrors?.consignee_phone ? "border-red-500" : ""
            )}
          />
          {renderError("consignee_phone")}
        </div>
      </div>
    </>
  );
}
