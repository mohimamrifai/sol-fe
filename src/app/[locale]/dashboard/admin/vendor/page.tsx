import { redirect } from "next/navigation";

export default async function AdminVendorIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/admin/vendor/vendors`);
}
