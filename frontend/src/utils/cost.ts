/**
 * Calculates the estimated cost using the app convention of an 8-hour day.
 */
export function calculateEstimatedCost(hours: number | string, dailyRate: number | string): number {
  return (Number(hours) * Number(dailyRate)) / 8
}

/**
 * Formats a currency amount as pounds with 2 decimals.
 */
export function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`
}

/**
 * Formats a numeric estimated cost value with the est. suffix.
 */
export function formatEstimatedCostValue(value: number): string {
  return `${formatCurrency(value)} est.`
}

/**
 * Formats an estimated cost for display beside timesheet totals.
 */
export function formatEstimatedCost(hours: number | string, dailyRate: number | string): string {
  return formatEstimatedCostValue(calculateEstimatedCost(hours, dailyRate))
}
