"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  fetchAdminRoles,
  fetchAdminPermissions,
  updateAdminRolePermissions,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { ShieldCheck, Loader2, Save } from "lucide-react";

type Role = {
  id: number;
  name: string;
  permissions: { name: string }[];
};

type Permission = {
  id: number;
  name: string;
};

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  // Local state for permissions per role to handle toggles before saving
  const [rolePerms, setRolePerms] = useState<Record<number, string[]>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetchAdminRoles(),
        fetchAdminPermissions(),
      ]);
      
      const rolesData = rolesRes.data as Role[];
      setRoles(rolesData);
      setPermissions(permsRes.data as Permission[]);

      // Map roles to their permission names
      const mapping: Record<number, string[]> = {};
      rolesData.forEach(r => {
        mapping[r.id] = r.permissions.map(p => p.name);
      });
      setRolePerms(mapping);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat data role.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const togglePermission = (roleId: number, permName: string) => {
    setRolePerms(prev => {
      const current = prev[roleId] || [];
      const updated = current.includes(permName)
        ? current.filter(p => p !== permName)
        : [...current, permName];
      return { ...prev, [roleId]: updated };
    });
  };

  const handleSave = async (roleId: number) => {
    setSaving(roleId);
    try {
      await updateAdminRolePermissions(roleId, rolePerms[roleId] || []);
      toast.success("Hak akses role berhasil diperbarui.");
      await loadData(); // Refresh to sync with server
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(null);
    }
  };

  // Group permissions for better UI
  const groupedPerms = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach(p => {
      const parts = p.name.split('_');
      const category = parts.length > 1 ? parts.slice(1).join(' ') : 'Lainnya';
      const key = category.charAt(0).toUpperCase() + category.slice(1);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [permissions]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Manajemen Hak Akses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola izin dan fitur untuk setiap peran pengguna di platform.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold uppercase tracking-wider">
                  {role.name.replace(/_/g, ' ')}
                </CardTitle>
                <CardDescription>
                  Tentukan fitur apa saja yang dapat diakses oleh {role.name}.
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={() => void handleSave(role.id)}
                disabled={saving === role.id}
                className="gap-2"
              >
                {saving === role.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Perubahan
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedPerms).map(([group, perms]) => (
                  <div key={group} className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-1">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {perms.map(p => (
                        <div key={p.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`role-${role.id}-perm-${p.id}`}
                            checked={rolePerms[role.id]?.includes(p.name)}
                            onCheckedChange={() => togglePermission(role.id, p.name)}
                          />
                          <label
                            htmlFor={`role-${role.id}-perm-${p.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {p.name.split('_')[0].charAt(0).toUpperCase() + p.name.split('_')[0].slice(1)} {group.toLowerCase()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
