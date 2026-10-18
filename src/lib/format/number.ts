const numberFmt = new Intl.NumberFormat('en-IN')
const percentFmt = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function formatNumber(value: number): string {
  return numberFmt.format(value)
}

export function formatPercent(value: number, digits = 1): string {
  return `${percentFmt.format(Number(value.toFixed(digits)))}%`
}

export interface ComparisonDisplay {
  label: string
  direction: 'up' | 'down' | 'flat' | 'new'
  absolute: number
  percent: number | null
}

/**
 * Percentage change: (current - previous) / previous * 100.
 * When previous is 0, returns "New" (if current > 0) or "---".
 */
export function compareValues(
  current: number,
  previous: number,
): ComparisonDisplay {
  const absolute = current - previous
  if (previous === 0) {
    if (current === 0) {
      return { label: '---', direction: 'flat', absolute, percent: null }
    }
    return { label: 'New', direction: 'new', absolute, percent: null }
  }
  const percent = (absolute / previous) * 100
  const direction = percent > 0.05 ? 'up' : percent < -0.05 ? 'down' : 'flat'
  const sign = percent > 0 ? '+' : ''
  return {
    label: `${sign}${percent.toFixed(1)}%`,
    direction,
    absolute,
    percent,
  }
}

/** Percentage-point change between two rates (0–100 scale). */
export function compareRatePoints(
  currentRate: number,
  previousRate: number,
): ComparisonDisplay {
  const absolute = currentRate - previousRate
  if (!Number.isFinite(previousRate) && !Number.isFinite(currentRate)) {
    return { label: '---', direction: 'flat', absolute: 0, percent: null }
  }
  const direction = absolute > 0.05 ? 'up' : absolute < -0.05 ? 'down' : 'flat'
  const sign = absolute > 0 ? '+' : ''
  return {
    label: `${sign}${absolute.toFixed(1)} pp`,
    direction,
    absolute,
    percent: absolute,
  }
}

export function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return (numerator / denominator) * 100
}
