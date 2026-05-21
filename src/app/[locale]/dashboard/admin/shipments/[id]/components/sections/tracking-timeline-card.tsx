"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X } from "lucide-react";
import Image from "next/image";

interface TrackingPhoto {
  id?: number | string;
  path?: string;
  url?: string;
}

interface TrackingEntry {
  id: number | string;
  status: string;
  tracked_at?: string;
  notes?: string;
  location?: string;
  photos?: TrackingPhoto[];
}

interface TrackingTimelineCardProps {
  trackings: TrackingEntry[];
}

function PhotoLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/40"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={900}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        unoptimized
      />
    </div>
  );
}

export function TrackingTimelineCard({ trackings }: TrackingTimelineCardProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fmtDateTime = (d?: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Timeline tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trackings.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Belum ada entri tracking.</p>
          ) : (
            <div className="relative border-l-2 border-zinc-100 ml-2 pl-4 space-y-4">
              {trackings.map((t) => {
                const photos = Array.isArray(t.photos) ? t.photos : [];
                return (
                  <div key={String(t.id)} className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-300 ring-4 ring-white" />
                    <div className="font-semibold text-sm">{String(t.status ?? "")}</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">
                      {t.tracked_at ? fmtDateTime(String(t.tracked_at)) : ""}
                      {t.location ? ` — ${String(t.location)}` : ""}
                      {t.notes ? ` — ${String(t.notes)}` : ""}
                    </div>

                    {/* ── Photos grid ── */}
                    {photos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {photos.map((photo, idx) => {
                          const imgUrl = photo.url || photo.path || "";
                          if (!imgUrl) return null;
                          return (
                            <button
                              key={photo.id ?? idx}
                              type="button"
                              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-sm transition-all hover:border-zinc-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                              onClick={() => setLightboxSrc(imgUrl)}
                            >
                              <Image
                                src={imgUrl}
                                alt={`Tracking foto ${idx + 1}`}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                loading="lazy"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                                <Camera className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <PhotoLightbox
          src={lightboxSrc}
          alt="Tracking photo"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
