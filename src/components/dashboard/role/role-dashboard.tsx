"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FileText,
  FileCheck2,
  Truck,
  CheckCircle2,
  Receipt,
  Wallet,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

import { StatCard } from "../stat-card";
import { SectionCard } from "../section-card";
import { ShipmentTable } from "../tables/shipment-table";
import { BookingTable } from "../tables/booking-table";
import { InvoiceTable } from "../tables/invoice-table";
import { PaymentTable } from "../tables/payment-table";
import { NotificationTimeline } from "../notifications/notification-timeline";
import { QuickActions } from "../quick-actions";

import type {
  CustomerDashboardCards,
  CustomerDashboardPayload,
} from "@/lib/dashboard-api";
import {
  CARD_LABEL_KEY,
  ORDERED_CARD_KEYS,
  getRoleVisibility,
  type CustomerRole,
} from "./role-types";

interface Props {
  role: CustomerRole;
  data: CustomerDashboardPayload | null;
  loading?: boolean;
}

const CARD_ICON_META: Record<
  (typeof ORDERED_CARD_KEYS)[number],
  { icon: LucideIcon; tone: string }
> = {
  booking_draft: { icon: FileText, tone: "bg-slate-100 text-slate-700" },
  booking_submitted: { icon: FileCheck2, tone: "bg-sky-100 text-sky-700" },
  shipment_active: { icon: Truck, tone: "bg-indigo-100 text-indigo-700" },
  shipment_completed: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
  invoice_unpaid: { icon: Receipt, tone: "bg-amber-100 text-amber-700" },
  invoice_outstanding_amount: { icon: Wallet, tone: "bg-rose-100 text-rose-700" },
};

export function RoleDashboard({ role, data, loading }: Props) {
  const t = useTranslations("Dashboard");
  const tEmpty = useTranslations("Dashboard.empty");
  const locale = useLocale();

  const visibility = getRoleVisibility(role);
  const readOnly = visibility.readOnly === true;
  const cards = data?.cards;
  const recent = data?.recent;
  const notifications = data?.notifications ?? [];

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      {/* 1. Stat cards */}
      <section aria-label="Statistik dashboard">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {visibility.cards.map((key) => {
            const meta = CARD_ICON_META[key];
            const Icon = meta.icon;
            const labelKey = CARD_LABEL_KEY[key];
            const isCurrency = key === "invoice_outstanding_amount";
            return (
              <StatCard
                key={key}
                labelKey={labelKey}
                descriptionKey={`${labelKey}Hint`}
                value={cards ? cards[key as keyof CustomerDashboardCards] : 0}
                icon={Icon}
                iconClassName={meta.tone}
                asCurrency={isCurrency}
              />
            );
          })}
        </div>
      </section>

      {/* 2. Sections (rendered in the order declared by the role config) */}
      {visibility.sections.map((section) => {
        switch (section) {
          case "shipmentTracking":
            return (
              <SectionCard
                key={section}
                titleKey="sections.shipmentTracking.title"
                descriptionKey="sections.shipmentTracking.description"
                viewAllLabelKey="sections.shipmentTracking.viewAll"
                viewAllHref="/dashboard/shipments"
              >
                <ShipmentTable
                  rows={recent?.shipments ?? []}
                  locale={locale}
                  emptyText={tEmpty("shipments")}
                />
              </SectionCard>
            );
          case "recentBooking":
            return (
              <SectionCard
                key={section}
                titleKey="sections.recentBooking.title"
                descriptionKey="sections.recentBooking.description"
                viewAllLabelKey="sections.recentBooking.viewAll"
                viewAllHref="/dashboard/booking"
                headerActions={
                  readOnly ? undefined : (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    className="h-8 gap-1 border-zinc-200 px-2.5 text-xs font-medium"
                    render={
                      <Link
                        href="/dashboard/booking/create"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t("sections.recentBooking.create")}
                      </Link>
                    }
                  />
                  )
                }
              >
                <BookingTable
                  rows={recent?.bookings ?? []}
                  locale={locale}
                  emptyText={tEmpty("bookings")}
                />
              </SectionCard>
            );
          case "outstandingInvoice":
            return (
              <SectionCard
                key={section}
                titleKey="sections.outstandingInvoice.title"
                descriptionKey="sections.outstandingInvoice.description"
                viewAllLabelKey="sections.outstandingInvoice.viewAll"
                viewAllHref="/dashboard/invoices"
              >
                <InvoiceTable
                  rows={recent?.invoices ?? []}
                  locale={locale}
                  emptyText={tEmpty("invoices")}
                  readOnly={readOnly}
                />
              </SectionCard>
            );
          case "recentPayment":
            return (
              <SectionCard
                key={section}
                titleKey="sections.recentPayment.title"
                descriptionKey="sections.recentPayment.description"
              >
                <PaymentTable
                  rows={recent?.payments ?? []}
                  locale={locale}
                  emptyText={tEmpty("payments")}
                />
              </SectionCard>
            );
          case "recentNotifications":
            return (
              <SectionCard
                key={section}
                titleKey="sections.recentNotifications.title"
                descriptionKey="sections.recentNotifications.description"
                viewAllLabelKey="sections.recentNotifications.viewAll"
                viewAllHref="/dashboard/notifications"
              >
                <NotificationTimeline
                  items={notifications}
                  emptyText={tEmpty("notifications")}
                />
              </SectionCard>
            );
          default:
            return null;
        }
      })}

      {/* 3. Quick actions */}
      <QuickActions visibleActions={visibility.quickActions} />
    </div>
  );
}
