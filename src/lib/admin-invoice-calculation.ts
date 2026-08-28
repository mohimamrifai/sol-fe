export type AdminInvoiceCalculationItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function isDiscountLine(item: AdminInvoiceCalculationItem): boolean {
  const amount = roundCurrency(Math.trunc(item.quantity) * item.unit_price);
  return amount < 0 || item.description.toLowerCase().includes("discount");
}

export function calculateAdminInvoiceTotals(
  items: AdminInvoiceCalculationItem[],
  taxRate: number
) {
  let subtotal = 0;
  let discount = 0;

  for (const item of items) {
    const amount = roundCurrency(Math.trunc(item.quantity) * item.unit_price);
    if (amount < 0 || item.description.toLowerCase().includes("discount")) {
      discount += Math.abs(amount);
    } else {
      subtotal += amount;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const ppn = roundCurrency(taxableAmount * Math.max(0, taxRate));

  return {
    subtotal: roundCurrency(subtotal),
    discount: roundCurrency(discount),
    taxableAmount: roundCurrency(taxableAmount),
    ppn,
    grandTotal: roundCurrency(taxableAmount + ppn),
  };
}

export function withDiscountLine(
  items: AdminInvoiceCalculationItem[],
  discount: number
): AdminInvoiceCalculationItem[] {
  const normalItems = items.filter((item) => !isDiscountLine(item));
  const safeDiscount = Math.max(0, roundCurrency(discount));

  if (safeDiscount === 0) return normalItems;

  return [
    ...normalItems,
    {
      description: "Discount",
      quantity: 1,
      unit_price: -safeDiscount,
    },
  ];
}
