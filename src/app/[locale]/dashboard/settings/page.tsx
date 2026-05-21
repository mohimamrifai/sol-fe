"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings, Building, User, Lock, Loader2, Save, CheckCircle2, Users, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";

import { CustomerUsersTab } from "./customer-users-tab";

interface CompanyData {
  id: number;
  name: string;
  company_code?: string;
  npwp?: string;
  nib?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status?: string;
  billing_cycle?: string;
}

export default function CompanySettingsPage() {
  const t = useTranslations("Dashboard.customer.settings");
  const { user, setUser } = useAuthStore();

  // Company profile state
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    npwp: "",
    nib: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    contact_person: "",
    email: "",
    phone: "",
  });

  // User profile state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  // Password change state
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    password_confirmation: "",
  });

  const loadCompany = useCallback(async () => {
    setLoadingCompany(true);
    try {
      const res = await apiFetch<{ data: CompanyData }>("/customer/company", { method: "GET" });
      setCompany(res.data);
      setCompanyForm({
        name: res.data.name ?? "",
        npwp: res.data.npwp ?? "",
        nib: res.data.nib ?? "",
        address: res.data.address ?? "",
        city: res.data.city ?? "",
        province: res.data.province ?? "",
        postal_code: res.data.postal_code ?? "",
        contact_person: res.data.contact_person ?? "",
        email: res.data.email ?? "",
        phone: res.data.phone ?? "",
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat data perusahaan.");
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name ?? "",
        phone: (user.phone as string) ?? "",
      });
    }
  }, [user]);

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      const res = await apiFetch<{ message: string; data: CompanyData }>("/customer/company", {
        method: "PUT",
        body: JSON.stringify(companyForm),
      });
      setCompany(res.data);
      toast.success(res.message || "Data perusahaan berhasil diperbarui.");
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Gagal menyimpan data perusahaan.";
      toast.error(msg);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await apiFetch<{ message: string; data: Record<string, unknown> }>("/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim() || null,
        }),
      });
      toast.success(res.message || "Profil berhasil diperbarui.");
      // Update local auth store
      if (user) {
        setUser({ ...user, name: profileForm.name.trim(), phone: profileForm.phone.trim() || null });
      }
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Gagal menyimpan profil.";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.password || passwordForm.password.length < 8) {
      toast.error("Password baru minimal 8 karakter.");
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await apiFetch<{ message: string }>("/profile", {
        method: "PUT",
        body: JSON.stringify({
          password: passwordForm.password,
          password_confirmation: passwordForm.password_confirmation,
        }),
      });
      toast.success(res.message || "Password berhasil diubah.");
      setPasswordForm({ password: "", password_confirmation: "" });
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Gagal mengubah password.";
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const billingCycleLabel = (cycle?: string) => {
    switch (cycle) {
      case "half_monthly_1": return "Tgl 1 - 15";
      case "half_monthly_2": return "Tgl 16 - Akhir Bulan";
      case "both_half": return "Tgl 1-15 & 16-Akhir Bulan";
      case "end_of_month": return "Akhir Bulan";
      default: return cycle ?? "—";
    }
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      {/* Page Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Settings className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {t("title", { default: "Company Settings" })}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("description", {
                default: "Kelola profil perusahaan, profil pengguna, dan keamanan akun.",
              })}
            </p>
          </div>
        </div>
      </div>

      {loadingCompany ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue={user?.roles?.includes("company_admin") || user?.roles?.includes("super_admin") ? "company" : "profile"} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            {(user?.roles?.includes("company_admin") || user?.roles?.includes("super_admin")) && (
              <>
                <TabsTrigger value="company" className="gap-2">
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil Perusahaan</span>
                  <span className="sm:hidden">Perusahaan</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Manajemen Pengguna</span>
                  <span className="sm:hidden">Tim</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil Pengguna</span>
              <span className="sm:hidden">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Keamanan</span>
              <span className="sm:hidden">Keamanan</span>
            </TabsTrigger>
          </TabsList>

          {/* ══ COMPANY PROFILE TAB ══ */}
          {(user?.roles?.includes("company_admin") || user?.roles?.includes("super_admin")) && (
            <TabsContent value="company">
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-zinc-500" />
                  Profil Perusahaan
                </CardTitle>
                <CardDescription>
                  Perbarui informasi perusahaan Anda. Status dan billing cycle dikelola oleh admin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status badges (read-only) */}
                {company && (
                  <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Status: {company.status === "active" ? "Aktif" : company.status ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200/60">
                      Billing Cycle: {billingCycleLabel(company.billing_cycle)}
                    </div>
                    {company.company_code && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-mono font-medium text-zinc-700 ring-1 ring-zinc-200/60">
                        Kode: {company.company_code}
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Company form fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="company-name">Nama Perusahaan</Label>
                    <Input
                      id="company-name"
                      value={companyForm.name}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="PT Contoh Indonesia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-npwp">NPWP</Label>
                    <Input
                      id="company-npwp"
                      value={companyForm.npwp}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, npwp: e.target.value }))
                      }
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-nib">NIB</Label>
                    <Input
                      id="company-nib"
                      value={companyForm.nib}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, nib: e.target.value }))
                      }
                      placeholder="Nomor Induk Berusaha"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="company-address">Alamat</Label>
                    <Textarea
                      id="company-address"
                      value={companyForm.address}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Alamat lengkap perusahaan"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-city">Kota</Label>
                    <Input
                      id="company-city"
                      value={companyForm.city}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="Jakarta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-province">Provinsi</Label>
                    <Input
                      id="company-province"
                      value={companyForm.province}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, province: e.target.value }))
                      }
                      placeholder="DKI Jakarta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-postal">Kode Pos</Label>
                    <Input
                      id="company-postal"
                      value={companyForm.postal_code}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, postal_code: e.target.value }))
                      }
                      placeholder="12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-contact">Contact Person</Label>
                    <Input
                      id="company-contact"
                      value={companyForm.contact_person}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, contact_person: e.target.value }))
                      }
                      placeholder="Nama contact person"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email Perusahaan</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={companyForm.email}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="info@perusahaan.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Telp. Perusahaan</Label>
                    <Input
                      id="company-phone"
                      value={companyForm.phone}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="021-XXXXXXX"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => void handleSaveCompany()}
                    disabled={savingCompany}
                    className="gap-2"
                  >
                    {savingCompany ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {savingCompany ? "Menyimpan…" : "Simpan Perusahaan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* ══ USER PROFILE TAB ══ */}
          {(user?.roles?.includes("company_admin") || user?.roles?.includes("super_admin")) && (
            <TabsContent value="users">
              <CustomerUsersTab />
            </TabsContent>
          )}

          {/* ══ PROFILE TAB ══ */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-zinc-500" />
                  Profil Pengguna
                </CardTitle>
                <CardDescription>
                  Perbarui nama dan telepon Anda. Email tidak dapat diubah.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      value={user?.email ?? ""}
                      disabled
                      className="bg-zinc-50 text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Email tidak dapat diubah dari sini.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Nama Lengkap</Label>
                    <Input
                      id="user-name"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Nama lengkap Anda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-phone">No. Telepon</Label>
                    <Input
                      id="user-phone"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="08XXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => void handleSaveProfile()}
                    disabled={savingProfile}
                    className="gap-2"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {savingProfile ? "Menyimpan…" : "Simpan Profil"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ SECURITY (PASSWORD) TAB ══ */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-zinc-500" />
                  Ubah Password
                </CardTitle>
                <CardDescription>
                  Pastikan password baru minimal 8 karakter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password Baru</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.password}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Minimal 8 karakter"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPasswordConfirmation ? "text" : "password"}
                        value={passwordForm.password_confirmation}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            password_confirmation: e.target.value,
                          }))
                        }
                        placeholder="Ulangi password baru"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      >
                        {showPasswordConfirmation ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => void handleChangePassword()}
                    disabled={savingPassword || !passwordForm.password}
                    className="gap-2"
                  >
                    {savingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    {savingPassword ? "Menyimpan…" : "Ubah Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
