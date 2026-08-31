type PartyBooking = {
  shipper_name?: string | null;
  shipper_location_id?: number | null;
  shipper_location?: { id?: number; name?: string } | null;
  shipperLocation?: { id?: number; name?: string } | null;
  shipper_snapshot?: Record<string, unknown> | null;
  customer_location_name?: string | null;
  shipper_company_name?: string | null;
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
  const locationName = resolveCustomerLocationName(data);

  const fromApi = data.shipper_company_name;
  if (fromApi != null && String(fromApi).trim() !== "") {
    const apiCompany = String(fromApi).trim();
    if (!locationName || apiCompany !== locationName) return apiCompany;
  }

  const fromSnapshot = data.shipper_snapshot?.company;
  if (fromSnapshot != null && String(fromSnapshot).trim() !== "") {
    const snapshotCompany = String(fromSnapshot).trim();
    if (!locationName || snapshotCompany !== locationName) return snapshotCompany;
  }

  if (data.company?.name) return data.company.name;

  const shipperName = String(data.shipper_name ?? "").trim();
  if (shipperName && (!locationName || shipperName !== locationName)) return shipperName;

  return data.company?.name ?? "";
}

export function resolveCustomerLocationName(data: PartyBooking | null | undefined): string {
  if (!data) return "";
  const fromApi = data.customer_location_name;
  if (fromApi != null && String(fromApi).trim() !== "") return String(fromApi);
  const fromRelation =
    data.shipper_location?.name ??
    data.shipperLocation?.name ??
    null;
  if (fromRelation != null && String(fromRelation).trim() !== "") return String(fromRelation);
  const snapshot = data.shipper_snapshot;
  if (snapshot && typeof snapshot === "object") {
    for (const key of ["location_name", "name"] as const) {
      const value = snapshot[key];
      if (value != null && String(value).trim() !== "") return String(value);
    }
  }
  return "";
}
