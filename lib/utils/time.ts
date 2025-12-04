/**
 * Formats milliseconds into human-readable time string
 * @param ms - Time in milliseconds
 * @returns Formatted time string (e.g., "1m 30s")
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return "< 1s"

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Calculates progress percentage
 * @param current - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}
