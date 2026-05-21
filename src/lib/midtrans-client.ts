/**
 * Midtrans Snap in browser — requires NEXT_PUBLIC_MIDTRANS_CLIENT_KEY and snap.js URL (sandbox/prod).
 */

type SnapWindow = Window & {
  snap?: { pay: (token: string, options?: Record<string, unknown>) => void };
};

export function getMidtransClientKey(): string {
  return process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ?? "";
}

export function getMidtransSnapScriptUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL?.trim() ||
    "https://app.sandbox.midtrans.com/snap/snap.js"
  );
}

let snapLoadPromise: Promise<void> | null = null;

export function ensureMidtransSnapLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const w = window as SnapWindow;
  if (w.snap?.pay) return Promise.resolve();
  const key = getMidtransClientKey();
  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum di-set."));
  }
  if (!snapLoadPromise) {
    snapLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-sol-midtrans]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Midtrans script error")));
        return;
      }
      const s = document.createElement("script");
      s.src = getMidtransSnapScriptUrl();
      s.async = true;
      s.setAttribute("data-sol-midtrans", "1");
      s.setAttribute("data-client-key", key);
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Gagal memuat Midtrans Snap."));
      document.body.appendChild(s);
    });
  }
  return snapLoadPromise;
}

export function openMidtransSnap(
  token: string,
  options?: { onSuccess?: () => void; onPending?: () => void; onError?: () => void; onClose?: () => void }
): void {
  const w = window as SnapWindow;
  if (!w.snap?.pay) {
    throw new Error("Midtrans Snap belum siap.");
  }
  w.snap.pay(token, {
    onSuccess: options?.onSuccess,
    onPending: options?.onPending,
    onError: options?.onError,
    onClose: options?.onClose,
  });
}
