"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { InvoiceStatsCards } from "@/components/invoices/invoice-stats-cards";
import {
  InvoiceFilters,
  INVOICE_FILTER_DEFAULTS,
  type InvoiceFiltersValue,
} from "@/components/invoices/invoice-filters";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { ListErrorBanner } from "@/components/shared/list-error-banner";
import { useCustomerInvoiceStats } from "@/hooks/use-customer-invoice-stats";
import { useCustomerInvoicesList } from "@/hooks/use-customer-invoices-list";
import { INVOICE_STATUSES, type CustomerInvoiceRow, type CustomerInvoiceStats } from "@/lib/invoice-types";

const PER_PAGE = 15;

const INVOICE_STATUS_FILTER_KEYS = [...INVOICE_STATUSES, "unpaid"] as const;

interface PageState {
  filters: InvoiceFiltersValue;
  page: number;
}

const INITIAL_STATE: PageState = {
  filters: INVOICE_FILTER_DEFAULTS,
  page: 1,
};

export default function CustomerInvoicesListPage() {
  const t = useTranslations("Invoices");
  const searchParams = useSearchParams();
  const didInitFromQuery = React.useRef(false);
  const [state, setState] = React.useState<PageState>(INITIAL_STATE);

  const setFilters = React.useCallback((filters: InvoiceFiltersValue) => {
    setState((prev) => (prev.filters === filters ? prev : { filters, page: 1 }));
  }, []);

  const setPage = React.useCallback((page: number) => {
    setState((prev) => (prev.page === page ? prev : { ...prev, page }));
  }, []);

  React.useEffect(() => {
    if (didInitFromQuery.current) return;
    const statusRaw = searchParams.get("status");
    const nextStatus =
      statusRaw && (INVOICE_STATUS_FILTER_KEYS as readonly string[]).includes(statusRaw)
        ? (statusRaw as InvoiceFiltersValue["status"] | "unpaid")
        : "";

    if (nextStatus) {
      didInitFromQuery.current = true;
      setState({
        filters: { ...INVOICE_FILTER_DEFAULTS, status: nextStatus as InvoiceFiltersValue["status"] },
        page: 1,
      });
    } else {
      didInitFromQuery.current = true;
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, [state.page]);

  const stats = useCustomerInvoiceStats();
  const list = useCustomerInvoicesList(state.filters, state.page, PER_PAGE);

  const rows = (list.data?.data ?? []) as unknown as CustomerInvoiceRow[];
  const total = list.data?.total ?? 0;

  const handleCardClick = React.useCallback(
    (key: keyof CustomerInvoiceStats) => {
      setFilters({ ...state.filters, status: key });
    },
    [setFilters, state.filters]
  );

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-balance text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </header>

      <InvoiceStatsCards
        counts={stats.data ?? { draft: 0, issued: 0, partially_paid: 0, paid: 0, overdue: 0 }}
        onCardClick={handleCardClick}
      />

      <InvoiceFilters value={state.filters} onChange={setFilters} />

      {list.error ? (
        <ListErrorBanner message={t("loadError")} onRetry={() => list.refetch()} />
      ) : (
        <InvoiceTable
          rows={rows}
          page={state.page}
          perPage={PER_PAGE}
          total={total}
          onPageChange={setPage}
          loading={list.isLoading}
        />
      )}
    </div>
  );
}
