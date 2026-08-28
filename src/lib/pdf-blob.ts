export function normalizePdfBlob(blob: Blob): Blob {
  if (blob.type === "application/pdf") {
    return blob;
  }

  return new Blob([blob], { type: "application/pdf" });
}

export function viewPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(normalizePdfBlob(blob));
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function printPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(normalizePdfBlob(blob));
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked");
  }

  printWindow.addEventListener("load", () => {
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  });

  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
