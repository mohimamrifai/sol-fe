"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loc, TM, ST } from "../../hooks/use-booking-form";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface RouteServiceSectionProps {
  locations: Loc[];
  modes: TM[];
  serviceTypes: ST[];
  originId: string;
  setOriginId: (v: string) => void;
  destId: string;
  setDestId: (v: string) => void;
  modeId: string;
  setModeId: (v: string) => void;
  serviceTypeId: string;
  setServiceTypeId: (v: string) => void;
  renderFieldError: (field: string) => string | null;
}

type ComboOption = { value: string; label: string };

export function RouteServiceSection({
  locations,
  modes,
  serviceTypes,
  originId,
  setOriginId,
  destId,
  setDestId,
  modeId,
  setModeId,
  serviceTypeId,
  setServiceTypeId,
  renderFieldError,
}: RouteServiceSectionProps) {
  const locationOptions: ComboOption[] = locations.map((l) => ({
    value: String(l.id),
    label: `${l.name}${l.code ? ` (${l.code})` : ""}`,
  }));
  const modeOptions: ComboOption[] = modes.map((m) => ({
    value: String(m.id),
    label: `${m.name}${m.code ? ` (${m.code})` : ""}`,
  }));
  const serviceOptions: ComboOption[] = serviceTypes.map((s) => ({
    value: String(s.id),
    label: `${s.name}${s.code ? ` (${s.code})` : ""}`,
  }));
  const selectedOrigin = locations.find((l) => String(l.id) === originId);
  const selectedDestination = locations.find((l) => String(l.id) === destId);
  const selectedMode = modes.find((m) => String(m.id) === modeId);
  const selectedServiceType = serviceTypes.find((s) => String(s.id) === serviceTypeId);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Rute &amp; Jenis Layanan</CardTitle>
        <CardDescription>Pilih asal, tujuan, dan moda transportasi pengiriman Anda.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Kota Asal (Origin) <span className="text-red-500">*</span></Label>
          <Combobox
            items={locationOptions}
            value={locationOptions.find((x) => x.value === originId) ?? null}
            onValueChange={(next) => setOriginId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("origin_location_id") && "[&_input]:border-red-500")}
              placeholder="Pilih lokasi asal"
            />
            <ComboboxContent>
              <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {selectedOrigin ? (
            <p className="text-[11px] text-zinc-500">Dipilih: {selectedOrigin.name}</p>
          ) : null}
          {renderFieldError("origin_location_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("origin_location_id")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Kota Tujuan (Destination) <span className="text-red-500">*</span></Label>
          <Combobox
            items={locationOptions}
            value={locationOptions.find((x) => x.value === destId) ?? null}
            onValueChange={(next) => setDestId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("destination_location_id") && "[&_input]:border-red-500")}
              placeholder="Pilih lokasi tujuan"
            />
            <ComboboxContent>
              <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {selectedDestination ? (
            <p className="text-[11px] text-zinc-500">Dipilih: {selectedDestination.name}</p>
          ) : null}
          {renderFieldError("destination_location_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("destination_location_id")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Moda Transportasi <span className="text-red-500">*</span></Label>
          <Combobox
            items={modeOptions}
            value={modeOptions.find((x) => x.value === modeId) ?? null}
            onValueChange={(next) => setModeId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("transport_mode_id") && "[&_input]:border-red-500")}
              placeholder="Pilih moda transportasi"
            />
            <ComboboxContent>
              <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {selectedMode ? (
            <p className="text-[11px] text-zinc-500">Dipilih: {selectedMode.name}</p>
          ) : null}
          {renderFieldError("transport_mode_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("transport_mode_id")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Tipe Layanan <span className="text-red-500">*</span></Label>
          <Combobox
            items={serviceOptions}
            value={serviceOptions.find((x) => x.value === serviceTypeId) ?? null}
            onValueChange={(next) => setServiceTypeId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("service_type_id") && "[&_input]:border-red-500")}
              placeholder="Pilih tipe layanan"
            />
            <ComboboxContent>
              <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {selectedServiceType ? (
            <p className="text-[11px] text-zinc-500">Dipilih: {selectedServiceType.name}</p>
          ) : null}
          {renderFieldError("service_type_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("service_type_id")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
