"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

/** Prefer an option from the list before falling back to free text. */
function findOptionForQuery(
  options: ComboboxOption[],
  query: string,
): ComboboxOption | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;

  const q = trimmed.toLowerCase();

  const exact = options.find((o) => o.label.toLowerCase() === q);
  if (exact) return exact;

  const partial = options.filter((o) => o.label.toLowerCase().includes(q));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    const wordMatch = partial.find((o) =>
      o.label
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(q)),
    );
    return wordMatch ?? partial[0];
  }

  return undefined;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingText?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** Allow user-typed value (not in the list) to be committed as-is. */
  allowFreeInput?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
}

/**
 * Lightweight searchable dropdown.
 * Built on cmdk + Base UI Popover. No Framer Motion.
 * Use this anywhere a metadata admin dropdown is needed
 * (regions, business entities, business categories, etc.).
 */
export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ditemukan.",
  loadingText = "Memuat...",
  disabled = false,
  loading = false,
  className,
  allowFreeInput = false,
  invalid = false,
  "aria-label": ariaLabel,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!open) setDraft("");
  }, [open]);

  // Some popover libraries (Base UI) auto-focus the first tabbable
  // element in the popup, which triggers the browser to scroll the
  // page so the focused element stays in view. Because the popover
  // is portaled near the bottom of the body, this looks like the
  // page is jumping down. While the popover is open we force the
  // scroll behavior to `auto` and restore the scroll position on
  // every animation frame to keep the viewport stable.
  React.useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    const startY = window.scrollY;
    let raf = 0;
    const tick = () => {
      if (window.scrollY !== startY) {
        window.scrollTo({ top: startY, behavior: "auto" });
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      html.style.scrollBehavior = previous;
    };
  }, [open]);

  const commit = (next: string) => {
    if (!next.trim()) return;
    const match = findOptionForQuery(options, next);
    if (match) {
      onChange(match.value);
    } else if (allowFreeInput) {
      onChange(next.trim());
    } else {
      const exact = options.find(
        (o) => o.label.toLowerCase() === next.trim().toLowerCase(),
      );
      if (exact) onChange(exact.value);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label={ariaLabel}
            disabled={disabled || loading}
            className={cn(
              // Match the same height/padding as the regular Input.
              "h-10 w-full justify-between rounded-lg border-zinc-200 bg-zinc-50/50 px-3 font-normal shadow-sm",
              "transition-all focus-visible:ring-2 focus-visible:ring-black",
              "focus-visible:border-transparent focus-visible:bg-white text-sm",
              !selected && !value && "text-muted-foreground",
              invalid && "border-destructive focus-visible:ring-destructive",
              className,
            )}
          >
            <span className="truncate">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {loadingText}
                </span>
              ) : selected ? (
                selected.label
              ) : value ? (
                value
              ) : (
                placeholder
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent
        className="w-72 max-w-[var(--available-width)] p-0"
        align="start"
        side="bottom"
        collisionAvoidance={{ side: "none", align: "shift", fallbackAxisSide: "none" }}
      >
        <Command shouldFilter>
          <CommandInput
            placeholder={searchPlaceholder}
            value={draft}
            onValueChange={setDraft}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !draft.trim()) return;
              const match = findOptionForQuery(options, draft);
              if (match) {
                e.preventDefault();
                onChange(match.value);
                setOpen(false);
                return;
              }
              if (allowFreeInput) {
                e.preventDefault();
                commit(draft);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>
              {emptyMessage}
              {allowFreeInput && draft.trim() ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => commit(draft)}
                    className="text-primary underline"
                  >
                    Pakai &quot;{draft.trim()}&quot;
                  </button>
                </div>
              ) : null}
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
