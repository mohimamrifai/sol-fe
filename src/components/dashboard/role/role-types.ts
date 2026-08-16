/**
 * Customer dashboard role definitions.
 * Each role shows a tailored subset of the dashboard's cards, sections,
 * and quick actions — per the rule "Customer hanya dapat melihat data
 * sesuai hak akses user" in the project brief.
 */
export type CustomerRole = "company_admin" | "ops_pic" | "finance_pic" | "viewer";

export interface RoleVisibility {
  /** Card keys (in `CustomerDashboardCards`) that are visible to the role. */
  cards: ReadonlyArray<keyof import("@/lib/dashboard-api").CustomerDashboardCards>;
  /** Section keys the role can see. */
  sections: ReadonlyArray<DashboardSectionKey>;
  /** Quick-action keys the role can see. */
  quickActions: ReadonlyArray<QuickActionKey>;
  /** Hide create/pay actions — used by Viewer (read-only). */
  readOnly?: boolean;
}

export type DashboardSectionKey =
  | "shipmentTracking"
  | "recentBooking"
  | "outstandingInvoice"
  | "recentPayment"
  | "recentNotifications";

export type QuickActionKey = "createBooking" | "trackShipment" | "viewInvoice" | "payInvoice";

/**
 * Card ordering — shared across all roles so the layout stays consistent.
 */
export const ORDERED_CARD_KEYS = [
  "booking_draft",
  "booking_submitted",
  "shipment_active",
  "shipment_completed",
  "invoice_unpaid",
  "invoice_outstanding_amount",
] as const;

const VISIBILITY: Record<CustomerRole, RoleVisibility> = {
  // Company Admin: full access — every card, every section, every quick action.
  company_admin: {
    cards: ORDERED_CARD_KEYS,
    sections: [
      "shipmentTracking",
      "recentBooking",
      "outstandingInvoice",
      "recentPayment",
      "recentNotifications",
    ],
    quickActions: ["createBooking", "trackShipment", "viewInvoice", "payInvoice"],
  },
  // Ops PIC: operational focus. No payment history, no outstanding amount card.
  ops_pic: {
    cards: [
      "booking_draft",
      "booking_submitted",
      "shipment_active",
      "shipment_completed",
      "invoice_unpaid",
    ],
    sections: [
      "shipmentTracking",
      "recentBooking",
      "outstandingInvoice",
      "recentNotifications",
    ],
    quickActions: ["createBooking", "trackShipment", "viewInvoice", "payInvoice"],
  },
  // Finance PIC: financial focus. No shipment tracking section.
  finance_pic: {
    cards: ORDERED_CARD_KEYS,
    sections: [
      "recentBooking",
      "outstandingInvoice",
      "recentPayment",
      "recentNotifications",
    ],
    quickActions: ["createBooking", "trackShipment", "viewInvoice", "payInvoice"],
  },
  // Viewer: read-only access to all dashboard data (FSD dashboard.md Rules).
  viewer: {
    cards: ORDERED_CARD_KEYS,
    sections: [
      "shipmentTracking",
      "recentBooking",
      "outstandingInvoice",
      "recentPayment",
      "recentNotifications",
    ],
    quickActions: ["trackShipment", "viewInvoice"],
    readOnly: true,
  },
};

export function getRoleVisibility(role: CustomerRole): RoleVisibility {
  return VISIBILITY[role];
}

/** Maps each card key to its i18n label key. */
export const CARD_LABEL_KEY: Record<
  (typeof ORDERED_CARD_KEYS)[number],
  string
> = {
  booking_draft: "bookingDraft",
  booking_submitted: "bookingSubmitted",
  shipment_active: "shipmentActive",
  shipment_completed: "shipmentCompleted",
  invoice_unpaid: "invoiceUnpaid",
  invoice_outstanding_amount: "invoiceOutstanding",
};

/** Maps each dashboard stat card to its filtered list page. */
export const CARD_HREF: Record<(typeof ORDERED_CARD_KEYS)[number], string> = {
  booking_draft: "/dashboard/booking?status=draft",
  booking_submitted: "/dashboard/booking?status=submitted",
  shipment_active: "/dashboard/shipments?status=in_progress",
  shipment_completed: "/dashboard/shipments?status=completed",
  invoice_unpaid: "/dashboard/invoices?status=unpaid",
  invoice_outstanding_amount: "/dashboard/invoices?status=unpaid",
};
