"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminCustomerEditPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const locale = String(params.locale ?? "id");
    const id = String(params.id ?? "");
    router.replace(`/${locale}/dashboard/admin/customer/customers/${id}?tab=company`);
  }, [params.id, params.locale, router]);

  return null;
}
