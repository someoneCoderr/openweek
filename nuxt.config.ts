// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Nuxt defaults to server sourcemaps in production. Nobody attaches a debugger to a
  // self-hosted Nitro bundle, and generating them costs ~130 MB of build heap: with them on
  // the build needs ~600 MB, which is more than the ~520 MB ceiling Node gives itself inside
  // a 1 GB container, so `docker compose up --build` died with an unexplained exit 1 on small
  // hosts. Off, it builds in 1 GB. Dev is unaffected — this only applies to `nuxt build`.
  sourcemap: false,
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  // Components keep their own names regardless of subdirectory, so the primitives in
  // components/ui are <OwButton> rather than <UiOwButton>.
  components: [{ path: '~/components', pathPrefix: false }],
  css: [
    // Self-hosted fonts (no CDN) — the design canvases link Google Fonts, which we deliberately
    // do not copy. Weights are the 400/500/600 the design actually renders; see docs/design.md.
    // Display face — variable, covers the whole 400..600 range in one file.
    '@fontsource-variable/bricolage-grotesque/wght.css',
    // Body faces — user-selectable via the Typeface setting (see app/composables/useTheme.ts).
    '@fontsource/open-sans/400.css',
    '@fontsource/open-sans/500.css',
    '@fontsource/open-sans/600.css',
    '@fontsource/lato/400.css',
    '@fontsource/lato/700.css', // Lato ships no 500/600
    '@fontsource/roboto/400.css',
    '@fontsource/roboto/500.css',
    '@fontsource/roboto/700.css',
    '@fontsource/inter/400.css',
    '@fontsource/inter/500.css',
    '@fontsource/inter/600.css',
    '@fontsource/source-sans-3/400.css',
    '@fontsource/source-sans-3/500.css',
    '@fontsource/source-sans-3/600.css',
    '~/assets/css/main.css',
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    // Scheduled polling: rollover (hourly, catches each tz midnight) and calendar sync (Phase 7).
    experimental: { tasks: true },
    scheduledTasks: {
      '0 * * * *': ['rollover'],
    },
  },
  app: {
    head: {
      // data-theme / data-accent are set in app.vue from the user's settings.
      htmlAttrs: { lang: 'en' },
      title: 'Openweek',
      link: [
        // Four icons because four kinds of consumer read them, and each ignores the others:
        // SVG for browsers that take it (it carries the dark-chrome swap), .ico for the ones
        // that don't — 16/32/48 frames drawn on their own pixel grid, 32-bit so no consumer
        // renders the alpha as a black box — a PNG for anything that reads neither, and the
        // 180px apple-touch for iOS, which composites transparency to black so it is opaque.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', sizes: '48x48 32x32 16x16', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        // Android reads neither of the above for a home-screen icon — it wants the manifest.
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
})
