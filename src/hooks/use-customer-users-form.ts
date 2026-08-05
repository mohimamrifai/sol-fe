"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCustomerUser,
  updateCustomerUser,
  changeCustomerUserStatus,
  changeCustomerUserRole,
  resetCustomerUserPassword,
} from "@/lib/customer-api";
import { USERS_LIST_KEY } from "./use-customer-users-list";
import { USER_DETAIL_KEY } from "./use-customer-user-detail";

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createCustomerUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...USERS_LIST_KEY] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateCustomerUser(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...USERS_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [...USER_DETAIL_KEY, vars.id] });
    },
  });
}

export function useChangeUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      changeCustomerUserStatus(id, status),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...USERS_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [...USER_DETAIL_KEY, vars.id] });
    },
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => changeCustomerUserRole(id, role),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...USERS_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [...USER_DETAIL_KEY, vars.id] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetCustomerUserPassword(id, password),
  });
}
