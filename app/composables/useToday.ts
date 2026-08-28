import { todayInTz, todayStr } from '~~/shared/utils/week'

/**
 * Today's date, as a value that changes when the day does.
 *
 * Every date rule in the planner — the today marker, "no planning into the past", which week
 * the Today button lands on — used to read the clock once, at setup, so a tab left open
 * overnight kept yesterday's answer until someone reloaded it. They all read this one clock
 * instead; `plugins/today.client.ts` turns it over.
 */
export function useToday() {
  return readonly(useTodayState())
}

/**
 * The writable clock behind `useToday()`. Only the plugin that drives it should set it;
 * everything else takes the read-only view.
 */
export function useTodayState(): Ref<string> {
  return useState('ow-today', () => currentDate(useSettingsStore().settings?.timezone))
}

/**
 * Which day it is on the clock that decides when one day becomes the next: the account's
 * timezone (Settings → Timezone), the same one the server rolls tasks over and buckets
 * completions on. Until settings have loaded there is nothing to ask, so the browser's own
 * clock stands in — which is what the whole front end used to do.
 */
export function currentDate(timezone: string | undefined): string {
  return timezone ? todayInTz(timezone) : todayStr()
}
