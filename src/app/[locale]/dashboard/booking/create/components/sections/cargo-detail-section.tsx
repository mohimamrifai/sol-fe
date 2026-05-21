"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CT, CC, DC } from "../../hooks/use-booking-form";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const selectCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
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
  departureDate: string;
  setDepartureDate: (v: string) => void;
  cargoCategoryId: string;
  setCargoCategoryId: (v: string) => void;
  cargo: string;
  setCargo: (v: string) => void;
  selectedCT?: CT;
  selectedCC?: CC;
  isDG: boolean;
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
  showTemp?: boolean;
  showProject?: boolean;
  renderFieldError: (field: string) => string | null;
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
  departureDate,
  setDepartureDate,
  cargoCategoryId,
  setCargoCategoryId,
  cargo,
  setCargo,
  selectedCT,
  selectedCC,
  isDG,
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
  showTemp,
  showProject,
  renderFieldError,
}: CargoDetailSectionProps) {
  const containerOptions: ComboOption[] = containerTypes.map((c) => ({
    value: String(c.id),
    label: `${c.name} (${c.size})`,
  }));
  const cargoCategoryOptions: ComboOption[] = cargoCategories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  const dgClassOptions: ComboOption[] = dgClasses.map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  const selectedCargoCategory = cargoCategories.find((c) => String(c.id) === cargoCategoryId);
  const selectedDgClass = dgClasses.find((d) => String(d.id) === dgClassId);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Detil Kargo &amp; Spesifikasi</CardTitle>
        <CardDescription>Masukkan rincian dimensi, berat, dan kategori kargo Anda.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {!isLCL ? (
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Tipe Kontainer {isFCL && <span className="text-red-500">*</span>}</Label>
              <Combobox
                items={containerOptions}
                value={containerOptions.find((x) => x.value === containerTypeId) ?? null}
                onValueChange={(next) => setContainerTypeId(next?.value ?? "")}
              >
                <ComboboxInput
                  className={cn("w-full", renderFieldError("container_type_id") && "[&_input]:border-red-500")}
                  placeholder="Pilih tipe kontainer"
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
              {selectedCT ? (
                <p className="text-[11px] text-zinc-500">Dipilih: {selectedCT.name}</p>
              ) : null}
              {renderFieldError("container_type_id") && (
                <p className="text-[11px] font-medium text-red-500">{renderFieldError("container_type_id")}</p>
              )}
              {selectedCT && (
                <div className="text-[10px] text-zinc-500 flex gap-4 px-1 font-mono uppercase bg-zinc-50 py-1 rounded">
                  <span>P: {selectedCT.length || 0} cm</span>
                  <span>L: {selectedCT.width || 0} cm</span>
                  <span>T: {selectedCT.height || 0} cm</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Jumlah Kontainer</Label>
              <Input
                type="number"
                min={1}
                value={containerCount}
                onChange={(e) => setContainerCount(e.target.value)}
                className={cn(renderFieldError("container_count") && "border-red-500")}
              />
              {renderFieldError("container_count") && (
                <p className="text-[11px] font-medium text-red-500">{renderFieldError("container_count")}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3 bg-zinc-50/50 p-4 rounded-lg border border-dashed">
            <div className="space-y-1">
              <Label>Panjang (cm)</Label>
              <Input
                type="number"
                value={itemLength}
                onChange={(e) => setItemLength(e.target.value)}
                placeholder="cm"
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Lebar (cm)</Label>
              <Input
                type="number"
                value={itemWidth}
                onChange={(e) => setItemWidth(e.target.value)}
                placeholder="cm"
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Tinggi (cm)</Label>
              <Input
                type="number"
                value={itemHeight}
                onChange={(e) => setItemHeight(e.target.value)}
                placeholder="cm"
                className="bg-white"
              />
            </div>
            <p className="sm:col-span-3 text-[10px] text-muted-foreground">* Dimensi digunakan untuk menghitung CBM secara otomatis.</p>
          </div>
        )}

        <div className="space-y-1">
          <Label>Total Berat (kg)</Label>
          <Input
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={!isLCL && !!selectedCT}
            className={cn(
              !isLCL && selectedCT ? "bg-zinc-100 italic" : "bg-white",
              renderFieldError("estimated_weight") && "border-red-500"
            )}
          />
          {renderFieldError("estimated_weight") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("estimated_weight")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Total CBM</Label>
          <Input
            type="number"
            step="0.01"
            value={cbm}
            onChange={(e) => setCbm(e.target.value)}
            disabled={!!selectedCT || isLCL}
            className={cn(
              selectedCT || isLCL ? "bg-zinc-100 italic" : "bg-white",
              renderFieldError("estimated_cbm") && "border-red-500"
            )}
          />
          {renderFieldError("estimated_cbm") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("estimated_cbm")}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Estimasi Tgl Berangkat</Label>
          <Input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className={cn(renderFieldError("departure_date") && "border-red-500")}
          />
          {renderFieldError("departure_date") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("departure_date")}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Kategori Kargo <span className="text-red-500">*</span></Label>
          <Combobox
            items={cargoCategoryOptions}
            value={cargoCategoryOptions.find((x) => x.value === cargoCategoryId) ?? null}
            onValueChange={(next) => setCargoCategoryId(next?.value ?? "")}
          >
            <ComboboxInput
              className={cn("w-full", renderFieldError("cargo_category_id") && "[&_input]:border-red-500")}
              placeholder="Pilih kategori kargo"
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
          {selectedCargoCategory ? (
            <p className="text-[11px] text-zinc-500">Dipilih: {selectedCargoCategory.name}</p>
          ) : null}
          {renderFieldError("cargo_category_id") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("cargo_category_id")}</p>
          )}
        </div>

        {/* Conditional: Temperature */}
        {showTemp && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label>Suhu (Celsius) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="0.0"
              className={cn(renderFieldError("temperature") && "border-red-500")}
              required
            />
            {renderFieldError("temperature") && (
              <p className="text-[11px] font-medium text-red-500">{renderFieldError("temperature")}</p>
            )}
          </div>
        )}

        {/* Conditional: Project Cargo Equipment Condition */}
        {showProject && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label>Kondisi Mesin / Unit <span className="text-red-500">*</span></Label>
            <select
              className={cn(selectCls, renderFieldError("equipment_condition") && "border-red-500 ring-2 ring-red-500/20")}
              value={equipmentCondition}
              onChange={(e) => setEquipmentCondition(e.target.value)}
              required
            >
              <option value="">— pilih kondisi —</option>
              <option value="CLEAN">CLEAN (Bersih/Baru)</option>
              <option value="RESIDUAL">RESIDUAL (Bekas/Terdapat sisa BBM)</option>
            </select>
            {renderFieldError("equipment_condition") && (
              <p className="text-[11px] font-medium text-red-500">{renderFieldError("equipment_condition")}</p>
            )}
            {equipmentCondition === "RESIDUAL" && (
              <p className="text-[10px] text-amber-600 font-medium">
                * Unit Residual akan otomatis ditandai sebagai Dangerous Goods (DG).
              </p>
            )}
          </div>
        )}

        {/* DG Section */}
        {isDG && (
          <div className="sm:col-span-2 border-t pt-4 mt-2">
            <Label className="text-sm font-bold text-red-600 mb-2 block">
              Detail Kargo Berbahaya (Dangerous Goods)
            </Label>
            <div className="grid gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-amber-50/30 p-4 rounded-xl border border-amber-100">
              <div className="space-y-1">
                <Label>DG Class <span className="text-red-500">*</span></Label>
                <Combobox
                  items={dgClassOptions}
                  value={dgClassOptions.find((x) => x.value === dgClassId) ?? null}
                  onValueChange={(next) => setDgClassId(next?.value ?? "")}
                >
                  <ComboboxInput
                    className={cn("w-full", renderFieldError("dg_class_id") && "[&_input]:border-red-500")}
                    placeholder="Pilih DG class"
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
                {selectedDgClass ? (
                  <p className="text-[11px] text-zinc-500">Dipilih: {selectedDgClass.name}</p>
                ) : null}
                {renderFieldError("dg_class_id") && (
                  <p className="text-[11px] font-medium text-red-500">{renderFieldError("dg_class_id")}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>UN Number <span className="text-red-500">*</span></Label>
                <Input
                  value={unNumber}
                  onChange={(e) => setUnNumber(e.target.value)}
                  placeholder="e.g. UN1263"
                  className={cn("bg-white", renderFieldError("un_number") && "border-red-500")}
                  required
                />
                {renderFieldError("un_number") && (
                  <p className="text-[11px] font-medium text-red-500">{renderFieldError("un_number")}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Dokumen MSDS <span className="text-red-500">*</span></Label>
                <Input
                  type="file"
                  onChange={(e) => setMsdsFile(e.target.files?.[0] || null)}
                  className={cn("text-xs bg-white h-auto py-1.5", renderFieldError("msds_file") && "border-red-500")}
                  accept=".pdf"
                  required={!msdsFile}
                />
                {msdsFile && <p className="text-[10px] text-zinc-500 truncate">{msdsFile.name}</p>}
                {renderFieldError("msds_file") && (
                  <p className="text-[11px] font-medium text-red-500">{renderFieldError("msds_file")}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="sm:col-span-2 space-y-1">
          <Label className="flex justify-between items-center">
            <span>Deskripsi Barang</span>
            <span className={selectedCC?.code === "MIX" ? "text-[10px] text-red-500 font-bold" : "text-[10px] text-zinc-400"}>
              {selectedCC?.code === "MIX" ? "(Wajib untuk Mixed Cargo)" : "(Opsional)"}
            </span>
          </Label>
          <Textarea
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            rows={3}
            placeholder={selectedCC?.code === "MIX" ? "Detail isi kargo campuran wajib diisi..." : "Sebutkan jenis barang, kemasan, atau catatan spesifik lainnya..."}
            className={cn(renderFieldError("cargo_description") && "border-red-500 ring-2 ring-red-500/20")}
            required={selectedCC?.code === "MIX"}
          />
          {renderFieldError("cargo_description") && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError("cargo_description")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
