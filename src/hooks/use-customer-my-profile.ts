"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomerMyProfile,
  updateCustomerMyProfile,
  uploadCustomerProfilePhoto,
  deleteCustomerProfilePhoto,
  changeCustomerMyPassword,
} from "@/lib/customer-api";

export const MY_PROFILE_KEY = ["customer", "my-profile"] as const;

export function useCustomerMyProfile() {
  return useQuery({
    queryKey: [...MY_PROFILE_KEY],
    queryFn: () => fetchCustomerMyProfile(),
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; phone?: string }) => updateCustomerMyProfile(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...MY_PROFILE_KEY] }),
  });
}

export function useUploadProfilePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadCustomerProfilePhoto(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...MY_PROFILE_KEY] }),
  });
}

export function useDeleteProfilePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCustomerProfilePhoto(),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...MY_PROFILE_KEY] }),
  });
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (payload: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => changeCustomerMyPassword(payload),
  });
}
