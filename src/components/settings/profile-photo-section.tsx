"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { User, Camera, Trash2, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApiError } from "@/lib/api-client";
import { useUploadProfilePhoto, useDeleteProfilePhoto } from "@/hooks/use-customer-my-profile";
import type { AuthUser } from "@/lib/auth-api";

interface UploadPhotoResponse {
  data?: { profile_photo_url?: string };
}

export function ProfilePhotoSection() {
  const t = useTranslations("Profile");
  const { user, setUser } = useAuthStore();
  const upload = useUploadProfilePhoto();
  const remove = useDeleteProfilePhoto();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const photoUrl = user?.profile_photo_url ?? user?.profile_photo_path ?? null;

  // Bump version on every update so <AvatarImage> refetches the binary,
  // even when the same URL is returned (browser would otherwise 304-cache it).
  const [photoVersion, setPhotoVersion] = React.useState(0);
  const cachedSrc = photoUrl
    ? photoUrl + (photoUrl.includes("?") ? "&" : "?") + "v=" + photoVersion
    : null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large (max 2 MB).");
      return;
    }
    try {
      const res = await upload.mutateAsync(file);
      const url = (res as UploadPhotoResponse | undefined)?.data?.profile_photo_url ?? photoUrl;
      if (user) {
        const next: AuthUser = { ...user, profile_photo_url: url ?? null };
        setUser(next);
        setPhotoVersion(Date.now());
      }
      toast.success("Photo uploaded.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    try {
      await remove.mutateAsync();
      if (user) {
        const next: AuthUser = { ...user, profile_photo_url: null, profile_photo_path: null };
        setUser(next);
        setPhotoVersion(Date.now());
      }
      toast.success("Photo removed.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed.");
    }
  };

  const initials = (user?.name ?? "?").substring(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <User className="h-4 w-4 text-zinc-600" />
          {t("photo.title")}
        </CardTitle>
        <CardDescription className="text-xs">{t("photo.hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20" key={cachedSrc ?? "empty"}>
            {cachedSrc ? <AvatarImage src={cachedSrc} alt={user?.name ?? ""} /> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => void handleFile(e)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
              className="h-9 gap-2"
            >
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {upload.isPending ? t("photo.uploading") : t("photo.upload")}
            </Button>
            {photoUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => void handleRemove()}
                className="h-9 gap-2 text-red-600 hover:text-red-700"
              >
                {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {t("photo.remove")}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
