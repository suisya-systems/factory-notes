// factory#54 measurement (no model calls, localhost only): what a browser costs per scenario, and how often the
// factory's judge fails a CORRECT app's page (judge-side noise). Uses the factory's own runScenario / openBrowser.
// Writes only to os.tmpdir() (the judge's app copies, data dirs, browser profiles) and to ../measure-out/.
// Stops itself after 18 minutes (abort), hard exit at 19.
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openBrowser } from './src/browser.ts'
import { freePort, removeTree } from './src/sandbox.ts'
import { runScenario, validateScenarios, type Scenario } from './src/scenario.ts'
import { HTTP, RACE, UI } from './scenarios-54.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'measure-out')
const reps = (name: string, d: number) => Number(process.env[name] ?? d)
const ac = new AbortController()
const t0 = Date.now()
setTimeout(() => { console.log('deadline (18 min): stopping'); ac.abort() }, 18 * 60_000).unref()
setTimeout(() => { console.log('hard exit (19 min)'); process.exit(2) }, 19 * 60_000).unref()

// The judge runs an exported copy of the build in tmpdir: so do we.
const copy = (name: string) => { const d = mkdtempSync(join(tmpdir(), `f54-${name}-`)); cpSync(join(HERE, '..', name), d, { recursive: true }); return d }
const apps = { normal: copy('memo-app'), slow: copy('memo-app-slow') }
validateScenarios(UI); validateScenarios(HTTP); validateScenarios(RACE)

type Row = { phase: string; id: string; rep: number; ms: number; pass: boolean; failedStep?: number; detail: string }
const rows: Row[] = []
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN }

// n reps of every scenario, at most `par` at once (lap 11 scores up to 4 replicates at once, one scenario each).
async function phase(name: string, app: string, set: Scenario[], n: number, par: number, ui: boolean) {
  const todo = Array.from({ length: n }, (_, r) => set.map((s) => [s, r] as const)).flat()
  const start = Date.now()
  await Promise.all(Array.from({ length: par }, async () => {
    while (todo.length && !ac.signal.aborted) {
      const [s, rep] = todo.shift()!
      const t = performance.now()
      try {
        const r = await runScenario(app, s, ac.signal, { ui })
        rows.push({ phase: name, id: s.id, rep, ms: performance.now() - t, pass: r.pass, failedStep: r.failedStep, detail: r.detail })
      } catch (e) { if (!ac.signal.aborted) rows.push({ phase: name, id: s.id, rep, ms: performance.now() - t, pass: false, detail: `threw: ${(e as Error).message}` }) }
    }
  }))
  const mine = rows.filter((r) => r.phase === name), ms = mine.map((r) => r.ms), fails = mine.filter((r) => !r.pass)
  console.log(`${name}: ${mine.length} runs, ${fails.length} failed, wall ${((Date.now() - start) / 1000).toFixed(1)}s, per scenario median ${pct(ms, 0.5).toFixed(0)}ms p95 ${pct(ms, 0.95).toFixed(0)}ms max ${Math.max(...ms).toFixed(0)}ms`)
  for (const f of fails.slice(0, 10)) console.log(`  FAIL ${f.id} rep ${f.rep}: ${f.detail.slice(0, 300)}`)
}

// Bare browser: launch + one goto + read + close, against a plain local page (no app sandbox).
async function bare(n: number) {
  const port = await freePort()
  const srv = http.createServer((_, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end('<p data-testid="x">hi</p>') }).listen(port, '127.0.0.1')
  const open: number[] = [], close: number[] = []
  for (let i = 0; i < n && !ac.signal.aborted; i++) {
    let t = performance.now()
    const b = await openBrowser(port, ac.signal); open.push(performance.now() - t)
    await b.act({ ui: 'goto', path: '/' }, port); await b.snapshot()
    t = performance.now(); await b.close(); close.push(performance.now() - t)
  }
  srv.close()
  console.log(`bare browser: ${open.length} launches, open median ${pct(open, 0.5).toFixed(0)}ms p95 ${pct(open, 0.95).toFixed(0)}ms, close median ${pct(close, 0.5).toFixed(0)}ms`)
  return { open, close }
}

const env = { node: process.version, cpus: (await import('node:os')).cpus().length, load: (await import('node:os')).loadavg() }
console.log(`env ${JSON.stringify(env)}`)
const b = await bare(reps('F54_BARE', 10))
await phase('http-par1', apps.normal, HTTP, reps('F54_HTTP1', 10), 1, false)
await phase('ui-par1', apps.normal, UI, reps('F54_UI1', 10), 1, true)
await phase('http-par4', apps.normal, HTTP, reps('F54_HTTP4', 10), 4, false)
await phase('ui-par4', apps.normal, UI, reps('F54_UI4', 40), 4, true)
await phase('ui-slow-par4', apps.slow, UI, reps('F54_SLOW4', 15), 4, true)
await phase('race-par4', apps.normal, RACE, reps('F54_RACE4', 20), 4, true)

mkdirSync(OUT, { recursive: true })
const file = join(OUT, `measure-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(file, JSON.stringify({ env, totalSec: (Date.now() - t0) / 1000, aborted: ac.signal.aborted, bare: b, rows }, null, 1))
console.log(`wrote ${file} (${((Date.now() - t0) / 1000).toFixed(0)}s total)`)
for (const d of Object.values(apps)) removeTree(d)
process.exit(0)
