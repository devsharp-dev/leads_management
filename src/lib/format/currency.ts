const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Format whole-rupee amounts as Indian Rupees. */
export function formatINR(amount: number): string {
  return inr.format(Math.round(amount))
}

export function formatINRCompact(amount: number): string {
  return inrCompact.format(Math.round(amount))
}
