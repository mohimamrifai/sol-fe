"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { bookingStatusBadgeClass, bookingStatusLabelFromApi } from "@/lib/booking-status";
import type { BookingDetail } from "./types";

interface BookingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  data: BookingDetail | null;
  canEdit?: boolean;
  saving?: boolean;
  onSave?: (payload: {
    departure_date: string | null;
    cargo_description: string | null;
    shipper_name: string | null;
    shipper_address: string | null;
    shipper_phone: string | null;
    consignee_name: string | null;
    consignee_address: string | null;
    consignee_phone: string | null;
  }) => void | Promise<void>;
}

export function BookingDetailDialog({
  open,
  onOpenChange,
  loading,
  data,
  canEdit = false,
  saving = false,
  onSave,
}: BookingDetailDialogProps) {
  const editable = useMemo(
    () => canEdit && !!data && data.status !== "cancelled",
    [canEdit, data]
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [departureDate, setDepartureDate] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [shipperName, setShipperName] = useState("");
  const [shipperAddress, setShipperAddress] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");

  const hydrateEditForm = () => {
    if (!data) return;
    setDepartureDate(data.departure_date ? String(data.departure_date).slice(0, 10) : "");
    setCargoDescription(data.cargo_description ?? "");
    setShipperName(data.shipper_name ?? "");
    setShipperAddress(data.shipper_address ?? "");
    setShipperPhone(data.shipper_phone ?? "");
    setConsigneeName(data.consignee_name ?? "");
    setConsigneeAddress(data.consignee_address ?? "");
    setConsigneePhone(data.consignee_phone ?? "");
  };

  const submitEdit = async () => {
    if (!onSave) return;
    await onSave({
      departure_date: departureDate || null,
      cargo_description: cargoDescription || null,
      shipper_name: shipperName || null,
      shipper_address: shipperAddress || null,
      shipper_phone: shipperPhone || null,
      consignee_name: consigneeName || null,
      consignee_address: consigneeAddress || null,
      consignee_phone: consigneePhone || null,
    });
    setIsEditMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Detail Booking</DialogTitle>
              <DialogDescription>ID: {data?.booking_number}</DialogDescription>
            </div>
            {data && (
              <Badge className={bookingStatusBadgeClass(data.status)}>
                {bookingStatusLabelFromApi(data.status)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
              Memuat data booking…
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Section: Company & Price */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-zinc-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </p>
                  <p className="font-semibold">{data.company?.name ?? "—"}</p>
                </div>
                <div className="rounded-lg border bg-emerald-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    Estimasi Harga
                  </p>
                  <p className="font-semibold text-emerald-700">
                    {data.estimated_price
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(Number(data.estimated_price))
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Section: Logistics */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Logistik & Pengiriman
                </h3>
                <div className="grid gap-x-4 gap-y-3 rounded-lg border p-4 sm:grid-cols-2">
                  <InfoItem
                    label="Origin"
                    value={`${data.origin_location?.name ?? data.originLocation?.name} (${data.origin_location?.code ?? data.originLocation?.code})`}
                  />
                  <InfoItem
                    label="Destination"
                    value={`${data.destination_location?.name ?? data.destinationLocation?.name} (${data.destination_location?.code ?? data.destinationLocation?.code})`}
                  />
                  <InfoItem label="Transport Mode" value={data.transport_mode?.name ?? data.transportMode?.name} />
                  <InfoItem label="Service Type" value={data.service_type?.name ?? data.serviceType?.name} />
                  <InfoItem
                    label="Tgl Keberangkatan"
                    value={isEditMode ? (
                      <Input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="h-9"
                      />
                    ) : (
                      data.departure_date
                        ? new Date(data.departure_date).toLocaleDateString("id-ID", {
                            dateStyle: "long",
                          })
                        : "—"
                    )}
                  />
                  <InfoItem
                    label="Kontainer"
                    value={
                      (data.container_type || data.containerType)
                        ? `${data.container_count}x ${(data.container_type?.name ?? data.containerType?.name)} (${(data.container_type?.size ?? data.containerType?.size)})`
                        : `${data.container_count}x —`
                    }
                  />
                </div>
              </div>

              {/* Section: Cargo */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Detail Kargo
                </h3>
                <div className="grid gap-x-4 gap-y-3 rounded-lg border p-4 sm:grid-cols-2">
                  <InfoItem label="Kategori" value={data.cargo_category?.name ?? data.cargoCategory?.name} />
                  <InfoItem
                    label="Berat Est."
                    value={data.estimated_weight ? `${data.estimated_weight} kg` : "—"}
                  />
                  <InfoItem
                    label="CBM Est."
                    value={data.estimated_cbm ? `${data.estimated_cbm} m³` : "—"}
                  />
                  <InfoItem
                    className="sm:col-span-2"
                    label="Deskripsi Barang"
                    value={isEditMode ? (
                      <Textarea
                        value={cargoDescription}
                        onChange={(e) => setCargoDescription(e.target.value)}
                        className="min-h-[84px]"
                      />
                    ) : (
                      data.cargo_description
                    )}
                  />
                </div>
              </div>

              {/* Section: DG */}
              {data.is_dangerous_goods ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Dangerous Goods
                  </h3>
                  <div className="grid gap-x-4 gap-y-3 rounded-lg border border-red-100 bg-red-50/30 p-4 sm:grid-cols-2">
                    <InfoItem
                      label="DG Class"
                      value={`${data.dg_class?.name ?? data.dgClass?.name} (${data.dg_class?.code ?? data.dgClass?.code})`}
                    />
                    <InfoItem label="UN Number" value={data.un_number} />
                    {data.msds_file && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">
                          MSDS File
                        </p>
                        <a
                          href={`/storage/${data.msds_file}`}
                          target="_blank"
                          className="text-xs text-blue-600 underline"
                        >
                          Lihat PDF
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Section: Contacts */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pengirim (Shipper)
                  </p>
                  {isEditMode ? (
                    <div className="space-y-2">
                      <Input value={shipperName} onChange={(e) => setShipperName(e.target.value)} className="h-9" />
                      <Textarea value={shipperAddress} onChange={(e) => setShipperAddress(e.target.value)} className="min-h-[72px]" />
                      <Input value={shipperPhone} onChange={(e) => setShipperPhone(e.target.value)} className="h-9" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold">{data.shipper_name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {data.shipper_address}
                      </p>
                      <p className="text-xs font-medium">📞 {data.shipper_phone}</p>
                    </>
                  )}
                </div>
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Penerima (Consignee)
                  </p>
                  {isEditMode ? (
                    <div className="space-y-2">
                      <Input value={consigneeName} onChange={(e) => setConsigneeName(e.target.value)} className="h-9" />
                      <Textarea value={consigneeAddress} onChange={(e) => setConsigneeAddress(e.target.value)} className="min-h-[72px]" />
                      <Input value={consigneePhone} onChange={(e) => setConsigneePhone(e.target.value)} className="h-9" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold">{data.consignee_name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {data.consignee_address}
                      </p>
                      <p className="text-xs font-medium">📞 {data.consignee_phone}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Services */}
              {data.additional_services?.length ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Layanan Tambahan
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.additional_services.map((s, i) => (
                      <Badge key={i} variant="secondary" className="px-2 py-0.5 text-[11px]">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Rejection Reason */}
              {data.status === "rejected" && data.rejection_reason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                    Alasan Penolakan
                  </p>
                  <p className="text-sm text-red-700">{data.rejection_reason}</p>
                </div>
              )}

              {/* Cancellation Reason (Notes) */}
              {data.status === "cancelled" && data.notes && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    Catatan Pembatalan
                  </p>
                  <p className="text-sm text-zinc-700 whitespace-pre-line">{data.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Data tidak tersedia.</div>
          )}
        </div>
        <DialogFooter className="border-t p-4">
          {editable && !isEditMode ? (
            <Button
              onClick={() => {
                hydrateEditForm();
                setIsEditMode(true);
              }}
            >
              Edit
            </Button>
          ) : null}
          {editable && isEditMode ? (
            <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={saving}>
              Batal Edit
            </Button>
          ) : null}
          {editable && isEditMode ? (
            <Button onClick={() => void submitEdit()} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-[10px] font-medium text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
