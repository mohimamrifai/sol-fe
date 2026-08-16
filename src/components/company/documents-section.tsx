"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FileText, Plus, Download, Eye, Loader2, Upload, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/hooks/use-customer-company-documents";
import { downloadCustomerCompanyDocument, previewCustomerCompanyDocument } from "@/lib/customer-api";

interface DocumentItem {
  id: number;
  type?: string;
  label?: string;
  file_name?: string;
  uploaded_at?: string;
}

const FSD_DOC_TYPES = ["npwp", "nib", "business_license", "other"] as const;

function latestByType(docs: DocumentItem[]): Record<string, DocumentItem | undefined> {
  const grouped: Record<string, DocumentItem[]> = {};
  for (const d of docs) {
    if (!d.type) continue;
    grouped[d.type] = grouped[d.type] ?? [];
    grouped[d.type].push(d);
  }
  const result: Record<string, DocumentItem | undefined> = {};
  for (const type of FSD_DOC_TYPES) {
    const list = grouped[type] ?? [];
    result[type] = list.sort((a, b) => {
      const ta = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
      const tb = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
      return tb - ta;
    })[0];
  }
  return result;
}

export function DocumentsSection() {
  const t = useTranslations("Company");
  const { data, isLoading } = useCustomerCompanyDocuments();
  const uploadMutation = useUploadCompanyDocument();

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<string>("npwp");
  const [label, setLabel] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null);
  const [previewingId, setPreviewingId] = React.useState<number | null>(null);

  const docs: DocumentItem[] = (data?.data ?? []) as unknown as DocumentItem[];
  const byType = latestByType(docs);

  const handleUpload = async () => {
    if (!file) {
      toast.error(t("documents.upload.fileRequired"));
      return;
    }
    try {
      await uploadMutation.mutateAsync({ type, label: label.trim() || undefined, file });
      toast.success(t("documents.upload.success"));
      setOpen(false);
      setFile(null);
      setLabel("");
      setType("npwp");
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : t("documents.upload.failed");
      toast.error(msg);
    }
  };

  const handleDownload = async (id: number, fileName?: string) => {
    setDownloadingId(id);
    try {
      const blob = await downloadCustomerCompanyDocument(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `document-${id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("documents.actions.downloadFailed"));
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
      toast.error(e instanceof ApiError ? e.message : t("documents.actions.previewFailed"));
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <FileText className="h-4 w-4 text-zinc-600" />
          {t("documents.title")}
        </CardTitle>
        <Button onClick={() => setOpen(true)} size="sm" className="h-9 gap-1">
          <Plus className="h-4 w-4" />
          {t("documents.add")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("documents.table.document")}</TableHead>
                  <TableHead className="text-right">{t("documents.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FSD_DOC_TYPES.map((docType) => {
                  const doc = byType[docType];
                  return (
                    <TableRow key={docType}>
                      <TableCell className="font-medium text-sm">
                        {t(`documents.type.${docType}` as `documents.type.${string}`)}
                      </TableCell>
                      <TableCell className="text-right">
                        {doc ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handlePreview(doc.id)}
                              disabled={previewingId === doc.id}
                              className="h-8 gap-1"
                            >
                              {previewingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                              {t("documents.actions.preview")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDownload(doc.id, doc.file_name)}
                              disabled={downloadingId === doc.id}
                              className="h-8 gap-1"
                            >
                              {downloadingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                              {t("documents.actions.download")}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">{t("documents.noFile")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  {FSD_DOC_TYPES.map((opt) => (
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
                placeholder={t("documents.upload.labelOptional")}
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
