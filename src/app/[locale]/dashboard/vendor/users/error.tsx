"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-lg font-semibold text-zinc-900">Vendor user error</h2>
      <p className="text-sm text-zinc-500">{error.message}</p>
      <button onClick={reset} className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50">
        Coba lagi
      </button>
    </div>
  );
}
