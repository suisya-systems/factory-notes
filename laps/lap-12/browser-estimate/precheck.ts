// Worker-side precheck (no bwrap): drive the UI scenarios with plain Playwright against an unsandboxed app and check
// each step's expectations the way the judge does (re-read until they hold, 5s). Only to catch mistakes in the scenarios.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'
import { EXE } from './src/browser.ts'
import { freePort, waitPort } from './src/sandbox.ts'
import { checkStep, fill } from './src/scenario.ts'
import { RACE, UI } from './scenarios-54.ts'

const app = process.argv[2]
const browser = await chromium.launch({ executablePath: EXE, headless: true })
let bad = 0
for (const s of [...UI, ...RACE]) {
  const port = await freePort()
  const p = spawn('node', ['server.js', ...(process.argv[3] ? [process.argv[3]] : [])], { cwd: app, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' })
  await waitPort(port, 5000, p, new AbortController().signal)
  const page = await browser.newPage(), vars = {}
  let failed: string | null = null, n = 0
  for (const st of s.steps) {
    n++
    if (!st.ui) { const res = await fetch(`http://127.0.0.1:${port}${fill(st.path, vars)}`, { method: st.method }); const raw = await res.text(); failed = checkStep(st, res.status, raw ? JSON.parse(raw) : undefined, vars, res.headers) }
    else {
      let status = 0
      if (st.ui === 'goto') status = (await page.goto(`http://127.0.0.1:${port}${st.path}`))!.status()
      else { const [id, i] = st.target!.split('.'); const l = page.getByTestId(id).filter({ visible: true }); const t = i === undefined ? l : l.nth(Number(i)); await (st.ui === 'click' ? t.click({ timeout: 5000 }) : t.fill(st.text!, { timeout: 5000 })) }
      const end = Date.now() + 5000
      for (;;) {
        const snap = await page.evaluate(() => { const o: Record<string, string[]> = {}; for (const e of document.querySelectorAll('[data-testid]')) { if (!(e as HTMLElement).checkVisibility()) continue; const id = e.getAttribute('data-testid')!; (o[id] ??= []).push(((e as any).value ?? (e as HTMLElement).innerText).replace(/\s+/g, ' ').trim()) } return o })
        for (const k of Object.keys((st.expect?.length ?? {}) as object)) snap[k] ??= []
        failed = checkStep(st, status, snap, { ...vars }); if (failed && Date.now() > end) failed += " " + JSON.stringify(snap)
        if (!failed || Date.now() > end) break
        await new Promise((r) => setTimeout(r, 100))
      }
    }
    if (failed) break
  }
  console.log(`${s.id}: ${failed ? `FAIL step ${n}: ${failed}` : 'ok'}`)
  if (failed) bad++
  await page.close(); p.kill()
}
await browser.close()
process.exit(bad ? 1 : 0)
