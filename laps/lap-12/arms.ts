// Lap 12 tools (no model call): laps/lap-11/arms.ts in factory-notes, with the ui rules (rules.json "ui", minUi) in place
// of the service rules in the pre-check, the flake rule (the last `judgements` judgements of each build, from #56's
// replicates/history/; a (set, scenario, build) whose verdict changes among them is left out) in the screen and the report,
// and the ui steps per set in place of the fake's steps (descriptive).
// Lap 11: the request's length (words) in the pre-check.
// Lap 10: the lap 8 / 9 analysis per request, the pre-check of the requests (rule pairs), the placeholder check of the
// drafted scenarios, a screen with a floor, the screen's unanimous failures with the failing step, one verdict across requests.
// Redrafts (#32): a set's name resolves to its last redraft in the vault (<id>, <id>-r2, <id>-r3).
// Rules: docs/lap-12/runbook.md.
// usage: node --experimental-strip-types --no-warnings docs/lap-12/arms.ts --self-test | --precheck <rules.json>
//   | --provenance <STATE> <id>... | --placeholders <STATE> <out.md> <id>... | --screen <screen.json> <STATE> [screen-errors.json [screen-flakes.json]]
//   | <prereg.json> <STATE> [errors.json [flakes.json]]
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FAMILY: Record<string, string> = { c: 'claude-opus-5-5', x: 'gpt-6-astra' }
const readJson = (f: string) => JSON.parse(readFileSync(f, 'utf8'))
const round = (x: number) => Math.round(1e9 * x) / 1e9 // the lines compare exact points: 4.9999.. must not slip under 5
const mean = (xs: (number | null)[]): number | null => (xs.length && xs.every((x) => x !== null) ? (xs as number[]).reduce((a, b) => a + b, 0) / xs.length : null)
const pts = (x: number | null) => (x === null ? 'n/a' : (100 * x).toFixed(1))

// ---- redraft names ----
// A set's attempts as the lap drafts them (#32): <id>, then <id>-r2, <id>-r3 .., in that order.
export function lineage(names: string[], id: string): string[] {
  const re = new RegExp(`^${id.replace(/[-.]/g, '\\$&')}(?:-r(\\d+))?$`)
  return names.map((n) => ({ n, m: n.match(re) })).filter((x) => x.m).map((x) => ({ n: x.n, k: x.m![1] ? Number(x.m![1]) : 1 })).sort((a, b) => a.k - b.k).map((x) => x.n)
}
// The last successful draft of a set: the last attempt with a classification in the vault.
export const resolveIn = (names: string[], id: string) => lineage(names, id).at(-1) ?? id
export const resolve = (sd: string, id: string) => {
  const v = join(sd, 'vault')
  return existsSync(v) ? resolveIn(readdirSync(v).filter((n) => existsSync(join(v, n, 'classification.json'))), id) : id
}

// ---- pre-check (rules.json, before any model call) ----
// Lap 11: a candidate also needs words within [lo, hi] (whitespace-separated, as wc -w). Lap 12: and at least minUi ui rules.
type Req = { file?: string; rules: string[]; pairs: string[]; ui?: string[] }
type Rules = { pairsTimes: number; calibration: string[]; candidates: string[]; words: [number, number]; minUi: number; requests: Record<string, Req> }
export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length
export function uiCount(r: Req): number {
  const s = r.ui ?? []
  for (const x of s) if (!r.rules.includes(x)) throw new Error(`ui rule "${x}" is not a listed rule`)
  if (new Set(s).size !== s.length) throw new Error('a ui rule is listed twice')
  return s.length
}
export function pairCount(r: { rules: string[]; pairs: string[] }): number {
  const set = new Set<string>()
  for (const p of r.pairs) {
    const [a, b] = p.split(':')[0].split('|').map((s) => s.trim())
    if (!r.rules.includes(a) || !r.rules.includes(b) || a === b) throw new Error(`pair "${p}": both sides must be distinct listed rules`)
    set.add([a, b].sort().join('|'))
  }
  return set.size
}
export function precheck(rules: Rules, words: Record<string, number>) {
  const n = Object.fromEntries(Object.keys(rules.requests).map((r) => [r, pairCount(rules.requests[r])]))
  const ui = Object.fromEntries(Object.keys(rules.requests).map((r) => [r, uiCount(rules.requests[r])]))
  const bar = rules.pairsTimes * Math.max(...rules.calibration.map((r) => n[r]))
  const [lo, hi] = rules.words
  const ok = (r: string) => n[r] >= bar && words[r] >= lo && words[r] <= hi && ui[r] >= rules.minUi
  return { n, ui, bar, pass: Object.fromEntries(rules.candidates.map((r) => [r, ok(r)])) }
}
function precheckMain(rules: Rules): number {
  const words = Object.fromEntries(Object.entries(rules.requests).map(([r, x]) => [r, wordCount(readFileSync(x.file!, 'utf8'))]))
  const { n, ui, bar, pass } = precheck(rules, words)
  const role = (r: string) => (rules.calibration.includes(r) ? 'calibration' : 'candidate')
  console.log(['| request | role | words | rules | ui rules | pairs | passes |', '|---|---|---|---|---|---|---|',
    ...Object.keys(rules.requests).map((r) => `| ${r} | ${role(r)} | ${words[r]} | ${rules.requests[r].rules.length} | ${ui[r]} | ${n[r]} | ${role(r) === 'candidate' ? (pass[r] ? 'yes' : 'NO') : '-'} |`),
    '', `bar: ${bar} pairs (${rules.pairsTimes} x the largest calibration count), ${rules.words[0]} to ${rules.words[1]} words, at least ${rules.minUi} ui rules (candidates only)`].join('\n'))
  const bad = rules.candidates.filter((r) => !pass[r])
  if (bad.length) { console.error(`pre-check failed: ${bad.join(', ')}`); return 1 }
  return 0
}

// ---- placeholder check (lap 9 proposal 2, outside the factory) ----
// Where a scenario uses {{name}}, and the places the runner does not fill (src/scenario.ts fill(): path, body, headers,
// expect.json, service bodies, ui path / text) or a name no earlier step captured (a step's captures come after its checks).
type Step = { path?: string; body?: unknown; headers?: Record<string, string>; text?: string; expect?: { json?: unknown; jsonHas?: string[]; length?: number | Record<string, number> }; capture?: Record<string, string> }
const names = (x: unknown): string[] => [...JSON.stringify(x ?? null).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
export function placeholders(scenarios: { id: string; steps: Step[] }[]) {
  const where: Record<string, number> = {}, bad: string[] = []
  for (const s of scenarios) {
    const seen = new Set<string>()
    s.steps.forEach((st, i) => {
      const filled: Record<string, unknown> = { path: st.path, body: st.body, headers: st.headers, 'expect.json': st.expect?.json, 'ui text': st.text }
      const unfilled: Record<string, unknown> = { 'expect.jsonHas': st.expect?.jsonHas, 'expect.length keys': typeof st.expect?.length === 'object' ? Object.keys(st.expect.length) : undefined, 'capture paths': st.capture ? Object.values(st.capture) : undefined, 'capture names': st.capture ? Object.keys(st.capture) : undefined }
      for (const [k, v] of Object.entries(filled)) for (const n of names(v)) {
        where[k] = (where[k] ?? 0) + 1
        if (!seen.has(n)) bad.push(`${s.id} step ${i}: {{${n}}} in ${k} before any step captured it`)
      }
      for (const [k, v] of Object.entries(unfilled)) for (const n of names(v)) bad.push(`${s.id} step ${i}: {{${n}}} in ${k}, which the runner does not fill`)
      for (const n of Object.keys(st.capture ?? {})) seen.add(n)
    })
  }
  return { where, bad }
}
// Written to <out> for the next gate's approver; never fails the lap (a failed exec step is never re-run, and a set that
// drafted fine is no redraft). The approver decides at the gate (runbook: placeholder check).
function placeholdersMain(sd: string, out: string, ids: string[]): number {
  const lines = ['| set | placeholders by place | problems |', '|---|---|---|'], bad: string[] = []
  for (const id0 of ids) {
    const id = resolve(sd, id0), r = placeholders(readJson(join(sd, 'vault', id, 'scenarios.json')))
    lines.push(`| ${id} | ${Object.entries(r.where).map(([k, n]) => `${k} ${n}`).join(', ') || '(none)'} | ${r.bad.length} |`)
    bad.push(...r.bad.map((b) => `${id}: ${b}`))
  }
  const text = [...lines, '', ...(bad.length ? ['PROBLEMS (each scenario fails on every build as written):', ...bad.map((b) => `- ${b}`)] : [`placeholders: ${ids.length} sets clean`])].join('\n') + '\n'
  writeFileSync(out, text)
  console.log(text)
  return 0
}

// ---- provenance (lap 9, names of lap 10 to 12: <req>-<spec family><scenario family>-<k|p>, redrafts -r<n>) ----
type Call = { role: string; requested: string | null; answered: string | null; counted?: true }
export function provenance(id: string, cost: { calls?: Call[]; countedCalls?: number; specFrom?: string | null } | null): string[] {
  const m = id.match(/^([a-z0-9][a-z0-9-]*?)-([cx])([cx])-(\d+|p)(?:-r\d+)?$/)
  if (!m) return [`${id}: not a lap-12 set name`]
  if (!cost?.calls) return [`${id}: no per-call record (draft-cost.json missing)`]
  const [, req, a, b, k] = m, bad: string[] = []
  const of = (role: string) => cost.calls!.filter((c) => c.role === role)
  const wantFrom = a === b ? null : `${req}-${a}${a}-${k}`
  const from = cost.specFrom ?? null
  if (wantFrom === null ? from !== null : !(from !== null && new RegExp(`^${wantFrom}(?:-r\\d+)?$`).test(from))) bad.push(`${id}: spec from ${from ?? '(own draft)'}, expected ${wantFrom ?? '(own draft)'}`)
  if (a === b && !of('spec-drafter').length) bad.push(`${id}: no spec-drafter call`)
  if (a !== b && of('spec-drafter').length) bad.push(`${id}: a reused spec, but the spec drafter was called`)
  if (!of('scenario-drafter').length) bad.push(`${id}: no scenario-drafter call`)
  const want: Record<string, string> = { 'spec-drafter': FAMILY[a], 'scenario-drafter': FAMILY[b], classifier: FAMILY.c }
  for (const c of cost.calls) {
    if (!Object.hasOwn(want, c.role)) { bad.push(`${id}: unexpected role ${c.role}`); continue }
    if (c.requested !== want[c.role]) bad.push(`${id}: ${c.role} asked for ${c.requested}, expected ${want[c.role]}`)
    const cross = c.requested === FAMILY.x
    if (cross !== (c.counted === true)) bad.push(`${id}: ${c.role} call ${cross ? 'not counted' : 'counted'}`)
    if (!cross && c.answered !== null && !c.answered.split(',').every((x) => x.startsWith('claude-'))) bad.push(`${id}: ${c.role} answered by ${c.answered}`)
  }
  if ((cost.countedCalls ?? 0) !== cost.calls.filter((c) => c.counted).length) bad.push(`${id}: countedCalls does not match the counted calls listed`)
  return bad
}
function provenanceMain(sd: string, ids: string[]): number {
  const lines = ['| set | spec from | spec-drafter calls | scenario-drafter calls | classifier calls | counted calls | USD |', '|---|---|---|---|---|---|---|']
  const bad: string[] = []
  for (const id0 of ids) {
    const id = resolve(sd, id0), f = join(sd, 'runs', id, 'draft-cost.json'), cost = existsSync(f) ? readJson(f) : null
    bad.push(...provenance(id, cost))
    const n = (role: string) => (cost?.calls ?? []).filter((c: Call) => c.role === role).length
    lines.push(`| ${id} | ${cost?.specFrom ?? '-'} | ${n('spec-drafter')} | ${n('scenario-drafter')} | ${n('classifier')} | ${cost?.countedCalls ?? 0} | ${(cost?.totalUsd ?? 0).toFixed(4)} |`)
  }
  console.log(lines.join('\n'))
  if (bad.length) { console.error(['provenance check failed:', ...bad.map((b) => `- ${b}`)].join('\n')); return 1 }
  console.log(`provenance: ${ids.length} sets as named`)
  return 0
}

// ---- lap 8 contrasts (unchanged) ----
type Pair = { spec: 'c' | 'x'; own: string; cross: string | null }
type Lines = { effectPts: number; nullPts: number }
export type Prereg = { k: number; judgements: number; maxFlakePct: number; requests: Record<string, { pairs: Pair[] }>; approvedVersions: Record<string, string>; lines: Lines; ceilingPct: number; floorPct: number; minRequests: number }
type ScenarioResult = { id: string; pass: boolean; failedStep?: number; detail?: string }
type Rep = { results: Record<string, ScenarioResult[]> }
type Stratum = 'all' | 'spec' | 'rest'
export type Verdict = '+' | '-' | '0' | '?'
type Classified = { id: string; checks?: { check: string; result: string; basis?: string }[] }

export function verdict(left: (number | null)[], right: (number | null)[], combos: [number, number][], lines: Lines): { d: number | null; v: Verdict } {
  const l = mean(left), r = mean(right)
  if (l === null || r === null) return { d: null, v: '?' }
  const d = round(100 * (l - r))
  const all = (f: (a: number, b: number) => boolean) => combos.every(([i, j]) => f(left[i] as number, right[j] as number))
  if (d >= lines.effectPts && all((a, b) => a > b)) return { d, v: '+' }
  if (d <= -lines.effectPts && all((a, b) => a < b)) return { d, v: '-' }
  if (Math.abs(d) < lines.nullPts) return { d, v: '0' }
  return { d, v: '?' }
}
export function attribute(a: Verdict, b: Verdict, side: [string, string]): string {
  if (a === '?' || b === '?') return 'undecided'
  if (a === b) return a === '+' ? 'lower with the other family' : a === '-' ? 'higher with the other family (reverse)' : 'no effect'
  if (a === '0' || b === '0') {
    const [v, where] = a === '0' ? [b, side[1]] : [a, side[0]]
    return `${v === '+' ? 'lower' : 'higher'} on the ${where} side only (interaction)`
  }
  return 'opposite directions by side (interaction)'
}
const ALL2: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]]
const PAIRED: [number, number][] = [[0, 0], [1, 1]]
const KEYS = ['D', 'Ds_c', 'Ds_x', 'Dp_c', 'Dp_x'] as const
export type Contrasts = Record<(typeof KEYS)[number], { d: number | null; v: Verdict }>
export function contrasts(P: Record<string, number | null>, arms: Record<'cc' | 'cx' | 'xx' | 'xc', string[]>, lines: Lines): Contrasts {
  const of = (a: keyof typeof arms) => arms[a].map((id) => P[id] ?? null)
  return { D: verdict(of('cc'), of('xx'), ALL2, lines), Ds_c: verdict(of('cc'), of('cx'), PAIRED, lines), Ds_x: verdict(of('xc'), of('xx'), PAIRED, lines), Dp_c: verdict(of('cc'), of('xc'), ALL2, lines), Dp_x: verdict(of('cx'), of('xx'), ALL2, lines) }
}
export const inSpecLayer = (c: Classified) => {
  const ks = (c.checks ?? []).filter((k) => !k.check.startsWith('status'))
  return ks.length > 0 && ks.every((k) => k.result === 'M' && k.basis === 'spec')
}
const reps = (sd: string, specId: string): Rep[] => {
  const dir = join(sd, 'runs', specId, 'replicates')
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(join(dir, f))) : []
}
// ---- lap 12: the flake rule ----
// A build's judgements, oldest first: replicates/history/<build>.<k>.json (#56, k = 1 the oldest), then the current record;
// the rule compares the last n of them. Builds are in the order of reps(), so build i here is reps()[i].
export const historyNames = (files: string[], build: string) => files.filter((f) => f.startsWith(`${build}.`) && /^\d+\.json$/.test(f.slice(build.length + 1)))
  .sort((a, b) => Number(a.slice(build.length + 1, -5)) - Number(b.slice(build.length + 1, -5)))
type Judged = { build: string; js: Rep[] }
const judged = (sd: string, specId: string, n: number): Judged[] => {
  const dir = join(sd, 'runs', specId, 'replicates'), h = join(dir, 'history')
  if (!existsSync(dir)) return []
  const hs = existsSync(h) ? readdirSync(h) : []
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const build = f.slice(0, -5)
    return { build, js: [...historyNames(hs, build).map((x) => readJson(join(h, x))), readJson(join(dir, f))].slice(-n) }
  })
}
// The scenarios of a set whose pass / fail differs among the judgements of one build. A judgement without the scenario
// does not count (as tally's "Verdicts that changed across judgements").
export function flaky(js: Rep[], set: string): string[] {
  const ids = [...new Set(js.flatMap((j) => (j.results[set] ?? []).map((x) => x.id)))]
  return ids.filter((sid) => new Set(js.map((j) => j.results[set]?.find((x) => x.id === sid)?.pass).filter((v) => v !== undefined)).size > 1)
}
type Flakes = Record<string, Record<string, string[]>> // set -> scenario -> builds, the shape of (screen-)flakes.json
// Over one spec's builds and the sets scoring them: the flakes per set and build, and the share of (set, scenario, build) cells.
export function flakesOf(jd: Judged[], ids: Record<string, string[]>) {
  const flakes: Flakes = {}, by: Record<string, string[][]> = {}
  let n = 0, cells = 0
  for (const [set, sids] of Object.entries(ids)) {
    by[set] = jd.map(({ build, js }) => { const f = flaky(js, set); for (const sid of f) ((flakes[set] ??= {})[sid] ??= []).push(build); n += f.length; return f })
    cells += sids.length * jd.length
  }
  return { flakes, by, n, cells }
}
export const overLine = (n: number, cells: number, maxPct: number) => cells > 0 && round(100 * n / cells) > maxPct
const sorted = (f: Flakes) => JSON.stringify(Object.keys(f).sort().filter((s) => Object.keys(f[s]).length).map((s) => [s, Object.keys(f[s]).sort().map((x) => [x, [...f[s][x]].sort()])]))
export const sameFlakes = (a: Flakes, b: Flakes) => sorted(a) === sorted(b)
function checkFlakes(file: string, got: Flakes): boolean {
  if (sameFlakes(readJson(file), got)) return true
  console.error(`flakes: ${file} does not match the flakes found:\n${JSON.stringify(got, null, 2)}`)
  return false
}

// One build's pass fraction of the scenarios kept: kept by keep() and (lap 12) not a flake of that build. emptied: the
// build has results for the set but keeps none (in the stratum 'all', the flake rule's "the count stops").
export function buildRate(xs: ScenarioResult[], keep: (sid: string) => boolean, fl: string[]) {
  const k = xs.filter((x) => keep(x.id) && !fl.includes(x.id))
  return { r: k.length ? k.filter((x) => x.pass).length / k.length : null, emptied: xs.length > 0 && !k.length }
}
// Per build the pass fraction of the scenarios kept: not in errors, in the stratum, not a flake of that build.
// short: a build has fewer judgements than the rule needs.
function rates(sd: string, specId: string, sets: string[], stratum: Stratum, errors: Record<string, string[]>, n: number) {
  const jd = judged(sd, specId, n), out: Record<string, (number | null)[]> = {}
  let emptied = false
  for (const id of sets) {
    const specLayer = new Set((readJson(join(sd, 'vault', id, 'classification.json')) as Classified[]).filter(inSpecLayer).map((c) => c.id))
    const keep = (sid: string) => !(errors[id] ?? []).includes(sid) && (stratum === 'all' || specLayer.has(sid) === (stratum === 'spec'))
    out[id] = jd.map(({ js }) => { const b = buildRate(js.at(-1)!.results[id] ?? [], keep, flaky(js, id)); emptied ||= b.emptied; return b.r })
  }
  return { rates: out, builds: jd.length, short: jd.some((j) => j.js.length < n), emptied }
}
// U (lap 9's pre-registered measure) is descriptive in lap 10.
export function undecidedShare(sets: Classified[][]): number | null {
  let n = 0, u = 0
  for (const cls of sets) for (const c of cls) for (const k of c.checks ?? []) if (!k.check.startsWith('status')) { n++; if (k.result === 'U') u++ }
  return n ? round(100 * u / n) : null
}
export const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : round((s[h - 1] + s[h]) / 2) }
export const sBar = (c: Contrasts) => (c.Ds_c.d === null || c.Ds_x.d === null ? null : round((c.Ds_c.d + c.Ds_x.d) / 2))

// ---- lap 12: the ui steps (descriptive, not in any verdict) ----
// Per set: the ui steps, the scenarios with at least one, and the ui steps without an expect (they do not wait; runbook: wait errors).
type UiStep = { ui?: string; expect?: unknown }
export function uiSteps(scenarios: { id: string; steps: UiStep[] }[]) {
  const ui = scenarios.flatMap((s) => s.steps).filter((st) => st.ui !== undefined)
  return { steps: ui.length, scenarios: scenarios.filter((s) => s.steps.some((st) => st.ui !== undefined)).length, of: scenarios.length, noExpect: ui.filter((st) => st.expect === undefined).length }
}

// Scenarios every build failed, with the step and the runner's detail of each build (read them before gate main / in the report).
export function unanimous(rs: Rep[], set: string): string[] {
  if (!rs.length) return []
  return (rs[0].results[set] ?? []).map((x) => x.id).filter((sid) => rs.every((r) => r.results[set]?.find((x) => x.id === sid)?.pass === false)).map((sid) => {
    const how = [...new Set(rs.map((r) => { const x = r.results[set].find((y) => y.id === sid)!; return `step ${x.failedStep ?? '?'}: ${x.detail ?? ''}` }))]
    return `- ${set} / ${sid} (all ${rs.length} builds fail; ${how.join(' | ')})`
  })
}

// ---- lap 10: the screen (lap 9 with a floor, single requests only) ----
// Off the band = at the ceiling (Q >= ceilingPct) or at the floor (Q < floorPct). Up to maxRequests requests in the band
// go on, lowest Q first; ties: the listed order. Q is computed without the scenarios in screen-errors.json.
export function screen(Q: Record<string, number>, maxRequests: number, ceilingPct: number, floorPct: number): string[] {
  return Object.keys(Q).map((r, i) => ({ r, i, q: Q[r] })).filter((x) => x.q < ceilingPct && x.q >= floorPct).sort((a, b) => a.q - b.q || a.i - b.i).slice(0, maxRequests).map((x) => x.r)
}
// Q of one set: per build the pass fraction of the scenarios kept (all but the excluded ids and, lap 12, that build's
// flakes in flaky[i]), averaged over the builds. A build without results for the set (the app did not start) counts 0.
// A set with every scenario excluded has no Q, nor has one a build of which keeps none after its flakes (the count stops).
export function screenQ(rs: Rep[], set: string, scenarioIds: string[], excluded: string[], flaky: string[][] = []): number {
  const keep = new Set(scenarioIds.filter((x) => !excluded.includes(x)))
  if (!keep.size) throw new Error(`screen: every scenario of ${set} is excluded; it has no Q`)
  return mean(rs.map((r, i) => {
    const k = [...keep].filter((x) => !(flaky[i] ?? []).includes(x))
    if (!k.length) throw new Error(`screen: build ${i + 1} keeps no scenario of ${set} after its flakes; the count stops`)
    const xs = (r.results[set] ?? []).filter((x) => k.includes(x.id)); return xs.length ? xs.filter((x) => x.pass).length / xs.length : 0
  }))!
}
type ScreenRule = { k: number; judgements: number; maxFlakePct: number; ceilingPct: number; floorPct: number; maxRequests: number; requests: string[] }
function screenMain(rule: ScreenRule, sd: string, errorsFile?: string, flakesFile?: string): number {
  const errors: Record<string, string[]> = errorsFile ? readJson(errorsFile) : {}
  const Q: Record<string, number> = {}, un: string[] = [], stopped: string[] = [], allFlakes: Flakes = {}
  const lines = ['| request | sets | builds | flakes (cells, %) | Q own (%) | Q cross (%) | Q (%) | place |', '|---|---|---|---|---|---|---|---|']
  for (const req of rule.requests) {
    const own = resolve(sd, `${req}-cc-p`), cross = resolve(sd, `${req}-cx-p`), jd = judged(sd, own, rule.judgements), rs = jd.map((j) => j.js.at(-1)!)
    if (rs.length !== rule.k) { console.error(`screen: ${own} has ${rs.length} builds, the rule needs ${rule.k}`); return 1 }
    const few = jd.filter((j) => j.js.length < rule.judgements).map((j) => j.build)
    if (few.length) { console.error(`screen: ${own} builds ${few.join(', ')} have fewer than ${rule.judgements} judgements (rescore them)`); return 1 }
    const ids = (id: string) => (readJson(join(sd, 'vault', id, 'scenarios.json')) as { id: string }[]).map((x) => x.id)
    const f = flakesOf(jd, { [own]: ids(own), [cross]: ids(cross) })
    Object.assign(allFlakes, f.flakes)
    const fl = `${f.n} of ${f.cells}, ${pts(f.cells ? f.n / f.cells : null)}`
    un.push(...unanimous(rs, own), ...unanimous(rs, cross))
    if (overLine(f.n, f.cells, rule.maxFlakePct)) { stopped.push(`${req}: flakes over ${rule.maxFlakePct} % of its cells; no Q`); lines.push(`| ${req} | ${own}, ${cross} | ${rs.length} | ${fl} | - | - | - | no Q (flakes) |`); continue }
    let qo: number, qc: number
    try {
      const q = (id: string) => screenQ(rs, id, ids(id), errors[id] ?? [], f.by[id])
      qo = q(own); qc = q(cross)
    } catch (e) { stopped.push(`${req}: ${(e as Error).message}`); lines.push(`| ${req} | ${own}, ${cross} | ${rs.length} | ${fl} | - | - | - | no Q |`); continue }
    Q[req] = round(100 * (qo + qc) / 2)
    lines.push(`| ${req} | ${own}, ${cross} | ${rs.length} | ${fl} | ${pts(qo)} | ${pts(qc)} | ${Q[req].toFixed(1)} | ${Q[req] >= rule.ceilingPct ? 'ceiling' : Q[req] < rule.floorPct ? 'floor' : 'band'} |`)
  }
  if (flakesFile && !checkFlakes(flakesFile, allFlakes)) return 1
  const go = screen(Q, rule.maxRequests, rule.ceilingPct, rule.floorPct)
  console.log([...lines, '', errorsFile ? `Q without the scenarios in ${errorsFile}.` : 'No screen-errors file: every scenario counted.',
    `Q without the flakes of each build (the last ${rule.judgements} judgements)${flakesFile ? `; they match ${flakesFile}` : ''}.`,
    `requests that go on: ${go.join(', ') || '(none)'}`, `left out (delete their main steps and prereg entries): ${rule.requests.filter((r) => !go.includes(r)).join(', ') || '(none)'}`, '',
    '## Requests with no Q (tell the secretary before gate main)', '', ...(stopped.length ? stopped.map((s) => `- ${s}`) : ['- none']), '',
    '## Flakes (the content of screen-flakes.json; read each scenario before gate main)', '', JSON.stringify(allFlakes, null, 2), '',
    '## Scenarios every screen build failed (read each one before gate main: the factory first, then the errors rule)', '', ...(un.length ? un : ['- none'])].join('\n'))
  return 0
}

// ---- lap 10: one verdict across requests ----
// In the rule: a request with every spec at k builds, at neither the ceiling nor the floor (raw or corrected), no dropped pair.
export const atCeiling = (P: Record<string, number | null>, pct: number) => Object.values(P).every((x) => x !== null && round(100 * x) >= pct)
export const atFloor = (P: Record<string, number | null>, pct: number) => Object.values(P).every((x) => x !== null && round(100 * x) <= pct)
export function finalVerdict(raw: Verdict, cor: Verdict | null, offBand: boolean): Verdict {
  return offBand || (cor !== null && cor !== raw) ? '?' : raw
}
export type ReqResult = { c: Contrasts; inRule: boolean }
export function across(byReq: Record<string, ReqResult>, minRequests: number): { scenario: string; spec: string; D: string; used: string[] } {
  const used = Object.keys(byReq).filter((r) => byReq[r].inRule)
  if (used.length < minRequests) { const v = `undecided (fewer than ${minRequests} requests in the rule)`; return { scenario: v, spec: v, D: v, used } }
  const same = (xs: string[]) => (new Set(xs).size === 1 && xs[0] !== 'undecided' && !xs[0].includes('interaction') ? xs[0] : 'undecided')
  const d = same(used.map((r) => ({ '+': 'lower with the other family', '-': 'higher with the other family (reverse)', '0': 'no effect', '?': 'undecided' })[byReq[r].c.D.v]))
  return {
    scenario: same(used.map((r) => attribute(byReq[r].c.Ds_c.v, byReq[r].c.Ds_x.v, ['Claude-spec', 'Codex-spec']))),
    spec: same(used.map((r) => attribute(byReq[r].c.Dp_c.v, byReq[r].c.Dp_x.v, ['Claude-scenario', 'Codex-scenario']))),
    D: d, used,
  }
}

function analyse(pre: Prereg, sd: string, errors: Record<string, string[]>) {
  const res: Record<string, Record<Stratum, { P: Record<string, number | null>; c: Contrasts; complete: boolean; emptied: boolean }>> = {}
  for (const [req, { pairs }] of Object.entries(pre.requests)) {
    const arms = { cc: [] as string[], cx: [] as string[], xx: [] as string[], xc: [] as string[] }
    for (const p of pairs) { arms[`${p.spec}${p.spec}` as 'cc' | 'xx'].push(p.own); arms[p.spec === 'c' ? 'cx' : 'xc'].push(p.cross ?? '') }
    res[req] = {} as never
    for (const st of ['all', 'spec', 'rest'] as Stratum[]) {
      const P: Record<string, number | null> = {}
      let complete = true, emptied = false
      for (const p of pairs) {
        const r = rates(sd, p.own, p.cross ? [p.own, p.cross] : [p.own], st, errors, pre.judgements)
        if (r.builds !== pre.k || r.short) complete = false
        emptied ||= r.emptied
        for (const [id, xs] of Object.entries(r.rates)) P[id] = mean(xs)
      }
      const c = contrasts(P, arms, pre.lines)
      if (!complete || pairs.some((p) => !p.cross)) for (const v of Object.values(c)) v.v = '?'
      res[req][st] = { P, c, complete, emptied }
    }
  }
  return res
}

function report(pre: Prereg, sd: string, errorsFile?: string, flakesFile?: string): string {
  for (const [id, v] of Object.entries(pre.approvedVersions)) {
    const a = join(sd, 'vault', id, 'approval.json')
    if (!existsSync(a) || readJson(a).version !== v) throw new Error(`${id}: approved version is not the pre-registered ${v}`)
  }
  const errors: Record<string, string[]> = errorsFile ? readJson(errorsFile) : {}
  const raw = analyse(pre, sd, {}), cor = errorsFile ? analyse(pre, sd, errors) : null
  const lines = ['# Lap 12: first-attempt pass rates by drafter family, per request', '',
    `k = ${pre.k}; lines: effect ${pre.lines.effectPts} pts (all combinations one way), null under ${pre.lines.nullPts} pts; ceiling: every set >= ${pre.ceilingPct} %; floor: every set <= ${pre.floorPct} %.` +
    ` Every P leaves out each build's flakes (the last ${pre.judgements} judgements); a request with flakes over ${pre.maxFlakePct} % of its cells is undecided.` + (cor ? ` Corrected = also without the scenarios in ${errorsFile}.` : ' No errors file: raw figures only.'), '']
  const fin: Record<string, ReqResult> = {}, allFlakes: Flakes = {}
  const uiRows = ['| request | set | ui steps | scenarios with ui steps | ui steps without expect | flakes (cells, %) |', '|---|---|---|---|---|---|']
  const uRows = ['| request | U per spec (%) | U (%) |', '|---|---|---|']
  for (const [req, { pairs }] of Object.entries(pre.requests)) {
    const cls = (id: string | null): Classified[] => (id ? readJson(join(sd, 'vault', id, 'classification.json')) : [])
    const us = pairs.map((p) => undecidedShare([cls(p.own), cls(p.cross)]))
    uRows.push(`| ${req} | ${us.map((x) => x?.toFixed(1) ?? 'n/a').join(', ')} | ${us.every((x) => x !== null) ? median(us as number[]).toFixed(1) : 'n/a'} |`)
    let fn = 0, fc = 0
    for (const p of pairs) {
      const sets = p.cross ? [p.own, p.cross] : [p.own], sc = Object.fromEntries(sets.map((id) => [id, readJson(join(sd, 'vault', id, 'scenarios.json')) as { id: string; steps: UiStep[] }[]]))
      const jd = judged(sd, p.own, pre.judgements), f = flakesOf(jd, Object.fromEntries(sets.map((id) => [id, sc[id].map((x) => x.id)])))
      Object.assign(allFlakes, f.flakes); fn += f.n; fc += f.cells
      for (const id of sets) {
        const x = uiSteps(sc[id]), n = Object.values(f.flakes[id] ?? {}).flat().length, cells = sc[id].length * jd.length
        uiRows.push(`| ${req} | ${id} | ${x.steps} | ${x.scenarios} of ${x.of} | ${x.noExpect} | ${n} of ${cells}, ${pts(cells ? n / cells : null)} |`)
      }
    }
    const offRaw = atCeiling(raw[req].all.P, pre.ceilingPct) ? 'CEILING' : atFloor(raw[req].all.P, pre.floorPct) ? 'FLOOR' : null
    const offCor = cor ? (atCeiling(cor[req].all.P, pre.ceilingPct) ? 'CEILING' : atFloor(cor[req].all.P, pre.floorPct) ? 'FLOOR' : null) : null
    const emptied = raw[req].all.emptied ? 'STOPPED: a build keeps no scenario of a set after the exclusions' : cor?.[req].all.emptied ? 'STOPPED: a build keeps no scenario of a set after the exclusions (corrected figures)' : null
    const off = overLine(fn, fc, pre.maxFlakePct) ? `FLAKES: ${fn} of ${fc} cells, over ${pre.maxFlakePct} %` : emptied ?? offRaw ?? (offCor ? `${offCor} in the corrected figures` : null)
    for (const st of ['all', 'spec', 'rest'] as Stratum[]) {
      const r = raw[req][st], c = cor?.[req][st]
      lines.push(`## ${req}, scenarios: ${st}${r.complete ? '' : ' (INCOMPLETE: a spec has fewer than k builds, or a build fewer judgements than the rule)'}${off ? ` (${off}: every verdict undecided)` : ''}`, '',
        '| set | P raw (%) |' + (c ? ' P corrected (%) |' : ''), '|---|---|' + (c ? '---|' : ''))
      for (const id of Object.keys(r.P)) lines.push(`| ${id} | ${pts(r.P[id])} |` + (c ? ` ${pts(c.P[id])} |` : ''))
      lines.push('', '| contrast | raw d (pts) | raw | ' + (c ? 'corrected d | corrected | ' : '') + 'verdict |', '|---|---|---|' + (c ? '---|---|' : '') + '---|')
      const merged = {} as Contrasts
      for (const k of KEYS) {
        const v = finalVerdict(r.c[k].v, c ? c.c[k].v : null, off !== null)
        merged[k] = { d: r.c[k].d, v }
        lines.push(`| ${k} | ${r.c[k].d?.toFixed(1) ?? 'n/a'} | ${r.c[k].v} | ` + (c ? `${c.c[k].d?.toFixed(1) ?? 'n/a'} | ${c.c[k].v} | ` : '') + `${v} |`)
      }
      if (st === 'all') fin[req] = { c: merged, inRule: r.complete && off === null && pairs.every((p) => p.cross) }
      lines.push('')
    }
    const f = fin[req].c
    lines.push(`**${req}**: S-bar ${sBar(raw[req].all.c)?.toFixed(1) ?? 'n/a'} pts; D ${f.D.v}; scenario family: ${attribute(f.Ds_c.v, f.Ds_x.v, ['Claude-spec', 'Codex-spec'])}; spec family: ${attribute(f.Dp_c.v, f.Dp_x.v, ['Claude-scenario', 'Codex-scenario'])}`, '')
  }
  if (flakesFile && !sameFlakes(readJson(flakesFile), allFlakes)) throw new Error(`${flakesFile} does not match the flakes found:\n${JSON.stringify(allFlakes, null, 2)}`)
  const a = across(fin, pre.minRequests)
  const un = Object.values(pre.requests).flatMap(({ pairs }) => pairs.flatMap((p) => (p.cross ? [p.own, p.cross] : [p.own]).flatMap((id) => unanimous(reps(sd, p.own), id))))
  lines.push('## Across requests (the main verdict)', '', `- requests in the rule: ${a.used.join(', ') || '(none)'}`, `- scenario family (main): ${a.scenario}`, `- spec family: ${a.spec}`, `- D: ${a.D}`, '',
    '## Undecided share U (descriptive; checks other than status codes, own + cross)', '', ...uRows, '',
    '## The ui steps and the flakes (descriptive)', '', ...uiRows, '',
    `## Flakes (the content of flakes.json${flakesFile ? `; they match ${flakesFile}` : ''})`, '', JSON.stringify(allFlakes, null, 2), '',
    '## Scenarios every build of a spec failed (read them against the errors rule)', '', ...(un.length ? un : ['- none']), '')
  return lines.join('\n')
}

function selfTest() {
  const L = { effectPts: 10, nullPts: 5 }
  // lap 8 lines, boundaries included
  assert.equal(verdict([0.9, 0.8], [0.6, 0.65], ALL2, L).v, '+')
  assert.deepEqual(verdict([1, 1], [0.9000000000000001, 1], PAIRED, L), { d: 5, v: '?' })
  assert.deepEqual(verdict([1, 1], [0.9, 0.9], PAIRED, L), { d: 10, v: '+' })
  assert.equal(verdict([0.6, 0.6], [0.62, 0.61], ALL2, L).v, '0')
  assert.equal(verdict([0.5, 0.5], [0.7, 0.8], ALL2, L).v, '-')
  assert.equal(verdict([0.9, null], [0.5, 0.5], ALL2, L).v, '?')
  // redraft names (#32): <id>, <id>-r2, <id>-r3; a longer id with the same prefix is another set
  const vault = ['a-cc-1', 'a-cc-12', 'b-cc-1-r3', 'b-cc-1', 'b-cc-1-r2', 'c-cx-p']
  assert.equal(resolveIn(vault, 'a-cc-1'), 'a-cc-1')
  assert.equal(resolveIn(vault, 'b-cc-1'), 'b-cc-1-r3')
  assert.deepEqual(lineage(vault, 'b-cc-1'), ['b-cc-1', 'b-cc-1-r2', 'b-cc-1-r3'])
  assert.equal(resolveIn(vault, 'c-cx-p'), 'c-cx-p')
  assert.equal(resolveIn(vault, 'd-cc-1'), 'd-cc-1')
  // pre-check: pairs are unordered and de-duplicated; a pair naming an unlisted rule is an error
  assert.equal(pairCount({ rules: ['a', 'b', 'c'], pairs: ['a|b: x', 'b|a: y', 'b|c: z'] }), 2)
  assert.throws(() => pairCount({ rules: ['a'], pairs: ['a|q: x'] }))
  assert.throws(() => pairCount({ rules: ['a'], pairs: ['a|a: x'] }))
  const R = (n: number) => ({ rules: Array.from({ length: n + 1 }, (_, i) => `r${i}`), pairs: Array.from({ length: n }, (_, i) => `r${i}|r${i + 1}: t`) })
  const W = { k1: 1, k2: 1, x: 700, y: 700 }, S = (n: number, ui: number) => ({ ...R(n), ui: R(n).rules.slice(0, ui) })
  const rq = (x: object, y: object) => ({ pairsTimes: 2, calibration: ['k1', 'k2'], candidates: ['x', 'y'], words: [694, 901] as [number, number], minUi: 8, requests: { k1: R(5), k2: R(7), x, y } as Record<string, Req> })
  assert.deepEqual(precheck(rq(S(14, 8), S(13, 8)), W).pass, { x: true, y: false }) // exactly 2 x 7 passes
  // lap 11: words within the range (both ends in); lap 12: at least minUi ui rules
  assert.deepEqual(precheck(rq(S(14, 8), S(14, 7)), W).pass, { x: true, y: false })
  assert.deepEqual(precheck(rq(S(14, 8), S(14, 8)), { ...W, x: 694, y: 902 }).pass, { x: true, y: false })
  assert.deepEqual(precheck(rq(S(14, 8), S(14, 8)), { ...W, x: 901, y: 693 }).pass, { x: true, y: false })
  assert.throws(() => uiCount({ rules: ['a'], pairs: [], ui: ['q'] }), /not a listed rule/)
  assert.throws(() => uiCount({ rules: ['a'], pairs: [], ui: ['a', 'a'] }), /twice/)
  assert.equal(wordCount('# A b\n\n- `c` d, e.\n'), 7)
  // the ui steps: counted per set, with the scenarios that have one and the steps without an expect
  assert.deepEqual(uiSteps([{ id: 'k', steps: [{ ui: 'goto', expect: {} }, {}, { ui: 'click' }, { ui: 'fill' }] }, { id: 'j', steps: [{}] }]), { steps: 3, scenarios: 1, of: 2, noExpect: 2 })
  // the flake rule: history in k order (10 after 2), another build's files and other names left out
  assert.deepEqual(historyNames(['b.1.json', 'b.10.json', 'b.2.json', 'b-1.1.json', 'b1.1.json', 'b.x.json', 'b.3.json.tmp'], 'b'), ['b.1.json', 'b.2.json', 'b.10.json'])
  const jr = (k: boolean | null, j: boolean): Rep => ({ results: { s: [...(k === null ? [] : [{ id: 'k', pass: k }]), { id: 'j', pass: j }] } })
  assert.deepEqual(flaky([jr(true, true), jr(false, true), jr(true, true)], 's'), ['k'])
  assert.deepEqual(flaky([jr(null, true), jr(false, true), jr(false, true)], 's'), []) // a judgement without the scenario does not count
  assert.deepEqual(flaky([jr(true, false)], 's'), [])
  const jd: Judged[] = [{ build: 'm-1', js: [jr(true, true), jr(false, true), jr(true, true)] }, { build: 'm-2', js: [jr(true, true), jr(true, true), jr(true, false)] }]
  const fo = flakesOf(jd, { s: ['k', 'j'], t: ['k'] })
  assert.deepEqual(fo.flakes, { s: { k: ['m-1'], j: ['m-2'] } })
  assert.deepEqual(fo.by, { s: [['k'], ['j']], t: [[], []] })
  assert.deepEqual([fo.n, fo.cells], [2, 6])
  assert.equal(sameFlakes({ s: { j: ['m-2'], k: ['m-1'] }, t: {} }, fo.flakes), true)
  assert.equal(sameFlakes({ s: { k: ['m-1'] } }, fo.flakes), false)
  // the stop line: over maxFlakePct, exactly at it passes (5 % of 20 cells = 1)
  assert.equal(overLine(1, 20, 5), false); assert.equal(overLine(2, 39, 5), true); assert.equal(overLine(0, 0, 5), false)
  // screen Q without each build's flakes (numerator and denominator); a build left with none stops the count
  assert.equal(screenQ([jr(false, true), jr(false, true)], 's', ['k', 'j'], [], [['k'], []]), 0.75)
  assert.throws(() => screenQ([jr(false, true)], 's', ['k', 'j'], ['j'], [['k']]), /keeps no scenario/)
  // the main P: flakes leave the fraction; a build with results that keeps none is emptied (the request stops), one without results is not
  const all = () => true, xs2 = jr(false, true).results.s
  assert.deepEqual(buildRate(xs2, all, ['k']), { r: 1, emptied: false })
  assert.deepEqual(buildRate(xs2, (sid) => sid !== 'j', ['k']), { r: null, emptied: true })
  assert.deepEqual(buildRate([], all, []), { r: null, emptied: false })
  // placeholders: filled places counted; unfilled places and names used before their capture are problems
  const sc = [{ id: 's', steps: [
    { path: '/g', expect: {}, capture: { g: 'id' } },
    { path: '/g/{{g}}', body: { shares: { '{{g}}': 1 } }, expect: { json: { '{{g}}': 1 }, jsonHas: ['owed.{{g}}'], length: { '{{g}}': 1 } }, capture: { m: 'members.0.id' } },
    { path: '/x/{{m}}/{{late}}', expect: { json: '{{m}}' }, capture: { late: 'id' } },
  ] }]
  const p = placeholders(sc)
  assert.deepEqual(p.where, { path: 3, body: 1, 'expect.json': 2 })
  assert.deepEqual(p.bad, ['s step 1: {{g}} in expect.jsonHas, which the runner does not fill', 's step 1: {{g}} in expect.length keys, which the runner does not fill', 's step 2: {{late}} in path before any step captured it'])
  // screen: band [floor, ceiling), lowest Q first, listed order on ties
  assert.deepEqual(screen({ a: 95, b: 70, c: 29.9, d: 30, e: 70, f: 89.9 }, 3, 90, 30), ['d', 'b', 'e'])
  assert.deepEqual(screen({ a: 90, b: 100 }, 3, 90, 30), [])
  // screen Q: excluded scenarios leave the fraction; a build without results counts 0; all excluded is an error (review of the design)
  const qr = (a: boolean, b: boolean): Rep => ({ results: { s: [{ id: 'k', pass: a }, { id: 'j', pass: b }] } })
  assert.equal(screenQ([qr(false, true), qr(false, true)], 's', ['k', 'j'], []), 0.5)
  assert.equal(screenQ([qr(false, true), qr(false, true)], 's', ['k', 'j'], ['k']), 1)
  assert.equal(screenQ([qr(true, true), { results: {} }], 's', ['k', 'j'], []), 0.5)
  assert.throws(() => screenQ([qr(true, true)], 's', ['k', 'j'], ['k', 'j']), /every scenario/)
  // unanimous: every build fails, with the steps / details seen
  const rep = (pass: boolean, detail = 'x'): Rep => ({ results: { s: [{ id: 'k', pass, failedStep: 2, detail }, { id: 'j', pass: true }] } })
  assert.deepEqual(unanimous([rep(false, 'a'), rep(false, 'b')], 's'), ['- s / k (all 2 builds fail; step 2: a | step 2: b)'])
  assert.deepEqual(unanimous([rep(false), rep(true)], 's'), [])
  // ceiling / floor
  assert.equal(atCeiling({ a: 0.9499999999999999, b: 1 }, 95), true)
  assert.equal(atFloor({ a: 0.2, b: 0.1 }, 20), true); assert.equal(atFloor({ a: 0.21, b: 0.1 }, 20), false)
  assert.equal(finalVerdict('+', '+', true), '?'); assert.equal(finalVerdict('+', '0', false), '?'); assert.equal(finalVerdict('+', null, false), '+')
  // across requests
  const con = (dsc: Verdict, dsx: Verdict, D: Verdict = '0'): Contrasts => ({ D: { d: 0, v: D }, Ds_c: { d: 0, v: dsc }, Ds_x: { d: 0, v: dsx }, Dp_c: { d: 0, v: '0' }, Dp_x: { d: 0, v: '0' } })
  assert.equal(across({ a: { c: con('+', '+', '+'), inRule: true }, b: { c: con('+', '+', '+'), inRule: true } }, 2).scenario, 'lower with the other family')
  assert.equal(across({ a: { c: con('+', '+', '+'), inRule: true }, b: { c: con('+', '+', '+'), inRule: true } }, 2).D, 'lower with the other family')
  assert.equal(across({ a: { c: con('0', '0'), inRule: true }, b: { c: con('0', '0'), inRule: true } }, 2).scenario, 'no effect')
  assert.equal(across({ a: { c: con('+', '+'), inRule: true }, b: { c: con('0', '0'), inRule: true } }, 2).scenario, 'undecided')
  assert.equal(across({ a: { c: con('+', '0'), inRule: true }, b: { c: con('+', '0'), inRule: true } }, 2).scenario, 'undecided') // interactions do not add up
  assert.match(across({ a: { c: con('+', '+'), inRule: true }, b: { c: con('+', '+'), inRule: false } }, 2).scenario, /fewer than 2/)
  // provenance with both redraft styles
  const claude = (role: string): Call => ({ role, requested: FAMILY.c, answered: FAMILY.c })
  const codex = (role: string): Call => ({ role, requested: FAMILY.x, answered: null, counted: true })
  assert.deepEqual(provenance('stock-backorder-cx-p', { calls: [codex('scenario-drafter'), claude('classifier')], countedCalls: 1, specFrom: 'stock-backorder-cc-p-r2' }), [])
  assert.deepEqual(provenance('task-deps-xc-1-r2', { calls: [claude('scenario-drafter'), claude('classifier')], countedCalls: 0, specFrom: 'task-deps-xx-1-r3' }), [])
  assert.deepEqual(provenance('task-deps-xx-2-r2', { calls: [codex('spec-drafter'), codex('scenario-drafter'), claude('classifier')], countedCalls: 2, specFrom: null }), [])
  assert.equal(provenance('task-deps-xc-1', { calls: [claude('scenario-drafter'), claude('classifier')], countedCalls: 0, specFrom: 'task-deps-xx-12' }).length, 1)
  assert.equal(provenance('task-deps-cx-1', { calls: [claude('scenario-drafter'), claude('classifier')], countedCalls: 0, specFrom: 'task-deps-cc-1' }).length, 1)
  console.log('arms.ts self-test: ok')
}

if (import.meta.main ?? process.argv[1]?.endsWith('arms.ts')) {
  const [a, b, ...rest] = process.argv.slice(2)
  if (a === '--self-test') selfTest()
  else if (a === '--precheck' && b) process.exit(precheckMain(readJson(b)))
  else if (a === '--provenance' && b && rest.length) process.exit(provenanceMain(b, rest))
  else if (a === '--placeholders' && b && rest.length > 1) process.exit(placeholdersMain(b, rest[0], rest.slice(1)))
  else if (a === '--screen' && b && rest[0]) process.exit(screenMain(readJson(b), rest[0], rest[1], rest[2]))
  else if (a && b && !existsSync(a)) { console.error(`arms.ts: ${a} does not exist (the lap stopped before gate "entrance" fixed it); no analysis`); process.exit(1) }
  else if (a && b) console.log(report(readJson(a), b, rest[0], rest[1]))
  else { console.error('usage: arms.ts --self-test | --precheck <rules.json> | --provenance <STATE> <id>... | --placeholders <STATE> <out.md> <id>... | --screen <screen.json> <STATE> [screen-errors.json [screen-flakes.json]] | <prereg.json> <STATE> [errors.json [flakes.json]]'); process.exit(2) }
}
