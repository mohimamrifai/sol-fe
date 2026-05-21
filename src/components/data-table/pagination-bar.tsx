"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationBarProps = {
  currentPage: number;
  lastPage: number;
  total: number;
  from?: number | null;
  to?: number | null;
  onPageChange: (page: number) => void;
  className?: string;
};

export function PaginationBar({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
  className,
}: PaginationBarProps) {
  const rangeText =
    from != null && to != null && total > 0
      ? `Menampilkan ${from}–${to} dari ${total}`
      : total > 0
        ? `Total ${total} data`
        : null;

  if (total === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">
        {rangeText}
        {lastPage > 1 ? ` · Halaman ${currentPage} dari ${lastPage}` : null}
      </p>
      {lastPage > 1 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={currentPage >= lastPage}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
