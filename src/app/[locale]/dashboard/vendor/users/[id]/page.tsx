"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mail, Phone, Building2, ShieldCheck, Power, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useVendorUser } from "@/hooks/use-vendor-users";
import { VendorChangeRoleDialog } from "@/components/vendor/users/dialogs/vendor-change-role-dialog";
import { VendorChangeStatusDialog } from "@/components/vendor/users/dialogs/vendor-change-status-dialog";
import { VendorResetPasswordDialog } from "@/components/vendor/users/dialogs/vendor-reset-password-dialog";
import type { VendorUser } from "@/lib/vendor/users-api";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export default function VendorUserDetailPage() {
  const tCommon = useTranslations("Vendor.common");
  const params = useParams<{ id: string }>();
  const id = Number(params?.id ?? 0);
  const router = useRouter();
  const { data, isLoading } = useVendorUser(id);

  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const u = data?.data as VendorUser | undefined;
  if (!u) return <div className="p-4 text-sm text-zinc-500">{tCommon("noData")}</div>;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/dashboard/vendor/users")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon("back")}
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{u.name}</CardTitle>
            <p className="mt-1 text-xs text-zinc-500">{u.primary_role_label ?? u.primary_role}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${STATUS_BADGE[u.status] ?? ""} border text-xs`}>{u.status}</Badge>
            <Button size="sm" variant="outline" onClick={() => setRoleOpen(true)}>
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Change Role
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatusOpen(true)}>
              <Power className="mr-1 h-3.5 w-3.5" /> Change Status
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPwOpen(true)}>
              <KeyRound className="mr-1 h-3.5 w-3.5" /> Reset Password
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-3.5 w-3.5 text-zinc-400" />
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd>{u.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-3.5 w-3.5 text-zinc-400" />
              <div>
                <dt className="text-zinc-500">Mobile</dt>
                <dd>{u.mobile ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-3.5 w-3.5 text-zinc-400" />
              <div>
                <dt className="text-zinc-500">Last Login</dt>
                <dd>{u.last_login_at ? new Date(u.last_login_at).toLocaleString("id-ID") : "Never"}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      {"activities" in (data?.data ?? {}) && Array.isArray((data?.data as { activities?: unknown[] }).activities) && ((data?.data as { activities: unknown[] }).activities.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {((data?.data as { activities: Array<{ id: number; description: string; actor_name: string | null; occurred_at: string }> }).activities).map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                  <span>{a.description}</span>
                  <span className="text-xs text-zinc-500">{new Date(a.occurred_at).toLocaleString("id-ID")} · {a.actor_name ?? "—"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <VendorChangeRoleDialog open={roleOpen} onOpenChange={setRoleOpen} target={u} />
      <VendorChangeStatusDialog open={statusOpen} onOpenChange={setStatusOpen} target={u} />
      <VendorResetPasswordDialog open={pwOpen} onOpenChange={setPwOpen} target={u} />
    </div>
  );
}
