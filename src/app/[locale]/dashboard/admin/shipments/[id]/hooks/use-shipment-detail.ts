import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  fetchAdminShipment,
  fetchAdminContainerTypes,
  updateAdminShipment,
  updateAdminShipmentTracking,
  addAdminShipmentContainer,
  updateAdminContainer,
  addAdminContainerRack,
  updateAdminRack,
  addAdminShipmentItem,
  updateAdminShipmentItem,
  deleteAdminShipmentItem,
  downloadAdminConsignmentNotePdf,
  deleteAdminRack,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";

type Row = Record<string, unknown>;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useShipmentDetail(shipmentId: number) {
  const [data, setData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerTypes, setContainerTypes] = useState<Row[]>([]);

  // Dialog States
  const [editOpen, setEditOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [contOpen, setContOpen] = useState(false);
  const [rackOpen, setRackOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);

  // Form Field States
  const [estDep, setEstDep] = useState("");
  const [estArr, setEstArr] = useState("");
  const [notes, setNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [trackStatus, setTrackStatus] = useState("booking_created");
  const [trackNotes, setTrackNotes] = useState("");
  const [trackAt, setTrackAt] = useState("");
  const [trackFiles, setTrackFiles] = useState<FileList | null>(null);
  const [savingTrack, setSavingTrack] = useState(false);

  const [contMode, setContMode] = useState<"create" | "edit">("create");
  const [contRow, setContRow] = useState<Row | null>(null);
  const [contTypeId, setContTypeId] = useState("");
  const [contNum, setContNum] = useState("");
  const [contSeal, setContSeal] = useState("");
  const [savingCont, setSavingCont] = useState(false);

  const [rackMode, setRackMode] = useState<"create" | "edit">("create");
  const [rackRow, setRackRow] = useState<Row | null>(null);
  const [rackContainerId, setRackContainerId] = useState<number | null>(null);
  const [rackName, setRackName] = useState("");
  const [savingRack, setSavingRack] = useState(false);

  const [itemMode, setItemMode] = useState<"create" | "edit">("create");
  const [itemRow, setItemRow] = useState<Row | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemWeight, setItemWeight] = useState("");
  const [itemPlacement, setItemPlacement] = useState<"rack" | "floor">("floor");
  const [itemContainerId, setItemContainerId] = useState("_none");
  const [itemRackId, setItemRackId] = useState("_none");
  const [itemFragile, setItemFragile] = useState(false);
  const [itemStack, setItemStack] = useState(true);
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemHeight, setItemHeight] = useState("");
  const [itemCbm, setItemCbm] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  const [deleteItemRow, setDeleteItemRow] = useState<Row | null>(null);
  const [deleteItemLoading, setDeleteItemLoading] = useState(false);

  const [deleteRackRow, setDeleteRackRow] = useState<Row | null>(null);
  const [deleteRackOpen, setDeleteRackOpen] = useState(false);
  const [deleteRackLoading, setDeleteRackLoading] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(shipmentId) || shipmentId < 1) {
      setError("ID shipment tidak valid.");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminShipment(shipmentId);
      const row = (res as { data: Row }).data;
      setData(row);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat shipment.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetchAdminContainerTypes({ page: 1, perPage: 200 });
        const p = r as { data?: Row[] };
        setContainerTypes(p.data ?? []);
        const first = p.data?.[0];
        if (first?.id != null) setContTypeId(String(first.id));
      } catch {
        setContainerTypes([]);
      }
    })();
  }, []);

  const containers = useMemo(() => {
    const c = data?.containers as Row[] | undefined;
    return Array.isArray(c) ? c : [];
  }, [data]);

  const items = useMemo(() => {
    const it = data?.items as Row[] | undefined;
    return Array.isArray(it) ? it : [];
  }, [data]);

  const trackings = useMemo(() => {
    const t = data?.trackings as Row[] | undefined;
    return Array.isArray(t) ? [...t].reverse() : [];
  }, [data]);

  const openEditShipment = () => {
    if (!data) return;
    setEstDep(String(data.estimated_departure ?? "").slice(0, 10));
    setEstArr(String(data.estimated_arrival ?? "").slice(0, 10));
    setNotes(String(data.notes ?? ""));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      await updateAdminShipment(shipmentId, {
        estimated_departure: estDep || null,
        estimated_arrival: estArr || null,
        notes: notes.trim() || null,
      });
      toast.success("Data shipment berhasil diperbarui.");
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan.");
    } finally {
      setSavingEdit(false);
    }
  };

  const saveTracking = async () => {
    setSavingTrack(true);
    try {
      const fd = new FormData();
      fd.append("status", trackStatus);
      if (trackNotes.trim()) fd.append("notes", trackNotes.trim());
      if (trackAt) fd.append("tracked_at", new Date(trackAt).toISOString());
      if (trackFiles?.length) {
        for (let i = 0; i < trackFiles.length; i++) {
          fd.append("photos[]", trackFiles[i]);
        }
      }
      await updateAdminShipmentTracking(shipmentId, fd);
      toast.success("Tracking berhasil ditambahkan.");
      setTrackOpen(false);
      setTrackNotes("");
      setTrackFiles(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal update tracking.");
    } finally {
      setSavingTrack(false);
    }
  };

  const openAddContainer = () => {
    setContMode("create");
    setContRow(null);
    setContTypeId(containerTypes[0]?.id ? String(containerTypes[0].id) : "");
    setContNum("");
    setContSeal("");
    setContOpen(true);
  };

  const openEditContainer = (row: Row) => {
    setContMode("edit");
    setContRow(row);
    setContTypeId(row.container_type_id ? String(row.container_type_id) : "");
    setContNum(String(row.container_number ?? ""));
    setContSeal(String(row.seal_number ?? ""));
    setContOpen(true);
  };

  const saveContainer = async () => {
    if (!contTypeId) return;
    setSavingCont(true);
    try {
      const payload = {
        container_type_id: Number(contTypeId),
        container_number: contNum.trim() || null,
        seal_number: contSeal.trim() || null,
      };
      if (contMode === "create") {
        await addAdminShipmentContainer(shipmentId, payload);
        toast.success("Kontainer berhasil ditambahkan.");
      } else if (contRow?.id != null) {
        await updateAdminContainer(Number(contRow.id), payload);
        toast.success("Kontainer berhasil diperbarui.");
      }
      setContOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan kontainer.");
    } finally {
      setSavingCont(false);
    }
  };

  const openRack = (containerId: number) => {
    setRackMode("create");
    setRackRow(null);
    setRackContainerId(containerId);
    setRackName("");
    setRackOpen(true);
  };

  const openEditRack = (row: Row, containerId: number) => {
    setRackMode("edit");
    setRackRow(row);
    setRackContainerId(containerId);
    setRackName(String(row.name ?? ""));
    setRackOpen(true);
  };

  const saveRack = async () => {
    if (rackContainerId == null || !rackName.trim()) return;
    setSavingRack(true);
    try {
      if (rackMode === "create") {
        await addAdminContainerRack(rackContainerId, { name: rackName.trim() });
        toast.success("Rack berhasil ditambahkan.");
      } else if (rackRow?.id != null) {
        await updateAdminRack(Number(rackRow.id), { name: rackName.trim() });
        toast.success("Rack berhasil diperbarui.");
      }
      setRackOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan rack.");
    } finally {
      setSavingRack(false);
    }
  };

  const openNewItem = () => {
    setItemMode("create");
    setItemRow(null);
    setItemName("");
    setItemDesc("");
    setItemQty("1");
    setItemWeight("");
    setItemPlacement("floor");
    setItemContainerId("_none");
    setItemRackId("_none");
    setItemFragile(false);
    setItemStack(true);
    setItemLength("");
    setItemWidth("");
    setItemHeight("");
    setItemCbm("");
    setItemOpen(true);
  };

  const openEditItem = (row: Row) => {
    setItemMode("edit");
    setItemRow(row);
    setItemName(String(row.name ?? ""));
    setItemDesc(String(row.description ?? ""));
    setItemQty(String(row.quantity ?? "1"));
    setItemWeight(String(row.gross_weight ?? ""));
    setItemPlacement((row.placement_type as "rack" | "floor") || "floor");
    setItemContainerId(row.container_id != null ? String(row.container_id) : "_none");
    setItemRackId(row.rack_id != null ? String(row.rack_id) : "_none");
    setItemFragile(Boolean(row.is_fragile));
    setItemStack(row.is_stackable !== false);
    setItemLength(String(row.length ?? ""));
    setItemWidth(String(row.width ?? ""));
    setItemHeight(String(row.height ?? ""));
    setItemCbm(String(row.cbm ?? ""));
    setItemOpen(true);
  };

  const saveItem = async () => {
    setSavingItem(true);
    try {
      const body: Record<string, unknown> = {
        name: itemName.trim(),
        description: itemDesc.trim() || null,
        quantity: Number(itemQty) || 1,
        gross_weight: Number(itemWeight) || 0,
        placement_type: itemPlacement,
        container_id:
          itemContainerId && itemContainerId !== "_none" ? Number(itemContainerId) : null,
        rack_id: itemRackId && itemRackId !== "_none" ? Number(itemRackId) : null,
        is_fragile: itemFragile,
        is_stackable: itemStack,
        length: Number(itemLength) || null,
        width: Number(itemWidth) || null,
        height: Number(itemHeight) || null,
        cbm: Number(itemCbm) || null,
      };
      if (itemMode === "create") {
        await addAdminShipmentItem(shipmentId, body);
        toast.success("Item berhasil ditambahkan.");
      } else if (itemRow?.id != null) {
        await updateAdminShipmentItem(Number(itemRow.id), body);
        toast.success("Item berhasil diperbarui.");
      }
      setItemOpen(false);
      await load();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Gagal menyimpan item.";
      toast.error(msg);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (deleteItemRow?.id == null) return;
    setDeleteItemLoading(true);
    try {
      await deleteAdminShipmentItem(Number(deleteItemRow.id));
      toast.success("Item berhasil dihapus.");
      setDeleteItemOpen(false);
      setDeleteItemRow(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDeleteItemLoading(false);
    }
  };

  const handleDeleteRack = async () => {
    if (deleteRackRow?.id == null) return;
    setDeleteRackLoading(true);
    try {
      await deleteAdminRack(Number(deleteRackRow.id));
      toast.success("Rack berhasil dihapus.");
      setDeleteRackOpen(false);
      setDeleteRackRow(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus rack. Pastikan tidak ada barang di dalamnya.");
    } finally {
      setDeleteRackLoading(false);
    }
  };

  const pdf = async () => {
    try {
      const blob = await downloadAdminConsignmentNotePdf(shipmentId);
      const cnNum = String(data?.waybill_number ?? shipmentId);
      downloadBlob(blob, `consignment-note-${cnNum}.pdf`);
      toast.success("PDF consignment note berhasil diunduh.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal unduh PDF.");
    }
  };

  const rackOptions = useMemo(() => {
    const opts: { id: number; label: string }[] = [];
    for (const c of containers) {
      const racks = c.racks as Row[] | undefined;
      if (!Array.isArray(racks)) continue;
      const cn = String((c.container_type as { name?: string } | undefined)?.name ?? c.id ?? "Kontainer");
      for (const r of racks) {
        if (r.id != null) opts.push({ id: Number(r.id), label: `${cn} / ${String(r.name ?? r.id)}` });
      }
    }
    return opts;
  }, [containers]);

  return {
    data,
    loading,
    error,
    containerTypes,
    containers,
    items,
    trackings,
    rackOptions,
    
    // Dialog control
    editOpen, setEditOpen,
    trackOpen, setTrackOpen,
    contOpen, setContOpen,
    rackOpen, setRackOpen,
    itemOpen, setItemOpen,
    deleteItemOpen, setDeleteItemOpen,
    deleteRackOpen, setDeleteRackOpen,

    // Edit logic
    estDep, setEstDep,
    estArr, setEstArr,
    notes, setNotes,
    savingEdit,
    openEditShipment,
    saveEdit,

    // Tracking logic
    trackStatus, setTrackStatus,
    trackNotes, setTrackNotes,
    trackAt, setTrackAt,
    setTrackFiles,
    savingTrack,
    saveTracking,

    // Container logic
    contMode,
    contTypeId, setContTypeId,
    contNum, setContNum,
    contSeal, setContSeal,
    savingCont,
    openAddContainer,
    openEditContainer,
    saveContainer,

    // Rack logic
    rackMode,
    rackName, setRackName,
    savingRack,
    openRack,
    openEditRack,
    saveRack,
    deleteRackRow, setDeleteRackRow,
    deleteRackLoading,
    handleDeleteRack,

    // Item logic
    itemMode,
    itemName, setItemName,
    itemDesc, setItemDesc,
    itemQty, setItemQty,
    itemWeight, setItemWeight,
    itemPlacement, setItemPlacement,
    itemContainerId, setItemContainerId,
    itemRackId, setItemRackId,
    itemFragile, setItemFragile,
    itemStack, setItemStack,
    itemLength, setItemLength,
    itemWidth, setItemWidth,
    itemHeight, setItemHeight,
    itemCbm, setItemCbm,
    savingItem,
    openNewItem,
    openEditItem,
    saveItem,

    // Delete item
    deleteItemRow, setDeleteItemRow,
    deleteItemLoading,
    handleDeleteItem,

    // PDF
    pdf,
  };
}
