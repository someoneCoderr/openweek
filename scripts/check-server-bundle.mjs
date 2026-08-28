import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/**
 * Fails the build if a browser-only package has been pulled into the SSR bundle.
 *
 * These packages touch `document` at import time and, more to the point, expose their entry
 * points as stub directories rather than an `exports` map — which Nitro's dependency trace
 * does not copy into `.output/server/node_modules`. The built server then dies on the first
 * render with "Cannot find module …/adapter/element-adapter".
 *
 * It has to be checked here, on the built output, because nothing else sees it: dev never
 * builds a server bundle, and a local `node .output/server/index.mjs` still resolves the
 * import from the project's own node_modules. Only a container — with nothing above
 * `.output` to fall back on — actually fails, which is a long way to find out.
 *
 * The rule that keeps them out: register drag-and-drop from inside `onMounted`, which Nuxt
 * strips from the server build. See the note in app/components/DayColumn.vue.
 */
const CLIENT_ONLY = [
  '@atlaskit/pragmatic-drag-and-drop',
  '@atlaskit/pragmatic-drag-and-drop-hitbox',
  '@atlaskit/pragmatic-drag-and-drop-auto-scroll',
]

const chunks = join(process.cwd(), '.output', 'server', 'chunks')

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield * walk(path)
    else if (path.endsWith('.mjs') || path.endsWith('.js')) yield path
  }
}

let statted
try {
  statted = statSync(chunks).isDirectory()
}
catch {
  statted = false
}
if (!statted) {
  console.error(`✗ ${chunks} not found — run this after \`nuxt build\`.`)
  process.exit(1)
}

const found = []
for (const file of walk(chunks)) {
  const source = readFileSync(file, 'utf8')
  for (const pkg of CLIENT_ONLY) {
    // Bare specifier for the package itself or any of its subpaths.
    if (new RegExp(`from\\s*["']${pkg.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}(["'/])`).test(source)) {
      found.push(`${pkg}  ← ${file.slice(chunks.length + 1)}`)
    }
  }
}

if (found.length) {
  console.error('✗ browser-only packages reached the server bundle:\n')
  for (const f of [...new Set(found)]) console.error(`    ${f}`)
  console.error(
    '\n  These do not survive Nitro\'s dependency trace, so the built server 500s on the'
    + '\n  first render. Register drag-and-drop from inside `onMounted` — Nuxt strips it'
    + '\n  from the server build. See app/components/DayColumn.vue.\n',
  )
  process.exit(1)
}

console.log('✓ server bundle carries no browser-only packages')
