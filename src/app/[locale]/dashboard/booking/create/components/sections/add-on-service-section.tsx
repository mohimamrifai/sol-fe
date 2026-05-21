"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Package, Truck, Wrench, Settings } from "lucide-react";
import { AS } from "../../hooks/use-booking-form";

interface AddOnServiceSectionProps {
  isFCL: boolean;
  isLCL: boolean;
  addServices: AS[];
  selectedAddOns: number[];
  setSelectedAddOns: (v: number[] | ((prev: number[]) => number[])) => void;
}

const fclMandatoryNames = [
  "Free Storage 5 Hari (Origin & Destination)",
  "LOLO (Lift On-Lift Off)",
  "Container Rent",
];
const lclMandatoryNames = ["Free Storage 1 Hari (Origin & Destination)"];

const CATEGORIES = [
  { key: "pickup", label: "Pickup", icon: Truck },
  { key: "packing", label: "Packing", icon: Package },
  { key: "handling", label: "Handling", icon: Wrench },
  { key: "other", label: "Lainnya", icon: Settings },
];

export function AddOnServiceSection({
  isFCL,
  isLCL,
  addServices,
  selectedAddOns,
  setSelectedAddOns,
}: AddOnServiceSectionProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Layanan Tambahan</CardTitle>
        <CardDescription>Pilih layanan pendukung lainnya seperti pickup atau asuransi.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
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
                            {activeCount > 0 ? activeNames : "Pilih layanan"}
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
                        (isFCL && fclMandatoryNames.includes(a.name)) ||
                        (isLCL && lclMandatoryNames.includes(a.name));
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
                                on
                                  ? prev.includes(a.id) ? prev : [...prev, a.id]
                                  : prev.filter((x) => x !== a.id)
                              );
                            }}
                          />
                          <div className="flex flex-col">
                            <span className={isMandatory ? "text-zinc-500 font-semibold italic" : "font-normal group-hover:text-zinc-900"}>
                              {a.name}
                            </span>
                            {isMandatory && <span className="text-[10px] text-zinc-400 font-medium">Bawaan (Default Terpilih)</span>}
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
