"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Props = {
  onChange: (filters: Record<string, unknown>) => void;
};

export function VendorDocumentFilters({ onChange }: Props) {
  const t = useTranslations("Vendor.documents");
  const tCommon = useTranslations("Vendor.common");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => onChange({ search }), 300);
    return () => clearTimeout(handle);
  }, [search, onChange]);

  return (
    <Card>
      <CardContent className="flex gap-2 p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("title")}
            className="h-10 pl-9"
          />
        </div>
        <Button variant="outline" className="h-10" onClick={() => setSearch("")}>
          <X className="mr-2 h-4 w-4" />
          {tCommon("reset")}
        </Button>
      </CardContent>
    </Card>
  );
}
