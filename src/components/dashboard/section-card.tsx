"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";

interface SectionCardProps {
  titleKey: string; // "Dashboard.sections.<key>.title"
  descriptionKey: string; // "Dashboard.sections.<key>.description"
  /** Translation key under "Dashboard.table.viewAll" or "Dashboard.sections.<key>.viewAll". */
  viewAllLabelKey?: string;
  /** Deep link for the "view all" / "create" button (rendered as secondary action). */
  viewAllHref?: string;
  /** Extra header actions (e.g. Create Booking button on the right). */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  titleKey,
  descriptionKey,
  viewAllLabelKey,
  viewAllHref,
  headerActions,
  children,
  className,
}: SectionCardProps) {
  const t = useTranslations("Dashboard");
  const title = t(titleKey);
  const description = t(descriptionKey);
  const viewAllLabel = viewAllLabelKey ? t(viewAllLabelKey) : null;

  return (
    <Card className={["min-w-0 overflow-hidden", className ?? ""].join(" ")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
              {title}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-zinc-500">
              {description}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            {viewAllLabel && viewAllHref ? (
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                className="h-8 gap-1 px-2.5 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                render={
                  <Link
                    href={viewAllHref}
                    className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    {viewAllLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}
