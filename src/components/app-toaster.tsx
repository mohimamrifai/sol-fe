"use client";

import { Toaster } from "@/components/ui/sonner";

/** Mount once di root layout agar `toast()` dari `sonner` tampil di seluruh app. */
export function AppToaster() {
  return <Toaster richColors position="top-center" />;
}
