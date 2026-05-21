"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PartyProps {
  type: "Shipper" | "Consignee";
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  isSameAsAccount?: boolean;
  setIsSameAsAccount?: (v: boolean) => void;
  renderFieldError: (field: string) => string | null;
}

export function PartyInfoSection({
  type,
  name, setName,
  phone, setPhone,
  address, setAddress,
  isSameAsAccount, setIsSameAsAccount,
  renderFieldError,
}: PartyProps) {
  const isShipper = type === "Shipper";
  const prefix = isShipper ? "shipper" : "consignee";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isShipper ? "Shipper (Pengirim)" : "Consignee (Penerima)"}</CardTitle>
        <CardDescription>
          {isShipper ? "Data pihak yang mengirim barang." : "Data pihak yang akan menerima barang."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isShipper && setIsSameAsAccount && (
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id="same-account"
              checked={isSameAsAccount}
              onCheckedChange={(v) => setIsSameAsAccount(v === true)}
            />
            <Label htmlFor="same-account" className="text-xs font-normal cursor-pointer text-zinc-600">
              Gunakan data profil perusahaan Anda
            </Label>
          </div>
        )}
        <div className="space-y-1">
          <Label>Nama {isShipper ? "Pengirim" : "Penerima"} <span className="text-red-500">*</span></Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama perusahaan atau perorangan"
            className={cn(renderFieldError(`${prefix}_name`) && "border-red-500 ring-2 ring-red-500/20")}
            required
          />
          {renderFieldError(`${prefix}_name`) && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError(`${prefix}_name`)}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Nomor Telepon <span className="text-red-500">*</span></Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 08123456789"
            className={cn(renderFieldError(`${prefix}_phone`) && "border-red-500 ring-2 ring-red-500/20")}
            required
          />
          {renderFieldError(`${prefix}_phone`) && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError(`${prefix}_phone`)}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={isShipper ? "Alamat lengkap lokasi penjemputan" : "Alamat lengkap lokasi tujuan pengiriman"}
            rows={3}
            className={cn(renderFieldError(`${prefix}_address`) && "border-red-500 ring-2 ring-red-500/20")}
            required
          />
          {renderFieldError(`${prefix}_address`) && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError(`${prefix}_address`)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
