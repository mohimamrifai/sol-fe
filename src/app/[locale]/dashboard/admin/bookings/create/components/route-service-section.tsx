import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { Company, Loc, TM, ST } from "@/hooks/use-admin-booking-form";

type ComboOption = { value: string; label: string };

interface RouteServiceSectionProps {
  companies: Company[];
  companyId: string;
  setCompanyId: (v: string) => void;
  selectedCompany?: Company;
  locations: Loc[];
  originId: string;
  setOriginId: (v: string) => void;
  destId: string;
  setDestId: (v: string) => void;
  modes: TM[];
  modeId: string;
  setModeId: (v: string) => void;
  serviceTypes: ST[];
  serviceTypeId: string;
  setServiceTypeId: (v: string) => void;
  validationErrors: Record<string, string[]> | null;
  renderError: (field: string) => React.ReactNode;
}

export function RouteServiceSection({
  companies,
  companyId,
  setCompanyId,
  selectedCompany,
  locations,
  originId,
  setOriginId,
  destId,
  setDestId,
  modes,
  modeId,
  setModeId,
  serviceTypes,
  serviceTypeId,
  setServiceTypeId,
  validationErrors,
  renderError,
}: RouteServiceSectionProps) {
  const companyOptions: ComboOption[] = companies.map((c) => ({ value: String(c.id), label: c.name }));
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">Rute & Layanan</h3>
      <div className="grid gap-5 sm:grid-cols-2 bg-white p-5 rounded-xl border shadow-sm">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Customer</Label>
          <Combobox
            items={companyOptions}
            value={companyOptions.find((x) => x.value === companyId) ?? null}
            onValueChange={(next) => setCompanyId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.company_id && "[&_input]:border-red-500")}
              placeholder="Pilih customer..."
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
          {selectedCompany ? <p className="text-[11px] text-zinc-500 ml-1">Dipilih: {selectedCompany.name}</p> : null}
          {renderError("company_id")}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Origin</Label>
          <Combobox
            items={locationOptions}
            value={locationOptions.find((x) => x.value === originId) ?? null}
            onValueChange={(next) => setOriginId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.origin_location_id && "[&_input]:border-red-500")}
              placeholder="Pilih origin..."
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
          {renderError("origin_location_id")}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Destination</Label>
          <Combobox
            items={locationOptions}
            value={locationOptions.find((x) => x.value === destId) ?? null}
            onValueChange={(next) => setDestId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.destination_location_id && "[&_input]:border-red-500")}
              placeholder="Pilih destination..."
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
          {renderError("destination_location_id")}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Transport mode</Label>
          <Combobox
            items={modeOptions}
            value={modeOptions.find((x) => x.value === modeId) ?? null}
            onValueChange={(next) => setModeId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.transport_mode_id && "[&_input]:border-red-500")}
              placeholder="Pilih moda..."
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
          {renderError("transport_mode_id")}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Service type</Label>
          <Combobox
            items={serviceOptions}
            value={serviceOptions.find((x) => x.value === serviceTypeId) ?? null}
            onValueChange={(next) => setServiceTypeId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.service_type_id && "[&_input]:border-red-500")}
              placeholder="Pilih layanan..."
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
          {renderError("service_type_id")}
        </div>
      </div>
    </div>
  );
}
