"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CT, CC, DC, ContainerRow, PackageRow } from "@/hooks/use-booking-form";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Pencil, Plus, Trash2 } from "lucide-react";

type ComboOption = { value: string; label: string };

interface CargoDetailSectionProps {
  isLCL: boolean;
  isFCL: boolean;
  containerTypes: CT[];
  cargoCategories: CC[];
  dgClasses: DC[];
  departureDate: string;
  setDepartureDate: (v: string) => void;
  cargoCategoryId: string;
  setCargoCategoryId: (v: string) => void;
  cargo: string;
  setCargo: (v: string) => void;
  equipmentCondition: string;
  setEquipmentCondition: (v: string) => void;
  temperature: string;
  setTemperature: (v: string) => void;
  showTemp?: boolean;
  showProject?: boolean;
  containerResponsibility: string;
  setContainerResponsibility: (v: string) => void;
  packages: PackageRow[];
  setPackages: (v: PackageRow[]) => void;
  containers: ContainerRow[];
  setContainers: (v: ContainerRow[]) => void;
  renderFieldError: (field: string) => string | null;
  adminFsdMode?: boolean;
}

export function CargoDetailSection({
  isLCL,
  isFCL,
  containerTypes,
  cargoCategories,
  dgClasses,
  departureDate,
  setDepartureDate,
  cargoCategoryId,
  setCargoCategoryId,
  cargo,
  setCargo,
  equipmentCondition,
  setEquipmentCondition,
  temperature,
  setTemperature,
  showTemp,
  showProject,
  containerResponsibility,
  setContainerResponsibility,
  packages,
  setPackages,
  containers,
  setContainers,
  renderFieldError,
  adminFsdMode = false,
}: CargoDetailSectionProps) {
  const t = useTranslations("Bookings.create.form");

  const containerTypeOptions: ComboOption[] = containerTypes.map((c) => ({
    value: String(c.id),
    label: `${c.name} (${c.size})`,
  }));
  const cargoCategoryOptions: ComboOption[] = cargoCategories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const selectedCargoCategory = cargoCategories.find((c) => String(c.id) === cargoCategoryId);

  const packageTotals = useMemo(() => {
    const totalPackages = packages.length;
    const totalWeight = packages.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);
    const totalVolume = packages.reduce((acc, p) => acc + calcPackageVolumeCbm(p), 0);
    const totalChargeable = packages.reduce((acc, p) => acc + calcPackageChargeableWeightKg(p), 0);
    return { totalPackages, totalWeight, totalVolume, totalChargeable };
  }, [packages]);

  const showPackagesError = renderFieldError("packages");
  const showContainersError = renderFieldError("containers");

  const [packageOpen, setPackageOpen] = useState(false);
  const [containerOpen, setContainerOpen] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);
  const [editingContainerIndex, setEditingContainerIndex] = useState<number | null>(null);
  const [draftPackage, setDraftPackage] = useState<PackageRow>(() => ({
    description: "",
    package_type: "",
    piece_count: 1,
    weight_kg: 0,
    length_cm: 0,
    width_cm: 0,
    height_cm: 0,
    remark: "",
    cargo_category_id: "",
    is_dangerous_goods: false,
    un_number: "",
    dg_class_id: "",
    packing_group: "",
    proper_shipping_name: "",
    flash_point_c: "",
    dg_remark: "",
    msds_file: null,
  }));
  const [draftContainer, setDraftContainer] = useState<ContainerRow>(() => ({
    container_type_id: "",
    quantity: 1,
    gross_weight_kg: 0,
    cargo_description: "",
    remark: "",
    cargo_category_id: "",
    is_dangerous_goods: false,
    un_number: "",
    dg_class_id: "",
    packing_group: "",
    proper_shipping_name: "",
    flash_point_c: "",
    dg_remark: "",
    msds_file: null,
  }));

  const packagingTypes = useMemo(() => ["Carton", "Pallet", "Crate", "Drum", "Sack", "Roll", "Others"], []);
  const packingGroups = useMemo(() => ["I", "II", "III"], []);
  const dgClassOptions = useMemo(
    () =>
      dgClasses.map((d) => ({
        value: String(d.id),
        label: d.name,
      })),
    [dgClasses]
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{t("cargoTitle")}</CardTitle>
        <CardDescription>{t("cargoSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {!adminFsdMode ? (
          <>
            <div className="space-y-1">
              <Label>{t("departureDate")}</Label>
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
              <Label>
                {t("cargoCategory")} <span className="text-red-500">*</span>
              </Label>
              <Combobox
                items={cargoCategoryOptions}
                value={cargoCategoryOptions.find((x) => x.value === cargoCategoryId) ?? null}
                onValueChange={(next) => setCargoCategoryId(next?.value ?? "")}
              >
                <ComboboxInput
                  className={cn("w-full", renderFieldError("cargo_category_id") && "[&_input]:border-red-500")}
                  placeholder={t("cargoCategoryPlaceholder")}
                />
                <ComboboxContent>
                  <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
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
                <p className="text-[11px] text-zinc-500">
                  {t("selected")}: {selectedCargoCategory.name}
                </p>
              ) : null}
              {renderFieldError("cargo_category_id") && (
                <p className="text-[11px] font-medium text-red-500">{renderFieldError("cargo_category_id")}</p>
              )}
            </div>

            {showTemp ? (
              <div className="space-y-1">
                <Label>
                  {t("temperature")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className={cn(renderFieldError("temperature") && "border-red-500")}
                />
                {renderFieldError("temperature") && (
                  <p className="text-[11px] font-medium text-red-500">{renderFieldError("temperature")}</p>
                )}
              </div>
            ) : null}

            {showProject ? (
              <div className="space-y-1">
                <Label>
                  {t("equipmentCondition")} <span className="text-red-500">*</span>
                </Label>
                <Select value={equipmentCondition} onValueChange={(v) => setEquipmentCondition(v ?? "")}>
                  <SelectTrigger className={cn("h-10 w-full", renderFieldError("equipment_condition") && "border-red-500")}>
                    <SelectValue placeholder={t("equipmentConditionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLEAN">{t("equipmentConditionClean")}</SelectItem>
                    <SelectItem value="RESIDUAL">{t("equipmentConditionResidual")}</SelectItem>
                  </SelectContent>
                </Select>
                {renderFieldError("equipment_condition") && (
                  <p className="text-[11px] font-medium text-red-500">{renderFieldError("equipment_condition")}</p>
                )}
              </div>
            ) : null}
          </>
        ) : null}

        {adminFsdMode && !isLCL && !isFCL ? (
          <p className="sm:col-span-2 text-sm text-muted-foreground">{t("selectServiceTypeHint")}</p>
        ) : null}

        {isLCL ? (
          <div className="sm:col-span-2 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{t("packagesTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("packagesSubtitle")}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 bg-white"
                onClick={() => {
                  setEditingPackageIndex(null);
                  setDraftPackage(emptyPackageRow(cargoCategories));
                  setPackageOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addPackage")}
              </Button>
            </div>

            {showPackagesError ? <p className="text-[11px] font-medium text-red-500">{showPackagesError}</p> : null}

            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>{t("packageDescription")}</TableHead>
                  <TableHead>{t("packageType")}</TableHead>
                  <TableHead className="text-right">{t("qty")}</TableHead>
                  <TableHead className="text-right">{t("weightKg")}</TableHead>
                  <TableHead className="text-right">{t("volumeCbm")}</TableHead>
                  <TableHead className="text-right">{t("chargeableWeight")}</TableHead>
                  <TableHead className="w-20 text-right">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length ? (
                  packages.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{p.description || "—"}</TableCell>
                      <TableCell>{p.package_type || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.piece_count || 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(calcPackageActualWeightKg(p))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(calcPackageVolumeCbm(p))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(calcPackageChargeableWeightKg(p))}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingPackageIndex(idx);
                              setDraftPackage(p);
                              setPackageOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPackages(packages.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      {t("packagesEmpty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("totalPackage")}</p>
                <p className="font-semibold tabular-nums">{packageTotals.totalPackages}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("totalActualWeight")}</p>
                <p className="font-semibold tabular-nums">{formatNumber(packageTotals.totalWeight)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("totalVolume")}</p>
                <p className="font-semibold tabular-nums">{formatNumber(packageTotals.totalVolume)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("totalChargeableWeight")}</p>
                <p className="font-semibold tabular-nums">{formatNumber(packageTotals.totalChargeable)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {isFCL ? (
          <div className="sm:col-span-2 space-y-3">
            <div className="space-y-2">
              <Label>
                {t("containerResponsibility")} <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={containerResponsibility} onValueChange={setContainerResponsibility} className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                  <RadioGroupItem value="SOC" />
                  <span>{t("containerResponsibilitySoc")}</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                  <RadioGroupItem value="COC" />
                  <span>{t("containerResponsibilityCoc")}</span>
                </label>
              </RadioGroup>
              {renderFieldError("container_responsibility") ? (
                <p className="text-[11px] font-medium text-red-500">{renderFieldError("container_responsibility")}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{t("containersTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("containersSubtitle")}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 bg-white"
                onClick={() => {
                  setEditingContainerIndex(null);
                  setDraftContainer(emptyContainerRow(cargoCategories));
                  setContainerOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addContainer")}
              </Button>
            </div>

            {showContainersError ? <p className="text-[11px] font-medium text-red-500">{showContainersError}</p> : null}

            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>{t("containerType")}</TableHead>
                  <TableHead className="text-right">{t("qty")}</TableHead>
                  <TableHead className="text-right">{t("weightKg")}</TableHead>
                  <TableHead>{t("cargoDescription")}</TableHead>
                  <TableHead>{t("cargoCategory")}</TableHead>
                  <TableHead>{t("remark")}</TableHead>
                  <TableHead className="w-20 text-right">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.length ? (
                  containers.map((c, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {containerTypes.find((x) => String(x.id) === c.container_type_id)?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.quantity || 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(Number(c.gross_weight_kg) || 0)}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{c.cargo_description || "—"}</TableCell>
                      <TableCell>{cargoCategories.find((x) => String(x.id) === c.cargo_category_id)?.name ?? "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{c.remark || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingContainerIndex(idx);
                              setDraftContainer(c);
                              setContainerOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setContainers(containers.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      {t("containersEmpty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {!adminFsdMode ? (
          <div className="sm:col-span-2 space-y-1">
            <Label>{t("cargoDescription")}</Label>
            <Textarea
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              rows={3}
              placeholder={t("cargoDescriptionPlaceholder")}
              className={cn(renderFieldError("cargo_description") && "border-red-500 ring-2 ring-red-500/20")}
            />
            {renderFieldError("cargo_description") && (
              <p className="text-[11px] font-medium text-red-500">{renderFieldError("cargo_description")}</p>
            )}
          </div>
        ) : null}
      </CardContent>

      <Dialog open={packageOpen} onOpenChange={setPackageOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPackageIndex == null ? t("addPackage") : t("editPackage")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>
                {t("packageDescription")} <span className="text-red-500">*</span>
              </Label>
              <Input value={draftPackage.description} onChange={(e) => setDraftPackage((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("packageType")}</Label>
              <Select value={draftPackage.package_type} onValueChange={(v) => setDraftPackage((p) => ({ ...p, package_type: v ?? "" }))}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder={t("packageTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {packagingTypes.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>
                {t("cargoCategory")} <span className="text-red-500">*</span>
              </Label>
              <Combobox
                items={cargoCategoryOptions}
                value={cargoCategoryOptions.find((x) => x.value === draftPackage.cargo_category_id) ?? null}
                onValueChange={(next) => {
                  const categoryId = next?.value ?? "";
                  const isDg = cargoCategories.find((c) => String(c.id) === categoryId)?.code === "DG";
                  setDraftPackage((p) => ({
                    ...p,
                    cargo_category_id: categoryId,
                    is_dangerous_goods: isDg,
                  }));
                }}
              >
                <ComboboxInput className="w-full" placeholder={t("cargoCategoryPlaceholder")} />
                <ComboboxContent>
                  <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
                  <ComboboxList>
                    {(item: ComboOption) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="space-y-1">
              <Label>
                {t("qty")} <span className="text-red-500">*</span>
              </Label>
              <Input type="number" min={1} value={String(draftPackage.piece_count ?? "")} onChange={(e) => setDraftPackage((p) => ({ ...p, piece_count: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("lengthCm")}</Label>
              <Input type="number" value={String(draftPackage.length_cm ?? "")} onChange={(e) => setDraftPackage((p) => ({ ...p, length_cm: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("widthCm")}</Label>
              <Input type="number" value={String(draftPackage.width_cm ?? "")} onChange={(e) => setDraftPackage((p) => ({ ...p, width_cm: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("heightCm")}</Label>
              <Input type="number" value={String(draftPackage.height_cm ?? "")} onChange={(e) => setDraftPackage((p) => ({ ...p, height_cm: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("volumeCbm")}</Label>
              <Input value={formatNumber(calcPackageVolumeCbm(draftPackage))} readOnly className="bg-zinc-100" />
            </div>
            <div className="space-y-1">
              <Label>{t("actualWeightKg")}</Label>
              <Input type="number" value={String(draftPackage.weight_kg ?? "")} onChange={(e) => setDraftPackage((p) => ({ ...p, weight_kg: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("volumeWeightKg")}</Label>
              <Input value={formatNumber(calcPackageVolumeWeightKg(draftPackage))} readOnly className="bg-zinc-100" />
            </div>
            <div className="space-y-1">
              <Label>{t("chargeableWeight")}</Label>
              <Input value={formatNumber(calcPackageChargeableWeightKg(draftPackage))} readOnly className="bg-zinc-100" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{t("remark")}</Label>
              <Textarea value={draftPackage.remark} onChange={(e) => setDraftPackage((p) => ({ ...p, remark: e.target.value }))} rows={3} />
            </div>
            <div className="sm:col-span-2 space-y-2 rounded-xl border bg-muted/20 p-4">
              {draftPackage.is_dangerous_goods ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>
                      {t("unNumber")} <span className="text-red-500">*</span>
                    </Label>
                    <Input value={draftPackage.un_number} onChange={(e) => setDraftPackage((p) => ({ ...p, un_number: e.target.value }))} placeholder="UN1203" />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("dgClass")} <span className="text-red-500">*</span>
                    </Label>
                    <Combobox
                      items={dgClassOptions}
                      value={dgClassOptions.find((x) => x.value === draftPackage.dg_class_id) ?? null}
                      onValueChange={(next) => setDraftPackage((p) => ({ ...p, dg_class_id: next?.value ?? "" }))}
                    >
                      <ComboboxInput className="w-full" placeholder={t("dgClassPlaceholder")} />
                      <ComboboxContent>
                        <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
                        <ComboboxList>
                          {(item: ComboOption) => (
                            <ComboboxItem key={item.value} value={item}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("packingGroup")} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={draftPackage.packing_group} onValueChange={(v) => setDraftPackage((p) => ({ ...p, packing_group: v ?? "" }))}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder={t("packingGroupPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {packingGroups.map((x) => (
                          <SelectItem key={x} value={x}>
                            {x}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("properShippingName")} <span className="text-red-500">*</span>
                    </Label>
                    <Input value={draftPackage.proper_shipping_name} onChange={(e) => setDraftPackage((p) => ({ ...p, proper_shipping_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("flashPoint")}</Label>
                    <Input type="number" value={draftPackage.flash_point_c} onChange={(e) => setDraftPackage((p) => ({ ...p, flash_point_c: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("msdsFile")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setDraftPackage((p) => ({ ...p, msds_file: e.target.files?.[0] ?? null }))}
                      className="h-auto bg-white py-1.5 text-xs"
                    />
                    {draftPackage.msds_file ? <p className="text-[10px] text-muted-foreground truncate">{draftPackage.msds_file.name}</p> : null}
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>{t("dgRemark")}</Label>
                    <Textarea value={draftPackage.dg_remark} onChange={(e) => setDraftPackage((p) => ({ ...p, dg_remark: e.target.value }))} rows={3} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPackageOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const next = { ...draftPackage };
                if (editingPackageIndex == null) {
                  setPackages([...packages, next]);
                } else {
                  setPackages(packages.map((p, i) => (i === editingPackageIndex ? next : p)));
                }
                setPackageOpen(false);
              }}
              disabled={!draftPackage.description || !draftPackage.piece_count || !draftPackage.cargo_category_id}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={containerOpen} onOpenChange={setContainerOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContainerIndex == null ? t("addContainer") : t("editContainer")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>
                {t("containerType")} <span className="text-red-500">*</span>
              </Label>
              <Combobox
                items={containerTypeOptions}
                value={containerTypeOptions.find((x) => x.value === draftContainer.container_type_id) ?? null}
                onValueChange={(next) => setDraftContainer((c) => ({ ...c, container_type_id: next?.value ?? "" }))}
              >
                <ComboboxInput className="w-full" placeholder={t("containerTypePlaceholder")} />
                <ComboboxContent>
                  <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
                  <ComboboxList>
                    {(item: ComboOption) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="space-y-1">
              <Label>
                {t("qty")} <span className="text-red-500">*</span>
              </Label>
              <Input type="number" min={1} value={String(draftContainer.quantity ?? "")} onChange={(e) => setDraftContainer((c) => ({ ...c, quantity: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>
                {t("cargoCategory")} <span className="text-red-500">*</span>
              </Label>
              <Combobox
                items={cargoCategoryOptions}
                value={cargoCategoryOptions.find((x) => x.value === draftContainer.cargo_category_id) ?? null}
                onValueChange={(next) => {
                  const categoryId = next?.value ?? "";
                  const isDg = cargoCategories.find((c) => String(c.id) === categoryId)?.code === "DG";
                  setDraftContainer((c) => ({
                    ...c,
                    cargo_category_id: categoryId,
                    is_dangerous_goods: isDg,
                  }));
                }}
              >
                <ComboboxInput className="w-full" placeholder={t("cargoCategoryPlaceholder")} />
                <ComboboxContent>
                  <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
                  <ComboboxList>
                    {(item: ComboOption) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="space-y-1">
              <Label>{t("cargoWeightKg")}</Label>
              <Input type="number" value={String(draftContainer.gross_weight_kg ?? "")} onChange={(e) => setDraftContainer((c) => ({ ...c, gross_weight_kg: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("cargoDescription")}</Label>
              <Input value={draftContainer.cargo_description} onChange={(e) => setDraftContainer((c) => ({ ...c, cargo_description: e.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{t("remark")}</Label>
              <Textarea value={draftContainer.remark} onChange={(e) => setDraftContainer((c) => ({ ...c, remark: e.target.value }))} rows={3} />
            </div>
            <div className="sm:col-span-2 space-y-2 rounded-xl border bg-muted/20 p-4">
              {draftContainer.is_dangerous_goods ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>
                      {t("unNumber")} <span className="text-red-500">*</span>
                    </Label>
                    <Input value={draftContainer.un_number} onChange={(e) => setDraftContainer((c) => ({ ...c, un_number: e.target.value }))} placeholder="UN1203" />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("dgClass")} <span className="text-red-500">*</span>
                    </Label>
                    <Combobox
                      items={dgClassOptions}
                      value={dgClassOptions.find((x) => x.value === draftContainer.dg_class_id) ?? null}
                      onValueChange={(next) => setDraftContainer((c) => ({ ...c, dg_class_id: next?.value ?? "" }))}
                    >
                      <ComboboxInput className="w-full" placeholder={t("dgClassPlaceholder")} />
                      <ComboboxContent>
                        <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
                        <ComboboxList>
                          {(item: ComboOption) => (
                            <ComboboxItem key={item.value} value={item}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("packingGroup")} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={draftContainer.packing_group} onValueChange={(v) => setDraftContainer((c) => ({ ...c, packing_group: v ?? "" }))}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder={t("packingGroupPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {packingGroups.map((x) => (
                          <SelectItem key={x} value={x}>
                            {x}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("properShippingName")} <span className="text-red-500">*</span>
                    </Label>
                    <Input value={draftContainer.proper_shipping_name} onChange={(e) => setDraftContainer((c) => ({ ...c, proper_shipping_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("flashPoint")}</Label>
                    <Input type="number" value={draftContainer.flash_point_c} onChange={(e) => setDraftContainer((c) => ({ ...c, flash_point_c: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t("msdsFile")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setDraftContainer((c) => ({ ...c, msds_file: e.target.files?.[0] ?? null }))}
                      className="h-auto bg-white py-1.5 text-xs"
                    />
                    {draftContainer.msds_file ? <p className="text-[10px] text-muted-foreground truncate">{draftContainer.msds_file.name}</p> : null}
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>{t("dgRemark")}</Label>
                    <Textarea value={draftContainer.dg_remark} onChange={(e) => setDraftContainer((c) => ({ ...c, dg_remark: e.target.value }))} rows={3} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContainerOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const next = { ...draftContainer };
                if (editingContainerIndex == null) {
                  setContainers([...containers, next]);
                } else {
                  setContainers(containers.map((c, i) => (i === editingContainerIndex ? next : c)));
                }
                setContainerOpen(false);
              }}
              disabled={!draftContainer.container_type_id || !draftContainer.quantity || !draftContainer.cargo_category_id}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function emptyPackageRow(cargoCategories: CC[]): PackageRow {
  const gen = cargoCategories.find((c) => c.code === "GEN");
  return {
    description: "",
    package_type: "",
    piece_count: 1,
    weight_kg: 0,
    length_cm: 0,
    width_cm: 0,
    height_cm: 0,
    remark: "",
    cargo_category_id: gen ? String(gen.id) : "",
    is_dangerous_goods: false,
    un_number: "",
    dg_class_id: "",
    packing_group: "",
    proper_shipping_name: "",
    flash_point_c: "",
    dg_remark: "",
    msds_file: null,
  };
}

function emptyContainerRow(cargoCategories: CC[]): ContainerRow {
  const gen = cargoCategories.find((c) => c.code === "GEN");
  return {
    container_type_id: "",
    quantity: 1,
    gross_weight_kg: 0,
    cargo_description: "",
    remark: "",
    cargo_category_id: gen ? String(gen.id) : "",
    is_dangerous_goods: false,
    un_number: "",
    dg_class_id: "",
    packing_group: "",
    proper_shipping_name: "",
    flash_point_c: "",
    dg_remark: "",
    msds_file: null,
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(Number.isFinite(value) ? value : 0);
}

function calcPackageVolumeCbm(p: PackageRow): number {
  const l = Number(p.length_cm) || 0;
  const w = Number(p.width_cm) || 0;
  const h = Number(p.height_cm) || 0;
  const qty = Number(p.piece_count) || 1;
  if (!l || !w || !h) return 0;
  return ((l * w * h) / 1_000_000) * qty;
}

function calcPackageVolumeWeightKg(p: PackageRow): number {
  const l = Number(p.length_cm) || 0;
  const w = Number(p.width_cm) || 0;
  const h = Number(p.height_cm) || 0;
  const qty = Number(p.piece_count) || 1;
  if (!l || !w || !h) return 0;
  return ((l * w * h) / 5000) * qty;
}

function calcPackageActualWeightKg(p: PackageRow): number {
  return Number(p.weight_kg) || 0;
}

function calcPackageChargeableWeightKg(p: PackageRow): number {
  return Math.max(calcPackageActualWeightKg(p), calcPackageVolumeWeightKg(p));
}
