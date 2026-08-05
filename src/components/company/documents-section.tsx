"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FileText, Plus, Trash2, Download, Eye, Loader2, Upload, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import {
  useCustomerCompanyDocuments,
  useUploadCompanyDocument,
  useDeleteCompanyDocument,
} from "@/hooks/use-customer-company-documents";
import { downloadCustomerCompanyDocument, previewCustomerCompanyDocument } from "@/lib/customer-api";

interface DocumentItem {
  id: number;
  type?: string;
  label?: string;
  file_name?: string;
  file_size?: number;
  uploaded_at?: string;
}

const DOC_TYPES = ["npwp", "nib", "business_license", "other"];

function fmtSize(n?: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function DocumentsSection() {
  const t = useTranslations("Company");
  const { data, isLoading } = useCustomerCompanyDocuments();
  const uploadMutation = useUploadCompanyDocument();
  const deleteMutation = useDeleteCompanyDocument();

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<string>("npwp");
  const [label, setLabel] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null);
  const [previewingId, setPreviewingId] = React.useState<number | null>(null);

  const docs: DocumentItem[] = (data?.data ?? []) as unknown as DocumentItem[];

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ type, label: label.trim() || undefined, file });
      toast.success("Document uploaded.");
      setOpen(false);
      setFile(null);
      setLabel("");
      setType("npwp");
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Upload failed.";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Document deleted.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed.");
    }
  };

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    try {
      const blob = await downloadCustomerCompanyDocument(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const doc = docs.find((d) => d.id === id);
      a.download = doc?.file_name || `document-${id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (id: number) => {
    setPreviewingId(id);
    try {
      const blob = await previewCustomerCompanyDocument(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Preview failed.");
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
            <FileText className="h-4 w-4 text-zinc-600" />
            {t("documents.title")}
          </CardTitle>
          <CardDescription className="text-xs">{t("documents.description")}</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="h-9 gap-1">
          <Plus className="h-4 w-4" />
          {t("documents.add")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">{t("documents.empty")}</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {d.type ? t(`documents.type.${d.type}` as `documents.type.${string}`) : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{d.label || "—"}</TableCell>
                    <TableCell className="text-xs text-zinc-500 font-mono max-w-48 truncate">
                      {d.file_name || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{fmtSize(d.file_size)}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{fmtDate(d.uploaded_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void handlePreview(d.id)}
                          disabled={previewingId === d.id}
                          title={t("documents.actions.preview")}
                        >
                          {previewingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void handleDownload(d.id)}
                          disabled={downloadingId === d.id}
                          title={t("documents.actions.download")}
                        >
                          {downloadingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void handleDelete(d.id)}
                          className="text-red-600 hover:text-red-700"
                          title={t("documents.actions.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("documents.upload.title")}</DialogTitle>
            <DialogDescription className="text-xs">{t("documents.upload.maxSize")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("documents.upload.type")}
              </Label>
              <Select value={type} onValueChange={(v) => setType(v ?? "npwp")}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {DOC_TYPES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`documents.type.${opt}` as `documents.type.${string}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("documents.upload.label")}
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("documents.upload.file")} <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="h-10 cursor-pointer"
                />
                {file ? (
                  <Button variant="ghost" size="icon-sm" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              {file ? (
                <p className="text-xs text-zinc-500">
                  {file.name} ({fmtSize(file.size)})
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploadMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void handleUpload()} disabled={uploadMutation.isPending || !file} className="gap-2">
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadMutation.isPending ? t("form.saving") : t("documents.upload.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
