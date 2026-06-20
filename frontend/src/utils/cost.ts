/**
 * Calculates the estimated cost using the app convention of an 8-hour day.
 */
export function calculateEstimatedCost(hours: number | string, dailyRate: number | string): number {
  return (Number(hours) * Number(dailyRate)) / 8
}

/**
 * Formats an estimated cost for display beside timesheet totals.
 */
export function formatEstimatedCost(hours: number | string, dailyRate: number | string): string {
  return `£${calculateEstimatedCost(hours, dailyRate).toFixed(2)} est.`
}
