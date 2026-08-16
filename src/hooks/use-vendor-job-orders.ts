import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptJobOrder,
  fetchJobOrder,
  fetchJobOrderActivities,
  fetchJobOrderStats,
  fetchJobOrders,
  rejectJobOrder,
  submitCompletion,
  submitProgress,
  type JobOrderListResponse,
  type JobOrderStats,
} from "@/lib/vendor/job-orders-api";

export function useVendorJobOrderStats() {
  return useQuery<{ data: JobOrderStats }>({
    queryKey: ["vendor", "job-orders", "stats"],
    queryFn: fetchJobOrderStats,
    staleTime: 30 * 1000,
  });
}

export function useVendorJobOrders(params: Record<string, unknown> = {}) {
  return useQuery<JobOrderListResponse>({
    queryKey: ["vendor", "job-orders", "list", params],
    queryFn: () => fetchJobOrders(params),
    staleTime: 30 * 1000,
  });
}

export function useVendorJobOrder(id: number) {
  return useQuery({
    queryKey: ["vendor", "job-orders", "detail", id],
    queryFn: () => fetchJobOrder(id),
    enabled: !!id,
  });
}

export function useVendorJobOrderActivities(id: number) {
  return useQuery({
    queryKey: ["vendor", "job-orders", "activities", id],
    queryFn: () => fetchJobOrderActivities(id),
    enabled: !!id,
  });
}

export function useAcceptJobOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => acceptJobOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["vendor", "job-orders"] });
      qc.invalidateQueries({ queryKey: ["vendor", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["vendor", "job-orders", "detail", id] });
    },
  });
}

export function useRejectJobOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      rejectJobOrder(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["vendor", "job-orders"] });
      qc.invalidateQueries({ queryKey: ["vendor", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["vendor", "job-orders", "detail", id] });
    },
  });
}

export function useSubmitProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => submitProgress(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["vendor", "job-orders", "detail", id] });
    },
  });
}

export function useSubmitCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => submitCompletion(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["vendor", "job-orders", "detail", id] });
      qc.invalidateQueries({ queryKey: ["vendor", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["vendor", "job-orders"] });
    },
  });
}
