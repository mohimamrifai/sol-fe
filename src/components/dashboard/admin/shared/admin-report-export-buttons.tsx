"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetchBlob, ApiError } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download-blob";
import { viewPdfBlob } from "@/lib/pdf-blob";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type AdminReportExportButtonsProps = {
  buildUrl: (params?: Record<string, string | number | undefined>) => string;
  params?: Record<string, string | number | undefined>;
};

function exportFilename(path: string, format: "excel" | "pdf"): string {
  const segment = path.split("/").filter(Boolean).slice(-2, -1)[0] ?? "report";
  return `${segment}.${format === "pdf" ? "pdf" : "xlsx"}`;
}

export function AdminReportExportButtons({ buildUrl, params }: AdminReportExportButtonsProps) {
  const t = useTranslations("AdminFsdReports");
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);

  const runExport = async (format: "excel" | "pdf") => {
    const path = buildUrl({ ...params, format });
    setLoading(format);
    try {
      const blob = await apiFetchBlob(path, { method: "GET" });
      if (format === "pdf") {
        viewPdfBlob(blob);
      } else {
        downloadBlob(blob, exportFilename(path, format));
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("exportFailed"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        className="h-9 gap-1.5"
        variant="outline"
        disabled={loading != null}
        onClick={() => void runExport("excel")}
      >
        {loading === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        {t("exportExcel")}
      </Button>
      <Button
        type="button"
        className="h-9 gap-1.5"
        disabled={loading != null}
        onClick={() => void runExport("pdf")}
      >
        {loading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {t("exportPdf")}
      </Button>
    </div>
  );
}
