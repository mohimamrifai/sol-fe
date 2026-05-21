"use client";

import { useMemo, useState, useEffect } from "react";
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
import { createAdminCompany } from "@/lib/admin-api";
import { BILLING_CYCLE_OPTIONS, billingCycleLabel } from "@/lib/billing-cycle-labels";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { toast } from "sonner";

const BUSINESS_ENTITY_OPTIONS = [
  { value: "PT", label: "PT" },
  { value: "CV", label: "CV" },
  { value: "Firma", label: "Firma" },
  { value: "UD", label: "UD" },
  { value: "Koperasi", label: "Koperasi" },
  { value: "Yayasan", label: "Yayasan" },
  { value: "Lainnya", label: "Lainnya" },
];

export default function AdminCustomerCreatePage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const backPath = `/${locale}/dashboard/admin/customers`;

  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const caps = useMemo(() => getAdminCustomerCapabilities(user?.roles ?? []), [user?.roles]);
  const canCreate = authHydrated && caps.canCreateCustomer;

  const [businessEntityType, setBusinessEntityType] = useState("PT");
  const [companyCode, setCompanyCode] = useState("");
  const [name, setName] = useState("");
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [billingCycle, setBillingCycle] = useState("end_of_month");
  const [paymentType, setPaymentType] = useState<"prepaid" | "postpaid">("prepaid");
  const [postpaidTermDays, setPostpaidTermDays] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Data PIC
  const [picEmail, setPicEmail] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derivedCompanyCode = useMemo(() => {
    const raw = name.trim();
    if (!raw) return "";

    const normalized = raw
      .toUpperCase()
      .replace(/[^A-Z0-9\s\-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const tokens = normalized.split(/[\s\-_]+/).filter(Boolean);
    const lettersOnly = normalized.replace(/[^A-Z]/g, "");

    let code = "";
    for (const token of tokens) {
      const ch = token.replace(/[^A-Z]/g, "").slice(0, 1);
      if (ch) code += ch;
      if (code.length >= 3) break;
    }

    if (code.length < 3) {
      code += lettersOnly.slice(code.length, 3);
    }

    code = code.slice(0, 3);
    return code.length === 3 ? code : "";
  }, [name]);

  useEffect(() => {
    setCompanyCode(derivedCompanyCode);
  }, [derivedCompanyCode]);

  const save = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      const cleanedPhone = phone.trim();
      if (cleanedPhone && !/^(0|62)\d+$/.test(cleanedPhone)) {
        setError("Format telepon harus diawali 0 atau 62 tanpa tanda +.");
        setSaving(false);
        return;
      }

      await createAdminCompany({
        business_entity_type: businessEntityType,
        name: name.trim(),
        company_code: companyCode || undefined,
        npwp: npwp.trim() || null,
        nib: nib.trim() || null,
        billing_cycle: billingCycle,
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

        // Data PIC
        pic_name: contactPerson.trim() || null,
        pic_email: picEmail.trim() || null,
        pic_phone: picPhone.trim() || null,
        password: password || undefined,

        status: "active",
      });
      toast.success("Customer berhasil ditambahkan.");
      router.push(backPath);
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

  if (!canCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses ditolak</CardTitle>
          <CardDescription>Role Anda tidak memiliki izin tambah customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push(backPath)}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah customer</CardTitle>
        <CardDescription>Form input customer oleh tim internal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">
            Informasi Perusahaan
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
            <Label>Badan usaha</Label>
            <Select
              value={businessEntityType}
              onValueChange={(v) => v && setBusinessEntityType(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih badan usaha">
                  {BUSINESS_ENTITY_OPTIONS.find((o) => o.value === businessEntityType)?.label ?? "Pilih badan usaha"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_ENTITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nama perusahaan</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama resmi perusahaan" />
          </div>
          <div className="space-y-2">
              <Label>Kode perusahaan</Label>
              <Input value={companyCode} readOnly className="bg-zinc-50" placeholder="Tiga huruf (Auto-generate)" />
            </div>
          <div className="space-y-2">
            <Label>NPWP</Label>
            <Input value={npwp} onChange={(e) => setNpwp(e.target.value)} placeholder="00.000.000.0-000.000" />
          </div>
          <div className="space-y-2">
            <Label>NIB</Label>
            <Input value={nib} onChange={(e) => setNib(e.target.value)} placeholder="Nomor Induk Berusaha" />
          </div>
          <div className="space-y-2">
            <Label>Tipe pembayaran</Label>
            <Select
              value={paymentType}
              onValueChange={(v) => v && setPaymentType(v as "prepaid" | "postpaid")}
            >
              <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat lengkap jalan & gedung"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Kota</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota / kabupaten" />
          </div>
          <div className="space-y-2">
            <Label>Provinsi</Label>
            <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Provinsi" />
          </div>
          <div className="space-y-2">
            <Label>Kode pos</Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
              placeholder="00000"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div className="space-y-2">
            <Label>Email perusahaan</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="perusahaan@domain.com"
            />
          </div>
          <div className="space-y-2">
              <Label>Telepon perusahaan</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="081234567890 atau 6281234567890"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">
            Data Akun PIC
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nama Lengkap PIC</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Nama PIC" />
            </div>
            <div className="space-y-2">
              <Label>Email Kerja PIC</Label>
              <Input
                type="email"
                value={picEmail}
                onChange={(e) => setPicEmail(e.target.value)}
                placeholder="email.pic@domain.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telepon / HP PIC</Label>
              <Input
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="081234567890"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            <div className="space-y-2">
              <Label>Password Akun</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(backPath)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={() => void save()} disabled={saving || !name.trim()}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
