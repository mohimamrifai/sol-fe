"use client";

import * as React from "react";
import { RoleDashboard } from "./role-dashboard";
import type { CustomerDashboardPayload } from "@/lib/dashboard-api";

interface Props {
  data: CustomerDashboardPayload | null;
  loading?: boolean;
}

export function DashboardOpsPic({ data, loading }: Props) {
  return <RoleDashboard role="ops_pic" data={data} loading={loading} />;
}
