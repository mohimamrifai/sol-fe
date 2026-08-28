"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useCustomerStatusLabel } from "@/hooks/use-admin-status-labels";
import { fetchAdminCompanies } from "@/lib/admin-api";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { ApiError } from "@/lib/api-client";
import { customerStatusBadgeClass } from "@/lib/customer-status";
import { useAuthStore } from "@/lib/store";
import type { LaravelPaginated } from "@/lib/types-api";

const PER_PAGE = 10;

export default function AdminCustomersPage() {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/customer/customers`;
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const capabilities = useMemo(
    () => getAdminCustomerCapabilities(user?.roles ?? []),
    [user?.roles],
  );
  const statusLabel = useCustomerStatusLabel();

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAdminCompanies({ page, perPage: PER_PAGE });
      setRows(response.data ?? []);
      setMeta(response);
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : t("toasts.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!authHydrated) {
    return <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t("listTitle")}</CardTitle>
        {capabilities.canCreateCustomer ? (
          <Button onClick={() => router.push(`${basePath}/create`)}>
            <Plus className="h-4 w-4" />
            {t("addCustomer")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.code")}</TableHead>
                <TableHead>{t("columns.companyName")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.registrationDate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    {tc("actions.loading")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((customer) => {
                  const id = Number(customer.id);
                  const status = String(customer.status ?? "");
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-xs">
                        {String(customer.company_code ?? "—")}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="font-medium text-left hover:underline"
                          onClick={() => router.push(`${basePath}/${id}`)}
                        >
                          {String(customer.name ?? "—")}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={customerStatusBadgeClass(status)}>
                          {statusLabel(status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.created_at ? String(customer.created_at).slice(0, 10) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {!loading && rows.length === 0 ? (
              <TableCaption>{tc("table.empty")}</TableCaption>
            ) : null}
          </Table>
        </div>

        {meta ? (
          <PaginationBar
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            onPageChange={setPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
