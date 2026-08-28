// Pure calendar-date helpers (YYYY-MM-DD strings, UTC arithmetic so there is no tz drift).
// Auto-imported across app and server.

const DAY_MS = 86_400_000

export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!) + days * DAY_MS).toISOString().slice(0, 10)
}

export function eachDay(startStr: string, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => addDaysStr(startStr, i))
}

export function todayStr(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Today's calendar date (YYYY-MM-DD) in the given IANA timezone. */
export function todayInTz(timezone: string, now: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  }
  catch {
    return todayStr(now)
  }
}

/**
 * How long until the calendar date changes in `timezone` — how long a clock may sleep before
 * "today" stops being true. Wall-clock arithmetic, so the two days a year a DST shift makes
 * the day 23 or 25 hours long it comes out an hour off; the caller re-reads the date when it
 * fires and waits again if the day has not actually turned, which absorbs that.
 *
 * An unknown timezone falls back to the machine's own clock, as `todayInTz` does, so the two
 * never end up answering about different midnights.
 */
export function msUntilNextDay(timezone: string, now: Date = new Date()): number {
  let [hour, minute, second] = [now.getHours(), now.getMinutes(), now.getSeconds()]
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(now)
    const at = (type: string) => Number(parts.find(p => p.type === type)?.value)
    const [h, m, sec] = [at('hour'), at('minute'), at('second')]
    if (Number.isFinite(h) && Number.isFinite(m) && Number.isFinite(sec)) [hour, minute, second] = [h, m, sec]
  }
  catch { /* not a timezone this runtime knows */ }
  return DAY_MS - (((hour * 60 + minute) * 60 + second) * 1000 + now.getMilliseconds())
}

/**
 * A day that has already gone. The planner refuses to put a task there — you cannot plan
 * into the past — so this is the one rule the composer, drops, "Move to…", convert, and the
 * task endpoints all share. ISO dates compare correctly as strings.
 */
export function isPastDate(dateStr: string, today: string): boolean {
  return dateStr < today
}

/** Start-of-week for the date, given the user's week-start (0 = Sunday, 1 = Monday). */
export function startOfWeekStr(dateStr: string, weekStartsOn: 0 | 1): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
  const diff = (dow - weekStartsOn + 7) % 7
  return addDaysStr(dateStr, -diff)
}
