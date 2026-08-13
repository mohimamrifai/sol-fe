"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

type DocRow = {
  key?: string;
  label?: string;
  available?: boolean;
  items?: Array<{ name?: string; url?: string }>;
};

type Props = {
  documents?: DocRow[];
  onPrintCn?: () => void;
};

export function ShipmentDocumentsCard({ documents, onPrintCn }: Props) {
  const rows = Array.isArray(documents) ? documents : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Shipment Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents available.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doc) => {
                const key = String(doc.key ?? doc.label ?? "");
                const available = Boolean(doc.available);
                return (
                  <TableRow key={key}>
                    <TableCell>{String(doc.label ?? key)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {available ? "Available" : "Not available"}
                    </TableCell>
                    <TableCell className="text-right">
                      {key === "consignment_note" && available && onPrintCn ? (
                        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={onPrintCn}>
                          <Download className="h-3.5 w-3.5" />
                          Print
                        </Button>
                      ) : available && (doc.items?.length ?? 0) > 0 ? (
                        <span className="text-xs text-muted-foreground">{doc.items?.length} file(s)</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
