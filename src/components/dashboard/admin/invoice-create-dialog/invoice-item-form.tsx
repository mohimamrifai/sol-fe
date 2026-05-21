"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export type ItemLine = { key: string; description: string; quantity: string; unit_price: string };

export function newLine(): ItemLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: "",
    quantity: "1",
    unit_price: "0",
  };
}

interface InvoiceItemFormProps {
  items: ItemLine[];
  onItemsChange: (items: ItemLine[]) => void;
}

export function InvoiceItemForm({ items, onItemsChange }: InvoiceItemFormProps) {
  const addItem = () => onItemsChange([...items, newLine()]);
  
  const removeItem = (key: string) => {
    if (items.length > 1) {
      onItemsChange(items.filter((it) => it.key !== key));
    }
  };

  const updateItem = (key: string, patch: Partial<ItemLine>) => {
    onItemsChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold">Item baris</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          onClick={addItem}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Tambah Baris
        </Button>
      </div>
      <div className="space-y-3 rounded-md border p-3 bg-zinc-50/30">
        {items.map((it, idx) => (
          <div key={it.key} className="grid gap-3 border-b pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Item #{idx + 1}</span>
              {items.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(it.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Input
              placeholder="Deskripsi jasa atau barang"
              value={it.description}
              onChange={(e) => updateItem(it.key, { description: e.target.value })}
              className="bg-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground ml-1">Kuantitas</Label>
                <Input
                  inputMode="numeric"
                  placeholder="Qty"
                  value={it.quantity}
                  onChange={(e) => updateItem(it.key, { quantity: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground ml-1">Harga Satuan</Label>
                <Input
                  inputMode="decimal"
                  placeholder="Harga"
                  value={it.unit_price}
                  onChange={(e) => updateItem(it.key, { unit_price: e.target.value })}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
