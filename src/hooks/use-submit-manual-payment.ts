"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitCustomerManualPayment } from "@/lib/customer-api";
import { customerPaymentDetailQueryKey } from "@/hooks/use-customer-payment-detail";
import { paymentStatsQueryKey } from "@/hooks/use-customer-payment-stats";
import { customerPaymentsListQueryKey } from "@/hooks/use-customer-payments-list";

export interface SubmitManualPaymentInput {
  paymentId: number;
  payload: {
    payment_date: string;
    amount: number;
    bank_name: string;
    reference_number?: string;
    remark?: string;
    proof_file: File;
  };
}

export function useSubmitManualPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, payload }: SubmitManualPaymentInput) =>
      submitCustomerManualPayment(paymentId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: customerPaymentDetailQueryKey(vars.paymentId) });
      qc.invalidateQueries({ queryKey: paymentStatsQueryKey });
      qc.invalidateQueries({ queryKey: customerPaymentsListQueryKey() });
    },
  });
}
