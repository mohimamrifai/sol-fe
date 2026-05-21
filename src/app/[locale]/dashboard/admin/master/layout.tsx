import { Suspense } from "react";
import { MasterLayoutShell } from "./_components/master-layout-shell";

export default function AdminMasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <MasterLayoutShell>
      <Suspense fallback={null}>{children}</Suspense>
    </MasterLayoutShell>
  );
}
