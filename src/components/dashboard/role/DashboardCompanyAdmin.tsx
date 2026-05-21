import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Truck, CreditCard, AlertTriangle } from "lucide-react";
import type { CustomerDashboardPayload } from "@/lib/dashboard-api";
import { shipmentStatusBadgeClass, shipmentStatusLabel } from "@/lib/shipment-status";
import { invoiceStatusBadgeClass, invoiceStatusLabelFromApi } from "@/lib/invoice-status";

function formatIdr(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    n
  );
}

type ShipmentRow = {
  id: number;
  shipment_number?: string;
  waybill_number?: string;
  status: string;
  origin_location?: { name?: string; code?: string };
  destination_location?: { name?: string; code?: string };
};

type InvoiceRow = {
  invoice_number: string;
  status: string;
  due_date?: string;
  total_amount: string | number;
};

export function DashboardCompanyAdmin({
  summary,
  shipments,
  invoices,
  loading,
}: {
  summary: CustomerDashboardPayload | null;
  shipments: ShipmentRow[];
  invoices: InvoiceRow[];
  loading?: boolean;
}) {
  const bs = summary?.bookings.by_status ?? {};
  const activeBookings =
    summary != null ? (Number(bs.submitted) || 0) + (Number(bs.draft) || 0) : 0;

  const companySummary = {
    activeBookings,
    activeShipments: summary?.shipments.active ?? 0,
    unpaidInvoices: summary?.invoices.unpaid ?? 0,
    overdueInvoices: summary?.invoices.overdue ?? 0,
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat dashboard…</p>;
  }

  const shipmentRows = shipments.slice(0, 10);
  const invoiceRows = invoices.slice(0, 10);

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Booking (draft + diajukan)</CardDescription>
              <span className="rounded-md bg-emerald-100 text-emerald-700 p-1.5">
                <FileText className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">{companySummary.activeBookings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Shipment Aktif</CardDescription>
              <span className="rounded-md bg-sky-100 text-sky-700 p-1.5">
                <Truck className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">{companySummary.activeShipments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Invoice Unpaid</CardDescription>
              <span className="rounded-md bg-amber-100 text-amber-700 p-1.5">
                <CreditCard className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">{companySummary.unpaidInvoices}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Invoice Overdue</CardDescription>
              <span className="rounded-md bg-red-100 text-red-700 p-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">{companySummary.overdueInvoices}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shipment Terbaru</CardTitle>
            <CardDescription>Pengiriman perusahaan Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Waybill / No.</TableHead>
                  <TableHead>Rute</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipmentRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                      Belum ada shipment.
                    </TableCell>
                  </TableRow>
                ) : (
                  shipmentRows.map((shipment, index) => {
                    const route = `${shipment.origin_location?.name ?? "-"} → ${shipment.destination_location?.name ?? "-"}`;
                    return (
                      <TableRow key={shipment.id}>
                        <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {shipment.waybill_number ?? shipment.shipment_number}
                        </TableCell>
                        <TableCell>{route}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={shipmentStatusBadgeClass(shipment.status)}>
                            {shipmentStatusLabel(shipment.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Invoice Terbaru</CardTitle>
            <CardDescription>Status pembayaran invoice.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nomor Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                      Belum ada invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoiceRows.map((invoice, index) => (
                    <TableRow key={invoice.invoice_number}>
                      <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={invoiceStatusBadgeClass(invoice.status)}>
                          {invoiceStatusLabelFromApi(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.due_date ?? "—"}</TableCell>
                      <TableCell>{formatIdr(Number(invoice.total_amount))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
