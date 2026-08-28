import { defineStore } from 'pinia'
import type { StatsPayload, StatsRange, StatsSummary } from '~~/shared/schemas/stats'

/**
 * Read-only, so there is none of the optimistic/rollback machinery the week store carries —
 * nothing here can be edited, only re-fetched over a different range.
 */
export const useStatsStore = defineStore('stats', () => {
  const payload = ref<StatsPayload | null>(null)
  const summary = ref<StatsSummary | null>(null)
  const range = ref<StatsRange>('4w')
  const loading = ref(false)

  async function load(next: StatsRange = range.value) {
    range.value = next
    loading.value = true
    try {
      const data = await apiFetch<StatsPayload>(`/api/stats?range=${next}`)
      payload.value = data
      summary.value = data
    }
    finally {
      loading.value = false
    }
  }

  /**
   * The strip above the week grid needs the headline block and nothing else, so it asks for
   * `scope=summary` rather than making every week load pay for a year of buckets.
   */
  async function loadSummary() {
    if (summary.value) return
    summary.value = await apiFetch<StatsSummary>('/api/stats?range=4w&scope=summary')
  }

  /**
   * Both payloads are answers about a particular day — the current streak, the trailing four
   * weeks, a year of ticks ending today. Left open past midnight they are quietly a day out,
   * so whatever has been fetched is fetched again when the date turns over. A failure here
   * leaves the last numbers up rather than taking the page down.
   */
  watch(useToday(), () => {
    if (payload.value) {
      load().catch(() => {})
      return
    }
    if (summary.value) {
      summary.value = null
      loadSummary().catch(() => {})
    }
  })

  return { payload, summary, range, loading, load, loadSummary }
})
