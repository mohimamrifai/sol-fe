"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";

type AdminReportExportButtonsProps = {
  buildUrl: (params?: Record<string, string | number | undefined>) => string;
  params?: Record<string, string | number | undefined>;
};

export function AdminReportExportButtons({ buildUrl, params }: AdminReportExportButtonsProps) {
  const t = useTranslations("AdminFsdReports");

  const openExport = (format: "excel" | "pdf") => {
    window.open(buildUrl({ ...params, format }), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" className="h-9 gap-1.5" variant="outline" onClick={() => openExport("excel")}>
        <FileSpreadsheet className="h-4 w-4" />
        {t("exportExcel")}
      </Button>
      <Button type="button" className="h-9 gap-1.5" onClick={() => openExport("pdf")}>
        <Download className="h-4 w-4" />
        {t("exportPdf")}
      </Button>
    </div>
  );
}
