"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundState } from "@/components/shared/not-found-state";
import { useCustomerUserDetail } from "@/hooks/use-customer-user-detail";
import { UserInfoSection } from "@/components/users/user-info-section";
import { UserConfigSection } from "@/components/users/user-config-section";
import { UserSecuritySection } from "@/components/users/user-security-section";
import { UserActivitySection } from "@/components/users/user-activity-section";
import { UserDetailHeader } from "@/components/users/user-detail-header";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { ChangeStatusDialog } from "@/components/users/change-status-dialog";
import { ChangeRoleDialog } from "@/components/users/change-role-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import type { UserRow } from "@/components/users/user-table";

export default function UserDetailPage() {
  const t = useTranslations("Users");
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const { data, isLoading, isError } = useCustomerUserDetail(
    Number.isFinite(id) && id > 0 ? id : null
  );
  const user: UserRow | null = (data?.data ?? null) as UserRow | null;

  const [editOpen, setEditOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [pwOpen, setPwOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <NotFoundState
        title={t("notFound.title")}
        description={t("notFound.description")}
        backLabel={t("notFound.back")}
        backHref="/dashboard/users"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/users")}
          className="h-8 gap-1 text-xs text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("detail.actions.back")}
        </Button>
      </div>

      <UserDetailHeader
        user={user}
        onEdit={() => setEditOpen(true)}
        onChangeRole={() => setRoleOpen(true)}
        onChangeStatus={() => setStatusOpen(true)}
        onResetPassword={() => setPwOpen(true)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UserInfoSection user={user} />
        <UserConfigSection user={user} />
      </div>
      <UserSecuritySection onResetPassword={() => setPwOpen(true)} />
      <UserActivitySection userId={user.id} />

      <UserFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        row={user}
      />
      <ChangeStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        target={user}
      />
      <ChangeRoleDialog
        open={roleOpen}
        onOpenChange={setRoleOpen}
        target={user}
      />
      <ResetPasswordDialog
        open={pwOpen}
        onOpenChange={setPwOpen}
        target={user}
      />
    </div>
  );
}
