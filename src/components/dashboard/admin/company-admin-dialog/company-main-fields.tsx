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
import { BILLING_CYCLE_OPTIONS, billingCycleLabel } from "@/lib/billing-cycle-labels";
import type { CompanyDialogMode } from "@/components/dashboard/admin/company-admin-dialog/types";
import { ControlledAddressRegionFields } from "@/components/shared/controlled-address-region-fields";

type Props = {
  mode: CompanyDialogMode;
  readOnly: boolean;
  name: string;
  npwp: string;
  nib: string;
  billingCycle: string;
  paymentType: "prepaid" | "postpaid";
  postpaidTermDays: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  onNameChange: (v: string) => void;
  onNpwpChange: (v: string) => void;
  onNibChange: (v: string) => void;
  onBillingCycleChange: (v: string) => void;
  onPaymentTypeChange: (v: "prepaid" | "postpaid") => void;
  onPostpaidTermDaysChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onProvinceChange: (v: string) => void;
  onPostalCodeChange: (v: string) => void;
  onContactPersonChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
};

export function CompanyMainFields({
  mode,
  readOnly,
  name,
  npwp,
  nib,
  billingCycle,
  paymentType,
  postpaidTermDays,
  address,
  city,
  province,
  postalCode,
  contactPerson,
  email,
  phone,
  onNameChange,
  onNpwpChange,
  onNibChange,
  onBillingCycleChange,
  onPaymentTypeChange,
  onPostpaidTermDaysChange,
  onAddressChange,
  onCityChange,
  onProvinceChange,
  onPostalCodeChange,
  onContactPersonChange,
  onEmailChange,
  onPhoneChange,
}: Props) {
  return (
    <>
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="co-name">Nama perusahaan</Label>
        <Input
          id="co-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={mode === "create" ? "Nama resmi perusahaan" : undefined}
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="co-npwp">NPWP</Label>
        <Input
          id="co-npwp"
          value={npwp}
          onChange={(e) => onNpwpChange(e.target.value)}
          placeholder={mode === "create" ? "00.000.000.0-000.000" : undefined}
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="co-nib">NIB</Label>
        <Input
          id="co-nib"
          value={nib}
          onChange={(e) => onNibChange(e.target.value)}
          placeholder={mode === "create" ? "Nomor Induk Berusaha" : undefined}
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label>Tipe pembayaran</Label>
        <Select
          value={paymentType}
          onValueChange={(v) => v && onPaymentTypeChange(v as "prepaid" | "postpaid")}
          disabled={readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih tipe pembayaran">
              {paymentType === "prepaid" ? "Pre-paid" : "Post-paid"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prepaid">Pre-paid</SelectItem>
            <SelectItem value="postpaid">Post-paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label>Siklus penagihan</Label>
        <Select
          value={billingCycle}
          onValueChange={(v) => v && onBillingCycleChange(v)}
          disabled={readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih siklus penagihan">
              {billingCycleLabel(billingCycle)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BILLING_CYCLE_OPTIONS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {paymentType === "postpaid" && (
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="co-term">Jatuh tempo (hari)</Label>
          <Input
            id="co-term"
            value={postpaidTermDays}
            onChange={(e) => onPostpaidTermDaysChange(e.target.value.replace(/\D/g, ""))}
            placeholder="Contoh: 30"
            disabled={readOnly}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>
      )}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="co-addr">Alamat</Label>
        <Textarea
          id="co-addr"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={mode === "create" ? "Alamat lengkap jalan & gedung" : undefined}
          disabled={readOnly}
          rows={3}
        />
      </div>
      <ControlledAddressRegionFields
        className="md:col-span-2"
        idPrefix="co"
        value={{ province, city, postal_code: postalCode }}
        onChange={(patch) => {
          if (patch.province !== undefined) onProvinceChange(patch.province);
          if (patch.city !== undefined) onCityChange(patch.city);
          if (patch.postal_code !== undefined) onPostalCodeChange(patch.postal_code);
        }}
        disabled={readOnly}
        labels={{
          province: "Provinsi",
          city: "Kota",
          postalCode: "Kode pos",
        }}
      />
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="co-pic">PIC</Label>
        <Input
          id="co-pic"
          value={contactPerson}
          onChange={(e) => onContactPersonChange(e.target.value)}
          placeholder={mode === "create" ? "Nama penanggung jawab" : undefined}
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="co-email">Email</Label>
        <Input
          id="co-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={mode === "create" ? "perusahaan@domain.com" : undefined}
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="co-phone">Telepon</Label>
        <Input
          id="co-phone"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder={mode === "create" ? "081234567890 atau 6281234567890" : undefined}
          disabled={readOnly}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>
    </>
  );
}
