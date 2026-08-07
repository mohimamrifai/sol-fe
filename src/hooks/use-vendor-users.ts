import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeVendorUserRole,
  changeVendorUserStatus,
  createVendorUser,
  fetchVendorUser,
  fetchVendorUsers,
  fetchVendorUserStats,
  resetVendorUserPassword,
  updateVendorUser,
  type VendorUser,
  type VendorUserListResponse,
  type VendorUserStats,
} from "@/lib/vendor/users-api";

export function useVendorUserStats() {
  return useQuery<{ data: VendorUserStats }>({
    queryKey: ["vendor", "users", "stats"],
    queryFn: fetchVendorUserStats,
    staleTime: 30 * 1000,
  });
}

export function useVendorUsers(params: Record<string, unknown> = {}) {
  return useQuery<VendorUserListResponse>({
    queryKey: ["vendor", "users", "list", params],
    queryFn: () => fetchVendorUsers(params),
    staleTime: 30 * 1000,
  });
}

export function useVendorUser(id: number) {
  return useQuery({
    queryKey: ["vendor", "users", "detail", id],
    queryFn: () => fetchVendorUser(id),
    enabled: !!id,
  });
}

export function useCreateVendorUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createVendorUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "users"] });
    },
  });
}

export function useUpdateVendorUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateVendorUser(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["vendor", "users"] });
      qc.invalidateQueries({ queryKey: ["vendor", "users", "detail", id] });
    },
  });
}

export function useChangeVendorUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => changeVendorUserRole(id, role),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["vendor", "users"] });
      qc.invalidateQueries({ queryKey: ["vendor", "users", "detail", id] });
    },
  });
}

export function useChangeVendorUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      changeVendorUserStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["vendor", "users"] });
      qc.invalidateQueries({ queryKey: ["vendor", "users", "detail", id] });
    },
  });
}

export function useResetVendorUserPassword() {
  return useMutation({
    mutationFn: (id: number) => resetVendorUserPassword(id),
  });
}

export type { VendorUser, VendorUserStats };
