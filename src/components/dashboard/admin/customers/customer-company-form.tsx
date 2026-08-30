"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { fetchAdminCompany, updateAdminCompany } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useAdminPostalCodeOptions } from "@/hooks/use-admin-postal-code-options";
import { toast } from "sonner";
import { ControlledAddressRegionFields } from "@/components/shared/controlled-address-region-fields";
import { CustomerOperationalFields } from "@/components/dashboard/admin/customers/customer-operational-fields";
import { BusinessEntityField } from "@/components/dashboard/admin/customers/business-entity-field";
import { CUSTOMER_STATUS_OPTIONS, DEFAULT_COUNTRY } from "@/lib/customer-form-options";

function normalizeMonthlyEstimate(value: unknown): string {
  const mapping: Record<string, string> = {
    "<10": "under_10",
    "10-50": "10_to_50",
    "50-100": "50_to_100",
    ">100": "over_100",
  };
  const raw = String(value ?? "");
  return mapping[raw] ?? raw;
}

export function CustomerCompanyForm({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);
  const backPath = `/${locale}/dashboard/admin/customer/customers/${id}`;

  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const caps = useMemo(() => getAdminCustomerCapabilities(user?.roles ?? []), [user?.roles]);
  const canEdit = authHydrated && caps.canEditCompanyData;
  const readOnly = authHydrated && !canEdit;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [businessEntity, setBusinessEntity] = useState("PT");
  const [businessEntityOther, setBusinessEntityOther] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [customerStatus, setCustomerStatus] = useState("pending");
  const [website, setWebsite] = useState("");
  const [npwp, setNpwp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [postalCode, setPostalCode] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessCategoryOther, setBusinessCategoryOther] = useState("");
  const [monthlyShipmentEstimate, setMonthlyShipmentEstimate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const { postalCodeOptions, loadingPostalCodes } = useAdminPostalCodeOptions(
    province,
    city,
    district,
  );

  const refreshData = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    try {
      const res = await fetchAdminCompany(id);
      const d = (res as { data: Record<string, unknown> }).data;
      setDetail(d);
      setName(String(d.name ?? ""));
      setBusinessEntity(String(d.business_entity_type ?? "PT"));
      setBusinessEntityOther(String(d.business_entity_other ?? ""));
      setCompanyCode(String(d.company_code ?? ""));
      setCustomerStatus(String(d.status ?? "pending"));
      setWebsite(String(d.website ?? ""));
      setNpwp(String(d.npwp ?? ""));
      setAddress(String(d.address ?? ""));
      setCity(String(d.city ?? ""));
      setProvince(String(d.province ?? ""));
      setDistrict(String(d.district ?? ""));
      setCountry(String(d.country ?? "Indonesia"));
      setPostalCode(String(d.postal_code ?? ""));
      setBusinessCategory(String(d.business_category ?? ""));
      setBusinessCategoryOther(String(d.business_category_other ?? ""));
      setMonthlyShipmentEstimate(normalizeMonthlyEstimate(d.monthly_shipment_estimate));
      setEmail(String(d.email ?? ""));
      setPhone(String(d.phone ?? ""));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("toasts.loadFailed"));
    }
  }, [id, t]);

  useEffect(() => {
    setLoading(true);
    void refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  const requiredFieldsComplete = Boolean(
    businessEntity
      && (businessEntity !== "Lainnya" || businessEntityOther.trim())
      && name.trim()
      && companyCode.trim()
      && npwp.trim()
      && email.trim()
      && phone.trim()
      && country.trim()
      && province.trim()
      && city.trim()
      && district.trim()
      && postalCode.trim()
      && address.trim()
      && businessCategory
      && (businessCategory !== "others" || businessCategoryOther.trim())
      && monthlyShipmentEstimate
      && customerStatus,
  );

  const save = async () => {
    if (!canEdit || !Number.isFinite(id) || id < 1) return;
    setSaving(true);
    setError(null);
    try {
      if (!requiredFieldsComplete) {
        setError(t("form.requiredFields"));
        return;
      }
      const cleanedPhone = phone.trim();
      if (cleanedPhone && !/^(0|62)\d+$/.test(cleanedPhone)) {
        setError(t("form.phoneFormatError"));
        setSaving(false);
        return;
      }
      await updateAdminCompany(id, {
        name: name.trim(),
        business_entity_type: businessEntity,
        business_entity_other: businessEntity === "Lainnya" ? businessEntityOther.trim() || null : null,
        company_code: companyCode.trim() || null,
        status: customerStatus,
        website: website.trim() || null,
        npwp: npwp.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        district: district.trim() || null,
        country: country.trim() || null,
        postal_code: postalCode.trim() || null,
        business_category: businessCategory || null,
        business_category_other: businessCategory === "others" ? businessCategoryOther.trim() || null : null,
        monthly_shipment_estimate: monthlyShipmentEstimate || null,
        email: email.trim() || null,
        phone: cleanedPhone || null,
      });
      toast.success(t("toasts.updated"));
      await refreshData();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : tc("errors.saveFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!authHydrated) {
    return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;
  }

  if (!canEdit && !readOnly) {
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

  const companyStatus = String(detail?.status ?? "").toLowerCase();
  const codeLocked = companyStatus === "active" || detail?.approved_at != null;

  const formBody = (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="border-b pb-2 text-sm font-bold uppercase tracking-wider">
          {t("create.sectionCompany")}
        </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <BusinessEntityField
          value={businessEntity}
          otherValue={businessEntityOther}
          onChange={setBusinessEntity}
          onOtherChange={setBusinessEntityOther}
          disabled={readOnly}
          entityLabel={t("form.businessEntity")}
          otherLabel={t("form.businessEntityOther")}
        />
        <div className="space-y-2">
          <Label>{t("form.companyName")}</Label>
          <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.customerCode")}</Label>
          <Input
            className="h-9 uppercase"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
            disabled={readOnly || codeLocked}
            maxLength={3}
          />
          <p className="text-xs text-muted-foreground">{t("form.customerCodeHint")}</p>
        </div>
        <div className="space-y-2">
          <Label>{t("form.npwp")}</Label>
          <Input className="h-9" value={npwp} onChange={(e) => setNpwp(e.target.value.replace(/\D/g, ""))} disabled={readOnly} maxLength={16} inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <Label>{t("form.email")}</Label>
          <Input className="h-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.phone")}</Label>
          <Input
            className="h-9"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            disabled={readOnly}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("form.website")}</Label>
          <Input className="h-9" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.customerStatus")}</Label>
          <Select value={customerStatus} onValueChange={(v) => v && setCustomerStatus(v)} disabled={readOnly}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CUSTOMER_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {t(`statusOptions.${s.labelKey}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b pb-2 text-sm font-bold uppercase tracking-wider">
          {t("create.sectionAddress")}
        </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <ControlledAddressRegionFields
          className="md:col-span-2"
          value={{ country, province, city, district, postal_code: postalCode }}
          onChange={(patch) => {
            if (patch.country !== undefined) setCountry(patch.country);
            if (patch.province !== undefined) setProvince(patch.province);
            if (patch.city !== undefined) setCity(patch.city);
            if (patch.district !== undefined) setDistrict(patch.district);
            if (patch.postal_code !== undefined) setPostalCode(patch.postal_code);
          }}
          disabled={readOnly}
          showCountry
          showDistrict
          postalCodeOptions={postalCodeOptions}
          loadingPostalCodes={loadingPostalCodes}
          labels={{
            province: t("form.province"),
            city: t("form.city"),
            postalCode: t("form.postalCode"),
          }}
        />
        <div className="space-y-2 md:col-span-2">
          <Label>{t("form.address")}</Label>
          <Textarea className="min-h-[80px]" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} disabled={readOnly} />
        </div>
      </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b pb-2 text-sm font-bold uppercase tracking-wider">
          {t("create.sectionOperational")}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
        <CustomerOperationalFields
          businessCategory={businessCategory}
          businessCategoryOther={businessCategoryOther}
          monthlyShipmentEstimate={monthlyShipmentEstimate}
          onBusinessCategoryChange={setBusinessCategory}
          onBusinessCategoryOtherChange={setBusinessCategoryOther}
          onMonthlyShipmentEstimateChange={setMonthlyShipmentEstimate}
          disabled={readOnly}
        />
      </div>
      </section>

      <div className="flex justify-end gap-2">
        {!embedded ? (
          <Button variant="outline" onClick={() => router.push(backPath)} disabled={saving}>
            {tc("actions.cancel")}
          </Button>
        ) : null}
        {canEdit ? (
          <Button onClick={() => void save()} disabled={saving || !requiredFieldsComplete}>
            {saving ? tc("actions.saving") : tc("actions.save")}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const inner = (
    <>
      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p> : null}
      {!loading ? formBody : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{inner}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editCustomer")}</CardTitle>
        <CardDescription>{t("editDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{inner}</CardContent>
    </Card>
  );
}
