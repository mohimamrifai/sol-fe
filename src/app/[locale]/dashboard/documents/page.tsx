"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { DocumentStatsCards } from "@/components/documents/document-stats-cards";
import {
  DocumentFilters,
  DOCUMENT_FILTER_DEFAULTS,
  type DocumentFiltersValue,
} from "@/components/documents/document-filters";
import { DocumentTable } from "@/components/documents/document-table";
import { ListErrorBanner } from "@/components/shared/list-error-banner";
import { useCustomerDocumentStats } from "@/hooks/use-customer-documents-stats";
import { useCustomerDocumentsList } from "@/hooks/use-customer-documents-list";
import { useCustomerDocumentShipmentOptions } from "@/hooks/use-customer-document-shipment-options";
import type { DocumentRow, DocumentFilterTypeKey, DocumentStats } from "@/lib/document-types";
import { DOCUMENT_FILTER_TYPES } from "@/lib/document-types";

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
  const searchParams = useSearchParams();
  const didInitFromQuery = React.useRef(false);

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

  React.useEffect(() => {
    if (didInitFromQuery.current) return;
    const shipmentIdRaw = searchParams.get("shipment_id");
    const typeRaw = searchParams.get("type");
    const searchRaw = searchParams.get("search");
    const dateFromRaw = searchParams.get("date_from");
    const dateToRaw = searchParams.get("date_to");

    const shipmentId = shipmentIdRaw ? Number(shipmentIdRaw) : null;
    const nextType =
      typeRaw && (DOCUMENT_FILTER_TYPES as readonly string[]).includes(typeRaw)
        ? (typeRaw as DocumentFilterTypeKey)
        : "";

    const nextFilters: DocumentFiltersValue = {
      ...DOCUMENT_FILTER_DEFAULTS,
      search: searchRaw ?? "",
      type: nextType,
      shipmentId: shipmentId && Number.isFinite(shipmentId) ? shipmentId : null,
      dateFrom: dateFromRaw ?? "",
      dateTo: dateToRaw ?? "",
    };

    const hasAny =
      nextFilters.search !== "" ||
      nextFilters.type !== "" ||
      nextFilters.shipmentId != null ||
      nextFilters.dateFrom !== "" ||
      nextFilters.dateTo !== "";

    if (hasAny) {
      didInitFromQuery.current = true;
      setState({ filters: nextFilters, page: 1 });
    } else {
      didInitFromQuery.current = true;
    }
  }, [searchParams]);

  const stats = useCustomerDocumentStats();
  const list = useCustomerDocumentsList(state.filters, state.page, PER_PAGE);
  const optionsQuery = useCustomerDocumentShipmentOptions();
  const shipmentOptions = optionsQuery.data ?? [];

  const rows = ((list.data?.data ?? []) as unknown as DocumentRow[]);
  const total = list.data?.total ?? 0;

  const handleCardClick = React.useCallback(
    (key: keyof DocumentStats) => {
      if (key === "total") {
        setFilters({ ...state.filters, type: "" });
        return;
      }
      setFilters({ ...state.filters, type: key as DocumentFilterTypeKey });
    },
    [setFilters, state.filters]
  );

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
        onCardClick={handleCardClick}
      />

      <DocumentFilters value={state.filters} onChange={setFilters} shipmentOptions={shipmentOptions} />

      {list.error ? (
        <ListErrorBanner message={t("loadError")} onRetry={() => list.refetch()} />
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
