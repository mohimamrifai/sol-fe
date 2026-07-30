"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Plus,
  Search,
  FileText,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import type { QuickActionKey } from "./role/role-types";

interface Props {
  visibleActions: ReadonlyArray<QuickActionKey>;
}

const ACTION_META: Record<
  QuickActionKey,
  { href: string; icon: React.ComponentType<{ className?: string }> }
> = {
  createBooking: { href: "/dashboard/booking/create", icon: Plus },
  trackShipment: { href: "/dashboard/shipments", icon: Search },
  viewInvoice: { href: "/dashboard/invoices", icon: FileText },
  payInvoice: { href: "/dashboard/invoices?status=unpaid", icon: CreditCard },
};

export function QuickActions({ visibleActions }: Props) {
  const t = useTranslations("Dashboard.quickAction");

  if (visibleActions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Pintasan menuju fitur yang sering dipakai.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {visibleActions.map((key) => {
            const meta = ACTION_META[key];
            const Icon = meta.icon;
            return (
              <Link
                key={key}
                href={meta.href as never}
                className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-sm"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-black group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate">{t(key)}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-700" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
