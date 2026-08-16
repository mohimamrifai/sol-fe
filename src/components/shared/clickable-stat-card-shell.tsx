"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const BASE_CLASS =
  "flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)] sm:p-5";

const INTERACTIVE_CLASS =
  "cursor-pointer transition-all hover:border-zinc-300 hover:bg-zinc-50/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2";

interface Props {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function ClickableStatCardShell({ href, onClick, className, children }: Props) {
  const interactive = Boolean(href || onClick);
  const base = cn(BASE_CLASS, interactive && INTERACTIVE_CLASS, className);

  if (href) {
    return (
      <Link href={href as never} className={base}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, "text-left")}>
        {children}
      </button>
    );
  }

  return <div className={base}>{children}</div>;
}
