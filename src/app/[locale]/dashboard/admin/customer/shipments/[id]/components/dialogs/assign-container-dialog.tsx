"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  assignAdminContainerSlot,
  fetchAdminAvailableContainers,
  fetchAdminVendors,
  registerAdminVendorContainer,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

type ContainerSlot = {
  id: number;
  container_type?: { id?: number; name?: string; size?: string };
  container_type_id?: number;
  container_number?: string;
  seal_number?: string;
  ownership?: string;
  assignment_status?: string;
  slot_sequence?: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: number;
  slot: ContainerSlot | null;
  isLcl: boolean;
  isCustomerProvided: boolean;
  containerTypeId?: number;
  onSaved: () => void;
};

export function AssignContainerDialog({
  open,
  onOpenChange,
  shipmentId,
  slot,
  isLcl,
  isCustomerProvided,
  containerTypeId,
  onSaved,
}: Props) {
  const [mode, setMode] = useState<"pick" | "manual" | "register">("pick");
  const [ownership, setOwnership] = useState("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sealNumber, setSealNumber] = useState("");
  const [remark, setRemark] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  const [vendors, setVendors] = useState<Array<{ id: number; name: string }>>([]);
  const [vendorId, setVendorId] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");

  useEffect(() => {
    if (!open) return;
    setSealNumber(slot?.seal_number ?? "");
    setRemark("");
    setManualNumber(slot?.container_number ?? "");
    setMode(isCustomerProvided ? "manual" : "pick");
    void fetchAdminVendors({ perPage: 200 })
      .then((res) => {
        const list = (res.data as Array<Record<string, unknown>>) ?? [];
        setVendors(list.map((v) => ({ id: Number(v.id), name: String(v.name ?? "") })));
      })
      .catch(() => setVendors([]));
  }, [open, slot, isCustomerProvided]);

  useEffect(() => {
    if (!open || isCustomerProvided || mode !== "pick") return;
    setLoading(true);
    void fetchAdminAvailableContainers(shipmentId, {
      ownership,
      container_type_id: containerTypeId ?? slot?.container_type_id ?? slot?.container_type?.id,
      search: search || undefined,
    })
      .then((res) => setRows(res.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open, shipmentId, ownership, search, containerTypeId, slot, isCustomerProvided, mode]);

  const saveManual = async () => {
    if (!slot?.id || !manualNumber.trim()) {
      toast.error("Nomor container wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await assignAdminContainerSlot(shipmentId, slot.id, {
        container_number: manualNumber.trim(),
        seal_number: sealNumber.trim() || null,
        remark: remark.trim() || null,
      });
      toast.success("Container berhasil dialokasikan.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal assign container.");
    } finally {
      setSaving(false);
    }
  };

  const saveAsset = async (assetId: number) => {
    if (!slot?.id) return;
    setSaving(true);
    try {
      await assignAdminContainerSlot(shipmentId, slot.id, {
        container_asset_id: assetId,
        seal_number: sealNumber.trim() || null,
        remark: remark.trim() || null,
      });
      toast.success("Container berhasil dialokasikan.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal assign container.");
    } finally {
      setSaving(false);
    }
  };

  const saveRegister = async () => {
    if (!registerNumber.trim() || !vendorId || !containerTypeId) {
      toast.error("Vendor dan nomor container wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const res = await registerAdminVendorContainer(shipmentId, {
        vendor_id: Number(vendorId),
        container_number: registerNumber.trim(),
        container_type_id: containerTypeId,
        remark: remark.trim() || null,
      });
      const assetId = Number((res as { data?: { id?: number } }).data?.id);
      if (slot?.id && assetId) {
        await assignAdminContainerSlot(shipmentId, slot.id, {
          container_asset_id: assetId,
          seal_number: sealNumber.trim() || null,
          remark: remark.trim() || null,
        });
      }
      toast.success("Vendor container terdaftar dan dialokasikan.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal register container.");
    } finally {
      setSaving(false);
    }
  };

  const ctLabel = slot?.container_type
    ? `${slot.container_type.name ?? ""} ${slot.container_type.size ? `(${slot.container_type.size})` : ""}`.trim()
    : "Container";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isCustomerProvided ? "Input Container Number" : "Assign Container"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Container Type</Label>
            <Input value={ctLabel} readOnly className="bg-muted/40" />
          </div>
          <div className="space-y-1">
            <Label>Seal Number</Label>
            <Input value={sealNumber} onChange={(e) => setSealNumber(e.target.value)} placeholder="Opsional" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Remark</Label>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
          </div>
        </div>

        {isCustomerProvided ? (
          <div className="space-y-2">
            <Label>Container Number *</Label>
            <Input value={manualNumber} onChange={(e) => setManualNumber(e.target.value)} placeholder="MSCU1234567" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={mode === "pick" ? "default" : "outline"} onClick={() => setMode("pick")}>
                Pilih dari daftar
              </Button>
              <Button type="button" size="sm" variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")}>
                Register Vendor Container
              </Button>
            </div>

            {mode === "pick" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Ownership</Label>
                    <Select value={ownership} onValueChange={(v) => v && setOwnership(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Search</Label>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Container no..." />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Container No</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Yard</TableHead>
                        {isLcl ? (
                          <>
                            <TableHead className="text-right">Used CBM</TableHead>
                            <TableHead className="text-right">Remaining</TableHead>
                          </>
                        ) : null}
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={isLcl ? 7 : 5} className="text-muted-foreground">
                            Memuat container…
                          </TableCell>
                        </TableRow>
                      ) : rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isLcl ? 7 : 5} className="text-muted-foreground">
                            Tidak ada container tersedia.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => {
                          const ct = row.container_type as { name?: string; size?: string } | undefined;
                          const yard = row.current_yard as { name?: string } | undefined;
                          const canAssign = row.can_assign !== false;
                          return (
                            <TableRow key={String(row.id)}>
                              <TableCell className="font-mono text-xs">{String(row.container_number ?? "—")}</TableCell>
                              <TableCell>{ct ? `${ct.name ?? ""} ${ct.size ?? ""}`.trim() : "—"}</TableCell>
                              <TableCell className="capitalize">{String(row.ownership ?? "—")}</TableCell>
                              <TableCell>{yard?.name ?? "—"}</TableCell>
                              {isLcl ? (
                                <>
                                  <TableCell className="text-right tabular-nums">{String(row.used_cbm ?? "—")}</TableCell>
                                  <TableCell className="text-right tabular-nums">{String(row.remaining_cbm ?? "—")}</TableCell>
                                </>
                              ) : null}
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!canAssign || saving}
                                  onClick={() => void saveAsset(Number(row.id))}
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
              </>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 rounded-lg border p-4">
                <div className="space-y-1">
                  <Label>Vendor *</Label>
                  <Select value={vendorId} onValueChange={(v) => v && setVendorId(v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih vendor" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Container Number *</Label>
                  <Input value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} />
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          {isCustomerProvided ? (
            <Button type="button" disabled={saving} onClick={() => void saveManual()}>
              {saving ? "Menyimpan…" : "Save"}
            </Button>
          ) : mode === "register" ? (
            <Button type="button" disabled={saving} onClick={() => void saveRegister()}>
              {saving ? "Menyimpan…" : "Save"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
