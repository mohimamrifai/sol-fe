"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useUpdateVendorCompany, useVendorCompany } from "@/hooks/use-vendor-company";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function VendorCompanyFormDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("Vendor.company.form.sections");
  const tForm = useTranslations("Vendor.company.form");
  const tCommon = useTranslations("Vendor.common");
  const tf = useTranslations("Vendor.company.fields");
  const { data } = useVendorCompany();
  const update = useUpdateVendorCompany();

  const c = data?.data;
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picMobile, setPicMobile] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (c) {
      setAddress(c.address ?? "");
      setCity(c.city ?? "");
      setProvince(c.province ?? "");
      setDistrict(c.district ?? "");
      setPostalCode(c.postal_code ?? "");
      setCountry(c.country ?? "Indonesia");
      setEmail(c.email ?? "");
      setPhone(c.phone ?? "");
      setWebsite(c.website ?? "");
      setPicName(c.pic_name ?? "");
      setPicEmail(c.pic_email ?? "");
      setPicMobile(c.pic_mobile ?? "");
      setBankName(c.bank_name ?? "");
      setBankAccountName(c.bank_account_name ?? "");
      setBankAccountNumber(c.bank_account_number ?? "");
      setDirty(false);
    }
  }, [c, open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({
        address: address || null,
        city: city || null,
        province: province || null,
        district: district || null,
        postal_code: postalCode || null,
        country: country || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        pic_name: picName || null,
        pic_email: picEmail || null,
        pic_mobile: picMobile || null,
        bank_name: bankName || null,
        bank_account_name: bankAccountName || null,
        bank_account_number: bankAccountNumber || null,
      });
      toast.success("Profil perusahaan berhasil diperbarui.");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422
        ? firstLaravelError(e.body) ?? e.message
        : e instanceof ApiError ? e.message : "Gagal memperbarui profil.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tForm("editDialogTitle")}</DialogTitle>
        </DialogHeader>
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {tForm("readonlyNotice")}
        </p>
        <form onSubmit={onSubmit} className="grid max-h-[70vh] gap-4 overflow-y-auto pr-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t("company")}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">{tf("companyCode")}</Label>
                <Input value={c?.company_code ?? ""} readOnly className="h-10 bg-zinc-50/50 font-mono text-xs" />
              </div>
              <div>
                <Label className="text-xs">{tf("businessEntity")}</Label>
                <Input value={c?.business_entity_type ?? ""} readOnly className="h-10 bg-zinc-50/50" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">{t("address")}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="text-xs">{tf("address")}</Label>
                <Input value={address} onChange={(e) => { setAddress(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("city")}</Label>
                <Input value={city} onChange={(e) => { setCity(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("province")}</Label>
                <Input value={province} onChange={(e) => { setProvince(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("district")}</Label>
                <Input value={district} onChange={(e) => { setDistrict(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("postalCode")}</Label>
                <Input value={postalCode} onChange={(e) => { setPostalCode(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("country")}</Label>
                <Input value={country} onChange={(e) => { setCountry(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("email")}</Label>
                <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("phone")}</Label>
                <Input value={phone} onChange={(e) => { setPhone(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">{tf("website")}</Label>
                <Input value={website} onChange={(e) => { setWebsite(e.target.value); setDirty(true); }} className="h-10" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">{t("contact")}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label className="text-xs">{tf("picName")}</Label>
                <Input value={picName} onChange={(e) => { setPicName(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("picEmail")}</Label>
                <Input type="email" value={picEmail} onChange={(e) => { setPicEmail(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("picMobile")}</Label>
                <Input value={picMobile} onChange={(e) => { setPicMobile(e.target.value); setDirty(true); }} className="h-10" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">{t("bank")}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label className="text-xs">{tf("bankName")}</Label>
                <Input value={bankName} onChange={(e) => { setBankName(e.target.value); setDirty(true); }} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">{tf("accountNumber")}</Label>
                <Input value={bankAccountNumber} onChange={(e) => { setBankAccountNumber(e.target.value); setDirty(true); }} className="h-10 font-mono text-xs" />
              </div>
              <div>
                <Label className="text-xs">{tf("accountName")}</Label>
                <Input value={bankAccountName} onChange={(e) => { setBankAccountName(e.target.value); setDirty(true); }} className="h-10" />
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button disabled={!dirty || update.isPending} onClick={onSubmit as unknown as () => void}>
            {tForm("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
