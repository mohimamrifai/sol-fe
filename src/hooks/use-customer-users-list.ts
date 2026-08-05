"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerUsers } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";

export const USERS_LIST_KEY = ["customer", "users", "list"] as const;

export function useCustomerUsersList(input?: number | ListQueryParams) {
  return useQuery({
    queryKey: [...USERS_LIST_KEY, input],
    queryFn: () => fetchCustomerUsers(input),
    placeholderData: (prev) => prev,
  });
}
