"use client";

import { useEffect, useState } from "react";
import { fetchAdminPostalCodes } from "@/lib/admin-api";
import type { ComboboxOption } from "@/components/searchable-combobox";

export function useAdminPostalCodeOptions(
  province: string,
  city: string,
  district = "",
) {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!city) {
      setOptions([]);
      return;
    }

    setLoading(true);
    void fetchAdminPostalCodes({ province, city, district })
      .then((response) => {
        if (!cancelled) setOptions(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [province, city, district]);

  return { postalCodeOptions: options, loadingPostalCodes: loading };
}
