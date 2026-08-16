"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Building2, Loader2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { uploadCustomerCompanyLogo } from "@/lib/customer-api";

interface Props {
  logoUrl?: string | null;
  onUpdated?: () => void;
}

const labelCls = "text-xs font-semibold uppercase tracking-wider text-zinc-500";

export function CompanyLogoField({ logoUrl, onUpdated }: Props) {
  const t = useTranslations("Company");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadCustomerCompanyLogo(file);
      toast.success(t("form.logoSaved"));
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("form.logoFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label className={labelCls}>{t("form.companyLogo")}</Label>
      <div className="flex items-center gap-4 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={t("form.companyLogo")} className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-8 w-8 text-zinc-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? t("form.saving") : t("form.uploadLogo")}
          </Button>
          <p className="text-xs text-zinc-500">{t("form.logoHint")}</p>
        </div>
      </div>
    </div>
  );
}
