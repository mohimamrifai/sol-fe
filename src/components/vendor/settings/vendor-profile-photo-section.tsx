"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Trash2, Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDeleteVendorProfilePhoto, useUploadVendorProfilePhoto, useVendorMyProfile } from "@/hooks/use-vendor-my-profile";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

export function VendorProfilePhotoSection() {
  const t = useTranslations("Vendor.settings.sections");
  const { data } = useVendorMyProfile();
  const upload = useUploadVendorProfilePhoto();
  const remove = useDeleteVendorProfilePhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);

  const user = data?.data;
  const photoUrl = user?.profile_photo_url ?? null;
  const src = photoUrl ? `${photoUrl}${photoUrl.includes("?") ? "&" : "?"}v=${version}` : null;
  const initials = (user?.name ?? "?").substring(0, 2).toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5 MB).");
      return;
    }
    try {
      await upload.mutateAsync(file);
      setVersion(Date.now());
      toast.success("Foto profil berhasil diperbarui.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    try {
      await remove.mutateAsync();
      setVersion(Date.now());
      toast.success("Foto profil berhasil dihapus.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menghapus foto.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-zinc-600" />
          {t("userInfo")}
        </CardTitle>
        <CardDescription className="text-xs">Upload foto profil (JPG/PNG, max 5 MB).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20" key={src ?? "empty"}>
            {src ? <AvatarImage src={src} alt={user?.name ?? ""} /> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={(e) => void handleFile(e)} className="hidden" />
            <Button type="button" variant="outline" size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()} className="h-9 gap-2">
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {upload.isPending ? "Mengunggah…" : "Upload Foto"}
            </Button>
            {photoUrl && (
              <Button type="button" variant="ghost" size="sm" disabled={remove.isPending} onClick={() => void handleRemove()} className="h-9 gap-2 text-red-600 hover:text-red-700">
                {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
