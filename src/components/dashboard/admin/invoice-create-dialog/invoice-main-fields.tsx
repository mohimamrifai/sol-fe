"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface InvoiceMainFieldsProps {
  shipments: { id: number; label: string; company_id?: number }[];
  companies: { id: number; name: string }[];
  listsLoading: boolean;
  values: {
    shipmentId: string;
    companyId: string;
    invoiceDate: string;
    notes: string;
  };
  onChange: (key: string, value: string) => void;
  onShipmentPick: (value: string) => void;
}

export function InvoiceMainFields({
  shipments,
  companies,
  listsLoading,
  values,
  onChange,
  onShipmentPick,
}: InvoiceMainFieldsProps) {
  const t = useTranslations("AdminInvoices");
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t("detail.shipmentNo")}</Label>
        <Select
          value={values.shipmentId}
          onValueChange={(v) => v && onShipmentPick(v)}
          disabled={listsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={listsLoading ? t("generateDialog.loading") : t("create.selectShipment")} />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t("detail.customer")}</Label>
        <Select
          value={values.companyId}
          onValueChange={(v) => v && onChange("companyId", v)}
          disabled={listsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={listsLoading ? t("generateDialog.loading") : t("create.selectCustomer")} />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inv-date" className="text-sm font-semibold">{t("detail.invoiceDate")}</Label>
        <Input
          id="inv-date"
          type="date"
          value={values.invoiceDate}
          onChange={(e) => onChange("invoiceDate", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inv-notes" className="text-sm font-semibold">{t("detail.remark")}</Label>
        <Textarea
          id="inv-notes"
          value={values.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={2}
          placeholder={t("create.remarkPlaceholder")}
          className="resize-none"
        />
      </div>
    </div>
  );
}
