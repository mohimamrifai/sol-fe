"use client";

import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";

export default function VendorJobOrderDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Vendor.common");
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
      <FileText className="h-10 w-10 text-zinc-300" />
      <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
      <p className="max-w-md text-sm text-zinc-500">{error.message || t("noData")}</p>
      <button onClick={reset} className="text-sm font-medium text-zinc-900 underline">
        Coba lagi
      </button>
    </div>
  );
}
