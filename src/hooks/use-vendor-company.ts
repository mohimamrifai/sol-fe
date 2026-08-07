import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchVendorCompany,
  fetchVendorCompanyActivities,
  updateVendorCompany,
  type VendorCompany,
  type VendorCompanyActivity,
} from "@/lib/vendor/company-api";

export function useVendorCompany() {
  return useQuery<{ data: VendorCompany }>({
    queryKey: ["vendor", "company"],
    queryFn: fetchVendorCompany,
    staleTime: 60 * 1000,
  });
}

export function useUpdateVendorCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<VendorCompany>) => updateVendorCompany(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "company"] });
      qc.invalidateQueries({ queryKey: ["vendor", "company", "activities"] });
    },
  });
}

export function useVendorCompanyActivities() {
  return useQuery<{ data: VendorCompanyActivity[] }>({
    queryKey: ["vendor", "company", "activities"],
    queryFn: fetchVendorCompanyActivities,
    staleTime: 30 * 1000,
  });
}
