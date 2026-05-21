"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/lib/store";
import { evaluateDashboardPathAccess } from "@/lib/dashboard-access";

export function DashboardAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  const violation = useMemo(() => {
    if (!user) return null;
    return evaluateDashboardPathAccess(user, pathname);
  }, [user, pathname]);

  useEffect(() => {
    if (violation) {
      router.replace(violation.redirectTo);
    }
  }, [violation, router]);

  if (!user || violation) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Memuat sesi…
      </div>
    );
  }

  return <>{children}</>;
}
