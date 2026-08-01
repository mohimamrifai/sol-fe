"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, FileText, RefreshCcw } from "lucide-react";
import { DocumentStatsCards } from "@/components/documents/document-stats-cards";
import {
  DocumentFilters,
  DOCUMENT_FILTER_DEFAULTS,
  type DocumentFiltersValue,
} from "@/components/documents/document-filters";
import { DocumentTable } from "@/components/documents/document-table";
import { useCustomerDocumentStats } from "@/hooks/use-customer-documents-stats";
import { useCustomerDocumentsList } from "@/hooks/use-customer-documents-list";
import { useCustomerDocumentShipmentOptions } from "@/hooks/use-customer-document-shipment-options";
import { Button } from "@/components/ui/button";
import type { DocumentRow } from "@/lib/document-types";

const PER_PAGE = 15;

interface PageState {
  filters: DocumentFiltersValue;
  page: number;
}

const INITIAL_STATE: PageState = {
  filters: DOCUMENT_FILTER_DEFAULTS,
  page: 1,
};

export default function CustomerDocumentsListPage() {
  const t = useTranslations("Documents");
  const [state, setState] = React.useState<PageState>(INITIAL_STATE);

  const setFilters = React.useCallback((filters: DocumentFiltersValue) => {
    setState((prev) =>
      prev.filters === filters
        ? prev
        : { filters, page: 1 }
    );
  }, []);

  const setPage = React.useCallback((page: number) => {
    setState((prev) => (prev.page === page ? prev : { ...prev, page }));
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, [state.page]);

  const stats = useCustomerDocumentStats();
  const list = useCustomerDocumentsList(state.filters, state.page, PER_PAGE);
  const optionsQuery = useCustomerDocumentShipmentOptions();
  const shipmentOptions = optionsQuery.data ?? [];

  const rows = ((list.data?.data ?? []) as unknown as DocumentRow[]);
  const total = list.data?.total ?? 0;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-balance text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </header>

      <DocumentStatsCards
        counts={stats.data ?? { total: 0, booking: 0, shipment: 0, billing: 0 }}
      />

      <DocumentFilters value={state.filters} onChange={setFilters} shipmentOptions={shipmentOptions} />

      {list.error ? (
        <ErrorBanner message={t("loadError")} onRetry={() => list.refetch()} />
      ) : (
        <DocumentTable
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
