"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payInvoice } from "@/lib/customer-api";
import { INVOICES_LIST_KEY } from "@/hooks/use-customer-invoices-list";
import { customerPaymentDetailQueryKey } from "@/hooks/use-customer-payment-detail";
import { paymentStatsQueryKey } from "@/hooks/use-customer-payment-stats";
import { customerPaymentsListQueryKey } from "@/hooks/use-customer-payments-list";

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => payInvoice(invoiceId),
    onSuccess: (_data, invoiceId) => {
      qc.invalidateQueries({ queryKey: paymentStatsQueryKey });
      qc.invalidateQueries({ queryKey: customerPaymentsListQueryKey() });
      qc.invalidateQueries({ queryKey: customerPaymentDetailQueryKey(0) });
      qc.invalidateQueries({ queryKey: ["customer", "invoices", "detail", invoiceId] });
      qc.invalidateQueries({ queryKey: INVOICES_LIST_KEY });
    },
  });
}
