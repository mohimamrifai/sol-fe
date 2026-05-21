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

interface InvoiceMainFieldsProps {
  shipments: { id: number; label: string; company_id?: number }[];
  companies: { id: number; name: string }[];
  listsLoading: boolean;
  values: {
    shipmentId: string;
    companyId: string;
    issuedDate: string;
    dueDate: string;
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
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Shipment</Label>
        <Select
          value={values.shipmentId}
          onValueChange={(v) => v && onShipmentPick(v)}
          disabled={listsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={listsLoading ? "Memuat…" : "Pilih shipment"} />
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
        <Label className="text-sm font-semibold">Pilih Perusahaan</Label>
        <Select
          value={values.companyId}
          onValueChange={(v) => v && onChange("companyId", v)}
          disabled={listsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={listsLoading ? "Memuat…" : "Pilih perusahaan"} />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inv-issued" className="text-sm font-semibold">Tanggal Terbit</Label>
          <Input
            id="inv-issued"
            type="date"
            value={values.issuedDate}
            onChange={(e) => onChange("issuedDate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-due" className="text-sm font-semibold">Jatuh Tempo</Label>
          <Input
            id="inv-due"
            type="date"
            value={values.dueDate}
            onChange={(e) => onChange("dueDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inv-notes" className="text-sm font-semibold">Catatan Invoice</Label>
        <Textarea
          id="inv-notes"
          value={values.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={2}
          placeholder="Opsional (akan muncul di PDF)"
          className="resize-none"
        />
      </div>
    </div>
  );
}
