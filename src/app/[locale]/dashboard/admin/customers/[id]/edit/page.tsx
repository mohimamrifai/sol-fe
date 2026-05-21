"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  fetchAdminCompany,
  updateAdminCompany,
} from "@/lib/admin-api";
import { BILLING_CYCLE_OPTIONS, billingCycleLabel } from "@/lib/billing-cycle-labels";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { toast } from "sonner";
import { BranchManagement } from "@/components/dashboard/admin/customers/branch-management";
import { DiscountManagement } from "@/components/dashboard/admin/customers/discount-management";
import { StatusManagerSection } from "@/components/dashboard/admin/customers/status-manager-section";

export default function AdminCustomerEditPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const id = Number(params?.id);
  const backPath = `/${locale}/dashboard/admin/customers`;

  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const caps = useMemo(() => getAdminCustomerCapabilities(user?.roles ?? []), [user?.roles]);
  const canEdit = authHydrated && caps.canEditCompanyData;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [paymentType, setPaymentType] = useState<"prepaid" | "postpaid">("postpaid");
  const [postpaidTermDays, setPostpaidTermDays] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const refreshData = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    try {
      const res = await fetchAdminCompany(id);
      const d = (res as { data: Record<string, unknown> }).data;
      setDetail(d);
      setName(String(d.name ?? ""));
      setNpwp(String(d.npwp ?? ""));
      setNib(String(d.nib ?? ""));
      setBillingCycle(String(d.billing_cycle || "end_of_month"));
      setAddress(String(d.address ?? ""));
      setCity(String(d.city ?? ""));
      setProvince(String(d.province ?? ""));
      setPostalCode(String(d.postal_code ?? ""));
      setContactPerson(String(d.contact_person ?? ""));
      setEmail(String(d.email ?? ""));
      setPhone(String(d.phone ?? ""));
      setPaymentType(
        (String(d.payment_type ?? "postpaid") === "prepaid" ? "prepaid" : "postpaid")
      );
      setPostpaidTermDays(
        d.postpaid_term_days != null ? String(d.postpaid_term_days) : ""
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat data customer.");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  const save = async () => {
    if (!canEdit || !Number.isFinite(id) || id < 1) return;
    setSaving(true);
    setError(null);
    try {
      const cleanedPhone = phone.trim();
      if (cleanedPhone && !/^(0|62)\d+$/.test(cleanedPhone)) {
        setError("Format telepon harus diawali 0 atau 62 tanpa tanda +.");
        setSaving(false);
        return;
      }
      await updateAdminCompany(id, {
        name: name.trim(),
        npwp: npwp.trim() || null,
        nib: nib.trim() || null,
        billing_cycle: billingCycle || "end_of_month",
        payment_type: paymentType,
        postpaid_term_days:
          paymentType === "postpaid" && postpaidTermDays.trim() !== ""
            ? Number(postpaidTermDays.trim())
            : null,
        address: address.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        postal_code: postalCode.trim() || null,
        contact_person: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: cleanedPhone || null,
      });
      toast.success("Data customer diperbarui.");
      await refreshData();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses ditolak</CardTitle>
          <CardDescription>Role Anda tidak memiliki izin edit customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push(backPath)}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }

  const companyStatus = String(detail?.status ?? "").toLowerCase();
  const branches =
    (detail?.branches as Record<string, unknown>[] | undefined) ??
    (detail?.Branches as Record<string, unknown>[] | undefined) ??
    [];
  const discounts =
    (detail?.customer_discounts as Record<string, unknown>[] | undefined) ??
    (detail?.customerDiscounts as Record<string, unknown>[] | undefined) ??
    [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit customer</CardTitle>
        <CardDescription>Perbarui data perusahaan customer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-muted-foreground">Memuat…</p> : null}
        {!loading && (
          <>
            <StatusManagerSection
              companyId={id}
              status={companyStatus}
              canApproveReject={caps.canApproveReject}
              onRefresh={refreshData}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama perusahaan</Label>
                <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>NPWP</Label>
                <Input className="h-9" value={npwp} onChange={(e) => setNpwp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>NIB</Label>
                <Input className="h-9" value={nib} onChange={(e) => setNib(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipe pembayaran</Label>
                <Select
                  value={paymentType}
                  onValueChange={(v) => v && setPaymentType(v as "prepaid" | "postpaid")}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg">
                    <SelectValue placeholder="Pilih tipe pembayaran">
                      {paymentType === "prepaid" ? "Pre-paid" : "Post-paid"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepaid">Pre-paid</SelectItem>
                    <SelectItem value="postpaid">Post-paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentType === "postpaid" && (
                <div className="space-y-2">
                  <Label>Siklus penagihan</Label>
                  <Select
                    value={billingCycle}
                    onValueChange={(v) => v && setBillingCycle(v)}
                  >
                    <SelectTrigger className="h-9 w-full rounded-lg">
                      <SelectValue placeholder="Pilih siklus penagihan">
                        {billingCycleLabel(billingCycle)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_CYCLE_OPTIONS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {paymentType === "postpaid" && (
                <div className="space-y-2">
                  <Label>Jatuh tempo (hari)</Label>
                  <Input
                    className="h-9"
                    value={postpaidTermDays}
                    onChange={(e) => setPostpaidTermDays(e.target.value.replace(/\D/g, ""))}
                    placeholder="Contoh: 30"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea className="min-h-[80px]" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Kota</Label>
                <Input className="h-9" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Provinsi</Label>
                <Input className="h-9" value={province} onChange={(e) => setProvince(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kode pos</Label>
                <Input
                  className="h-9"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div className="space-y-2">
                <Label>PIC</Label>
                <Input className="h-9" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input className="h-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input
                  className="h-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="081234567890 atau 6281234567890"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <BranchManagement
                companyId={id}
                branches={branches}
                canManage={caps.canManageBranches}
                onRefresh={refreshData}
              />

              <DiscountManagement
                companyId={id}
                discounts={discounts}
                canManage={caps.canManageDiscounts}
                onRefresh={refreshData}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push(backPath)} disabled={saving}>
                Batal
              </Button>
              <Button onClick={() => void save()} disabled={saving || !name.trim()}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
