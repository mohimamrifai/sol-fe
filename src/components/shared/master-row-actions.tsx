"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function MasterRowActions({
  entityLabel,
  canManage,
  onView,
  onEdit,
  onDelete,
  extraActions,
}: {
  entityLabel: string;
  canManage: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  extraActions?: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Menu aksi {entityLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {onView ? (
          <DropdownMenuItem className="cursor-pointer" onClick={onView}>
            <Eye className="h-4 w-4" />
            Lihat detail
          </DropdownMenuItem>
        ) : null}
        {extraActions}
        {canManage && (onEdit || onDelete) ? <DropdownMenuSeparator /> : null}
        {canManage && onEdit ? (
          <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canManage && onDelete ? (
          <DropdownMenuItem className="cursor-pointer" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
