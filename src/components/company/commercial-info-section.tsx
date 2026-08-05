"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { BadgeDollarSign, CreditCard, Wallet, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerCompanyCommercial } from "@/hooks/use-customer-company-commercial";
import { formatIdr } from "@/lib/format";

interface CommercialData {
  billing_type?: string | null;
  pricing_type?: string | null;
  discount_percent?: number | null;
  billing_cycle?: string | null;
  payment_term?: string | null;
  credit_limit?: number | null;
  current_deposit_balance?: number | null;
  outstanding_balance?: number | null;
}

function fmtMoney(n?: number | null) {
  if (n == null) return "—";
  return formatIdr(n);
}

function fmtPercent(n?: number | null) {
  if (n == null) return "—";
  return `${n}%`;
}

const labelCls = "text-xs font-medium text-zinc-500";

export function CommercialInfoSection() {
  const t = useTranslations("Company");
  const tLabels = useTranslations("Company.commercialLabels");
  const { data, isLoading } = useCustomerCompanyCommercial();
  const commercial: CommercialData = data?.data ?? {};

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const translate = (group: string, value?: string | null): React.ReactNode => {
    if (!value) return "—";
    const key = `${group}.${value}` as const;
    try {
      return tLabels.has(key) ? tLabels(key) : value;
    } catch {
      return value;
    }
  };

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    {
      icon: <BadgeDollarSign className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.billingType"),
      value: translate("billingType", commercial.billing_type),
    },
    {
      icon: <BadgeDollarSign className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.pricingType"),
      value: translate("pricingType", commercial.pricing_type),
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.discountPercent"),
      value: fmtPercent(commercial.discount_percent),
    },
    {
      icon: <FileText className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.billingCycle"),
      value: translate("billingCycle", commercial.billing_cycle),
    },
    {
      icon: <CreditCard className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.paymentTerm"),
      value: translate("paymentTerm", commercial.payment_term),
    },
    {
      icon: <CreditCard className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.creditLimit"),
      value: fmtMoney(commercial.credit_limit),
    },
    {
      icon: <Wallet className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.currentDepositBalance"),
      value: fmtMoney(commercial.current_deposit_balance),
    },
    {
      icon: <Wallet className="h-4 w-4 text-zinc-500" />,
      label: t("commercialFields.outstandingBalance"),
      value: fmtMoney(commercial.outstanding_balance),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("sections.commercial")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("form.readonly")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2.5"
            >
              <div className="mt-0.5">{row.icon}</div>
              <div className="min-w-0 flex-1">
                <dt className={labelCls}>{row.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-900 break-words">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
