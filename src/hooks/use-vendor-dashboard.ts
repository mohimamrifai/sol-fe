import { useQuery } from "@tanstack/react-query";
import { fetchVendorDashboard, type VendorDashboardPayload } from "@/lib/vendor/dashboard-api";

export function useVendorDashboard() {
  return useQuery<{ data: VendorDashboardPayload }>({
    queryKey: ["vendor", "dashboard"],
    queryFn: fetchVendorDashboard,
    staleTime: 60 * 1000,
  });
}
