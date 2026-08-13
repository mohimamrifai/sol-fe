"use client";

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
  containers: ContainerRow[];
  containerResponsibility?: string | null;
  serviceCode?: string;
  canEdit: boolean;
  onAssign: (container: ContainerRow) => void;
};

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
  containers,
  containerResponsibility,
  serviceCode,
  canEdit,
  onAssign,
}: Props) {
  const isSoc = String(containerResponsibility ?? "").toUpperCase() === "SOC";
  const isLcl = String(serviceCode ?? "").toUpperCase() === "LCL";

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
      <CardContent className="overflow-x-auto p-0">
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
      </CardContent>
    </Card>
  );
}
