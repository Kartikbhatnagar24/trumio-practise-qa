export const COUPONS: Record<string, number> = { SAVE10: 0.1 };
export const FREE_SHIPPING_FROM = 50;
export const SHIPPING_FEE = 4.99;

const round = (value: number) => Math.round(value * 100) / 100;

export function computeTotals(lines: { price: number; quantity: number }[], coupon: string | null) {
  const subtotal = round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));
  const discount = round(subtotal * (COUPONS[coupon ?? ''] ?? 0));
  const shipping = subtotal === 0 || subtotal - discount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  return { subtotal, discount, shipping, total: round(subtotal - discount + shipping) };
}

export const formatPrice = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
