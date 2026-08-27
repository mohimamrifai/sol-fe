"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Download, Eye, FileText, Inbox, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  downloadAdminPaymentProof,
  downloadAdminPaymentReceipt,
  previewAdminPaymentProof,
  uploadAdminPaymentProof,
} from "@/lib/admin-api";
import { downloadBlob } from "@/lib/download-blob";
import { ApiError } from "@/lib/api-client";

type SupportingDoc = {
  key: string;
  label: string;
  available: boolean;
  meta?: {
    id?: number;
    original_name?: string;
    file_size?: number;
    category?: string;
  };
};

type Props = {
  paymentId: number;
  paymentNo: string;
  documents: SupportingDoc[];
  canUpload?: boolean;
  onUploaded?: () => void;
};

function fileSizeKb(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function PaymentSupportingDocuments({
  paymentId,
  paymentNo,
  documents,
  canUpload = false,
  onUploaded,
}: Props) {
  const t = useTranslations("AdminPayments.detail");
  const proofInputRef = useRef<HTMLInputElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  async function onPreview(doc: SupportingDoc) {
    try {
      if (doc.key === "payment_receipt") {
        const blob = await downloadAdminPaymentReceipt(paymentId, false);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        return;
      }
      const blob = await previewAdminPaymentProof(paymentId, doc.meta?.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("docOpenFailed"));
    }
  }

  async function onDownload(doc: SupportingDoc) {
    try {
      if (doc.key === "payment_receipt") {
        const blob = await downloadAdminPaymentReceipt(paymentId, true);
        downloadBlob(blob, `payment-receipt-${paymentNo}.pdf`);
        return;
      }
      const blob = await downloadAdminPaymentProof(paymentId, {
        download: true,
        attachmentId: doc.meta?.id,
      });
      const name = doc.meta?.original_name || `payment-proof-${paymentNo}`;
      downloadBlob(blob, name);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("docDownloadFailed"));
    }
  }

  async function onUpload(file: File, category: "payment_proof" | "other") {
    try {
      await uploadAdminPaymentProof(paymentId, file, category);
      toast.success(t("docUploaded"));
      onUploaded?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("docUploadFailed"));
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sectionDocuments")}</p>
        {canUpload ? (
          <div className="flex flex-wrap gap-2">
            <input
              ref={proofInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file, "payment_proof");
                e.target.value = "";
              }}
            />
            <input
              ref={otherInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file, "other");
                e.target.value = "";
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={() => proofInputRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" />
              {t("uploadProof")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => otherInputRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" />
              {t("uploadOther")}
            </Button>
          </div>
        ) : null}
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
          <Inbox className="h-6 w-6" />
          <p className="text-sm">{t("documentsEmpty")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={`${doc.key}-${doc.meta?.id ?? "receipt"}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{doc.label}</div>
                  {doc.meta?.original_name ? (
                    <div className="truncate text-[11px] text-muted-foreground">
                      {doc.meta.original_name}
                      {doc.meta.file_size ? ` · ${fileSizeKb(doc.meta.file_size)}` : ""}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {doc.available ? (
                  <>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => void onPreview(doc)}>
                      <Eye className="mr-1 h-3 w-3" />
                      {t("docView")}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => void onDownload(doc)}>
                      <Download className="mr-1 h-3 w-3" />
                      {t("docDownload")}
                    </Button>
                  </>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
