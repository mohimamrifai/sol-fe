import type { ReactNode } from "react";
import { AdminPageHeader } from "./admin-page-header";
import type { LucideIcon } from "lucide-react";

type AdminDetailLayoutProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  headerActions?: ReactNode;
  children: ReactNode;
};

export function AdminDetailLayout({
  icon,
  title,
  description,
  headerActions,
  children,
}: AdminDetailLayoutProps) {
  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <AdminPageHeader icon={icon} title={title} description={description} actions={headerActions} />
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </div>
  );
}
