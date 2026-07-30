"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  FileText,
  Truck,
  Receipt,
  CreditCard,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatRelative } from "../format";
import type { CustomerDashboardNotification } from "@/lib/dashboard-api";

interface Props {
  items: CustomerDashboardNotification[];
  emptyText: string;
}

const ICON_MAP = {
  booking_submitted: FileText,
  booking_approved: CheckCircle2,
  shipment_departed: Truck,
  shipment_arrived: CheckCircle2,
  invoice_issued: Receipt,
  payment_received: CreditCard,
} as const;

const TYPE_LABEL_KEY = {
  booking_submitted: "bookingSubmitted",
  booking_approved: "bookingApproved",
  shipment_departed: "shipmentDeparted",
  shipment_arrived: "shipmentArrived",
  invoice_issued: "invoiceIssued",
  payment_received: "paymentReceived",
} as const;

const TYPE_COLOR = {
  booking_submitted: "bg-sky-50 text-sky-700",
  booking_approved: "bg-emerald-50 text-emerald-700",
  shipment_departed: "bg-indigo-50 text-indigo-700",
  shipment_arrived: "bg-cyan-50 text-cyan-700",
  invoice_issued: "bg-amber-50 text-amber-700",
  payment_received: "bg-emerald-50 text-emerald-700",
} as const;

export function NotificationTimeline({ items, emptyText }: Props) {
  const t = useTranslations("Dashboard.notifications");
  const locale = useLocale();

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">{emptyText}</p>
    );
  }

  return (
    <ol className="relative ml-2 space-y-3 border-l border-zinc-200 pl-5">
      {items.map((n) => {
        const Icon = ICON_MAP[n.type];
        const colorClass = TYPE_COLOR[n.type];
        const message = renderMessage(t, n);
        return (
          <li key={n.id} className="relative">
            <span
              className={`absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${colorClass}`}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div className="flex flex-col gap-0.5">
              <Link
                href={n.link as never}
                className="text-sm leading-snug text-zinc-800 hover:text-black hover:underline"
              >
                {message}
              </Link>
              <span className="text-[11px] text-zinc-500">
                {formatRelative(n.occurred_at, locale)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function renderMessage(
  t: ReturnType<typeof useTranslations>,
  n: CustomerDashboardNotification,
): string {
  const number = n.ref_number ?? "";
  const labelKey = TYPE_LABEL_KEY[n.type];

  if (n.type === "shipment_arrived") {
    if (n.destination && n.destination.trim().length > 0) {
      return t(labelKey, { number, destination: n.destination });
    }
    return t("shipmentArrivedNoDest", { number });
  }

  return t(labelKey, { number });
}
