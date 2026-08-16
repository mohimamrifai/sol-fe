"use client";

import * as React from "react";
import { RoleDashboard } from "./role-dashboard";
import type { CustomerDashboardPayload } from "@/lib/dashboard-api";

interface Props {
  data: CustomerDashboardPayload | null;
  loading?: boolean;
}

export function DashboardViewer({ data, loading }: Props) {
  return <RoleDashboard role="viewer" data={data} loading={loading} />;
}
