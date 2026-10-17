// Lap 7 tally (no model call): per run and attempt, how many scenarios passed, split into the verified minority
// scenarios (prereg.json) and the rest; each run's class; the verdict per arm (summaries / bare control) and the
// summary effect with bounds for censored runs; per minority point, the first attempt that passed its own scenarios.
// Lines fixed in the pre-registration (laps/lap-7/prereg.json, runbook in the lap 7 records).
// usage: node --experimental-strip-types --no-warnings docs/lap-7/attempts.ts <prereg.json> <STATE>
//        node --experimental-strip-types --no-warnings docs/lap-7/attempts.ts --self-test
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

type Attempt = { n: number; testsAllPass: boolean; llmPass: boolean | null; pass: boolean; results: { id: string; pass: boolean }[] }
type Run = { changeId: string; status: string; stopReason: string; feedback?: string; attempts: Attempt[] }
type Arm = 'summaries' | 'bare'
// points: point -> the scenarios that fail when only that point is reverted on the reference app and depend on no
// other declared point (empty: the point is not identifiable on its own).
export type Prereg = { maxAttempts: number; sets: Record<string, { minority: string[]; points: Record<string, string[]>; arms: Record<Arm, string[]> }> }

const passed = (a: Attempt, ids: Set<string>, inside: boolean) => a.results.filter((r) => r.pass && ids.has(r.id) === inside).length
const allPass = (a: Attempt, ids: string[]) => ids.every((id) => a.results.find((r) => r.id === id)?.pass === true)
const firstPass = (r: Run, ids: string[]) => (ids.length ? (r.attempts.find((a) => allPass(a, ids))?.n ?? '-') : 'n/a')

// Same lines as lap 6, over the verified minority scenarios only ("minority-subset convergence"):
// P1: attempt 1 passes them all. CONV: a later attempt does. INCOMPLETE: stopped (cost cap, stop, error) before the
// last attempt. NEAR: more minority passes at the last attempt than at the first, no fewer of the others. STUCK: the rest.
export function classOf(r: Run, minority: string[], maxAttempts: number): string {
  const m = new Set(minority), all = (a: Attempt) => passed(a, m, true) === m.size
  const [first, last] = [r.attempts[0], r.attempts.at(-1)]
  if (!first) return 'INCOMPLETE'
  if (all(first)) return 'P1'
  if (r.attempts.some(all)) return 'CONV'
  if (r.attempts.length < maxAttempts) return 'INCOMPLETE'
  return passed(last!, m, true) > passed(first, m, true) && passed(last!, m, false) >= passed(first, m, false) ? 'NEAR' : 'STUCK'
}

const EX = ['CONV', 'NEAR', 'STUCK']
export function verdict(classes: string[]): string {
  const ex = classes.filter((c) => EX.includes(c))
  if (ex.length < 3) return `undecided (${ex.length} exercised complete runs)`
  const n = (c: string) => ex.filter((x) => x === c).length
  return n('CONV') * 2 > ex.length ? 'supported' : n('STUCK') * 2 > ex.length ? 'not supported' : 'undecided'
}

// CONV share over exercised runs; an INCOMPLETE run counts as CONV (hi) or not (lo); P1 and unstarted runs are out.
const share = (cs: string[], incomplete: 'lo' | 'hi') => {
  const inc = cs.filter((c) => c === 'INCOMPLETE').length, ex = cs.filter((c) => EX.includes(c))
  const den = ex.length + inc
  return den ? (ex.filter((c) => c === 'CONV').length + (incomplete === 'hi' ? inc : 0)) / den : NaN
}
const effectOf = (d: number) => (Number.isNaN(d) ? 'no exercised runs' : d >= 0.5 ? 'effect observed' : d <= 0 ? 'no effect seen' : 'unclear')
// d = CONV share (summaries) - CONV share (bare). With censored runs, the verdict holds only if both bounds agree.
export function effect(sum: string[], bare: string[]): string {
  const lo = share(sum, 'lo') - share(bare, 'hi'), hi = share(sum, 'hi') - share(bare, 'lo')
  const [a, b] = [effectOf(lo), effectOf(hi)]
  return `d in [${lo.toFixed(2)}, ${hi.toFixed(2)}]: ${a === b ? a : 'unclear (censored runs)'}`
}

function report(p: Prereg, sd: string): string {
  const lines: string[] = [], pooled: Record<Arm, string[]> = { summaries: [], bare: [] }
  for (const [set, s] of Object.entries(p.sets)) {
    const m = new Set(s.minority), pts = Object.entries(s.points), classes: Record<Arm, string[]> = { summaries: [], bare: [] }
    lines.push(`## ${set} (minority: ${s.minority.join(', ')})`, '')
    for (const arm of ['summaries', 'bare'] as Arm[]) {
      lines.push(`### ${set} / ${arm}`, '', '| run | attempt | all tests | minority | others | LLM | pass | failed |', '|---|---|---|---|---|---|---|---|')
      const perPoint: string[] = []
      for (const id of s.arms[arm]) {
        const f = join(sd, 'runs', id, 'run.json')
        if (!existsSync(f)) { lines.push(`| ${id} | **not started** | | | | | | |`); continue } // a lap cap or stop ended the lap first: not counted
        const r: Run = JSON.parse(readFileSync(f, 'utf8'))
        if ((r.feedback ?? 'summaries') !== arm) throw new Error(`${id}: ran with feedback ${r.feedback}, pre-registered in arm ${arm}`)
        for (const a of r.attempts) {
          const others = a.results.filter((x) => !m.has(x.id)).length
          lines.push(`| ${id} | ${a.n} | ${a.results.filter((x) => x.pass).length}/${a.results.length} | ${passed(a, m, true)}/${m.size} | ${passed(a, m, false)}/${others} | ${a.llmPass} | ${a.pass} | ${a.results.filter((x) => !x.pass).map((x) => x.id).join(', ')} |`)
        }
        const c = classOf(r, s.minority, p.maxAttempts)
        classes[arm].push(c)
        lines.push(`| ${id} | **${c}** | status ${r.status} | full suite first passed: ${firstPass(r, r.attempts[0]?.results.map((x) => x.id) ?? [])} | | | | ${r.stopReason} |`)
        perPoint.push(`| ${id} | ${pts.map(([, ids]) => firstPass(r, ids)).join(' | ')} |`)
      }
      lines.push('', `First attempt passing each point's own scenarios (- never, n/a not identifiable):`, '', `| run | ${pts.map(([k]) => k).join(' | ')} |`, `|---|${pts.map(() => '---|').join('')}`, ...perPoint, '')
      pooled[arm].push(...classes[arm])
    }
    lines.push(`${set} summaries: ${verdict(classes.summaries)}; bare: ${verdict(classes.bare)}; summary effect: ${effect(classes.summaries, classes.bare)}`, '')
  }
  lines.push(`All sets, summaries: ${verdict(pooled.summaries)}`, `All sets, bare: ${verdict(pooled.bare)}`, `All sets, summary effect: ${effect(pooled.summaries, pooled.bare)}`)
  return lines.join('\n')
}

function selfTest() {
  const at = (n: number, pass: Record<string, boolean>): Attempt => ({ n, testsAllPass: false, llmPass: null, pass: false, results: Object.entries(pass).map(([id, p]) => ({ id, pass: p })) })
  const run = (...as: Attempt[]): Run => ({ changeId: 'x', status: 'failed', stopReason: '', attempts: as })
  const m = ['a', 'b']
  assert.equal(classOf(run(at(1, { a: true, b: true, c: false })), m, 5), 'P1')
  assert.equal(classOf(run(at(1, { a: false, b: true }), at(2, { a: true, b: true })), m, 5), 'CONV')
  assert.equal(classOf(run(at(1, { a: false, b: true }), at(2, { a: false, b: true })), m, 5), 'INCOMPLETE')
  const five = (last: Record<string, boolean>) => run(at(1, { a: false, b: false, c: true }), ...[2, 3, 4].map((n) => at(n, { a: false, b: false, c: true })), at(5, last))
  assert.equal(classOf(five({ a: true, b: false, c: true }), m, 5), 'NEAR')
  assert.equal(classOf(five({ a: true, b: false, c: false }), m, 5), 'STUCK')
  assert.equal(classOf(run(), m, 5), 'INCOMPLETE')
  assert.equal(verdict(['P1', 'CONV', 'CONV', 'STUCK']), 'supported')
  assert.equal(verdict(['CONV', 'STUCK', 'STUCK']), 'not supported')
  assert.equal(verdict(['CONV', 'NEAR', 'STUCK', 'STUCK']), 'undecided')
  assert.match(verdict(['P1', 'CONV', 'INCOMPLETE']), /undecided \(1/)
  assert.equal(firstPass(run(at(1, { a: false }), at(2, { a: true })), ['a']), 2)
  assert.equal(firstPass(run(at(1, { a: false })), ['a']), '-')
  assert.equal(firstPass(run(at(1, { a: false })), []), 'n/a')
  assert.equal(effect(['CONV', 'CONV', 'CONV', 'STUCK'], ['STUCK', 'STUCK', 'STUCK', 'CONV']), 'd in [0.50, 0.50]: effect observed')
  assert.equal(effect(['CONV', 'STUCK'], ['CONV', 'STUCK']), 'd in [0.00, 0.00]: no effect seen')
  assert.equal(effect(['CONV', 'CONV', 'P1'], ['STUCK', 'INCOMPLETE']), 'd in [0.50, 1.00]: effect observed') // P1 is out
  assert.match(effect(['CONV', 'INCOMPLETE'], ['STUCK', 'STUCK']), /\[0\.50, 1\.00\]: effect observed/)
  assert.match(effect(['CONV', 'STUCK'], ['STUCK', 'INCOMPLETE']), /\[0\.00, 0\.50\]: unclear \(censored/)
  console.log('self-test ok')
}

const [a1, a2] = process.argv.slice(2)
if (a1 === '--self-test') selfTest()
else console.log(report(JSON.parse(readFileSync(a1, 'utf8')), a2))
