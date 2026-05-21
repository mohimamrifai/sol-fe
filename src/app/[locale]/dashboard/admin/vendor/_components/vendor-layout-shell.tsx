"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { Plus, Store, Tags } from "lucide-react";

const NAV = [
  { href: "/dashboard/admin/vendor/vendors", label: "Vendor", Icon: Store },
  { href: "/dashboard/admin/vendor/pricing", label: "Pricing", Icon: Tags },
];

export function VendorLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageVendor = authHydrated && (roles.includes("super_admin") || roles.includes("sales"));

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Store className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Vendor &amp; Harga</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola vendor dan ringkasan pricing per lane.</p>
          </div>
        </div>
        {canManageVendor ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <Button
              className="h-9 w-full gap-1.5 px-4 sm:w-auto"
              type="button"
              onClick={() => router.push("/dashboard/admin/vendor/vendors?create=1")}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Tambah Vendor
            </Button>
          </div>
        ) : null}
      </div>

      <nav
        className="-mx-1 flex gap-2 overflow-x-auto border-b border-border px-1 pb-3 sm:flex-wrap"
        aria-label="Vendor & harga"
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
