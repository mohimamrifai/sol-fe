"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Package, Truck, Wrench, Settings } from "lucide-react";
import { AS } from "@/hooks/use-booking-form";

interface AddOnServiceSectionProps {
  isFCL: boolean;
  isLCL: boolean;
  addServices: AS[];
  selectedAddOns: number[];
  setSelectedAddOns: (v: number[] | ((prev: number[]) => number[])) => void;
}

const FCL_MANDATORY_CODES = ["FREE_STORAGE_FCL", "LOLO", "CONTAINER_RENT"];
const LCL_MANDATORY_CODES = ["FREE_STORAGE_LCL"];

export function AddOnServiceSection({
  isFCL,
  isLCL,
  addServices,
  selectedAddOns,
  setSelectedAddOns,
}: AddOnServiceSectionProps) {
  const tForm = useTranslations("Bookings.create.form");
  const categories = useMemo(
    () => [
      { key: "pickup", label: tForm("addOnCategoryPickup"), icon: Truck },
      { key: "packing", label: tForm("addOnCategoryPacking"), icon: Package },
      { key: "handling", label: tForm("addOnCategoryHandling"), icon: Wrench },
      { key: "other", label: tForm("addOnCategoryOther"), icon: Settings },
    ],
    [tForm]
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{tForm("addOnTitle")}</CardTitle>
        <CardDescription>{tForm("addOnSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => {
            const svcs = addServices.filter((s) => (s.category || "other") === cat.key);
            if (svcs.length === 0) return null;

            const activeCount = svcs.filter((s) => selectedAddOns.includes(s.id)).length;
            const activeNames = svcs
              .filter((s) => selectedAddOns.includes(s.id))
              .map((s) => s.name)
              .join(", ");

            return (
              <Popover key={cat.key}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3 px-4 text-left font-normal border-zinc-200 hover:bg-zinc-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                          <cat.icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-zinc-900 leading-tight">{cat.label}</span>
                          <span className="text-xs text-zinc-500 leading-tight truncate max-w-[120px]">
                            {activeCount > 0 ? activeNames : tForm("addOnChooseServices")}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                    </Button>
                  }
                />
                <PopoverContent className="w-72 p-2 shadow-2xl border-zinc-200" align="start">
                  <div className="flex flex-col gap-1">
                    {svcs.map((a) => {
                      const isMandatory =
                        (isFCL && a.code != null && FCL_MANDATORY_CODES.includes(a.code)) ||
                        (isLCL && a.code != null && LCL_MANDATORY_CODES.includes(a.code));
                      return (
                        <label
                          key={a.id}
                          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100 cursor-pointer text-sm transition-colors"
                        >
                          <Checkbox
                            checked={selectedAddOns.includes(a.id)}
                            disabled={isMandatory}
                            onCheckedChange={(v) => {
                              if (isMandatory) return;
                              const on = v === true;
                              setSelectedAddOns((prev) =>
                                on ? (prev.includes(a.id) ? prev : [...prev, a.id]) : prev.filter((x) => x !== a.id)
                              );
                            }}
                          />
                          <div className="flex flex-col">
                            <span
                              className={
                                isMandatory
                                  ? "text-zinc-500 font-semibold italic"
                                  : "font-normal group-hover:text-zinc-900"
                              }
                            >
                              {a.name}
                            </span>
                            {isMandatory && (
                              <span className="text-[10px] text-zinc-400 font-medium">{tForm("addOnIncludedDefault")}</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
