"use client";

import { useQuery } from "@tanstack/react-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { fetchCustomerInvoices, type ListQueryParams } from "@/lib/customer-api";
import type { CustomerInvoiceRow } from "@/lib/invoice-types";
import type { InvoiceFiltersValue } from "@/components/invoices/invoice-filters";

export const INVOICES_LIST_KEY = ["customer", "invoices", "list"] as const;

export function buildInvoiceListParams(
  filters: InvoiceFiltersValue,
  page: number,
  perPage: number
): ListQueryParams {
  return {
    page,
    perPage,
    search: filters.search || undefined,
    status: filters.status || undefined,
    invoiceDateFrom: filters.invoiceDateFrom || undefined,
    invoiceDateTo: filters.invoiceDateTo || undefined,
    dueDateFrom: filters.dueDateFrom || undefined,
    dueDateTo: filters.dueDateTo || undefined,
  };
}

export function useCustomerInvoicesList(filters: InvoiceFiltersValue, page: number, perPage: number) {
  const params = buildInvoiceListParams(filters, page, perPage);
  return useQuery({
    queryKey: [...INVOICES_LIST_KEY, params] as const,
    queryFn: async (): Promise<LaravelPaginated<CustomerInvoiceRow>> => {
      return (await fetchCustomerInvoices(params)) as unknown as LaravelPaginated<CustomerInvoiceRow>;
    },
    placeholderData: (prev) => prev as LaravelPaginated<CustomerInvoiceRow> | undefined,
  });
}
