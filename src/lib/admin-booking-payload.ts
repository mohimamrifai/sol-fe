import type { ContainerRow, PackageRow } from "@/hooks/use-booking-form";
import type { CC } from "@/hooks/use-admin-booking-form";

export function deriveBookingCargoCategoryId(
  packages: PackageRow[],
  containers: ContainerRow[],
  fallbackId = ""
): string {
  const fromPkg = packages.find((p) => p.cargo_category_id)?.cargo_category_id;
  if (fromPkg) return fromPkg;
  const fromCtr = containers.find((c) => c.cargo_category_id)?.cargo_category_id;
  if (fromCtr) return fromCtr;
  return fallbackId;
}

export function isDgCargoCategory(categories: CC[], id: string): boolean {
  const cat = categories.find((c) => String(c.id) === id);
  return cat?.code?.toUpperCase() === "DG";
}

export function mapPackageRowsForApi(packages: PackageRow[], cargoCats: CC[]) {
  return packages.map((p) => {
    const isItemDg = isDgCargoCategory(cargoCats, p.cargo_category_id);
    return {
      description: p.description || null,
      package_type: p.package_type || null,
      piece_count: Number(p.piece_count) || 1,
      weight_kg: Number(p.weight_kg) || null,
      length: Number(p.length_cm) || null,
      width: Number(p.width_cm) || null,
      height: Number(p.height_cm) || null,
      remark: p.remark || null,
      cargo_category_id: p.cargo_category_id ? Number(p.cargo_category_id) : null,
      is_dangerous_goods: isItemDg ? 1 : 0,
      dg_class_id: isItemDg && p.dg_class_id ? Number(p.dg_class_id) : null,
      un_number: isItemDg ? p.un_number || null : null,
      packing_group: isItemDg ? p.packing_group || null : null,
      proper_shipping_name: isItemDg ? p.proper_shipping_name || null : null,
      flash_point: isItemDg && p.flash_point_c ? Number(p.flash_point_c) : null,
      dg_remark: isItemDg ? p.dg_remark || null : null,
    };
  });
}

export function mapContainerRowsForApi(containers: ContainerRow[], cargoCats: CC[]) {
  return containers.map((c) => {
    const isItemDg = isDgCargoCategory(cargoCats, c.cargo_category_id);
    return {
      container_type_id: c.container_type_id ? Number(c.container_type_id) : null,
      quantity: Number(c.quantity) || 1,
      gross_weight_kg: Number(c.gross_weight_kg) || null,
      cargo_description: c.cargo_description || null,
      remark: c.remark || null,
      cargo_category_id: c.cargo_category_id ? Number(c.cargo_category_id) : null,
      is_dangerous_goods: isItemDg ? 1 : 0,
      dg_class_id: isItemDg && c.dg_class_id ? Number(c.dg_class_id) : null,
      un_number: isItemDg ? c.un_number || null : null,
      packing_group: isItemDg ? c.packing_group || null : null,
      proper_shipping_name: isItemDg ? c.proper_shipping_name || null : null,
      flash_point: isItemDg && c.flash_point_c ? Number(c.flash_point_c) : null,
      dg_remark: isItemDg ? c.dg_remark || null : null,
    };
  });
}

type IncludedServiceSource = { id: number; name: string; code?: string | null };

export function buildIncludedServiceNames(
  addServices: IncludedServiceSource[],
  selectedAddOns: number[],
  options: { showPickup: boolean; showDelivery: boolean }
): string[] {
  const names = new Set<string>();

  addServices
    .filter((s) => selectedAddOns.includes(s.id))
    .forEach((s) => names.add(s.name));

  if (options.showPickup) {
    const pickup = addServices.find((s) => s.code === "PICKUP");
    if (pickup) names.add(pickup.name);
  }

  if (options.showDelivery) {
    const delivery = addServices.find((s) => s.code === "DELIVERY");
    if (delivery) names.add(delivery.name);
  }

  return Array.from(names);
}
