/**
 * Number formatting utilities — Slovak locale (sk-SK).
 * Thousands separator: non-breaking space (U+00A0)
 * Decimal separator: comma
 */

const SK = new Intl.NumberFormat("sk-SK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const SK0 = new Intl.NumberFormat("sk-SK", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a euro amount: "4 327,80 €" */
export function formatEur(value: number): string {
  return SK.format(value) + " €";
}

/** Format a number with 2 decimal places, no currency symbol */
export function formatDec(value: number): string {
  return SK.format(value);
}

/** Format a whole number with thousands separator */
export function formatInt(value: number): string {
  return SK0.format(value);
}
