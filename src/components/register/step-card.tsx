"use client";

import * as React from "react";
import { Building2, Globe, MapPin, UserCog, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRegisterT, type StepDescriptor } from "./types";

const ICON_MAP = {
  building: Building2,
  map: MapPin,
  globe: Globe,
  user: UserCog,
} as const;

interface StepCardProps {
  descriptor: StepDescriptor;
  /** When true, render a green check beside the step number. */
  isComplete?: boolean;
  /** Disable the trigger (e.g. while submitting). */
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a single registration step inside the Base UI AccordionItem.
 * Provides the standard trigger header (step number, icon, title) and
 * the content slot. Title & subtitle are read from the i18n context.
 */
export function StepCard({
  descriptor,
  isComplete = false,
  disabled = false,
  children,
  className,
}: StepCardProps) {
  const t = useRegisterT();
  const Icon = ICON_MAP[descriptor.iconName];

  return (
    <AccordionItem
      value={descriptor.key}
      disabled={disabled}
      className={cn(
        "group rounded-xl border border-zinc-100 bg-white px-4 transition-all",
        "data-open:border-zinc-200 data-open:shadow-sm",
        "data-disabled:opacity-60",
        className,
      )}
    >
      <AccordionTrigger className="flex w-full items-center gap-3 py-4 hover:no-underline">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors",
            isComplete ? "bg-emerald-500" : "bg-black",
          )}
        >
          {isComplete ? (
            <Check className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {t("step.sectionLabel", { number: descriptor.step })}
          </span>
          <h3 className="text-sm font-bold text-zinc-900">
            {t(`step.${descriptor.key}.title`)}
          </h3>
        </div>
        {isComplete ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            {t("step.statusComplete")}
          </span>
        ) : null}
      </AccordionTrigger>
      <AccordionContent className="pt-1 pb-5">
        <div className="space-y-4 border-t border-zinc-50 pt-4">
          <p className="text-xs text-zinc-500">
            {t(`step.${descriptor.key}.subtitle`)}
          </p>
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
