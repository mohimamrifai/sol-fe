"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminCompanies,
  fetchAdminLocations,
  fetchAdminServiceTypes,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";

export type ListMasterOption = { id: number; label: string };

export type AdminListMasters = {
  loading: boolean;
  companies: ListMasterOption[];
  locations: ListMasterOption[];
  serviceTypes: ListMasterOption[];
};

const PER_PAGE = 500;

function mapCompany(row: Record<string, unknown>): ListMasterOption {
  return { id: Number(row.id), label: String(row.name ?? row.id) };
}

function mapLocation(row: Record<string, unknown>): ListMasterOption {
  const name = String(row.name ?? "");
  const code = row.code ? ` (${String(row.code)})` : "";
  return { id: Number(row.id), label: `${name}${code}` };
}

function mapServiceType(row: Record<string, unknown>): ListMasterOption {
  const name = String(row.name ?? "");
  const code = row.code ? ` (${String(row.code)})` : "";
  return { id: Number(row.id), label: `${name}${code}` };
}

export function useAdminListMasters(opts?: { includeServiceTypes?: boolean }): AdminListMasters {
  const includeServiceTypes = opts?.includeServiceTypes ?? true;
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<ListMasterOption[]>([]);
  const [locations, setLocations] = useState<ListMasterOption[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ListMasterOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const tasks: Promise<void>[] = [
          fetchAdminCompanies({ page: 1, perPage: PER_PAGE, status: "active" }).then((res) => {
            if (cancelled) return;
            const rows = ((res as LaravelPaginated<Record<string, unknown>>).data ?? []) as Record<string, unknown>[];
            setCompanies(rows.map(mapCompany));
          }),
          fetchAdminLocations({ page: 1, perPage: PER_PAGE, status: "active" }).then((res) => {
            if (cancelled) return;
            const rows = ((res as LaravelPaginated<Record<string, unknown>>).data ?? []) as Record<string, unknown>[];
            setLocations(rows.map(mapLocation));
          }),
        ];
        if (includeServiceTypes) {
          tasks.push(
            fetchAdminServiceTypes({ page: 1, perPage: PER_PAGE, status: "active" }).then((res) => {
              if (cancelled) return;
              const rows = ((res as LaravelPaginated<Record<string, unknown>>).data ?? []) as Record<string, unknown>[];
              setServiceTypes(rows.map(mapServiceType));
            })
          );
        }
        await Promise.all(tasks);
      } catch {
        if (!cancelled) {
          setCompanies([]);
          setLocations([]);
          setServiceTypes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [includeServiceTypes]);

  return { loading, companies, locations, serviceTypes };
}

export const COVERAGE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "port_to_port", label: "Port to Port" },
  { value: "door_to_port", label: "Door to Port" },
  { value: "port_to_door", label: "Port to Door" },
  { value: "door_to_door", label: "Door to Door" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  { value: "transfer", label: "Transfer" },
  { value: "giro", label: "Giro" },
  { value: "cash", label: "Cash" },
  { value: "virtual_account", label: "Virtual Account" },
  { value: "midtrans", label: "Midtrans" },
];
