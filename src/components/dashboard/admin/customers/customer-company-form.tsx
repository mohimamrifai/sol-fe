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
import { BILLING_CYCLE_OPTIONS, FSD_BILLING_CYCLE_OPTIONS, FSD_PAYMENT_TERM_OPTIONS, billingCycleLabel } from "@/lib/billing-cycle-labels";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { toast } from "sonner";
import { DiscountManagement } from "@/components/dashboard/admin/customers/discount-management";
import { StatusManagerSection } from "@/components/dashboard/admin/customers/status-manager-section";
import { ControlledAddressRegionFields } from "@/components/shared/controlled-address-region-fields";
import { CustomerOperationalFields } from "@/components/dashboard/admin/customers/customer-operational-fields";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [businessEntity, setBusinessEntity] = useState("PT");
  const [website, setWebsite] = useState("");
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [billingType, setBillingType] = useState<"prepaid" | "postpaid">("prepaid");
  const [pricingType, setPricingType] = useState<"standard" | "discount">("standard");
  const [discountPercent, setDiscountPercent] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [postpaidTermDays, setPostpaidTermDays] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [postalCode, setPostalCode] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessCategoryOther, setBusinessCategoryOther] = useState("");
  const [monthlyShipmentEstimate, setMonthlyShipmentEstimate] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const refreshData = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    try {
      const res = await fetchAdminCompany(id);
      const d = (res as { data: Record<string, unknown> }).data;
      setDetail(d);
      setName(String(d.name ?? ""));
      setBusinessEntity(String(d.business_entity_type ?? "PT"));
      setWebsite(String(d.website ?? ""));
      setNpwp(String(d.npwp ?? ""));
      setNib(String(d.nib ?? ""));
      setBillingType(String(d.billing_type ?? d.payment_type ?? "prepaid") === "postpaid" ? "postpaid" : "prepaid");
      setPricingType(String(d.pricing_type ?? "standard") === "discount" ? "discount" : "standard");
      setDiscountPercent(d.discount_percent != null ? String(d.discount_percent) : "");
      setBillingCycle(String(d.billing_cycle || "monthly"));
      setPaymentTerm(String(d.payment_term ?? "net_30"));
      setCreditLimit(d.credit_limit != null ? String(d.credit_limit) : "");
      setAddress(String(d.address ?? ""));
      setCity(String(d.city ?? ""));
      setProvince(String(d.province ?? ""));
      setDistrict(String(d.district ?? ""));
      setCountry(String(d.country ?? "Indonesia"));
      setPostalCode(String(d.postal_code ?? ""));
      setBusinessCategory(String(d.business_category ?? ""));
      setBusinessCategoryOther(String(d.business_category_other ?? ""));
      setMonthlyShipmentEstimate(String(d.monthly_shipment_estimate ?? ""));
      setContactPerson(String(d.contact_person ?? ""));
      setEmail(String(d.email ?? ""));
      setPhone(String(d.phone ?? ""));
      setPostpaidTermDays(d.postpaid_term_days != null ? String(d.postpaid_term_days) : "");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("toasts.loadFailed"));
    }
  }, [id, t]);

  useEffect(() => {
    setLoading(true);
    void refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  const save = async () => {
    if (!canEdit || !Number.isFinite(id) || id < 1) return;
    setSaving(true);
    setError(null);
    try {
      const cleanedPhone = phone.trim();
      if (cleanedPhone && !/^(0|62)\d+$/.test(cleanedPhone)) {
        setError(t("form.phoneFormatError"));
        setSaving(false);
        return;
      }
      await updateAdminCompany(id, {
        name: name.trim(),
        business_entity_type: businessEntity,
        website: website.trim() || null,
        npwp: npwp.trim() || null,
        nib: nib.trim() || null,
        billing_type: billingType,
        pricing_type: pricingType,
        discount_percent: pricingType === "discount" && discountPercent.trim() ? Number(discountPercent) : null,
        billing_cycle: billingType === "postpaid" ? billingCycle || null : null,
        payment_term: billingType === "postpaid" ? paymentTerm || null : null,
        credit_limit: billingType === "postpaid" && creditLimit.trim() ? Number(creditLimit) : null,
        payment_type: billingType,
        postpaid_term_days:
          billingType === "postpaid" && postpaidTermDays.trim() !== ""
            ? Number(postpaidTermDays.trim())
            : null,
        address: address.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        district: district.trim() || null,
        country: country.trim() || null,
        postal_code: postalCode.trim() || null,
        business_category: businessCategory || null,
        business_category_other: businessCategory === "others" ? businessCategoryOther.trim() || null : null,
        monthly_shipment_estimate: monthlyShipmentEstimate || null,
        contact_person: contactPerson.trim() || null,
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

  if (!canEdit) {
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
  const discounts =
    (detail?.customer_discounts as Record<string, unknown>[] | undefined) ??
    (detail?.customerDiscounts as Record<string, unknown>[] | undefined) ??
    [];

  const formBody = (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("form.companyName")}</Label>
          <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.customerCode")}</Label>
          <Input className="h-9" value={String(detail?.company_code ?? "")} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t("form.businessEntity")}</Label>
          <Select value={businessEntity} onValueChange={(v) => v && setBusinessEntity(v)}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["PT", "CV", "UD", "Koperasi", "Yayasan", "Firma", "Perorangan", "Lainnya"].map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("form.website")}</Label>
          <Input className="h-9" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.npwp")}</Label>
          <Input className="h-9" value={npwp} onChange={(e) => setNpwp(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.nib")}</Label>
          <Input className="h-9" value={nib} onChange={(e) => setNib(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <p className="text-sm font-medium">{t("form.billingSection")}</p>
        <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("form.billingType")}</Label>
          <Select value={billingType} onValueChange={(v) => v && setBillingType(v as "prepaid" | "postpaid")}>
            <SelectTrigger className="h-9 w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prepaid">{t("form.prepaid")}</SelectItem>
              <SelectItem value="postpaid">{t("form.postpaid")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("form.pricingType")}</Label>
          <Select value={pricingType} onValueChange={(v) => v && setPricingType(v as "standard" | "discount")}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">{t("form.standard")}</SelectItem>
              <SelectItem value="discount">{t("form.discount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {pricingType === "discount" ? (
          <div className="space-y-2">
            <Label>{t("form.discountPercent")}</Label>
            <Input className="h-9" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
          </div>
        ) : null}
        {billingType === "postpaid" && (
          <div className="space-y-2">
            <Label>{t("form.billingCycle")}</Label>
            <Select value={billingCycle} onValueChange={(v) => v && setBillingCycle(v)}>
              <SelectTrigger className="h-9 w-full rounded-lg">
                <SelectValue>{billingCycleLabel(billingCycle)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FSD_BILLING_CYCLE_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
                {BILLING_CYCLE_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {billingType === "postpaid" && (
          <div className="space-y-2">
            <Label>{t("form.paymentTerm")}</Label>
            <Select value={paymentTerm} onValueChange={(v) => v && setPaymentTerm(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FSD_PAYMENT_TERM_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {billingType === "postpaid" && (
          <div className="space-y-2">
            <Label>{t("form.creditLimit")}</Label>
            <Input className="h-9" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value.replace(/\D/g, ""))} />
          </div>
        )}
        <div className="space-y-2">
          <Label>{t("form.depositBalance")}</Label>
          <Input className="h-9" value={String(detail?.current_deposit_balance ?? 0)} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t("form.outstandingBalance")}</Label>
          <Input className="h-9" value={String(detail?.outstanding_balance ?? 0)} disabled />
        </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>{t("form.address")}</Label>
          <Textarea className="min-h-[80px]" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
        </div>
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
          disabled={!canEdit}
          showCountry
          showDistrict
          labels={{
            province: t("form.province"),
            city: t("form.city"),
            postalCode: t("form.postalCode"),
          }}
        />
        <CustomerOperationalFields
          businessCategory={businessCategory}
          businessCategoryOther={businessCategoryOther}
          monthlyShipmentEstimate={monthlyShipmentEstimate}
          onBusinessCategoryChange={setBusinessCategory}
          onBusinessCategoryOtherChange={setBusinessCategoryOther}
          onMonthlyShipmentEstimateChange={setMonthlyShipmentEstimate}
          disabled={!canEdit}
        />
        <div className="space-y-2">
          <Label>{t("form.pic")}</Label>
          <Input className="h-9" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.email")}</Label>
          <Input className="h-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("form.phone")}</Label>
          <Input
            className="h-9"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
          />
        </div>
      </div>

      <DiscountManagement
        companyId={id}
        discounts={discounts}
        canManage={caps.canManageDiscounts}
        onRefresh={refreshData}
      />

      <div className="flex justify-end gap-2">
        {!embedded ? (
          <Button variant="outline" onClick={() => router.push(backPath)} disabled={saving}>
            {tc("actions.cancel")}
          </Button>
        ) : null}
        <Button onClick={() => void save()} disabled={saving || !name.trim()}>
          {saving ? tc("actions.saving") : tc("actions.save")}
        </Button>
      </div>
    </>
  );

  const inner = (
    <>
      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p> : null}
      {!loading && (
        <>
          <StatusManagerSection
            companyId={id}
            status={companyStatus}
            canApproveReject={caps.canApproveReject}
            onRefresh={refreshData}
          />
          {formBody}
        </>
      )}
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
