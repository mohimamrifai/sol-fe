"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminTrackingEntry = {
  occurred_at?: string | null;
  title?: string;
  description?: string | null;
  actor_name?: string | null;
  status?: string;
};

type Props = {
  entries?: AdminTrackingEntry[];
};

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminTrackingTimelineCard({ entries }: Props) {
  const rows = Array.isArray(entries) ? [...entries].reverse() : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tracking Timeline</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Belum ada aktivitas tracking.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="pr-6">User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry, idx) => (
                <TableRow key={`${entry.occurred_at ?? idx}-${entry.title ?? idx}`}>
                  <TableCell className="pl-6 whitespace-nowrap text-xs text-muted-foreground">
                    {fmtDate(entry.occurred_at)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{entry.title ?? "—"}</p>
                    {entry.description ? (
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="pr-6 text-sm">{entry.actor_name ?? "System"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
