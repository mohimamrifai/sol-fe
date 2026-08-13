"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityEntry = {
  occurred_at?: string;
  title?: string;
  description?: string | null;
  actor_name?: string | null;
  source?: string;
};

type Props = {
  entries?: ActivityEntry[];
};

export function ShipmentActivityLogCard({ entries }: Props) {
  const rows = Array.isArray(entries) ? [...entries].reverse() : [];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {rows.map((entry, i) => (
              <li key={`${entry.occurred_at ?? i}-${entry.title ?? i}`} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{String(entry.title ?? "—")}</p>
                  {entry.description ? (
                    <p className="text-muted-foreground">{String(entry.description)}</p>
                  ) : null}
                  {entry.actor_name ? (
                    <p className="text-xs text-muted-foreground">{entry.actor_name}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {entry.occurred_at ? String(entry.occurred_at).slice(0, 16).replace("T", " ") : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
