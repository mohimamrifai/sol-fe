"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useTranslations, useLocale } from "next-intl";
import {
  useCreateVendorInvoice,
  useEligibleJobOrders,
  useUpdateVendorInvoice,
} from "@/hooks/use-vendor-invoices";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FileText,
  UploadCloud,
  X,
  AlertCircle,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { VendorInvoice } from "@/lib/vendor/invoices-api";

type JoOption = { value: string; label: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editInvoice?: VendorInvoice | null;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatIDR(locale: string, value: number) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function FileDropzone({
  label,
  required,
  accept,
  multiple,
  files,
  onChange,
  onError,
  dropzoneLabels,
}: {
  label: string;
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  files: File[] | File | null;
  onChange: (files: File[] | File | null) => void;
  onError: (msg: string) => void;
  dropzoneLabels: { primary: string; or: string; maxSize: string; remove: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const list = files ? (Array.isArray(files) ? files : [files]) : [];

  const setNew = (picked: File[]) => {
    const valid = picked.filter((f) => f.size <= MAX_FILE_BYTES);
    if (valid.length < picked.length) {
      onError(dropzoneLabels.maxSize);
    }
    if (multiple) {
      onChange([...(Array.isArray(files) ? files : []), ...valid]);
    } else {
      onChange(valid[0] ?? null);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {list.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = Array.from(e.dataTransfer.files);
            if (f.length) setNew(f);
          }}
          className={cn(
            "group flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
            isDragging
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-50",
          )}
        >
          <UploadCloud className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600" />
          <p className="text-xs text-zinc-700">
            <span className="font-medium text-zinc-900">{dropzoneLabels.primary}</span>
            {" "}{dropzoneLabels.or}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">{dropzoneLabels.maxSize}</p>
        </button>
      ) : (
        <ul className="space-y-1.5">
          {list.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-900">{f.name}</p>
                <p className="text-[10px] text-zinc-500">{formatBytes(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (Array.isArray(files)) {
                    onChange(files.filter((_, idx) => idx !== i));
                  } else {
                    onChange(null);
                  }
                }}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-rose-500"
                aria-label={dropzoneLabels.remove}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {multiple && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <UploadCloud className="h-3 w-3" />
                {dropzoneLabels.primary}
              </button>
            </li>
          )}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (picked.length) setNew(picked);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function VendorInvoiceFormDialog({ open, onOpenChange, editInvoice }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const t = useTranslations("Vendor.invoices.form");
  const tSection = useTranslations("Vendor.invoices.form.sections");
  const tF = useTranslations("Vendor.invoices.form.fields");
  const tDrop = useTranslations("Vendor.invoices.form.dropzone");
  const tSum = useTranslations("Vendor.invoices.form.summary");
  const tToast = useTranslations("Vendor.invoices.toast");
  const locale = useLocale();
  const isEdit = !!editInvoice;
  const create = useCreateVendorInvoice();
  const update = useUpdateVendorInvoice();
  const { data: eligibles } = useEligibleJobOrders();

  const [shipmentId, setShipmentId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [supporting, setSupporting] = useState<File[]>([]);

  useEffect(() => {
    if (editInvoice) {
      setShipmentId(String(editInvoice.shipment_id));
      setInvoiceDate(editInvoice.invoice_date);
      setDueDate(editInvoice.due_date);
      setInvoiceAmount(String(editInvoice.invoice_amount));
      setTaxAmount(String(editInvoice.tax_amount));
      setNotes(editInvoice.notes ?? "");
    }
  }, [editInvoice]);

  const subtotal = Number(invoiceAmount || 0);
  const tax = Number(taxAmount || 0);
  const total = subtotal + tax;

  const fileCount = (invoiceFile ? 1 : 0) + (taxFile ? 1 : 0) + supporting.length;
  const joOptions: JoOption[] = (eligibles?.data ?? []).map((j) => ({
    value: String(j.id),
    label: `${j.jo_number} — ${j.customer_name}`,
  }));
  const selectedJoOption = joOptions.find((o) => o.value === shipmentId) ?? null;
  const selectedJob = eligibles?.data?.find((j) => String(j.id) === shipmentId);
  const dropzoneLabels = {
    primary: tDrop("primary"),
    or: tDrop("or"),
    maxSize: tDrop("maxSize"),
    remove: tDrop("remove"),
  };

  const reset = () => {
    setShipmentId("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setInvoiceAmount("");
    setTaxAmount("");
    setNotes("");
    setInvoiceFile(null);
    setTaxFile(null);
    setSupporting([]);
  };

  const submit = async () => {
    try {
      const fd = new FormData();
      fd.append("shipment_id", shipmentId);
      fd.append("invoice_date", invoiceDate);
      fd.append("due_date", dueDate);
      fd.append("invoice_amount", invoiceAmount);
      if (taxAmount) fd.append("tax_amount", taxAmount);
      if (notes) fd.append("notes", notes);
      if (invoiceFile) fd.append("invoice_file", invoiceFile);
      if (taxFile) fd.append("tax_invoice_file", taxFile);
      supporting.forEach((f) => fd.append("supporting_files[]", f));
      if (isEdit && editInvoice) {
        await update.mutateAsync({ id: editInvoice.id, payload: fd });
        toast.success(tToast("updated"));
      } else {
        await create.mutateAsync(fd);
        toast.success(tToast("created"));
      }
      reset();
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : isEdit ? tToast("updateFailed") : tToast("createFailed");
      toast.error(msg);
    }
  };

  const isValid =
    !!shipmentId &&
    !!invoiceAmount &&
    !!invoiceFile &&
    !create.isPending &&
    !update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-full !max-w-[calc(100%-2.5rem)] flex-col gap-0 overflow-hidden p-0 sm:!max-w-7xl sm:max-h-[90vh] sm:rounded-xl">
        <DialogHeader className="flex-shrink-0 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-xs">
                {isEdit ? tSection("invoiceInfo") : "New"}
              </p>
              <DialogTitle className="mt-1 text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
                {isEdit ? t("editTitle") : t("createTitle")}
              </DialogTitle>
            </div>
            <p className="text-[10px] text-zinc-500 sm:text-right">{tSum("requiredNote")}</p>
          </div>
        </DialogHeader>

        <Separator className="flex-shrink-0" />

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-y-auto md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
            <section className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {tSection("jobOrder")}
              </p>
              {joOptions.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <p>{t("noCompletedHint")}</p>
                </div>
              ) : (
                <Combobox
                  items={joOptions}
                  value={selectedJoOption}
                  onValueChange={(next) => setShipmentId(next?.value ?? "")}
                >
                  <ComboboxInput
                    className="h-10 w-full"
                    placeholder={t("jobOrderPlaceholder")}
                  />
                  <ComboboxContent side="bottom" sideOffset={6}>
                    <ComboboxEmpty>{tF("noJobResults")}</ComboboxEmpty>
                    <ComboboxList>
                      {(item: JoOption) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {tSection("invoiceInfo")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700">{tF("invoiceDate")}</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700">{tF("dueDate")}</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700">
                    {tF("invoiceAmount")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="h-10 font-mono text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700">{tF("taxAmount")}</Label>
                  <Input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="h-10 font-mono text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-700">{tF("notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {tSection("uploadDocs")}
              </p>
              <div className="grid grid-cols-1 gap-3">
                <FileDropzone
                  label={tF("pdf")}
                  required
                  accept="application/pdf"
                  files={invoiceFile}
                  onChange={(f) => setInvoiceFile((f as File) ?? null)}
                  onError={() => toast.error(tDrop("maxSize"))}
                  dropzoneLabels={dropzoneLabels}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FileDropzone
                    label={tF("taxInvoice")}
                    accept="application/pdf"
                    files={taxFile}
                    onChange={(f) => setTaxFile((f as File) ?? null)}
                    onError={() => toast.error(tDrop("maxSize"))}
                    dropzoneLabels={dropzoneLabels}
                  />
                  <FileDropzone
                    label={tF("supporting")}
                    multiple
                    files={supporting}
                    onChange={(f) => setSupporting(Array.isArray(f) ? f : [])}
                    onError={() => toast.error(tDrop("maxSize"))}
                    dropzoneLabels={dropzoneLabels}
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="border-t border-zinc-200 bg-zinc-50/60 p-4 md:border-l md:border-t-0 md:p-6">
            <div className="space-y-4 sm:space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {tSum("title")}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">{tSum("jobLabel")}</p>
                {selectedJob ? (
                  <div className="mt-1.5 space-y-0.5">
                    <p className="font-mono text-xs text-zinc-900">{selectedJob.jo_number}</p>
                    <p className="text-xs text-zinc-600">{selectedJob.customer_name}</p>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs italic text-zinc-400">{tSum("noJob")}</p>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
                <Row label={tSum("subtotal")} value={formatIDR(locale, subtotal)} />
                <Row label={tSum("tax")} value={formatIDR(locale, tax)} muted={!tax} />
                <Separator className="my-2" />
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {tSum("total")}
                  </p>
                  <p className="truncate text-base font-semibold tracking-tight text-zinc-900">
                    {formatIDR(locale, total)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {tSum("filesAttached")}
                  </p>
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    fileCount > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-500",
                  )}>
                    {fileCount}
                  </span>
                </div>
                {fileCount === 0 ? (
                  <p className="text-xs italic text-zinc-400">{tSum("noFiles")}</p>
                ) : (
                  <ul className="space-y-1 text-xs text-zinc-700">
                    {invoiceFile && (
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate">{invoiceFile.name}</span>
                      </li>
                    )}
                    {taxFile && (
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate">{taxFile.name}</span>
                      </li>
                    )}
                    {supporting.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate">{f.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!isValid && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p className="break-words">
                    {tF("invoiceAmount")}, {tSection("jobOrder")}, {tF("pdf")}
                  </p>
                </div>
              )}

              <div className="hidden items-center gap-2 text-[10px] text-zinc-500 sm:flex">
                <Receipt className="h-3 w-3" />
                <p>SOL · Vendor Portal</p>
              </div>
            </div>
          </aside>
        </div>

        <Separator className="flex-shrink-0" />

        <DialogFooter className="flex-shrink-0 gap-3 px-6 py-5 sm:px-8 sm:py-5">
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} className="w-full sm:w-auto">
            {tCommon("cancel")}
          </Button>
          <Button
            disabled={!isValid}
            onClick={submit}
            className="w-full min-w-32 sm:w-auto"
          >
            {create.isPending || update.isPending ? tCommon("loading") : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={cn("font-mono text-xs tabular-nums", muted ? "text-zinc-400" : "text-zinc-900")}>
        {value}
      </p>
    </div>
  );
}
