import { msUntilNextDay } from '~~/shared/utils/week'

/** A beat past the turn, so a clock running a hair fast does not read the old date and wait
 *  another whole day for the next timer. */
const SETTLE_MS = 1_000

/**
 * Drives the shared clock behind `useToday()`.
 *
 * Two triggers, because neither is enough on its own: a timer set for the next midnight, and
 * a re-read whenever the tab comes back. A laptop that slept through midnight does not run
 * the timer on time — and that sleeping tab is exactly the one you open the next morning
 * expecting it to be about today.
 */
export default defineNuxtPlugin(() => {
  const settings = useSettingsStore()
  const today = useTodayState()
  let timer: ReturnType<typeof setTimeout> | undefined

  function sync() {
    const tz = settings.settings?.timezone
    today.value = currentDate(tz)
    clearTimeout(timer)
    timer = setTimeout(sync, Math.max(msUntilNextDay(tz ?? '') + SETTLE_MS, SETTLE_MS))
  }

  sync()
  // The timezone setting is what midnight means here, so changing it re-times the clock —
  // and settles the first reading, which may have been taken before settings arrived.
  watch(() => settings.settings?.timezone, sync)

  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync() })
  window.addEventListener('focus', sync)
})
