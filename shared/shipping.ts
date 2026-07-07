export const ALLOWED_COUNTRIES = ['BE', 'FR', 'NL', 'DE', 'ES', 'IT', 'LU'] as const;
export type AllowedCountry = typeof ALLOWED_COUNTRIES[number];

export const FREE_SHIPPING_THRESHOLD = 100;
export const FREE_SHIPPING_AMOUNT = 0;

const SHIPPING_RATES: Record<string, number> = {
  FR: 12.90,
  BE: 12.90,
  NL: 19.90,
  DE: 19.90,
  ES: 19.90,
  IT: 19.90,
  LU: 19.90,
};

export function calculateShipping(subtotal: number, country: string): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return FREE_SHIPPING_AMOUNT;
  const rate = SHIPPING_RATES[country];
  if (rate === undefined) {
    return 29.90;
  }
  return rate;
}

export function isAllowedCountry(country: string): boolean {
  return (ALLOWED_COUNTRIES as readonly string[]).includes(country);
}
