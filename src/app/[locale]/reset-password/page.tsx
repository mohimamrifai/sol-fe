"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { resetPasswordRequest } from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token || !emailParam) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Tautan Tidak Valid</CardTitle>
          <CardDescription>
            Tautan reset password tidak valid atau informasi email hilang. Silakan minta tautan baru.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => router.push("/forgot-password")}>
            Kembali ke Lupa Password
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest({
        token,
        email: emailParam,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast.success("Password baru berhasil disimpan. Silakan login.");
      router.push("/login");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mereset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl text-center">Atur Ulang Password</CardTitle>
        <CardDescription className="text-center">
          Masukkan password baru Anda untuk mengamankan akun Anda.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password Baru</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
            <Input
              id="confirm_password"
              type="password"
              required
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Ulangi password baru"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Password Baru
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
