"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, MoreHorizontal } from "lucide-react";
import { PayRow } from "./types";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

interface PaymentActionsMenuProps {
  payment: PayRow;
}

/** FSD §5.1: grid action is Detail only. */
export function PaymentActionsMenu({ payment }: PaymentActionsMenuProps) {
  const t = useTranslations("AdminPayments");
  const router = useRouter();

  const isArOnly = payment.is_ar_only === true;
  const paymentId = Number(payment.id);
  const invoiceId = Number(
    (payment.invoice_id as number | undefined) ??
      ((payment.invoice as { id?: number } | undefined)?.id)
  );

  const openDetail = () => {
    if (isArOnly && Number.isFinite(invoiceId)) {
      router.push(`/dashboard/admin/customer/payments/invoice/${invoiceId}`);
      return;
    }
    if (Number.isFinite(paymentId)) {
      router.push(`/dashboard/admin/customer/payments/${paymentId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
        aria-label={t("actions.actionsMenu")}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem className="cursor-pointer" onClick={openDetail}>
          <Eye className="h-4 w-4" />
          {t("actions.viewDetail")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
