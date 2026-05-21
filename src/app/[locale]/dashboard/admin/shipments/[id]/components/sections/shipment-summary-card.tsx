"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ShipmentBookingInfo {
  cargo_category?: { name?: string };
  estimated_weight?: number | string;
  estimated_cbm?: number | string;
  cargo_description?: string;
  is_dangerous_goods?: boolean | number;
  dg_class?: { name?: string };
  un_number?: string;
  shipper_name?: string;
  shipper_address?: string;
  shipper_phone?: string;
  consignee_name?: string;
  consignee_address?: string;
  consignee_phone?: string;
}

interface ShipmentSummaryCardProps {
  companyName: string;
  bookingNumber?: string;
  bookingId?: number | string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  notes?: string;
  transportMode?: string;
  serviceType?: string;
  containerInfo?: string;
  booking?: ShipmentBookingInfo;
  onOpenBooking?: () => void;
}

export function ShipmentSummaryCard({
  companyName,
  bookingNumber,
  bookingId,
  origin,
  destination,
  departure,
  arrival,
  notes,
  transportMode,
  serviceType,
  containerInfo,
  booking,
  onOpenBooking,
}: ShipmentSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan</CardTitle>
        <CardDescription>{companyName}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        {bookingNumber && bookingId ? (
          <div className="sm:col-span-2">
            <span className="text-muted-foreground font-medium">Ref Booking: </span>
            {onOpenBooking ? (
              <button onClick={onOpenBooking} className="text-blue-600 hover:underline font-medium">
                {bookingNumber}
              </button>
            ) : (
              <span className="font-medium">{bookingNumber}</span>
            )}
          </div>
        ) : null}
        
        <div className="sm:col-span-2 mt-2 mb-1">
          <h4 className="font-semibold text-zinc-900">Logistik & Pengiriman</h4>
        </div>
        
        <div>
          <span className="text-muted-foreground font-medium">Asal: </span>
          {origin}
        </div>
        <div>
          <span className="text-muted-foreground font-medium">Tujuan: </span>
          {destination}
        </div>
        <div>
          <span className="text-muted-foreground font-medium">Moda: </span>
          {transportMode ?? "—"}
        </div>
        <div>
          <span className="text-muted-foreground font-medium">Layanan: </span>
          {serviceType ?? "—"}
        </div>
        {containerInfo && (
          <div className="sm:col-span-2">
            <span className="text-muted-foreground font-medium">Kontainer: </span>
            {containerInfo}
          </div>
        )}
        
        <div className="sm:col-span-2 mt-2 mb-1">
          <h4 className="font-semibold text-zinc-900">Jadwal</h4>
        </div>
        
        <div>
          <span className="text-muted-foreground font-medium">Est. berangkat: </span>
          {departure}
        </div>
        <div>
          <span className="text-muted-foreground font-medium">Est. tiba: </span>
          {arrival}
        </div>

        {booking ? (
          <>
            <div className="sm:col-span-2 mt-2 mb-1">
              <h4 className="font-semibold text-zinc-900">Detail Kargo</h4>
            </div>
            {booking.cargo_category?.name && (
              <div>
                <span className="text-muted-foreground font-medium">Kategori: </span>
                {booking.cargo_category.name}
              </div>
            )}
            {booking.estimated_weight && (
              <div>
                <span className="text-muted-foreground font-medium">Berat Est.: </span>
                {booking.estimated_weight} kg
              </div>
            )}
            {booking.estimated_cbm && (
              <div>
                <span className="text-muted-foreground font-medium">CBM Est.: </span>
                {booking.estimated_cbm} m³
              </div>
            )}
            {booking.cargo_description && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground font-medium">Deskripsi: </span>
                {booking.cargo_description}
              </div>
            )}

            {booking.is_dangerous_goods ? (
              <div className="sm:col-span-2 mt-2 mb-1">
                <h4 className="font-semibold text-red-600">Dangerous Goods</h4>
                <div className="grid grid-cols-2 mt-1">
                  <div>
                    <span className="text-muted-foreground font-medium">DG Class: </span>
                    {booking.dg_class?.name ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">UN Number: </span>
                    {booking.un_number ?? "—"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="sm:col-span-2 mt-2 mb-1">
              <h4 className="font-semibold text-zinc-900">Kontak Pihak Terkait</h4>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pengirim (Shipper)</span>
              <p className="font-medium">{booking.shipper_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{booking.shipper_address}</p>
              <p className="text-xs">📞 {booking.shipper_phone || "—"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Penerima (Consignee)</span>
              <p className="font-medium">{booking.consignee_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{booking.consignee_address}</p>
              <p className="text-xs">📞 {booking.consignee_phone || "—"}</p>
            </div>
          </>
        ) : null}

        {notes ? (
          <div className="sm:col-span-2 mt-2 pt-2 border-t">
            <span className="text-muted-foreground font-medium">Catatan Shipment: </span>
            {notes}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
