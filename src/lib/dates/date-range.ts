import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns'
import type { DatePreset, DateRange } from '../../types/domain'

export function parseDate(value: string | Date): Date {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(date)) {
    throw new Error(`Invalid date: ${String(value)}`)
  }
  return date
}

export function isWithinRange(
  value: string | Date | undefined | null,
  range: Pick<DateRange, 'start' | 'end'>,
): boolean {
  if (!value) return false
  const date = parseDate(value)
  return date >= range.start && date <= range.end
}

export function buildPresetRange(
  preset: Exclude<DatePreset, 'custom'>,
  now: Date = new Date(),
): DateRange {
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  if (preset === 'today') {
    return {
      start: todayStart,
      end: todayEnd,
      preset,
      label: format(todayStart, 'MMM d, yyyy'),
    }
  }

  const days = preset === 'last_7' ? 7 : 30
  const start = startOfDay(subDays(todayStart, days - 1))
  return {
    start,
    end: todayEnd,
    preset,
    label: `${format(start, 'MMM d, yyyy')} – ${format(todayStart, 'MMM d, yyyy')}`,
  }
}

export function buildCustomRange(
  startInput: string | Date,
  endInput: string | Date,
): DateRange {
  const start = startOfDay(parseDate(startInput))
  const end = endOfDay(parseDate(endInput))
  if (end < start) {
    throw new Error('End date must be on or after start date')
  }
  return {
    start,
    end,
    preset: 'custom',
    label: `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`,
  }
}

/** Immediately preceding window of the same calendar-day length. */
export function previousPeriod(range: Pick<DateRange, 'start' | 'end'>): {
  start: Date
  end: Date
  label: string
} {
  const days = differenceInCalendarDays(range.end, range.start) + 1
  const prevEnd = endOfDay(subDays(startOfDay(range.start), 1))
  const prevStart = startOfDay(subDays(startOfDay(range.start), days))
  return {
    start: prevStart,
    end: prevEnd,
    label: `${format(prevStart, 'MMM d, yyyy')} – ${format(prevEnd, 'MMM d, yyyy')}`,
  }
}

export function eachCalendarDay(range: Pick<DateRange, 'start' | 'end'>): Date[] {
  const days: Date[] = []
  const total = differenceInCalendarDays(range.end, range.start) + 1
  for (let i = 0; i < total; i += 1) {
    days.push(startOfDay(addDays(startOfDay(range.start), i)))
  }
  return days
}

export function toDateKey(value: string | Date): string {
  return format(startOfDay(parseDate(value)), 'yyyy-MM-dd')
}

export function formatShortDate(value: string | Date): string {
  return format(parseDate(value), 'MMM d, yyyy')
}

export function formatDateTime(value: string | Date): string {
  return format(parseDate(value), 'MMM d, yyyy HH:mm')
}
