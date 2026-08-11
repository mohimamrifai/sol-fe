import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminStatCard = {
  key: string;
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  onClick?: () => void;
};

type AdminStatsCardsProps = {
  cards: AdminStatCard[];
  columns?: 2 | 3 | 4 | 6;
  loading?: boolean;
};

const columnClass: Record<NonNullable<AdminStatsCardsProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 xl:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
  6: "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6",
};

export function AdminStatsCards({ cards, columns = 4, loading }: AdminStatsCardsProps) {
  return (
    <div className={cn("grid gap-4", columnClass[columns])}>
      {cards.map((card) => {
        const Icon = card.icon;
        const clickable = Boolean(card.onClick);

        return (
          <Card
            key={card.key}
            className={cn(clickable && "cursor-pointer transition-shadow hover:shadow-md")}
            onClick={card.onClick}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription>{card.label}</CardDescription>
                {Icon ? (
                  <span className={cn("rounded-md p-1.5", card.iconClassName ?? "bg-zinc-100 text-zinc-700")}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </div>
              <CardTitle className="text-2xl font-semibold">
                {loading ? "—" : card.value}
              </CardTitle>
              {card.hint ? <p className="text-xs font-normal text-muted-foreground">{card.hint}</p> : null}
            </CardHeader>
            <CardContent className="hidden" />
          </Card>
        );
      })}
    </div>
  );
}
