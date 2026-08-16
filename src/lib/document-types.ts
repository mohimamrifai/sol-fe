/**
 * 8 document types surfaced on the customer "Documents" page.
 * Each type corresponds to a virtual document aggregated from existing
 * tables (booking_attachments, shipments, invoices, payments).
 */

export const DOCUMENT_TYPES = [
  "booking_attachment",
  "consignment_note",
  "delivery_order",
  "proof_of_delivery",
  "invoice",
  "tax_invoice",
  "payment_receipt",
  "other_supporting",
  "msds_file",
] as const;

export type DocumentTypeKey = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_KEYS: DocumentTypeKey[] = [...DOCUMENT_TYPES];

/** FSD filter keys sent as `type` query param */
export const DOCUMENT_FILTER_TYPES = [
  "booking",
  "shipment",
  "invoice",
  "tax_invoice",
  "pod",
  "delivery_order",
  "other",
] as const;

export type DocumentFilterTypeKey = (typeof DOCUMENT_FILTER_TYPES)[number];

export const DOCUMENT_BUCKETS = ["booking", "shipment", "billing"] as const;
export type DocumentBucketKey = (typeof DOCUMENT_BUCKETS)[number];

export interface DocumentRow {
  id: string;
  document_type: DocumentTypeKey;
  document_type_label: string;
  name: string;
  format: string | null;
  mime_type: string | null;
  preview_supported: boolean;
  upload_date: string | null;
  uploaded_by: string | null;
  shipment_id: number | null;
  shipment_no: string | null;
  shipment_number: string | null;
  booking_id: number | null;
  booking_no: string | null;
  cn_no: string | null;
  bucket: DocumentBucketKey;
  available: boolean;
  source: {
    kind:
      | "booking_attachment"
      | "consignment_note"
      | "delivery_order"
      | "proof_of_delivery"
      | "invoice"
      | "tax_invoice"
      | "payment_receipt"
      | "other_supporting"
      | "msds_file";
    id: number;
    file_path?: string | null;
    entity?: string;
  };
}

export interface DocumentDetail extends DocumentRow {
  info: {
    document_name?: string | null;
    document_type?: string | null;
    booking_no?: string | null;
    shipment_no?: string | null;
    customer?: string | null;
    uploaded_by?: string | null;
    upload_date?: string | null;
    remarks?: string | null;
  };
  related_shipment: { id: number; shipment_no: string | null } | null;
}

export interface DocumentStats {
  total: number;
  booking: number;
  shipment: number;
  billing: number;
}

export interface DocumentShipmentOption {
  id: number;
  label: string;
}
