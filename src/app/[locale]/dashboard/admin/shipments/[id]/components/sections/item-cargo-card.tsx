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

const PLACEMENT_LABELS: Record<string, string> = {
  rack: "Rack",
  floor: "Lantai",
};

function placementTypeLabel(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  return PLACEMENT_LABELS[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ItemCargoCardProps {
  items: Array<{
    id?: number | string;
    name?: string;
    quantity?: number | string;
    gross_weight?: number | string;
    length?: number | string | null;
    width?: number | string | null;
    height?: number | string | null;
    cbm?: number | string | null;
    placement_type?: string;
  }>;
  onEdit: (item: ItemCargoCardProps["items"][number]) => void;
  onDelete: (item: ItemCargoCardProps["items"][number]) => void;
}

export function ItemCargoCard({ items, onEdit, onDelete }: ItemCargoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Item cargo</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50">
              <TableHead className="pl-6">Nama</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Berat</TableHead>
              <TableHead>Dimensi (cm)</TableHead>
              <TableHead>CBM</TableHead>
              <TableHead>Letak</TableHead>
              <TableHead className="text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={String(it.id)}>
                <TableCell className="pl-6 font-medium">{String(it.name ?? "")}</TableCell>
                <TableCell>{String(it.quantity ?? "")}</TableCell>
                <TableCell>{String(it.gross_weight ?? "")}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {it.length != null || it.width != null || it.height != null
                    ? `${it.length ?? 0}x${it.width ?? 0}x${it.height ?? 0}`
                    : "—"}
                </TableCell>
                <TableCell className="text-xs tabular-nums">{it.cbm != null ? Number(it.cbm).toFixed(3) : "—"}</TableCell>
                <TableCell>{placementTypeLabel(it.placement_type)}</TableCell>
                <TableCell className="text-right pr-6 space-x-1">
                  <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => onEdit(it)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(it)}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {items.length === 0 ? <p className="text-sm text-muted-foreground p-6 text-center italic">Belum ada item kargo.</p> : null}
      </CardContent>
    </Card>
  );
}
