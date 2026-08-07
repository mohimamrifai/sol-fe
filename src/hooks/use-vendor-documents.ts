import { useQuery } from "@tanstack/react-query";
import { fetchVendorDocumentStats, fetchVendorDocuments, type VendorDocumentListResponse, type VendorDocumentStats } from "@/lib/vendor/documents-api";

export function useVendorDocumentStats() {
  return useQuery<{ data: VendorDocumentStats }>({
    queryKey: ["vendor", "documents", "stats"],
    queryFn: fetchVendorDocumentStats,
    staleTime: 30 * 1000,
  });
}

export function useVendorDocuments(params: Record<string, unknown> = {}) {
  return useQuery<VendorDocumentListResponse>({
    queryKey: ["vendor", "documents", "list", params],
    queryFn: () => fetchVendorDocuments(params),
    staleTime: 30 * 1000,
  });
}
