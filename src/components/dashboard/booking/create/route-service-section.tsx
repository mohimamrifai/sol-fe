"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Coverage, Loc, TM, ST } from "@/hooks/use-booking-form";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface RouteServiceSectionProps {
  locations: Loc[];
  modes: TM[];
  serviceTypes: ST[];
  coverages: Coverage[];
  originId: string;
  setOriginId: (v: string) => void;
  destId: string;
  setDestId: (v: string) => void;
  modeId: string;
  setModeId: (v: string) => void;
  serviceTypeId: string;
  setServiceTypeId: (v: string) => void;
  shipmentCoverage: string;
  setShipmentCoverage: (v: string) => void;
  pickupDate: string;
  setPickupDate: (v: string) => void;
  pickupTime: string;
  setPickupTime: (v: string) => void;
  pickupNotes: string;
  setPickupNotes: (v: string) => void;
  renderFieldError: (field: string) => string | null;
}

type ComboOption = { value: string; label: string };

export function RouteServiceSection({
  locations,
  modes,
  serviceTypes,
  coverages,
  originId,
  setOriginId,
  destId,
  setDestId,
  modeId,
  setModeId,
  serviceTypeId,
  setServiceTypeId,
  shipmentCoverage,
  setShipmentCoverage,
  pickupDate,
  setPickupDate,
  pickupTime,
  setPickupTime,
  pickupNotes,
  setPickupNotes,
  renderFieldError,
}: RouteServiceSectionProps) {
  const tForm = useTranslations("Bookings.create.form");
  const tCommon = useTranslations("Bookings");

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
  const coverageOptions: ComboOption[] = coverages.map((c) => ({
    value: c.value,
    label: tCommon(`coverage.${c.value}`),
  }));
  const selectedOrigin = locations.find((l) => String(l.id) === originId);
  const selectedDestination = locations.find((l) => String(l.id) === destId);
  const selectedMode = modes.find((m) => String(m.id) === modeId);
  const selectedServiceType = serviceTypes.find((s) => String(s.id) === serviceTypeId);
  const selectedCoverage = coverages.find((c) => String(c.value) === shipmentCoverage);
  const showPickupFields = shipmentCoverage === "door_to_port" || shipmentCoverage === "door_to_door";

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{tForm("routeTitle")}</CardTitle>
        <CardDescription>{tForm("routeSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>
            {tForm("originStation")} <span className="text-red-500">*</span>
          </Label>
          <Combobox
            items={locationOptions}
            value={locationOptions.find((x) => x.value === originId) ?? null}
            onValueChange={(next) => setOriginId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("origin_location_id") && "[&_input]:border-red-500")}
              placeholder={tForm("originStationPlaceholder")}
            />
            <ComboboxContent>
              <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
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
            <p className="text-[11px] text-zinc-500">
              {tForm("selected")}: {selectedOrigin.name}
            </p>
          ) : null}
          {renderFieldError("origin_location_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("origin_location_id")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>
            {tForm("destinationStation")} <span className="text-red-500">*</span>
          </Label>
          <Combobox
            items={locationOptions}
            value={locationOptions.find((x) => x.value === destId) ?? null}
            onValueChange={(next) => setDestId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("destination_location_id") && "[&_input]:border-red-500")}
              placeholder={tForm("destinationStationPlaceholder")}
            />
            <ComboboxContent>
              <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
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
            <p className="text-[11px] text-zinc-500">
              {tForm("selected")}: {selectedDestination.name}
            </p>
          ) : null}
          {renderFieldError("destination_location_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("destination_location_id")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>
            {tForm("transportMode")} <span className="text-red-500">*</span>
          </Label>
          <Combobox
            items={modeOptions}
            value={modeOptions.find((x) => x.value === modeId) ?? null}
            onValueChange={(next) => setModeId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("transport_mode_id") && "[&_input]:border-red-500")}
              placeholder={tForm("transportModePlaceholder")}
            />
            <ComboboxContent>
              <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
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
            <p className="text-[11px] text-zinc-500">
              {tForm("selected")}: {selectedMode.name}
            </p>
          ) : null}
          {renderFieldError("transport_mode_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("transport_mode_id")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>
            {tForm("serviceType")} <span className="text-red-500">*</span>
          </Label>
          <Combobox
            items={serviceOptions}
            value={serviceOptions.find((x) => x.value === serviceTypeId) ?? null}
            onValueChange={(next) => setServiceTypeId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("service_type_id") && "[&_input]:border-red-500")}
              placeholder={tForm("serviceTypePlaceholder")}
            />
            <ComboboxContent>
              <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
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
            <p className="text-[11px] text-zinc-500">
              {tForm("selected")}: {selectedServiceType.name}
            </p>
          ) : null}
          {renderFieldError("service_type_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("service_type_id")}</p>
          )}
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label>
            {tForm("shipmentCoverage")} <span className="text-red-500">*</span>
          </Label>
          <Combobox
            items={coverageOptions}
            value={coverageOptions.find((x) => x.value === shipmentCoverage) ?? null}
            onValueChange={(next) => setShipmentCoverage(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("shipment_coverage") && "[&_input]:border-red-500")}
              placeholder={tForm("shipmentCoveragePlaceholder")}
            />
            <ComboboxContent>
              <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {selectedCoverage ? (
            <p className="text-[11px] text-zinc-500">
              {tForm("selected")}: {tCommon(`coverage.${selectedCoverage.value}`)}
            </p>
          ) : null}
          {renderFieldError("shipment_coverage") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("shipment_coverage")}</p>
          )}
        </div>

        {showPickupFields ? (
          <>
            <div className="space-y-1">
              <Label>
                {tForm("pickupDate")} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className={cn(renderFieldError("pickup_date") && "border-red-500")}
              />
              {renderFieldError("pickup_date") && (
                <p className="text-[11px] font-medium text-red-500">{renderFieldError("pickup_date")}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>
                {tForm("pickupTime")} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className={cn(renderFieldError("pickup_time") && "border-red-500")}
              />
              {renderFieldError("pickup_time") && (
                <p className="text-[11px] font-medium text-red-500">{renderFieldError("pickup_time")}</p>
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{tForm("pickupNotes")}</Label>
              <Textarea
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                className="min-h-[88px]"
                placeholder={tForm("pickupNotesPlaceholder")}
              />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
