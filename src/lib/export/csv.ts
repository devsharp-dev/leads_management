export function toCsv(
  rows: Record<string, string | number | boolean | null | undefined>[],
  columns?: string[],
): string {
  if (rows.length === 0) {
    return columns?.length ? `${columns.join(',')}\n` : ''
  }
  const headers = columns ?? Object.keys(rows[0]!)
  const escape = (value: string | number | boolean | null | undefined) => {
    const raw = value == null ? '' : String(value)
    if (/[",\n\r]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`
    }
    return raw
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]
  return `${lines.join('\n')}\n`
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
