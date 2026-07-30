"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";

/**
 * Opens the local "create" dialog when the URL contains `?create=1`, then strips the query.
 * Used with the "Tambah Master Data" dropdown in MasterLayoutShell.
 */
export function useMasterOpenCreateFromQuery(opts: {
  canManage: boolean;
  authHydrated: boolean;
  onOpenCreate: () => void;
}) {
  const { canManage, authHydrated, onOpenCreate } = opts;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    if (!authHydrated || !canManage) return;
    if (searchParams.get("create") !== "1") return;
    doneRef.current = true;
    onOpenCreate();
    router.replace(pathname);
  }, [authHydrated, canManage, searchParams, pathname, router, onOpenCreate]);
}
