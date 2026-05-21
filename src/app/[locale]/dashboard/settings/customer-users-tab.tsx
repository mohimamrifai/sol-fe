"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Users, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { apiFetch, ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store";
import { customerStatusLabelFromApi, customerStatusBadgeClass } from "@/lib/customer-status";

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  roles?: { name: string }[];
}

export function CustomerUsersTab() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "ops_pic",
    password: "",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: UserData[] }>("/customer/users", { method: "GET" });
      setUsers(res.data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat pengguna.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setShowPassword(false);
    setForm({ name: "", email: "", phone: "", role: "ops_pic", password: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (u: UserData) => {
    setEditingId(u.id);
    setShowPassword(false);
    const roleName = u.roles?.[0]?.name ?? "ops_pic";
    setForm({ name: u.name, email: u.email, phone: u.phone ?? "", role: roleName, password: "" });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun ini?")) return;
    try {
      await apiFetch(`/customer/users/${id}`, { method: "DELETE" });
      toast.success("Akun berhasil dihapus.");
      void loadUsers();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus akun.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/customer/users/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        toast.success("Akun berhasil diperbarui.");
      } else {
        await apiFetch("/customer/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Akun berhasil ditambahkan.");
      }
      setDialogOpen(false);
      void loadUsers();
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Gagal menyimpan akun.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: UserData, checked: boolean) => {
    if (currentUser?.id === user.id) {
      toast.error("Anda tidak dapat mengubah status akun Anda sendiri.");
      return;
    }
    const newStatus = checked ? "active" : "inactive";
    try {
      await apiFetch(`/customer/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Status akun ${user.name} berhasil diubah.`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengubah status akun.");
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "company_admin": return "Admin Perusahaan";
      case "ops_pic": return "PIC Operasional";
      case "finance_pic": return "PIC Keuangan";
      default: return role;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-500" />
            Manajemen Pengguna
          </CardTitle>
          <CardDescription>
            Kelola akun tim operasional (PIC) dan keuangan (Finance) di perusahaan Anda.
          </CardDescription>
        </div>
        <Button onClick={handleOpenAdd} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tambah Akun</span>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada pengguna.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback>
                              {u.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {roleLabel(u.roles?.[0]?.name ?? "")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            size="sm"
                            checked={u.status === "active"}
                            onCheckedChange={(checked) => void handleToggleStatus(u, checked)}
                            disabled={currentUser?.id === u.id}
                          />
                          <Badge variant="outline" className={customerStatusBadgeClass(u.status)}>
                            {customerStatusLabelFromApi(u.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {currentUser?.id !== u.id && (
                            <Button variant="ghost" size="icon-sm" className="text-red-600 hover:text-red-700" onClick={() => void handleDelete(u.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Akun" : "Tambah Akun"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Perbarui detail akun tim Anda." : "Tambahkan anggota tim untuk mengakses portal ini."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama pengguna" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@perusahaan.com" />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Peran (Role)</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue>
                    {form.role ? roleLabel(form.role) : "Pilih peran..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin">Admin Perusahaan</SelectItem>
                  <SelectItem value="ops_pic">PIC Operasional</SelectItem>
                  <SelectItem value="finance_pic">PIC Keuangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Password {editingId && <span className="text-xs text-muted-foreground font-normal">(Kosongkan jika tidak ingin diubah)</span>}</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
