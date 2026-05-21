"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";

interface ContainerRackCardProps {
  containers: Array<{
    id?: number | string;
    container_type?: { name?: string; size?: string };
    container_type_id?: number | string;
    container_number?: string;
    seal_number?: string;
    racks?: Array<{ id: number | string; name?: string }>;
  }>;
  onAddRack: (containerId: number) => void;
  onEditContainer: (container: ContainerRackCardProps["containers"][number]) => void;
  onEditRack: (rack: Record<string, unknown>, containerId: number) => void;
  onDeleteRack?: (rack: Record<string, unknown>) => void;
}

export function ContainerRackCard({ containers, onAddRack, onEditContainer, onEditRack, onDeleteRack }: ContainerRackCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontainer & rack</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {containers.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Belum ada kontainer.</p>
        ) : (
          containers.map((c) => {
            const cid = Number(c.id);
            const ct = c.container_type;
            const racks = c.racks;
            return (
              <div key={cid} className="rounded-lg border p-4 bg-zinc-50/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-bold text-zinc-900 flex items-center gap-2">
                      <span>{ct?.name ?? "Kontainer"} {ct?.size ? `(${ct.size})` : ""}</span>
                      <button
                        type="button"
                        onClick={() => onEditContainer(c)}
                        className="text-zinc-400 hover:text-blue-600 transition-colors"
                        title="Edit Kontainer"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Num: {String(c.container_number ?? "—")} / Seal: {String(c.seal_number ?? "—")}
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="h-8 bg-white" onClick={() => onAddRack(cid)}>
                    + Rack
                  </Button>
                </div>
                {Array.isArray(racks) && racks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-100 mt-2">
                    {racks.map((r) => (
                      <div key={String(r.id)} className="group flex items-center gap-1 bg-white border text-[10px] pl-2 pr-1 py-0.5 rounded text-zinc-600">
                        <span>{String(r.name ?? r.id)}</span>
                        <button
                          type="button"
                          onClick={() => onEditRack(r, cid)}
                          className="text-zinc-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit Rack"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {onDeleteRack && (
                          <button
                            type="button"
                            onClick={() => onDeleteRack(r)}
                            className="text-zinc-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all ml-1"
                            title="Hapus Rack"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
