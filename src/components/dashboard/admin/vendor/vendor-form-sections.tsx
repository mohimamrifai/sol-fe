"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ControlledAddressRegionFields } from "@/components/shared/controlled-address-region-fields";
import { VendorContactDialog } from "@/components/dashboard/admin/vendor/vendor-contact-dialog";
import {
  createAdminVendorContact,
  deleteAdminVendorContact,
  updateAdminVendorContact,
} from "@/lib/admin-api";
import {
  BUSINESS_ENTITY_OPTIONS,
  VENDOR_PAYMENT_METHOD_OPTIONS,
  VENDOR_PAYMENT_TERM_OPTIONS,
  VENDOR_TAX_STATUS_OPTIONS,
  VENDOR_TYPE_OPTIONS,
  businessEntityLabel,
  vendorPaymentMethodLabel,
  vendorPaymentTermLabel,
} from "@/lib/vendor-fsd-options";
import {
  SELECT_EMPTY_VALUE,
  fromSelectFieldValue,
  normalizeSelectField,
  optionLabel,
  toSelectFieldValue,
} from "@/lib/select-field";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type VendorContactRow = {
  id?: number;
  name: string;
  position?: string;
  email?: string;
  mobile: string;
  is_primary?: boolean;
  is_active?: boolean;
};

export type VendorFormValues = {
  name: string;
  business_entity: string;
  vendor_types: string[];
  vendor_category: string;
  npwp: string;
  email: string;
  phone: string;
  website: string;
  remark: string;
  is_active: boolean;
  address: string;
  country: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  payment_terms: string;
  payment_method: string;
  bank_name: string;
  bank_account_number: string;
  account_holder: string;
  tax_status: string;
  contacts: VendorContactRow[];
};

const EMPTY: VendorFormValues = {
  name: "",
  business_entity: "company",
  vendor_types: [],
  vendor_category: "",
  npwp: "",
  email: "",
  phone: "",
  website: "",
  remark: "",
  is_active: true,
  address: "",
  country: "Indonesia",
  province: "",
  city: "",
  district: "",
  postal_code: "",
  payment_terms: "30_days",
  payment_method: "transfer",
  bank_name: "",
  bank_account_number: "",
  account_holder: "",
  tax_status: "",
  contacts: [],
};

export function vendorDetailToForm(d: Record<string, unknown>): VendorFormValues {
  const contacts = ((d.contacts as Record<string, unknown>[]) ?? []).map((c) => ({
    id: c.id != null ? Number(c.id) : undefined,
    name: String(c.name ?? ""),
    position: String(c.position ?? ""),
    email: String(c.email ?? ""),
    mobile: String(c.mobile ?? ""),
    is_primary: c.is_primary === true,
    is_active: c.is_active !== false,
  }));

  return {
    name: String(d.name ?? ""),
    business_entity: String(d.business_entity ?? "company"),
    vendor_types: (d.vendor_types as string[]) ?? [],
    vendor_category: normalizeSelectField(d.vendor_category),
    npwp: String(d.npwp ?? ""),
    email: String(d.email ?? ""),
    phone: String(d.phone ?? ""),
    website: String(d.website ?? ""),
    remark: String(d.remark ?? ""),
    is_active: d.is_active !== false,
    address: String(d.address ?? ""),
    country: String(d.country ?? "Indonesia"),
    province: String(d.province ?? ""),
    city: String(d.city ?? ""),
    district: String(d.district ?? ""),
    postal_code: String(d.postal_code ?? ""),
    payment_terms: String(d.payment_terms ?? "30_days"),
    payment_method: String(d.payment_method ?? "transfer"),
    bank_name: String(d.bank_name ?? ""),
    bank_account_number: String(d.bank_account_number ?? ""),
    account_holder: String(d.account_holder ?? ""),
    tax_status: normalizeSelectField(d.tax_status),
    contacts,
  };
}

export function VendorFormSections({
  values,
  onChange,
  readonly = false,
  vendorCode,
  showContacts = true,
  businessEntityReadonly = false,
  contactCrud,
}: {
  values: VendorFormValues;
  onChange: (patch: Partial<VendorFormValues>) => void;
  readonly?: boolean;
  vendorCode?: string;
  showContacts?: boolean;
  businessEntityReadonly?: boolean;
  contactCrud?: { vendorId: number; onRefresh: () => Promise<void> };
}) {
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactEditIndex, setContactEditIndex] = useState<number | null>(null);
  const [contactBusy, setContactBusy] = useState(false);

  const contactsReadonly = readonly && !contactCrud;

  const toggleVendorType = (type: string) => {
    const set = new Set(values.vendor_types);
    if (set.has(type)) set.delete(type);
    else set.add(type);
    onChange({ vendor_types: Array.from(set) });
  };

  const saveContact = async (row: VendorContactRow) => {
    if (contactCrud && readonly) {
      setContactBusy(true);
      try {
        const payload = {
          name: row.name,
          position: row.position ?? null,
          email: row.email ?? null,
          mobile: row.mobile,
          is_primary: row.is_primary ?? false,
          is_active: row.is_active !== false,
        };
        if (row.id) {
          await updateAdminVendorContact(contactCrud.vendorId, row.id, payload);
        } else {
          await createAdminVendorContact(contactCrud.vendorId, payload);
        }
        await contactCrud.onRefresh();
        setContactDialogOpen(false);
        setContactEditIndex(null);
        toast.success(row.id ? "Contact diperbarui." : "Contact ditambahkan.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menyimpan contact.");
      } finally {
        setContactBusy(false);
      }
      return;
    }

    const next = [...values.contacts];
    if (contactEditIndex != null) {
      next[contactEditIndex] = row;
    } else {
      next.push(row);
    }
    if (row.is_primary) {
      next.forEach((c, i) => {
        if (contactEditIndex != null ? i !== contactEditIndex : c !== row) c.is_primary = false;
      });
    }
    onChange({ contacts: next });
    setContactDialogOpen(false);
    setContactEditIndex(null);
  };

  const removeContact = async (index: number) => {
    const contact = values.contacts[index];
    if (contactCrud && readonly && contact?.id) {
      setContactBusy(true);
      try {
        await deleteAdminVendorContact(contactCrud.vendorId, contact.id);
        await contactCrud.onRefresh();
        toast.success("Contact dihapus.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menghapus contact.");
      } finally {
        setContactBusy(false);
      }
      return;
    }
    onChange({ contacts: values.contacts.filter((_, i) => i !== index) });
  };

  const transferRequired = values.payment_method === "transfer";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">General Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Business Entity</Label>
            {businessEntityReadonly ? (
              <Input value={businessEntityLabel(values.business_entity)} readOnly disabled className="bg-muted" />
            ) : (
              <Select
                value={values.business_entity}
                onValueChange={(v) => v && onChange({ business_entity: v })}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue>{businessEntityLabel(values.business_entity)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_ENTITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Vendor Name</Label>
            <Input value={values.name} onChange={(e) => onChange({ name: e.target.value })} disabled={readonly} />
          </div>
          <div className="space-y-2">
            <Label>Vendor Code</Label>
            <Input value={vendorCode ?? "Auto Generate"} readOnly disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={values.is_active ? "active" : "inactive"}
              onValueChange={(v) => onChange({ is_active: v === "active" })}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue>{values.is_active ? "Active" : "Inactive"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Vendor Type</Label>
          <div className="flex flex-wrap gap-4">
            {VENDOR_TYPE_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values.vendor_types.includes(o.value)}
                  onCheckedChange={() => toggleVendorType(o.value)}
                  disabled={readonly}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>NPWP</Label>
            <Input value={values.npwp} onChange={(e) => onChange({ npwp: e.target.value })} disabled={readonly} />
          </div>
          <div className="space-y-2">
            <Label>Vendor Category</Label>
            <Select
              value={toSelectFieldValue(values.vendor_category)}
              onValueChange={(v) => onChange({ vendor_category: fromSelectFieldValue(v) })}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Opsional">
                  {optionLabel(values.vendor_category, BUSINESS_ENTITY_OPTIONS)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_EMPTY_VALUE}>—</SelectItem>
                {BUSINESS_ENTITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company Email</Label>
            <Input type="email" value={values.email} onChange={(e) => onChange({ email: e.target.value })} disabled={readonly} />
          </div>
          <div className="space-y-2">
            <Label>Company Phone Number</Label>
            <Input value={values.phone} onChange={(e) => onChange({ phone: e.target.value })} disabled={readonly} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Website</Label>
            <Input value={values.website} onChange={(e) => onChange({ website: e.target.value })} disabled={readonly} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Remark</Label>
            <Textarea value={values.remark} onChange={(e) => onChange({ remark: e.target.value })} disabled={readonly} rows={3} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Address Information</h3>
        <ControlledAddressRegionFields
          value={{
            country: values.country,
            province: values.province,
            city: values.city,
            district: values.district,
            postal_code: values.postal_code,
          }}
          onChange={(patch) => onChange(patch)}
          disabled={readonly}
          showCountry
          showDistrict
          showPostalCode
        />
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea value={values.address} onChange={(e) => onChange({ address: e.target.value })} disabled={readonly} rows={3} />
        </div>
      </section>

      {showContacts ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Contact Person</h3>
            {!contactsReadonly ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={contactBusy}
                onClick={() => {
                  setContactEditIndex(null);
                  setContactDialogOpen(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Contact Person
              </Button>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead>Status</TableHead>
                  {!contactsReadonly ? <TableHead className="w-20" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {values.contacts.map((c, i) => (
                  <TableRow key={c.id ?? i}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.position || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell>{c.mobile}</TableCell>
                    <TableCell>{c.is_primary ? "Yes" : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active !== false ? "default" : "secondary"}>
                        {c.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {!contactsReadonly ? (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button type="button" size="icon-sm" variant="ghost" disabled={contactBusy} onClick={() => { setContactEditIndex(i); setContactDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon-sm" variant="ghost" disabled={contactBusy} onClick={() => void removeContact(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {values.contacts.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Belum ada contact person.</p>
            ) : null}
          </div>
          <VendorContactDialog
            open={contactDialogOpen}
            onOpenChange={setContactDialogOpen}
            initial={contactEditIndex != null ? values.contacts[contactEditIndex] : null}
            onSave={saveContact}
          />
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Payment Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Select value={values.payment_terms} onValueChange={(v) => v && onChange({ payment_terms: v })} disabled={readonly}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih payment terms">
                  {vendorPaymentTermLabel(values.payment_terms)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VENDOR_PAYMENT_TERM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={values.payment_method} onValueChange={(v) => v && onChange({ payment_method: v })} disabled={readonly}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih payment method">
                  {vendorPaymentMethodLabel(values.payment_method)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VENDOR_PAYMENT_METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {transferRequired ? (
            <>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={values.bank_name} onChange={(e) => onChange({ bank_name: e.target.value })} disabled={readonly} />
              </div>
              <div className="space-y-2">
                <Label>Bank Account Number</Label>
                <Input value={values.bank_account_number} onChange={(e) => onChange({ bank_account_number: e.target.value })} disabled={readonly} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Account Holder</Label>
                <Input value={values.account_holder} onChange={(e) => onChange({ account_holder: e.target.value })} disabled={readonly} />
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label>Tax Status</Label>
            <Select
              value={toSelectFieldValue(values.tax_status)}
              onValueChange={(v) => onChange({ tax_status: fromSelectFieldValue(v) })}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Opsional">
                  {optionLabel(values.tax_status, VENDOR_TAX_STATUS_OPTIONS)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_EMPTY_VALUE}>—</SelectItem>
                {VENDOR_TAX_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}

export function useVendorForm(initial?: VendorFormValues) {
  const [values, setValues] = useState<VendorFormValues>(initial ?? EMPTY);
  const onChange = useCallback((patch: Partial<VendorFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);
  const reset = useCallback((next?: VendorFormValues) => setValues(next ?? EMPTY), []);
  return useMemo(() => ({ values, onChange, reset, setValues }), [values, onChange, reset]);
}

export function vendorFormToPayload(values: VendorFormValues): Record<string, unknown> {
  return {
    ...values,
    vendor_category: normalizeSelectField(values.vendor_category) || null,
    website: values.website || null,
    remark: values.remark || null,
    tax_status: normalizeSelectField(values.tax_status) || null,
    bank_name: values.bank_name || null,
    bank_account_number: values.bank_account_number || null,
    account_holder: values.account_holder || null,
  };
}

export { EMPTY as EMPTY_VENDOR_FORM };
