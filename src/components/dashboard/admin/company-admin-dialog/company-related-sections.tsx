import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import type { Row } from "./types";

type Props = {
  capabilities: AdminCustomerCapabilities;
  branches: Row[];
  discounts: Row[];
  onAddBranch: () => void;
  onEditBranch: (row: Row) => void;
  onDeleteBranch: (row: Row) => void;
  onAddDiscount: () => void;
  onEditDiscount: (row: Row) => void;
  onDeleteDiscount: (row: Row) => void;
};

export function CompanyRelatedSections({
  capabilities,
  branches,
  discounts,
  onAddBranch,
  onEditBranch,
  onDeleteBranch,
  onAddDiscount,
  onEditDiscount,
  onDeleteDiscount,
}: Props) {
  return (
    <>
      <div className="border-t pt-4 space-y-2 md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Cabang</h3>
          {capabilities.canManageBranches ? (
            <Button type="button" size="sm" variant="outline" onClick={onAddBranch}>
              + Cabang
            </Button>
          ) : null}
        </div>
        {branches.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada cabang.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={String(b.id)}>
                  <TableCell>{String(b.name ?? "")}</TableCell>
                  <TableCell className="text-right">
                    {capabilities.canManageBranches ? (
                      <>
                        <Button type="button" size="sm" variant="ghost" onClick={() => onEditBranch(b)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => onDeleteBranch(b)}
                        >
                          Hapus
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="border-t pt-4 space-y-2 md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Diskon</h3>
          {capabilities.canManageDiscounts ? (
            <Button type="button" size="sm" variant="outline" onClick={onAddDiscount}>
              + Diskon
            </Button>
          ) : null}
        </div>
        {discounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada diskon.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipe</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((d) => (
                <TableRow key={String(d.id)}>
                  <TableCell>{String(d.discount_type ?? "")}</TableCell>
                  <TableCell>{String(d.discount_value ?? "")}</TableCell>
                  <TableCell className="text-right">
                    {capabilities.canManageDiscounts ? (
                      <>
                        <Button type="button" size="sm" variant="ghost" onClick={() => onEditDiscount(d)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => onDeleteDiscount(d)}
                        >
                          Hapus
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
