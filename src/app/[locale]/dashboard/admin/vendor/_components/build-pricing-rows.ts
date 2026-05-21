export type PricingRow = { 
  id: number;
  vsId: number;
  lane: string; 
  service: string; 
  detail: string; 
  priceType: string;
  raw: Record<string, unknown>;
};

export function priceTypeLabel(code: string): string {
  const c = code.trim().toLowerCase();
  if (c === "buy") return "Beli";
  if (c === "sell") return "Jual";
  return code || "—";
}

/** Format angka ke Rupiah untuk dibaca manusia (pemisah ribuan, tanpa desimal berlebihan). */
export function formatIdrAmount(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Satu baris per komponen harga; dipisah newline di tabel. */
function buildPricingDetailLines(p: Record<string, unknown>): string {
  const lines: string[] = [];
  if (p.price_per_container != null && Number(p.price_per_container) > 0) {
    lines.push(`Per kontainer: ${formatIdrAmount(p.price_per_container)}`);
  }
  if (p.min_kg != null && Number(p.min_kg) > 0) {
    lines.push(`Min. Kg Awal: ${p.min_kg} kg`);
  }
  if (p.minimum_charge != null && Number(p.minimum_charge) > 0) {
    lines.push(`Min. Tarif: ${formatIdrAmount(p.minimum_charge)}`);
  }
  if (p.price_per_kg != null && Number(p.price_per_kg) > 0) {
    lines.push(`Next Tarif (Per kg): ${formatIdrAmount(p.price_per_kg)}`);
  }
  if (p.price_per_cbm != null && Number(p.price_per_cbm) > 0) {
    lines.push(`Per CBM: ${formatIdrAmount(p.price_per_cbm)}`);
  }
  return lines.length > 0 ? lines.join("\n") : "—";
}

/** Flatten nested vendor detail (vendor_services → pricings) untuk tabel ringkasan. */
export function buildPricingRowsFromVendorDetail(v: Record<string, unknown>): PricingRow[] {
  const flat: PricingRow[] = [];
  const vss = (v.vendor_services as Record<string, unknown>[] | undefined) ?? [];
  for (const vs of vss) {
    const o = vs.origin_location as { code?: string; name?: string } | undefined;
    const d = vs.destination_location as { code?: string; name?: string } | undefined;
    const st = vs.service_type as { name?: string } | undefined;
    const lane = [o?.code ?? o?.name, d?.code ?? d?.name].filter(Boolean).join(" → ") || "—";
    const pricings = (vs.pricings as Record<string, unknown>[] | undefined) ?? [];
    for (const p of pricings) {
      const pt = String(p.price_type ?? "");
      flat.push({
        id: Number(p.id),
        vsId: Number(vs.id),
        lane,
        service: st?.name ?? "—",
        priceType: pt,
        detail: buildPricingDetailLines(p),
        raw: p,
      });
    }
  }
  return flat;
}
