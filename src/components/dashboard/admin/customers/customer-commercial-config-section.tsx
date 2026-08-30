"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAdminCompany, updateAdminCompany } from "@/lib/admin-api";
import { FSD_BILLING_CYCLE_OPTIONS, FSD_PAYMENT_TERM_OPTIONS, billingCycleLabel, paymentTermLabel } from "@/lib/billing-cycle-labels";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { formatIdr } from "@/lib/format";
import { toast } from "sonner";

type Props = {
  companyId: number;
};

export function CustomerCommercialConfigSection({ companyId }: Props) {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const caps = useMemo(() => getAdminCustomerCapabilities(user?.roles ?? []), [user?.roles]);
  const canEdit = authHydrated && caps.canEditCompanyData;
  const readOnly = authHydrated && !canEdit;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingType, setBillingType] = useState<"prepaid" | "postpaid">("prepaid");
  const [pricingType, setPricingType] = useState<"standard" | "discount">("standard");
  const [discountPercent, setDiscountPercent] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [depositBalance, setDepositBalance] = useState<number | string | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState<number | string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(companyId) || companyId < 1) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminCompany(companyId);
      const d = (res as { data: Record<string, unknown> }).data;
      setBillingType(String(d.billing_type ?? "prepaid") === "postpaid" ? "postpaid" : "prepaid");
      setPricingType(String(d.pricing_type ?? "standard") === "discount" ? "discount" : "standard");
      setDiscountPercent(d.discount_percent != null ? String(d.discount_percent) : "");
      setBillingCycle(String(d.billing_cycle || "monthly"));
      setPaymentTerm(String(d.payment_term ?? "net_30"));
      setCreditLimit(d.credit_limit != null ? String(d.credit_limit) : "");
      setDepositBalance(d.current_deposit_balance as number | string | null);
      setOutstandingBalance(d.outstanding_balance as number | string | null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("toasts.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const formComplete = billingType !== "postpaid" || Boolean(billingCycle && paymentTerm);

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      if (!formComplete) {
        setError(t("form.requiredFields"));
        return;
      }
      await updateAdminCompany(companyId, {
        billing_type: billingType,
        pricing_type: pricingType,
        discount_percent: pricingType === "discount" && discountPercent.trim() ? Number(discountPercent) : null,
        billing_cycle: billingType === "postpaid" ? billingCycle || null : null,
        payment_term: billingType === "postpaid" ? paymentTerm || null : null,
        credit_limit: billingType === "postpaid" && creditLimit.trim() ? Number(creditLimit) : null,
      });
      toast.success(t("toasts.updated"));
      await load();
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <section className="space-y-4">
        <h3 className="border-b pb-2 text-sm font-bold uppercase tracking-wider">
          {t("form.billingSection")}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("form.billingType")}</Label>
            <Select value={billingType} onValueChange={(v) => v && setBillingType(v as "prepaid" | "postpaid")} disabled={readOnly}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue>{billingType === "postpaid" ? t("form.postpaid") : t("form.prepaid")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prepaid">{t("form.prepaid")}</SelectItem>
                <SelectItem value="postpaid">{t("form.postpaid")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("form.pricingType")}</Label>
            <Select value={pricingType} onValueChange={(v) => v && setPricingType(v as "standard" | "discount")} disabled={readOnly}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue>{pricingType === "discount" ? t("form.discount") : t("form.standard")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">{t("form.standard")}</SelectItem>
                <SelectItem value="discount">{t("form.discount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pricingType === "discount" ? (
            <div className="space-y-2">
              <Label>{t("form.discountPercent")}</Label>
              <Input
                className="h-9"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                disabled={readOnly}
              />
            </div>
          ) : null}
          {billingType === "postpaid" ? (
            <>
              <div className="space-y-2">
                <Label>{t("form.billingCycle")}</Label>
                <Select value={billingCycle} onValueChange={(v) => v && setBillingCycle(v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue>{billingCycleLabel(billingCycle)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FSD_BILLING_CYCLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form.paymentTerm")}</Label>
                <Select value={paymentTerm} onValueChange={(v) => v && setPaymentTerm(v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue>{paymentTermLabel(paymentTerm)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FSD_PAYMENT_TERM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form.creditLimit")}</Label>
                <Input
                  className="h-9"
                  value={creditLimit ? formatIdr(creditLimit) : ""}
                  onChange={(e) => setCreditLimit(e.target.value.replace(/\D/g, ""))}
                  disabled={readOnly}
                  inputMode="numeric"
                />
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label>{t("form.depositBalance")}</Label>
            <Input className="h-9" value={formatIdr(depositBalance)} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t("form.outstandingBalance")}</Label>
            <Input className="h-9" value={formatIdr(outstandingBalance)} disabled />
          </div>
        </div>
      </section>

      {canEdit ? (
        <div className="flex justify-end">
          <Button onClick={() => void save()} disabled={saving || !formComplete}>
            {saving ? tc("actions.saving") : tc("actions.save")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
