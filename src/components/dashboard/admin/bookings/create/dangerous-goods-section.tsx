import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DangerousGoodsSectionProps {
  isDg: boolean;
  dgClassId: string;
  onDgClassIdChange: (v: string) => void;
  unNumber: string;
  onUnNumberChange: (v: string) => void;
  msdsFile: File | null;
  onMsdsFileChange: (file: File | null) => void;
  dgClasses: { id: number; name: string; code: string }[];
  validationErrors?: Record<string, string[]>;
  renderError: (field: string) => React.ReactNode;
}

export function DangerousGoodsSection({
  isDg,
  dgClassId,
  onDgClassIdChange,
  unNumber,
  onUnNumberChange,
  onMsdsFileChange,
  dgClasses,
  validationErrors,
  renderError,
}: DangerousGoodsSectionProps) {
  return (
    <div className="sm:col-span-2 space-y-4">
      {isDg && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <Label className="font-semibold text-red-600">
              Detail Barang Berbahaya (DG / Dangerous Goods)
            </Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-red-100 bg-red-50/20 p-4">
            <div className="space-y-2">
            <Label>DG Class</Label>
            <Select value={dgClassId} onValueChange={(v) => v && onDgClassIdChange(v)}>
              <SelectTrigger
                className={cn(
                  "h-9 w-full rounded-lg",
                  validationErrors?.dg_class_id ? "border-red-500 ring-red-500" : ""
                )}
              >
                <SelectValue placeholder="Pilih class…" />
              </SelectTrigger>
              <SelectContent>
                {dgClasses.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name} ({d.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderError("dg_class_id")}
          </div>
          <div className="space-y-2">
            <Label>UN Number</Label>
            <Input
              placeholder="Contoh: UN1234"
              value={unNumber}
              onChange={(e) => onUnNumberChange(e.target.value)}
              required={isDg}
              className={cn(
                "h-9",
                validationErrors?.un_number ? "border-red-500" : ""
              )}
            />
            {renderError("un_number")}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>MSDS File (PDF)</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => onMsdsFileChange(e.target.files?.[0] ?? null)}
              required={isDg}
              className={cn(
                "h-9 italic text-xs py-1.5",
                validationErrors?.msds_file ? "border-red-500" : ""
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              Wajib untuk barang berbahaya (maks 5MB).
            </p>
            {renderError("msds_file")}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
