"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Props = { onChange: (filters: Record<string, unknown>) => void };

const VENDOR_ROLES = [
  { value: "vendor_company_admin", label: "Vendor Company Admin" },
  { value: "vendor_ops_pic", label: "Vendor Ops PIC" },
  { value: "vendor_finance_pic", label: "Vendor Finance PIC" },
  { value: "vendor_viewer", label: "Vendor Viewer" },
];

export function VendorUserFilters({ onChange }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tF = useTranslations("Vendor.users.filters");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const handle = setTimeout(() => onChange({ search, role, status }), 300);
    return () => clearTimeout(handle);
  }, [search, role, status, onChange]);

  return (
    <Card>
      <CardContent className="grid gap-2 p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tF("search")}
            className="h-10 pl-9"
          />
        </div>
        <Select value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={tF("role")} />
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            {VENDOR_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={tCommon("status")} />
            </SelectTrigger>
            <SelectContent side="bottom">
              <SelectItem value="all">{tCommon("all")}</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10" onClick={() => { setSearch(""); setRole("all"); setStatus("all"); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
