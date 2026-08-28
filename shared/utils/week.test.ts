import { describe, expect, it } from 'vitest'
import { addDaysStr, eachDay, isPastDate, msUntilNextDay, startOfWeekStr, todayInTz, todayStr } from './week'

describe('addDaysStr', () => {
  it('moves forward and back across a month boundary', () => {
    expect(addDaysStr('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDaysStr('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('handles a leap day', () => {
    expect(addDaysStr('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('eachDay', () => {
  it('returns seven consecutive dates', () => {
    expect(eachDay('2026-08-17')).toEqual([
      '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20',
      '2026-08-21', '2026-08-22', '2026-08-23',
    ])
  })
})

describe('startOfWeekStr', () => {
  it('honours the week-start setting', () => {
    // 2026-08-19 is a Wednesday.
    expect(startOfWeekStr('2026-08-19', 1)).toBe('2026-08-17')
    expect(startOfWeekStr('2026-08-19', 0)).toBe('2026-08-16')
  })
})

describe('isPastDate', () => {
  it('is false for today and every day after it', () => {
    expect(isPastDate('2026-08-19', '2026-08-19')).toBe(false)
    expect(isPastDate('2026-08-20', '2026-08-19')).toBe(false)
    expect(isPastDate('2027-01-01', '2026-08-19')).toBe(false)
  })

  it('is true for yesterday and earlier, across month and year ends', () => {
    expect(isPastDate('2026-08-18', '2026-08-19')).toBe(true)
    expect(isPastDate('2026-07-31', '2026-08-01')).toBe(true)
    expect(isPastDate('2025-12-31', '2026-01-01')).toBe(true)
  })
})

describe('todayInTz', () => {
  // 21:30 UTC — late evening in London, already tomorrow in Tokyo, still afternoon in New York.
  const at = new Date('2026-08-19T21:30:00Z')

  it('reads the date off the given zone, not the machine', () => {
    expect(todayInTz('UTC', at)).toBe('2026-08-19')
    expect(todayInTz('Asia/Tokyo', at)).toBe('2026-08-20')
    expect(todayInTz('America/New_York', at)).toBe('2026-08-19')
  })

  it('falls back to the machine clock for a zone it does not know', () => {
    expect(todayInTz('Middle/Earth', at)).toBe(todayStr(at))
  })
})

describe('msUntilNextDay', () => {
  const at = new Date('2026-08-19T21:30:00Z')

  it('measures to midnight in the given zone', () => {
    expect(msUntilNextDay('UTC', at)).toBe(2.5 * 3600_000)
    // +02:00 in August: 23:30 already.
    expect(msUntilNextDay('Europe/Berlin', at)).toBe(0.5 * 3600_000)
    // A half-hour offset still lands on the hour boundary: 03:00 there.
    expect(msUntilNextDay('Asia/Kolkata', at)).toBe(21 * 3600_000)
  })

  it('lands exactly on the turn — not a moment before it', () => {
    for (const tz of ['UTC', 'Europe/Berlin', 'Pacific/Auckland', 'America/New_York']) {
      const turn = at.getTime() + msUntilNextDay(tz, at)
      expect(todayInTz(tz, new Date(turn - 1))).toBe(todayInTz(tz, at))
      expect(todayInTz(tz, new Date(turn))).not.toBe(todayInTz(tz, at))
    }
  })
})
