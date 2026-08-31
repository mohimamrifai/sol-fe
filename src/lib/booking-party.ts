type PartyBooking = {
  shipper_name?: string | null;
  shipper_location_id?: number | null;
  shipper_location?: { id?: number; name?: string } | null;
  shipperLocation?: { id?: number; name?: string } | null;
  shipper_snapshot?: Record<string, unknown> | null;
  company?: { id?: number; name?: string } | null;
  company_id?: number | null;
};

export function resolveBookingCompanyId(data: PartyBooking | null | undefined): number | null {
  if (!data) return null;
  const id = data.company_id ?? data.company?.id;
  return id != null && Number.isFinite(Number(id)) ? Number(id) : null;
}

export function resolveShipperLocationId(data: PartyBooking | null | undefined): string {
  if (!data) return "";
  if (data.shipper_location_id) return String(data.shipper_location_id);
  const relId = data.shipper_location?.id ?? data.shipperLocation?.id;
  return relId ? String(relId) : "";
}

export function resolveShipperCompanyName(data: PartyBooking | null | undefined): string {
  if (!data) return "";
  const fromSnapshot = data.shipper_snapshot?.company;
  if (fromSnapshot != null && String(fromSnapshot).trim() !== "") return String(fromSnapshot);
  if (data.company?.name) return data.company.name;
  return String(data.shipper_name ?? "");
}
