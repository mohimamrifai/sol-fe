"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deactivateAdminPricing, fetchAdminPricing } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import {
  formatIdr,
  pricingBasisLabel,
  serviceCategoryLabel,
} from "@/lib/vendor-fsd-options";
import { toast } from "sonner";

export default function AdminPricingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);
  const listPath = `/${locale}/dashboard/admin/vendor/pricing`;
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!Number.isFinite(id)) return;
    setLoading(true);
    try {
      const res = await fetchAdminPricing(id);
      setDetail((res as { data: Record<string, unknown> }).data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [id]);

  const deactivate = async () => {
    try {
      await deactivateAdminPricing(id);
      toast.success("Pricing dinonaktifkan.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menonaktifkan.");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  if (!detail) return <p className="text-sm text-red-600">Pricing tidak ditemukan.</p>;

  const history = (detail.pricing_history as Record<string, unknown>[]) ?? [];
  const activities = (detail.activity_log as Record<string, unknown>[]) ?? [];

  const field = (label: string, value: string) => (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 font-medium">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{String(detail.vendor ?? "Pricing Detail")}</CardTitle>
            <CardDescription className="mt-1">
              {serviceCategoryLabel(String(detail.service_category ?? ""))} ·{" "}
              {detail.created_at ? new Date(String(detail.created_at)).toLocaleDateString("id-ID") : "—"} ·{" "}
              {String(detail.created_by ?? "—")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={detail.is_active !== false ? "default" : "secondary"}>
              {detail.is_active !== false ? "Active" : "Inactive"}
            </Badge>
            {detail.is_active !== false ? (
              <Button size="sm" variant="outline" onClick={() => void deactivate()}>Inactive</Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {field("Vendor", String(detail.vendor ?? "—"))}
          {field("Service Category", serviceCategoryLabel(String(detail.service_category ?? "")))}
          {field("Pricing Basis", pricingBasisLabel(String(detail.pricing_basis ?? "")))}
          {field("Origin", String(detail.origin ?? "—"))}
          {field("Destination", String(detail.destination ?? "—"))}
          {detail.vehicle_container_type ? field("Vehicle / Container Type", String(detail.vehicle_container_type)) : null}
          {field("Unit Price", formatIdr(detail.unit_price as string))}
          {field("Minimum Charge", detail.minimum_charge ? formatIdr(detail.minimum_charge as string) : "—")}
          {field("Remark", String(detail.remark ?? "—"))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pricing History</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={String(h.id)}>
                    <TableCell>{h.created_at ? new Date(String(h.created_at)).toLocaleDateString("id-ID") : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatIdr(h.unit_price as string)}</TableCell>
                    <TableCell>{h.is_active !== false ? "Active" : "Inactive"}</TableCell>
                    <TableCell>{String(h.created_by ?? "—")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {activities.map((a, i) => (
              <li key={i} className="flex flex-wrap gap-2 text-muted-foreground">
                <span>{String(a.activity ?? "—")}</span>
                <span>·</span>
                <span>{a.created_at ? new Date(String(a.created_at)).toLocaleString("id-ID") : "—"}</span>
                {a.created_by ? <span>· {String(a.created_by)}</span> : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.push(listPath)}>Kembali</Button>
    </div>
  );
}
