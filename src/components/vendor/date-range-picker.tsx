"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
};

export function DateRangePicker({ from, to, onChange }: Props) {
  const tCommon = useTranslations("Vendor.common");

  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
      <input
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="h-10 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        placeholder={tCommon("from")}
        aria-label={tCommon("from")}
      />
      <span className="text-zinc-400">—</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="h-10 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        placeholder={tCommon("to")}
        aria-label={tCommon("to")}
      />
    </div>
  );
}
