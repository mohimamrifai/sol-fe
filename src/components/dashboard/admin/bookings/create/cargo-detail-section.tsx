import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DangerousGoodsSection } from "@/components/dashboard/admin/bookings/create/dangerous-goods-section";
import type { CC, CT, DC } from "@/hooks/use-admin-booking-form";

type ComboOption = { value: string; label: string };

interface CargoDetailSectionProps {
  isLCL: boolean;
  isFCL: boolean;
  containerTypes: CT[];
  cargoCategories: CC[];
  dgClasses: DC[];

  containerTypeId: string;
  setContainerTypeId: (v: string) => void;
  containerCount: string;
  setContainerCount: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  cbm: string;
  setCbm: (v: string) => void;
  itemLength: string;
  setItemLength: (v: string) => void;
  itemWidth: string;
  setItemWidth: (v: string) => void;
  itemHeight: string;
  setItemHeight: (v: string) => void;
  pickupDate: string;
  setPickupDate: (v: string) => void;
  cargoCategoryId: string;
  setCargoCategoryId: (v: string) => void;
  cargo: string;
  setCargo: (v: string) => void;

  isDg: boolean;
  dgClassId: string;
  setDgClassId: (v: string) => void;
  unNumber: string;
  setUnNumber: (v: string) => void;
  msdsFile: File | null;
  setMsdsFile: (v: File | null) => void;

  equipmentCondition: string;
  setEquipmentCondition: (v: string) => void;
  temperature: string;
  setTemperature: (v: string) => void;

  selectedContainerType?: CT;
  selectedCargoCategory?: CC;
  showTemp?: boolean;
  showProject?: boolean;

  validationErrors: Record<string, string[]> | null;
  renderError: (field: string) => React.ReactNode;
}

export function CargoDetailSection({
  isLCL,
  isFCL,
  containerTypes,
  cargoCategories,
  dgClasses,
  containerTypeId,
  setContainerTypeId,
  containerCount,
  setContainerCount,
  weight,
  setWeight,
  cbm,
  setCbm,
  itemLength,
  setItemLength,
  itemWidth,
  setItemWidth,
  itemHeight,
  setItemHeight,
  pickupDate,
  setPickupDate,
  cargoCategoryId,
  setCargoCategoryId,
  cargo,
  setCargo,
  isDg,
  dgClassId,
  setDgClassId,
  unNumber,
  setUnNumber,
  msdsFile,
  setMsdsFile,
  equipmentCondition,
  setEquipmentCondition,
  temperature,
  setTemperature,
  selectedContainerType,
  selectedCargoCategory,
  showTemp,
  showProject,
  validationErrors,
  renderError,
}: CargoDetailSectionProps) {
  const containerOptions: ComboOption[] = [
    { value: "__none__", label: "—" },
    ...containerTypes.map((c) => ({ value: String(c.id), label: `${c.name} (${c.size})` })),
  ];
  const cargoCategoryOptions: ComboOption[] = cargoCategories.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-2">
        Detail Kargo & Pengiriman
      </h3>
      <div className="grid gap-5 sm:grid-cols-2 bg-white p-5 rounded-xl border shadow-sm">
        {!isLCL ? (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                Container type {isFCL && <span className="text-red-500">*</span>}
              </Label>
              <Combobox
                items={containerOptions}
                value={containerOptions.find((x) => x.value === (containerTypeId || "__none__")) ?? null}
                onValueChange={(next) => setContainerTypeId(next?.value && next.value !== "__none__" ? next.value : "")}
              >
                <ComboboxInput className="w-full h-10 bg-zinc-50/50" placeholder="Pilih tipe kontainer..." />
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
              {renderError("container_type_id")}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Jumlah kontainer</Label>
              <Input
                type="number"
                min={1}
                value={containerCount}
                onChange={(e) => setContainerCount(e.target.value.replace(/\D/g, ""))}
                className={cn("h-10 bg-zinc-50/50", validationErrors?.container_count && "border-red-500")}
              />
              {renderError("container_count")}
            </div>
          </>
        ) : (
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3 bg-zinc-50/50 p-4 rounded-lg border border-dashed">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Panjang (cm)</Label>
              <Input
                type="number"
                value={itemLength}
                onChange={(e) => {
                  setItemLength(e.target.value);
                  const l = Number(e.target.value) || 0;
                  const w = Number(itemWidth) || 0;
                  const h = Number(itemHeight) || 0;
                  if (l && w && h) setCbm(String((l * w * h) / 1000000));
                }}
                placeholder="cm"
                className="h-10 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Lebar (cm)</Label>
              <Input
                type="number"
                value={itemWidth}
                onChange={(e) => {
                  setItemWidth(e.target.value);
                  const l = Number(itemLength) || 0;
                  const w = Number(e.target.value) || 0;
                  const h = Number(itemHeight) || 0;
                  if (l && w && h) setCbm(String((l * w * h) / 1000000));
                }}
                placeholder="cm"
                className="h-10 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Tinggi (cm)</Label>
              <Input
                type="number"
                value={itemHeight}
                onChange={(e) => {
                  setItemHeight(e.target.value);
                  const l = Number(itemLength) || 0;
                  const w = Number(itemWidth) || 0;
                  const h = Number(e.target.value) || 0;
                  if (l && w && h) setCbm(String((l * w * h) / 1000000));
                }}
                placeholder="cm"
                className="h-10 bg-white"
              />
            </div>
            <p className="sm:col-span-3 text-[10px] text-muted-foreground ml-1">
              * Dimensi digunakan untuk menghitung CBM secara otomatis.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Berat Estimasi (kg)</Label>
          <Input
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={!isLCL && !!selectedContainerType}
            className={cn(
              "h-10 bg-zinc-50/50",
              !isLCL && selectedContainerType && "bg-zinc-100 italic",
              validationErrors?.estimated_weight && "border-red-500"
            )}
          />
          {renderError("estimated_weight")}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">CBM Estimasi</Label>
          <Input
            type="number"
            step="0.01"
            value={cbm}
            onChange={(e) => setCbm(e.target.value)}
            disabled={!!selectedContainerType || isLCL}
            className={cn(
              "h-10 bg-zinc-50/50",
              (selectedContainerType || isLCL) && "bg-zinc-100 italic",
              validationErrors?.estimated_cbm && "border-red-500"
            )}
          />
          {renderError("estimated_cbm")}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
            Tanggal keberangkatan (est.)
          </Label>
          <Input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="h-10 bg-zinc-50/50"
          />
          {renderError("departure_date")}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Kategori Kargo</Label>
          <Combobox
            items={cargoCategoryOptions}
            value={cargoCategoryOptions.find((x) => x.value === cargoCategoryId) ?? null}
            onValueChange={(next) => setCargoCategoryId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full h-10 bg-zinc-50/50", validationErrors?.cargo_category_id && "[&_input]:border-red-500")}
              placeholder="Pilih kategori..."
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
          {renderError("cargo_category_id")}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
            <span>Deskripsi barang</span>
            <span
              className={
                selectedCargoCategory?.code === "MIX"
                  ? "text-[10px] text-red-500 font-bold"
                  : "text-[10px] text-zinc-400 normal-case"
              }
            >
              {selectedCargoCategory?.code === "MIX" ? "(Wajib untuk Mixed Cargo)" : "(Opsional)"}
            </span>
          </Label>
          <Textarea
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            rows={3}
            placeholder="Sebutkan isi paket secara detail..."
            className={cn("min-h-[84px] bg-zinc-50/50", validationErrors?.cargo_description && "border-red-500")}
            required={selectedCargoCategory?.code === "MIX"}
          />
          {renderError("cargo_description")}
        </div>

        {showProject ? (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
              Kondisi Mesin / Unit <span className="text-red-500">*</span>
            </Label>
            <select
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-zinc-50/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                validationErrors?.equipment_condition && "border-red-500"
              )}
              value={equipmentCondition}
              onChange={(e) => setEquipmentCondition(e.target.value)}
              required
            >
              <option value="">— pilih kondisi —</option>
              <option value="CLEAN">CLEAN (Bersih/Baru)</option>
              <option value="OILY">OILY (Berminyak/Bekas)</option>
              <option value="DIRTY">DIRTY (Kotor)</option>
            </select>
            {renderError("equipment_condition")}
          </div>
        ) : null}

        {showTemp ? (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
              Kebutuhan Suhu (Opsional)
            </Label>
            <Input
              type="text"
              placeholder="Contoh: -18°C, 2-8°C"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className={cn("h-10 bg-zinc-50/50", validationErrors?.temperature && "border-red-500")}
            />
            {renderError("temperature")}
          </div>
        ) : null}
      </div>

      <DangerousGoodsSection
        isDg={isDg}
        dgClassId={dgClassId}
        onDgClassIdChange={setDgClassId}
        unNumber={unNumber}
        onUnNumberChange={setUnNumber}
        msdsFile={msdsFile}
        onMsdsFileChange={setMsdsFile}
        dgClasses={dgClasses}
        validationErrors={validationErrors ?? undefined}
        renderError={(field) => {
          const err = renderError(field);
          return err ? String(err) : null;
        }}
      />
    </div>
  );
}
