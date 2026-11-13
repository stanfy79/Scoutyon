export function formatCurrency(
  amount: number,
  currency = 'USD',
  decimals = 2,
): string {
  if (isNaN(amount)) return '$0.00';

  const curr = currency.toUpperCase();

  // Handle common fiat and crypto codes safely
  try {
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'].includes(curr)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    }
  } catch {
    // fallback
  }

  return `${amount.toFixed(decimals)} ${curr}`;
}
