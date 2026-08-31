"use client";

import { useEffect, useState } from "react";
import {
  fetchAllAdminCompanies,
  fetchAllAdminLocations,
  fetchAllAdminServiceTypes,
} from "@/lib/admin-api";

export type ListMasterOption = { id: number; label: string };

export type AdminListMasters = {
  loading: boolean;
  companies: ListMasterOption[];
  locations: ListMasterOption[];
  serviceTypes: ListMasterOption[];
};

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
          fetchAllAdminCompanies({ status: "active" }).then((rows) => {
            if (cancelled) return;
            setCompanies(rows.map(mapCompany));
          }),
          fetchAllAdminLocations({ status: "active" }).then((rows) => {
            if (cancelled) return;
            setLocations(rows.map(mapLocation));
          }),
        ];
        if (includeServiceTypes) {
          tasks.push(
            fetchAllAdminServiceTypes({ status: "active" }).then((rows) => {
              if (cancelled) return;
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
