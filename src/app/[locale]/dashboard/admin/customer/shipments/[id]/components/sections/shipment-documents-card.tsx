"use client";

import { useRef, useState } from "react";
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
import { Download, Eye, Upload } from "lucide-react";
import {
  downloadAdminShipmentDocument,
  uploadAdminShipmentDocument,
  viewAdminConsignmentNotePdf,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

type SupportingItem = {
  id?: number;
  name?: string;
  uploaded_by?: string;
  uploaded_at?: string;
};

type DocRow = {
  key?: string;
  label?: string;
  available?: boolean;
  uploaded_by?: string | null;
  uploaded_at?: string | null;
  items?: SupportingItem[];
};

type Props = {
  shipmentId: number;
  documents?: DocRow[];
  canUpload?: boolean;
  onPrintCn?: () => void;
  onUploaded?: () => void;
  cnAvailable?: boolean;
};

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShipmentDocumentsCard({
  shipmentId,
  documents,
  canUpload = false,
  onPrintCn,
  onUploaded,
  cnAvailable = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewingCn, setViewingCn] = useState(false);
  const rows = Array.isArray(documents) ? documents : [];
  const supporting = rows.find((d) => d.key === "supporting");
  const supportingItems = supporting?.items ?? [];

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadAdminShipmentDocument(shipmentId, file);
      toast.success("Dokumen pendukung diunggah.");
      onUploaded?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunggah dokumen.");
    } finally {
      setUploading(false);
    }
  };

  const handleViewCn = async () => {
    setViewingCn(true);
    try {
      const blob = await viewAdminConsignmentNotePdf(shipmentId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka Consignment Note.");
    } finally {
      setViewingCn(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Shipment Documents</CardTitle>
        {canUpload ? (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </>
        ) : null}
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50">
              <TableHead className="pl-6">Document Type</TableHead>
              <TableHead>Upload By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="pl-6">Consignment Note</TableCell>
              <TableCell>—</TableCell>
              <TableCell>—</TableCell>
              <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-2">
                  {cnAvailable ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={viewingCn}
                        onClick={() => void handleViewCn()}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      {onPrintCn ? (
                        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={onPrintCn}>
                          <Download className="h-3.5 w-3.5" />
                          Print
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </TableCell>
            </TableRow>
            {supportingItems.length === 0 ? (
              <TableRow>
                <TableCell className="pl-6">Supporting Documents</TableCell>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Belum ada dokumen pendukung.
                </TableCell>
              </TableRow>
            ) : (
              supportingItems.map((item) => (
                <TableRow key={String(item.id)}>
                  <TableCell className="pl-6">{item.name ?? "Supporting Document"}</TableCell>
                  <TableCell>{item.uploaded_by ?? "—"}</TableCell>
                  <TableCell>{fmtDate(item.uploaded_at)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() =>
                        void downloadAdminShipmentDocument(shipmentId, Number(item.id), item.name)
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
