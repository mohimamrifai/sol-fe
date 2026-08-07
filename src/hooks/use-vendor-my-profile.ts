import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeVendorPassword,
  deleteVendorProfilePhoto,
  fetchVendorMyProfile,
  fetchVendorMyProfileActivities,
  updateVendorMyProfile,
  uploadVendorProfilePhoto,
  type VendorMyProfile,
} from "@/lib/vendor/my-profile-api";

export function useVendorMyProfile() {
  return useQuery<{ data: VendorMyProfile }>({
    queryKey: ["vendor", "my-profile"],
    queryFn: fetchVendorMyProfile,
    staleTime: 60 * 1000,
  });
}

export function useUpdateVendorMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; phone?: string }) => updateVendorMyProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "my-profile"] });
    },
  });
}

export function useUploadVendorProfilePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadVendorProfilePhoto(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "my-profile"] });
    },
  });
}

export function useDeleteVendorProfilePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteVendorProfilePhoto(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "my-profile"] });
    },
  });
}

export function useChangeVendorPassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string; new_password_confirmation: string }) =>
      changeVendorPassword(payload),
  });
}

export function useVendorMyProfileActivities() {
  return useQuery<{
    data: Array<{ id: number; event_key: string; description: string; occurred_at: string }>;
  }>({
    queryKey: ["vendor", "my-profile", "activities"],
    queryFn: fetchVendorMyProfileActivities,
    staleTime: 30 * 1000,
  });
}

export type { VendorMyProfile };
