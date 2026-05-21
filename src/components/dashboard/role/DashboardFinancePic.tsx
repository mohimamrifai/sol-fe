import type { ComponentProps } from "react";
import { DashboardCompanyAdmin } from "./DashboardCompanyAdmin";

export function DashboardFinancePic(props: ComponentProps<typeof DashboardCompanyAdmin>) {
  return <DashboardCompanyAdmin {...props} />;
}
