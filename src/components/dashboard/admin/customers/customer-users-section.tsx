"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { createAdminUser, updateAdminUser } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const CUSTOMER_ROLES = [
  { value: "company_admin", label: "Company Admin" },
  { value: "ops_pic", label: "Ops PIC" },
  { value: "finance_pic", label: "Finance PIC" },
  { value: "viewer", label: "Viewer" },
];

type Props = {
  companyId: number;
  users: Record<string, unknown>[];
  canManage: boolean;
  onRefresh: () => void;
};

export function CustomerUsersSection({ companyId, users, canManage, onRefresh }: Props) {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("company_admin");
  const [status, setStatus] = useState("active");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEditId(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("company_admin");
    setStatus("active");
    setPassword("");
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (user: Record<string, unknown>) => {
    setEditId(Number(user.id));
    setName(String(user.name ?? ""));
    setEmail(String(user.email ?? ""));
    setPhone(String(user.phone ?? ""));
    const roles = user.roles as { name?: string }[] | undefined;
    setRole(roles?.[0]?.name ?? "company_admin");
    setStatus(String(user.status ?? "active"));
    setPassword("");
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editId) {
        await updateAdminUser(editId, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          role,
          status,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
        toast.success(t("users.updated"));
      } else {
        await createAdminUser({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          password: password.trim(),
          user_type: "customer",
          company_id: companyId,
          role,
          status,
        });
        toast.success(t("users.created"));
      }
      setOpen(false);
      reset();
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("users.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: Record<string, unknown>) => {
    const uid = Number(user.id);
    const next = String(user.status) === "active" ? "inactive" : "active";
    try {
      await updateAdminUser(uid, { status: next });
      toast.success(t("users.statusUpdated"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("users.statusFailed"));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("users.description")}</p>
        {canManage ? (
          <Button size="sm" onClick={openCreate}>
            {t("users.addUser")}
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.name")}</TableHead>
              <TableHead>{t("users.email")}</TableHead>
              <TableHead>{t("users.role")}</TableHead>
              <TableHead>{tc("table.status")}</TableHead>
              {canManage ? <TableHead className="text-right">{t("users.action")}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-muted-foreground">
                  {t("users.empty")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={String(user.id)}>
                  <TableCell className="font-medium">{String(user.name ?? "—")}</TableCell>
                  <TableCell>{String(user.email ?? "—")}</TableCell>
                  <TableCell>
                    {((user.roles as { name?: string }[]) ?? []).map((r) => r.name).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{String(user.status ?? "—")}</Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                        {tc("actions.edit")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void toggleStatus(user)}>
                        {String(user.status) === "active" ? t("users.deactivate") : t("users.activate")}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? t("users.editUser") : t("users.addUser")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t("users.name")}</Label>
              <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.email")}</Label>
              <Input className="h-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.mobile")}</Label>
              <Input className="h-9" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.role")}</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editId ? t("users.passwordNew") : t("users.passwordTemp")}</Label>
              <Input className="h-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc("actions.cancel")}</Button>
            <Button disabled={saving || !name.trim() || !email.trim() || (!editId && password.length < 8)} onClick={() => void save()}>
              {saving ? tc("actions.saving") : tc("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
