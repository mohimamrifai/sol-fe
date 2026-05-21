import { redirect } from "next/navigation";

export default async function AdminMasterIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/admin/master/locations`);
}
