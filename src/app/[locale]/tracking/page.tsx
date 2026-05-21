"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { shipmentStatusLabel } from "@/lib/shipment-status";
import { useTranslations } from "next-intl";
import {
  Search,
  Loader2,
  MapPin,
  ArrowRight,
  Calendar,
  Clock,
  Package,
  CheckCircle2,
  Camera,
  X,
} from "lucide-react";
import { Link } from "@/i18n/routing";

type TrackingPhoto = {
  path?: string;
  url?: string;
};

type TrackingData = {
  waybill_number: string;
  status: string;
  origin?: { name?: string; code?: string };
  destination?: { name?: string; code?: string };
  estimated_departure?: string | null;
  estimated_arrival?: string | null;
  timeline?: Array<{
    status: string;
    notes?: string | null;
    location?: string | null;
    tracked_at?: string;
    photos?: TrackingPhoto[];
  }>;
};

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

export default function PublicTrackingPage() {
  const t = useTranslations("Tracking");
  const searchParams = useSearchParams();
  const [cnNumber, setCnNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingData | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const search = async (q?: string) => {
    const wb = (q ?? cnNumber).trim().replace(/^WB-/i, "CN-");
    if (!wb) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiFetch<{ data: TrackingData }>(
        `/tracking?waybill=${encodeURIComponent(wb)}`,
        { method: "GET", token: null }
      );
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("notFound"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const wb = searchParams.get("waybill") || searchParams.get("cn");
    if (wb) {
      const formattedWb = wb.replace(/^WB-/i, "CN-");
      setCnNumber(formattedWb);
      void search(formattedWb);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDate = (d?: string | null) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d;
    }
  };

  const fmtDateTime = (d?: string | null) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b1b69] via-[#0d2280] to-[#162ea8] pb-20 pt-32 md:pb-24 md:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-[100px]" />
          <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-sky-300/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center md:px-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Search className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-indigo-200 sm:text-base">
            {t("subtitle")}
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); void search(); }}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={cnNumber}
                onChange={(e) => setCnNumber(e.target.value)}
                placeholder={t("placeholder")}
                className="h-13 rounded-xl border-0 bg-white pl-12 pr-4 text-sm text-zinc-900 shadow-lg placeholder:text-zinc-400 focus:ring-2 focus:ring-sky-400 sm:h-14 sm:text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !cnNumber.trim()}
              className="h-13 shrink-0 rounded-xl bg-white px-7 text-sm font-semibold text-[#0b1b69] shadow-lg transition-colors hover:bg-zinc-100 sm:h-14 sm:text-base"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("cta")}
            </Button>
          </form>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl px-6 md:mt-10 md:px-12">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/50">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-5 md:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("waybillLabel")}</p>
                  <p className="mt-1 font-mono text-xl font-bold tracking-tight text-zinc-900">
                    {data.waybill_number.replace(/^WB-/i, "CN-")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0b1b69]/10 px-4 py-2 text-sm font-semibold text-[#0b1b69]">
                  <CheckCircle2 className="h-4 w-4" />
                  {shipmentStatusLabel(data.status)}
                </div>
              </div>
            </div>

            <div className="px-6 py-6 md:px-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("origin")}</p>
                    <p className="mt-1 font-medium text-zinc-900">{data.origin?.name ?? "—"}</p>
                    {data.origin?.code && <p className="text-xs text-zinc-500">{data.origin.code}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("destination")}</p>
                    <p className="mt-1 font-medium text-zinc-900">{data.destination?.name ?? "—"}</p>
                    {data.destination?.code && <p className="text-xs text-zinc-500">{data.destination.code}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("estDeparture")}</p>
                    <p className="mt-1 font-medium text-zinc-900">{fmtDate(data.estimated_departure)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("estArrival")}</p>
                    <p className="mt-1 font-medium text-zinc-900">{fmtDate(data.estimated_arrival)}</p>
                  </div>
                </div>
              </div>

              {(data.timeline ?? []).length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    {t("timeline")}
                  </h3>
                  <div className="relative space-y-0 pl-6">
                    <div className="absolute top-2 bottom-2 left-[9px] w-px bg-zinc-200" />
                    {(data.timeline ?? []).map((entry, i) => {
                      const photos = Array.isArray(entry.photos) ? entry.photos : [];
                      return (
                        <div key={i} className="relative pb-6 last:pb-0">
                          <div className="absolute -left-6 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#0b1b69] shadow-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>
                          <div className="ml-2">
                            <p className="text-sm font-semibold text-zinc-900">
                              {shipmentStatusLabel(entry.status)}
                            </p>
                            {entry.location && (
                              <p className="mt-0.5 text-xs text-zinc-500">{entry.location}</p>
                            )}
                            {entry.notes && (
                              <p className="mt-1 text-xs text-zinc-500">{entry.notes}</p>
                            )}
                            {entry.tracked_at && (
                              <p className="mt-1 text-xs text-zinc-400">{fmtDateTime(entry.tracked_at)}</p>
                            )}

                            {/* ── Photos ── */}
                            {photos.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                {photos.map((photo, idx) => {
                                  const imgUrl = photo.url || photo.path || "";
                                  if (!imgUrl) return null;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      className="group relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm transition-all hover:border-zinc-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0b1b69]/30"
                                      onClick={() => setLightboxSrc(imgUrl)}
                                    >
                                      <Image
                                        src={imgUrl}
                                        alt={`Foto ${idx + 1}`}
                                        width={80}
                                        height={80}
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {!data && !error && !loading && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-10 text-center shadow-lg shadow-zinc-200/50">
            <Package className="mx-auto h-12 w-12 text-zinc-200" />
            <p className="mt-4 text-sm text-zinc-500">{t("emptyState")}</p>
            <Link
              href="/estimasi"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0b1b69] transition-colors hover:text-[#0d2280]"
            >
              {t("goEstimate")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="h-16" />
      </div>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <PhotoLightbox
          src={lightboxSrc}
          alt="Tracking photo"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
