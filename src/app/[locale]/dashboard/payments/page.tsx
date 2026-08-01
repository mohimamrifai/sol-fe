"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCcw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentStatsCards } from "@/components/payments/payment-stats-cards";
import {
  PaymentFilters,
  PAYMENT_FILTER_DEFAULTS,
  type PaymentFiltersValue,
} from "@/components/payments/payment-filters";
import { PaymentTable } from "@/components/payments/payment-table";
import { useCustomerPaymentStats } from "@/hooks/use-customer-payment-stats";
import { useCustomerPaymentsList } from "@/hooks/use-customer-payments-list";
import type { ListQueryParams } from "@/lib/list-query";
import type { PaymentListItem } from "@/lib/payment-types";

const PER_PAGE = 15;

interface PageState {
  filters: PaymentFiltersValue;
  page: number;
}

const INITIAL_STATE: PageState = {
  filters: PAYMENT_FILTER_DEFAULTS,
  page: 1,
};

export default function CustomerPaymentsListPage() {
  const t = useTranslations("Payments");
  const [state, setState] = React.useState<PageState>(INITIAL_STATE);

  const setFilters = React.useCallback((filters: PaymentFiltersValue) => {
    setState((prev) => (prev.filters === filters ? prev : { filters, page: 1 }));
  }, []);

  const setPage = React.useCallback((page: number) => {
    setState((prev) => (prev.page === page ? prev : { ...prev, page }));
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, [state.page]);

  const stats = useCustomerPaymentStats();
  const queryParams: ListQueryParams = React.useMemo(
    () => ({
      page: state.page,
      perPage: PER_PAGE,
      search: state.filters.search || undefined,
      status: state.filters.status || undefined,
      paymentMethod: state.filters.paymentMethod || undefined,
      paymentDateFrom: state.filters.paymentDateFrom || undefined,
      paymentDateTo: state.filters.paymentDateTo || undefined,
    }),
    [state]
  );

  const list = useCustomerPaymentsList(queryParams);

  const rows = (list.data?.data ?? []) as unknown as PaymentListItem[];
  const total = list.data?.total ?? 0;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-balance text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </header>

      <PaymentStatsCards counts={stats.data?.data ?? { unpaid: 0, partially_paid: 0, paid: 0, overdue: 0 }} />

      <PaymentFilters value={state.filters} onChange={setFilters} />

      {list.error ? (
        <ErrorBanner message={t("loadError")} onRetry={() => list.refetch()} />
      ) : (
        <PaymentTable
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

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="h-8 gap-1 px-2 text-xs">
        <RefreshCcw className="h-3 w-3" />
        Retry
      </Button>
    </div>
  );
}
