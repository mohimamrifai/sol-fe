"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createAdminCompany } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { toast } from "sonner";
import { ControlledAddressRegionFields } from "@/components/shared/controlled-address-region-fields";
import { CustomerOperationalFields } from "@/components/dashboard/admin/customers/customer-operational-fields";

const BUSINESS_ENTITY_OPTIONS = ["PT", "CV", "UD", "Koperasi", "Yayasan", "Firma", "Perorangan", "Lainnya"];

export default function AdminCustomerCreatePage() {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const backPath = `/${locale}/dashboard/admin/customer/customers`;

  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const caps = useMemo(() => getAdminCustomerCapabilities(user?.roles ?? []), [user?.roles]);
  const canCreate = authHydrated && caps.canCreateCustomer;

  const [businessEntityType, setBusinessEntityType] = useState("PT");
  const [companyCode, setCompanyCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [name, setName] = useState("");
  const [npwp, setNpwp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [postalCode, setPostalCode] = useState("");
  const [website, setWebsite] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessCategoryOther, setBusinessCategoryOther] = useState("");
  const [monthlyShipmentEstimate, setMonthlyShipmentEstimate] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derivedCompanyCode = useMemo(() => {
    const raw = name.trim();
    if (!raw) return "";
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9\s\-_]/g, " ").replace(/\s+/g, " ").trim();
    const tokens = normalized.split(/[\s\-_]+/).filter(Boolean);
    let code = "";
    for (const token of tokens) {
      const ch = token.replace(/[^A-Z]/g, "").slice(0, 1);
      if (ch) code += ch;
      if (code.length >= 3) break;
    }
    const lettersOnly = normalized.replace(/[^A-Z]/g, "");
    if (code.length < 3) code += lettersOnly.slice(code.length, 3);
    code = code.slice(0, 3);
    return code.length === 3 ? code : "";
  }, [name]);

  useEffect(() => {
    if (!codeTouched) setCompanyCode(derivedCompanyCode);
  }, [derivedCompanyCode, codeTouched]);

  const save = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      const cleanedPhone = phone.trim();
      if (cleanedPhone && !/^(0|62)\d+$/.test(cleanedPhone)) {
        setError(t("form.phoneFormatError"));
        setSaving(false);
        return;
      }
      const code = companyCode.trim().toUpperCase();
      if (code && !/^[A-Z]{3}$/.test(code)) {
        setError(t("form.customerCodeHint"));
        setSaving(false);
        return;
      }

      await createAdminCompany({
        business_entity_type: businessEntityType,
        name: name.trim(),
        company_code: code || undefined,
        npwp: npwp.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        district: district.trim() || null,
        country: country.trim() || null,
        postal_code: postalCode.trim() || null,
        website: website.trim() || null,
        business_category: businessCategory || null,
        business_category_other: businessCategory === "others" ? businessCategoryOther.trim() || null : null,
        monthly_shipment_estimate: monthlyShipmentEstimate || null,
        contact_person: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: cleanedPhone || null,
        pic_name: contactPerson.trim() || null,
        pic_email: picEmail.trim() || null,
        pic_phone: picPhone.trim() || null,
        password: password || undefined,
        status: "pending",
      });
      toast.success(t("create.saved"));
      router.push(backPath);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : t("create.saveFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("accessDenied")}</CardTitle>
          <CardDescription>{t("accessDeniedDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push(backPath)}>
            {t("actions.back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("create.title")}</CardTitle>
        <CardDescription>{t("create.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b pb-2">{t("create.sectionCompany")}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("form.businessEntity")}</Label>
              <Select value={businessEntityType} onValueChange={(v) => v && setBusinessEntityType(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_ENTITY_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("form.companyName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("form.customerCode")}</Label>
              <Input
                value={companyCode}
                onChange={(e) => {
                  setCodeTouched(true);
                  setCompanyCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3));
                }}
                maxLength={3}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">{t("form.customerCodeHint")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("form.npwp")}</Label>
              <Input value={npwp} onChange={(e) => setNpwp(e.target.value)} maxLength={16} />
            </div>
            <div className="space-y-2">
              <Label>{t("form.companyEmail")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("form.companyPhone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("form.website")}</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b pb-2">{t("create.sectionAddress")}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{t("form.address")}</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
            </div>
            <ControlledAddressRegionFields
              className="md:col-span-2"
              idPrefix="create-co"
              value={{ country, province, city, district, postal_code: postalCode }}
              onChange={(patch) => {
                if (patch.country !== undefined) setCountry(patch.country);
                if (patch.province !== undefined) setProvince(patch.province);
                if (patch.city !== undefined) setCity(patch.city);
                if (patch.district !== undefined) setDistrict(patch.district);
                if (patch.postal_code !== undefined) setPostalCode(patch.postal_code);
              }}
              showCountry
              showDistrict
              labels={{
                province: t("form.province"),
                city: t("form.city"),
                postalCode: t("form.postalCode"),
              }}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b pb-2">{t("create.sectionOperational")}</h3>
          <CustomerOperationalFields
            businessCategory={businessCategory}
            businessCategoryOther={businessCategoryOther}
            monthlyShipmentEstimate={monthlyShipmentEstimate}
            onBusinessCategoryChange={setBusinessCategory}
            onBusinessCategoryOtherChange={setBusinessCategoryOther}
            onMonthlyShipmentEstimateChange={setMonthlyShipmentEstimate}
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b pb-2">{t("create.sectionAdmin")}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("create.adminName")}</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("create.adminEmail")}</Label>
              <Input type="email" value={picEmail} onChange={(e) => setPicEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("create.mobileNumber")}</Label>
              <Input value={picPhone} onChange={(e) => setPicPhone(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label>{t("create.tempPassword")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t("create.tempPasswordHint")}</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(backPath)} disabled={saving}>
            {tc("actions.cancel")}
          </Button>
          <Button onClick={() => void save()} disabled={saving || !name.trim()}>
            {saving ? tc("actions.saving") : tc("actions.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
