import type { ComponentProps } from "react";
import { DashboardCompanyAdmin } from "./DashboardCompanyAdmin";

export function DashboardOpsPic(props: ComponentProps<typeof DashboardCompanyAdmin>) {
  return <DashboardCompanyAdmin {...props} />;
}
