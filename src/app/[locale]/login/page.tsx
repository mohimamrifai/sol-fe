"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLoginSchema, type LoginSchema } from "@/lib/validations/auth";
import { useAuthStore } from "@/lib/store";
import { loginRequest } from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const t = useTranslations("Login");
  const { setSession } = useAuthStore();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(createLoginSchema((key) => t(key))),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: LoginSchema) => {
    setFormError(null);
    try {
      const res = await loginRequest(data.email, data.password);
      setSession(res.data.token, res.data.user);
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as { message?: string; errors?: Record<string, string[]> } | undefined;
        setFormError(
          body?.message ?? (typeof e.message === "string" ? e.message : "Login gagal.")
        );
        return;
      }
      setFormError("Tidak dapat terhubung ke server. Periksa NEXT_PUBLIC_API_URL dan server Laravel.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50 p-4 font-sans pt-28 pb-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-zinc-200/50 sm:p-10 border border-zinc-100">
        <div className="mb-8 flex flex-col items-center space-y-3 text-center">
          <BrandLogo size="lg" />
          <p className="text-sm font-medium text-zinc-500">
            Logistik Multimoda, Transparan & Berkelanjutan
          </p>
        </div>

        <div className="mb-8 space-y-1.5 text-center">
          <h2 className="text-lg font-bold text-zinc-900">{t("welcome")}</h2>
          <p className="text-sm text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
            {t("welcomeSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder=""
              className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[10px] font-medium text-red-500 ml-1">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("password")}</Label>
              <Link href="/forgot-password" title={t("forgotPassword")} className="text-xs font-medium text-zinc-500 hover:text-black hover:underline transition-colors">
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 pr-9 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:border-transparent focus-visible:bg-white text-sm ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] font-medium text-red-500 ml-1">{errors.password.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-black text-sm font-bold text-white hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Loading..." : t("login")}
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-zinc-200"></div>
            <span className="mx-4 shrink text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{t("or")}</span>
            <div className="grow border-t border-zinc-200"></div>
          </div>

          <div className="space-y-3 pt-0 text-center">
            <p className="text-xs text-zinc-500">{t("noAccount")}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/register")}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-transparent text-sm font-bold text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
            >
              {t("register")}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-12 flex flex-col items-center space-y-3 text-center">
        <BrandLogo size="sm" />
        <p className="text-xs font-medium text-zinc-400">
          ©2026 PT IDNVerse Karya Nusantara
        </p>
      </div>
    </div>
  );
}
