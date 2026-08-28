"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchAdminAvailableContainers } from "@/lib/admin-api";

type ContainerRow = {
  id?: number;
  container_type?: { id?: number; name?: string; size?: string };
  container_type_id?: number;
  container_number?: string;
  seal_number?: string;
  ownership?: string;
  assignment_status?: string;
  slot_sequence?: number;
  remark?: string;
};

type Props = {
  shipmentId: number;
  containers: ContainerRow[];
  containerResponsibility?: string | null;
  serviceCode?: string;
  canEdit: boolean;
  onAssign: (container: ContainerRow) => void;
  onPickAvailable?: (assetId: number, asset: Record<string, unknown>) => void;
};

function formatPayloadTon(row: Record<string, unknown>, key: "used" | "remaining"): string {
  const tonKey = key === "used" ? "used_payload_ton" : "remaining_payload_ton";
  const kgKey = key === "used" ? "used_payload_kg" : "remaining_payload_kg";
  const ton = row[tonKey];
  if (ton != null) return `${ton} Ton`;
  const kg = row[kgKey];
  if (kg == null) return "—";
  return `${(Number(kg) / 1000).toFixed(2)} Ton`;
}

function ownershipLabel(v?: string): string {
  if (!v) return "—";
  if (v === "company") return "Company";
  if (v === "vendor") return "Vendor";
  if (v === "customer") return "Customer";
  return v;
}

function statusLabel(v?: string): string {
  if (v === "assigned") return "Assigned";
  if (v === "waiting") return "Waiting";
  return v ?? "—";
}

export function ContainerAssignmentCard({
  shipmentId,
  containers,
  containerResponsibility,
  serviceCode,
  canEdit,
  onAssign,
  onPickAvailable,
}: Props) {
  const isSoc = String(containerResponsibility ?? "").toUpperCase() === "SOC";
  const isLcl = String(serviceCode ?? "").toUpperCase() === "LCL";
  const hasAssigned = containers.some((c) => Boolean(c.container_number));
  const [availableRows, setAvailableRows] = useState<Array<Record<string, unknown>>>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const containerTypeId = containers[0]?.container_type_id ?? containers[0]?.container_type?.id;

  useEffect(() => {
    if (!isLcl || !canEdit || isSoc || hasAssigned) {
      setAvailableRows([]);
      return;
    }
    setLoadingAvailable(true);
    void fetchAdminAvailableContainers(shipmentId, {
      container_type_id: containerTypeId,
    })
      .then((res) => setAvailableRows(res.data ?? []))
      .catch(() => setAvailableRows([]))
      .finally(() => setLoadingAvailable(false));
  }, [shipmentId, isLcl, canEdit, isSoc, hasAssigned, containerTypeId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Container Assignment</CardTitle>
          {containerResponsibility ? (
            <p className="text-xs text-muted-foreground mt-1">
              Container Responsibility: {isSoc ? "Provided by Customer" : "Provided by SOL"}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pb-4">
        {isLcl && canEdit && !isSoc && !hasAssigned ? (
          <div className="px-6 pt-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Available Containers
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50">
                    <TableHead>Container No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Used CBM</TableHead>
                    <TableHead className="text-right">Remaining CBM</TableHead>
                    <TableHead className="text-right">Used Payload</TableHead>
                    <TableHead className="text-right">Remaining Payload</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAvailable ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                        Memuat container…
                      </TableCell>
                    </TableRow>
                  ) : availableRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                        Tidak ada container tersedia. Buat slot container terlebih dahulu.
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableRows.map((row) => {
                      const ct = row.container_type as { name?: string; size?: string } | undefined;
                      return (
                        <TableRow key={String(row.id)}>
                          <TableCell className="font-mono text-xs">{String(row.container_number ?? "—")}</TableCell>
                          <TableCell>{ct ? `${ct.name ?? ""} ${ct.size ?? ""}`.trim() : "—"}</TableCell>
                          <TableCell className="capitalize">{String(row.ownership ?? "—")}</TableCell>
                          <TableCell className="text-right tabular-nums">{String(row.used_cbm ?? "—")}</TableCell>
                          <TableCell className="text-right tabular-nums">{String(row.remaining_cbm ?? "—")}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatPayloadTon(row, "used")}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatPayloadTon(row, "remaining")}</TableCell>
                          <TableCell>Available</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={row.can_assign === false}
                              onClick={() => {
                                if (onPickAvailable) {
                                  onPickAvailable(Number(row.id), row);
                                } else if (containers[0]) {
                                  onAssign(containers[0]);
                                }
                              }}
                            >
                              Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                {!isLcl ? <TableHead className="pl-6">Cargo</TableHead> : null}
                <TableHead className={isLcl ? "pl-6" : undefined}>Container Type</TableHead>
                <TableHead>Container Number</TableHead>
                <TableHead>Seal Number</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Status</TableHead>
                {canEdit ? <TableHead className="text-right pr-6">Action</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="py-6 text-center text-sm text-muted-foreground italic">
                    Belum ada slot container. Konversi booking FCL atau assign container LCL.
                  </TableCell>
                </TableRow>
              ) : (
                containers.map((c, idx) => {
                  const ct = c.container_type;
                  const typeLabel = ct ? `${ct.name ?? ""}${ct.size ? ` (${ct.size})` : ""}`.trim() : "—";
                  const assigned = Boolean(c.container_number);
                  return (
                    <TableRow key={String(c.id ?? idx)}>
                      {!isLcl ? (
                        <TableCell className="pl-6 font-medium">
                          {typeLabel} #{c.slot_sequence ?? idx + 1}
                        </TableCell>
                      ) : null}
                      <TableCell className={isLcl ? "pl-6" : undefined}>{typeLabel}</TableCell>
                      <TableCell className="font-mono text-xs">{c.container_number ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{c.seal_number ?? "—"}</TableCell>
                      <TableCell>{ownershipLabel(c.ownership)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{statusLabel(c.assignment_status ?? (assigned ? "assigned" : "waiting"))}</Badge>
                      </TableCell>
                      {canEdit ? (
                        <TableCell className="text-right pr-6">
                          <Button type="button" size="sm" variant="outline" onClick={() => onAssign(c)}>
                            {assigned ? (isSoc ? "Edit" : "Change") : isSoc ? "Input No" : "Assign"}
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
