"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncCustomerPaymentMidtrans } from "@/lib/customer-api";
import { customerPaymentDetailQueryKey } from "@/hooks/use-customer-payment-detail";
import { paymentStatsQueryKey } from "@/hooks/use-customer-payment-stats";
import { customerPaymentsListQueryKey } from "@/hooks/use-customer-payments-list";

export function useSyncMidtransPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: number) => syncCustomerPaymentMidtrans(paymentId),
    onSuccess: (_data, paymentId) => {
      qc.invalidateQueries({ queryKey: customerPaymentDetailQueryKey(paymentId) });
      qc.invalidateQueries({ queryKey: paymentStatsQueryKey });
      qc.invalidateQueries({ queryKey: customerPaymentsListQueryKey() });
    },
  });
}
