"use client";

import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttachmentDraft } from "@/hooks/use-booking-form";
import { Trash2, Upload } from "lucide-react";

type DocOption = { value: string; label: string };

interface AttachmentSectionProps {
  attachments: AttachmentDraft[];
  setAttachments: (v: AttachmentDraft[]) => void;
}

export function AttachmentSection({ attachments, setAttachments }: AttachmentSectionProps) {
  const t = useTranslations("Bookings.create.form");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const documentTypes: DocOption[] = useMemo(
    () => [
      { value: "invoice", label: t("docInvoice") },
      { value: "packing_list", label: t("docPackingList") },
      { value: "purchase_order", label: t("docPurchaseOrder") },
      { value: "delivery_order", label: t("docDeliveryOrder") },
      { value: "msds", label: t("docMsds") },
      { value: "other", label: t("docOther") },
    ],
    [t]
  );

  const onPickFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{t("attachmentsTitle")}</CardTitle>
        <CardDescription>{t("attachmentsSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("attachmentsHint")}</p>
            <p className="text-[11px] text-muted-foreground">{t("attachmentsFormats")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                const next: AttachmentDraft[] = files.map((file) => ({
                  file,
                  document_type: "other",
                  remarks: "",
                }));
                setAttachments([...attachments, ...next]);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" className="h-10 bg-white" onClick={onPickFiles}>
              <Upload className="mr-2 h-4 w-4" />
              {t("addDocument")}
            </Button>
          </div>
        </div>

        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>{t("file")}</TableHead>
              <TableHead className="w-[220px]">{t("documentType")}</TableHead>
              <TableHead>{t("remarks")}</TableHead>
              <TableHead className="w-12 text-right">{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attachments.length ? (
              attachments.map((a, idx) => (
                <TableRow key={`${a.file.name}-${idx}`}>
                  <TableCell className="max-w-[260px] truncate">
                    <div className="space-y-0.5">
                      <p className="font-medium truncate">{a.file.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatBytes(a.file.size)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Label className="sr-only">{t("documentType")}</Label>
                    <Select
                      value={a.document_type}
                      onValueChange={(v) =>
                        setAttachments(attachments.map((x, i) => (i === idx ? { ...x, document_type: v ?? "other" } : x)))
                      }
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder={t("documentTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={a.remarks}
                      onChange={(e) => setAttachments(attachments.map((x, i) => (i === idx ? { ...x, remarks: e.target.value } : x)))}
                      rows={2}
                      className="min-h-[44px]"
                      placeholder={t("remarksPlaceholder")}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  {t("attachmentsEmpty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function formatBytes(value: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(size)} ${units[i]}`;
}
