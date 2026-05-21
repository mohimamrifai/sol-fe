import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Clock3, Container, Factory, Building2, FileText, CreditCard, ArrowRight } from "lucide-react";
import type { AdminDashboardPayload } from "@/lib/dashboard-api";
import { shipmentStatusBadgeClass, shipmentStatusLabel } from "@/lib/shipment-status";
import Link from "next/link";

const chartConfig = {
  fcl: { label: "FCL", color: "#0ea5e9" },
  lcl: { label: "LCL", color: "#6366f1" },
} satisfies ChartConfig;

const emptySummary = {
  bookingsToday: 0,
  activeShipments: 0,
  rackUtilization: 0,
  overdueInvoices: 0,
  activeCompanies: 0,
  pendingCompanyApprovals: 0,
  unpaidInvoices: 0,
  paymentsToday: 0,
};

export function DashboardSuperAdmin({
  data,
  loading,
}: {
  data: AdminDashboardPayload | null;
  loading?: boolean;
}) {
  const shipmentSummary = data?.summary ?? emptySummary;
  const recentShipments = (data?.activeShipments ?? []).slice(0, 10);
  const chartRows = data?.shipmentVolumeByWeek ?? [];

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Memuat data dashboard…</p>
    );
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Booking Baru Hari Ini</CardDescription>
              <span className="rounded-md bg-emerald-100 text-emerald-700 p-1.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold flex flex-col gap-0.5">
              <span>{shipmentSummary.bookingsToday}</span>
              <span className="text-xs font-normal text-emerald-600">booking hari ini</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Shipment Aktif</CardDescription>
              <span className="rounded-md bg-sky-100 text-sky-700 p-1.5">
                <Container className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold flex flex-col gap-0.5">
              <span>{shipmentSummary.activeShipments}</span>
              <span className="text-xs font-normal text-muted-foreground">shipment aktif</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Utilisasi Rack LCL</CardDescription>
              <span className="rounded-md bg-amber-100 text-amber-700 p-1.5">
                <Clock3 className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold flex flex-col gap-0.5">
              <span>{shipmentSummary.rackUtilization.toFixed(1)}%</span>
              <span className="text-xs font-normal text-muted-foreground">kapasitas terpakai</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Invoice Overdue</CardDescription>
              <span className="rounded-md bg-violet-100 text-violet-700 p-1.5">
                <Factory className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold flex flex-col gap-0.5">
              <span>{shipmentSummary.overdueInvoices}</span>
              <span className="text-xs font-normal text-muted-foreground">tagihan lewat jatuh tempo</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle>Volume shipment baru (FCL vs LCL)</CardTitle>
            <CardDescription>
              Jumlah shipment dibuat per minggu (4 minggu terakhir), klasifikasi dari service type.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {chartRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data shipment untuk grafik.</p>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="h-64 w-full min-w-[280px] rounded-sm border border-sky-100/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-3 shadow-sm"
              >
                <BarChart data={chartRows}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="fcl" stackId="shipments" fill="var(--color-fcl)" name="FCL" />
                  <Bar dataKey="lcl" stackId="shipments" fill="var(--color-lcl)" name="LCL" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Ringkasan Admin Internal</CardTitle>
            <CardDescription />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-sky-100 text-sky-700 p-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Customer Aktif</p>
                  <p className="text-xs text-muted-foreground">Perusahaan aktif.</p>
                </div>
              </div>
              <span className="text-base font-semibold text-zinc-900">{shipmentSummary.activeCompanies}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-100 text-amber-700 p-1.5">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Approval Pending</p>
                  <p className="text-xs text-muted-foreground">Perusahaan menunggu approval.</p>
                </div>
              </div>
              <span className="text-base font-semibold text-zinc-900">{shipmentSummary.pendingCompanyApprovals}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-violet-100 text-violet-700 p-1.5">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Invoice Belum Terbayar</p>
                  <p className="text-xs text-muted-foreground">Unpaid + overdue.</p>
                </div>
              </div>
              <span className="text-base font-semibold text-zinc-900">{shipmentSummary.unpaidInvoices}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 text-emerald-700 p-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Pembayaran Sukses Hari Ini</p>
                  <p className="text-xs text-muted-foreground">Transaksi Midtrans.</p>
                </div>
              </div>
              <span className="text-base font-semibold text-zinc-900">{shipmentSummary.paymentsToday}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between w-full">
          <CardTitle>Shipment Terbaru</CardTitle>
          <Link href="/dashboard/admin/shipments" className="flex flex-row gap-1 items-center mt-2">Lihat Semua <ArrowRight className="h-3.5 w-3.5" /></Link>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rute</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                    Belum ada shipment.
                  </TableCell>
                </TableRow>
              ) : (
                recentShipments.map((shipment, index) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>{shipment.customer}</TableCell>
                    <TableCell>{shipment.route}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={shipmentStatusBadgeClass(shipment.status)}>
                        {shipmentStatusLabel(shipment.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableCaption className="text-xs">Ringkasan operasional multimodal.</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
