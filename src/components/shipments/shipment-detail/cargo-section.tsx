"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, Container as ContainerIcon } from "lucide-react";

export interface CargoItem {
  id: number;
  sequence?: number;
  description?: string;
  package_type?: string;
  piece_count?: number;
  weight_kg?: number;
  volume_cbm?: number;
  container_number?: string;
  seal_number?: string;
  container_type?: string;
  quantity?: number;
  cargo_weight_kg?: number;
  cargo_description?: string;
  chargeable_weight_kg?: number;
  cargo_category?: string;
  container_responsibility?: string;
}

export interface CargoData {
  service_kind?: "LCL" | "FCL" | null;
  service_code?: string | null;
  packages: CargoItem[];
  containers: CargoItem[];
  summary?: {
    total_packages?: number;
    total_pieces?: number;
    total_actual_weight_kg?: number;
    total_volume_cbm?: number;
    total_chargeable_weight_kg?: number;
    total_containers?: number;
  } | null;
}

interface Props { data?: CargoData | null }

function fmtNum(n?: number | null, digits = 2) {
  if (n == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function CargoSection({ data }: Props) {
  const t = useTranslations("Shipments.detail.section4");
  const tCol = useTranslations("Shipments.detail.section4.columns");
  const tSummary = useTranslations("Shipments.detail.section4.summary");

  const kind = data?.service_kind ?? "LCL";
  const packages = data?.packages ?? [];
  const containers = data?.containers ?? [];
  const summary = data?.summary;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {kind === "FCL" ? (
            <ContainerIcon className="h-4 w-4 text-zinc-600" />
          ) : (
            <Package className="h-4 w-4 text-zinc-600" />
          )}
          <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </CardTitle>
          <span className="ml-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            {kind}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {kind === "FCL" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-2 font-semibold">{tCol("containerType")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tCol("qty")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tCol("cargoWeight")}</th>
                  <th className="px-3 py-2 font-semibold">Cargo Description</th>
                </tr>
              </thead>
              <tbody>
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-zinc-500">
                      {t("noItems")}
                    </td>
                  </tr>
                ) : (
                  containers.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-3 py-2 text-zinc-700">{c.container_type ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.quantity ?? 1}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-900">
                        {fmtNum(c.cargo_weight_kg)}
                      </td>
                      <td className="px-3 py-2 text-zinc-700">{c.cargo_description ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-2 font-semibold">{tCol("packageDescription")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tCol("qty")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tCol("weight")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tCol("volume")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tCol("chargeableWeight")}</th>
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-500">
                      {t("noItems")}
                    </td>
                  </tr>
                ) : (
                  packages.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-3 py-2 text-zinc-900">{p.description ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.piece_count ?? 0}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNum(p.weight_kg)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNum(p.volume_cbm)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {fmtNum(
                          p.chargeable_weight_kg ??
                            Math.max(p.weight_kg ?? 0, (p.volume_cbm ?? 0) * 1000)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {summary ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              {tSummary("title")}
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {kind === "FCL" ? (
                <SummaryCell label={tSummary("totalContainers")} value={fmtNum(summary.total_containers, 0)} />
              ) : (
                <>
                  <SummaryCell label={tSummary("totalPackage")} value={fmtNum(summary.total_packages, 0)} />
                  <SummaryCell label={tSummary("totalActualWeight")} value={fmtNum(summary.total_actual_weight_kg)} />
                  <SummaryCell label={tSummary("totalVolume")} value={fmtNum(summary.total_volume_cbm)} />
                  <SummaryCell label={tSummary("totalChargeableWeight")} value={fmtNum(summary.total_chargeable_weight_kg)} />
                </>
              )}
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5">
      <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="font-mono text-sm font-semibold tabular-nums text-zinc-900">{value}</dd>
    </div>
  );
}
