"use client";

import * as React from "react";
import { RoleDashboard } from "./role-dashboard";
import type { CustomerDashboardPayload } from "@/lib/dashboard-api";

interface Props {
  data: CustomerDashboardPayload | null;
  loading?: boolean;
}

export function DashboardFinancePic({ data, loading }: Props) {
  return <RoleDashboard role="finance_pic" data={data} loading={loading} />;
}
