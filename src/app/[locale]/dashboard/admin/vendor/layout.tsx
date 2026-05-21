import { VendorLayoutShell } from "./_components/vendor-layout-shell";

export default function AdminVendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorLayoutShell>{children}</VendorLayoutShell>;
}
