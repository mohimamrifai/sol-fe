"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { fetchAdminContainer, fetchAllAdminContainerTypes, updateAdminContainer } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { Container as ContainerIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type AssignmentRow = {
  shipment_id?: number;
  shipment_number?: string;
  customer?: string;
  service?: string;
  status?: string;
  departure?: string;
  eta?: string;
};

type LclRow = {
  shipment_id?: number;
  shipment_number?: string;
  used_cbm?: number;
  used_weight?: number;
};

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function AdminContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/container/containers`;
  const t = useTranslations("AdminFsdContainers");
  const tc = useTranslations("AdminCommon");

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [containerTypeId, setContainerTypeId] = useState("");
  const [remark, setRemark] = useState("");
  const [types, setTypes] = useState<{ id: number; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const typeOptions = useMemo(
    () => types.map((x) => ({ value: String(x.id), label: x.label })),
    [types]
  );

  const refresh = useCallback(async () => {
    const res = await fetchAdminContainer(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    const general = (d.general as Record<string, unknown> | undefined) ?? d;
    setContainerTypeId(String(general.container_type_id ?? d.container_type_id ?? ""));
    setRemark(String(general.remark ?? d.remark ?? ""));
  }, [id]);

  useEffect(() => {
    void refresh().catch(() => setDetail(null));
    void fetchAllAdminContainerTypes().then((rows) => {
      setTypes(rows.map((row) => ({
        id: Number(row.id),
        label: String(row.name ?? row.code),
      })));
    });
  }, [refresh]);

  const ownershipLabel = useCallback(
    (value: string) => {
      if (value === "company") return t("filters.company");
      if (value === "vendor") return t("filters.vendor");
      return value;
    },
    [t]
  );

  const statusLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase().replace(/\s+/g, "_");
      if (t.has(`statuses.${key}` as "statuses.available")) {
        return t(`statuses.${key}` as "statuses.available");
      }
      return value;
    },
    [t]
  );

  const movementLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase().replace(/\s+/g, "_");
      const detailKeyMap: Record<string, string> = {
        registered: "registered",
        assigned: "assigned",
        loaded: "train_departed",
        arrived: "arrived_yard",
        released: "released",
        train_departed: "train_departed",
        arrived_yard: "arrived_yard",
        returned: "returned",
      };
      const mapped = detailKeyMap[key] ?? key;
      if (t.has(`movements.${mapped}` as "movements.assigned")) {
        return t(`movements.${mapped}` as "movements.assigned");
      }
      return value;
    },
    [t]
  );

  const maintenanceTypeLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase();
      if (t.has(`maintenanceTypes.${key}` as "maintenanceTypes.repair")) {
        return t(`maintenanceTypes.${key}` as "maintenanceTypes.repair");
      }
      return value;
    },
    [t]
  );

  const maintenanceStatusLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase();
      if (t.has(`maintenanceStatuses.${key}` as "maintenanceStatuses.scheduled")) {
        return t(`maintenanceStatuses.${key}` as "maintenanceStatuses.scheduled");
      }
      return value;
    },
    [t]
  );

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminContainer(id, {
        container_type_id: containerTypeId ? Number(containerTypeId) : undefined,
        remark,
      });
      toast.success(t("updateSuccess"));
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  if (!detail) return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;

  const header = (detail.header as Record<string, unknown> | undefined) ?? {};
  const general = (detail.general as Record<string, unknown> | undefined) ?? detail;
  const ownership = String(general.ownership ?? detail.ownership ?? "");
  const assignments = (detail.current_assignments as AssignmentRow[] | undefined) ?? [];
  const utilization = detail.utilization as Record<string, unknown> | undefined;
  const movements = (detail.movements as Record<string, unknown>[] | undefined) ?? [];
  const maintenances = (detail.maintenances as Record<string, unknown>[] | undefined) ?? [];
  const activityLog = (detail.activity_log as Record<string, unknown>[] | undefined) ?? [];
  const lclRows = (utilization?.lcl_rows as LclRow[] | undefined) ?? [];

  const shipmentLink = (shipmentId?: number) =>
    shipmentId ? `/${locale}/dashboard/admin/customer/shipments/${shipmentId}` : null;

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={ContainerIcon}
        title={String(header.container_number ?? detail.container_number ?? "—")}
        description={t("detailSubtitle")}
        actions={<Button variant="outline" onClick={() => router.push(basePath)}>{tc("actions.back")}</Button>}
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("columns.containerNo")}</p>
            <p className="font-mono text-sm font-semibold">{String(header.container_number ?? "—")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("columns.type")}</p>
            <p className="text-sm font-medium">{String(header.container_type ?? general.container_type ?? "—")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("columns.ownership")}</p>
            <Badge variant="secondary" className="mt-1">{ownershipLabel(ownership)}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{tc("table.status")}</p>
            <Badge variant="outline" className="mt-1">{statusLabel(String(header.status ?? detail.status ?? "—"))}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("detail.general")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ReadonlyField label={t("columns.containerNo")} value={String(general.container_number ?? "—")} />
            <div className="space-y-2">
              <Label>{t("columns.type")}</Label>
              <SearchableCombobox
                options={typeOptions}
                value={containerTypeId}
                onChange={setContainerTypeId}
                placeholder={t("columns.type")}
                searchPlaceholder={t("searchPlaceholder")}
                aria-label={t("columns.type")}
              />
            </div>
            <ReadonlyField
              label={t("columns.ownership")}
              value={<Badge variant="secondary">{ownershipLabel(ownership)}</Badge>}
            />
            {ownership === "vendor" ? (
              <ReadonlyField label={t("filters.vendor")} value={String(general.vendor ?? "—")} />
            ) : null}
            <ReadonlyField label={t("fields.maxPayload")} value={String(general.max_payload_kg ?? "—")} />
            <ReadonlyField label={t("fields.maxCapacity")} value={String(general.max_capacity_cbm ?? "—")} />
            <ReadonlyField label={t("columns.yard")} value={String(general.current_yard ?? "—")} />
            <ReadonlyField label={t("fields.manufactureYear")} value={String(general.manufacture_year ?? "—")} />
            <div className="space-y-2">
              <Label>{t("fields.remark")}</Label>
              <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} />
            </div>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? tc("actions.saving") : tc("actions.save")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("detail.assignment")}</CardTitle></CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noAssignment")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.shipment")}</TableHead>
                    <TableHead>{t("columns.customer")}</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((row) => {
                    const href = shipmentLink(row.shipment_id);
                    return (
                      <TableRow key={String(row.shipment_id)}>
                        <TableCell className="font-mono text-xs">
                          {href ? (
                            <Link href={href} className="text-primary underline">{row.shipment_number}</Link>
                          ) : (
                            row.shipment_number ?? "—"
                          )}
                        </TableCell>
                        <TableCell>{row.customer ?? "—"}</TableCell>
                        <TableCell>{row.service ?? "—"}</TableCell>
                        <TableCell>{row.status ?? "—"}</TableCell>
                        <TableCell>{row.departure ?? "—"}</TableCell>
                        <TableCell>{row.eta ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("detail.utilization")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {utilization?.mode === "fcl" ? (
              <p className="text-sm font-medium">{String(utilization.dedicated_message ?? t("detail.fclDedicated"))}</p>
            ) : utilization?.mode === "lcl" ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">{t("detail.lclBreakdown")}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("columns.shipment")}</TableHead>
                      <TableHead className="text-right">Used CBM</TableHead>
                      <TableHead className="text-right">Used Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lclRows.map((row) => {
                      const href = shipmentLink(row.shipment_id);
                      return (
                        <TableRow key={String(row.shipment_id)}>
                          <TableCell className="font-mono text-xs">
                            {href ? (
                              <Link href={href} className="text-primary underline">{row.shipment_number}</Link>
                            ) : (
                              row.shipment_number ?? "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{row.used_cbm ?? 0}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.used_weight ?? 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <ReadonlyField label="Used CBM" value={String(utilization.used_cbm ?? 0)} />
                  <ReadonlyField label="Remaining CBM" value={String(utilization.remaining_cbm ?? 0)} />
                  <ReadonlyField label="Used Payload (Kg)" value={String(utilization.used_payload_kg ?? 0)} />
                  <ReadonlyField label="Remaining Payload (Kg)" value={String(utilization.remaining_payload_kg ?? 0)} />
                </div>
              </>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <ReadonlyField label="Used CBM" value="0" />
                <ReadonlyField label="Remaining" value="100%" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("detail.movements")}</CardTitle></CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.emptyMovements")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("movement.occurredAt")}</TableHead>
                    <TableHead>{t("movement.activity")}</TableHead>
                    <TableHead>{t("movement.route")}</TableHead>
                    <TableHead>{t("columns.shipment")}</TableHead>
                    <TableHead>{t("movement.createdBy")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={String(m.id)}>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.occurred_at ? new Date(String(m.occurred_at)).toLocaleString("id-ID") : "—"}
                      </TableCell>
                      <TableCell>{movementLabel(String(m.activity ?? "—"))}</TableCell>
                      <TableCell>{String(m.location ?? "—")}</TableCell>
                      <TableCell className="font-mono text-xs">{String(m.shipment_number ?? "—")}</TableCell>
                      <TableCell>{String(m.updated_by ?? "—")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("detail.maintenance")}</CardTitle></CardHeader>
          <CardContent>
            {maintenances.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.emptyMaintenance")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Maintenance Type</TableHead>
                    <TableHead>{t("filters.vendor")}</TableHead>
                    <TableHead>{t("fields.remark")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenances.map((m) => (
                    <TableRow key={String(m.id)}>
                      <TableCell>{String(m.maintenance_date ?? "—")}</TableCell>
                      <TableCell>{maintenanceTypeLabel(String(m.maintenance_type ?? "—"))}</TableCell>
                      <TableCell>{String(m.vendor ?? "—")}</TableCell>
                      <TableCell>{String(m.remark ?? "—")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{maintenanceStatusLabel(String(m.status ?? "—"))}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("detail.activityLog")}</CardTitle></CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.emptyActivity")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("movement.occurredAt")}</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>{t("movement.createdBy")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLog.map((row, index) => (
                    <TableRow key={`${String(row.occurred_at)}-${index}`}>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.occurred_at ? new Date(String(row.occurred_at)).toLocaleString("id-ID") : "—"}
                      </TableCell>
                      <TableCell>{String(row.description ?? "—")}</TableCell>
                      <TableCell>{String(row.user ?? "—")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
