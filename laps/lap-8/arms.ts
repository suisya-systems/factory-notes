// Lap 8 tools (no model call).
// --provenance: per drafted set, the calls in draft-cost.json match the set's name <req>-<spec family><scenario family>-<k>
//   (c = claude-opus-5-5, x = gpt-6-astra): which model each role was asked for, the spec's lineage, counted calls.
// <prereg.json> <STATE> [errors.json]: the first-attempt pass rate per scenario set, per arm (cc / cx / xx / xc), the
//   contrasts D, Ds_c, Ds_x, Dp_c, Dp_x with the pre-registered lines, the attribution table and the lap's conclusion.
//   Lines: laps/lap-8/runbook.md ("判定の線").
// usage: node --experimental-strip-types --no-warnings docs/lap-8/arms.ts --provenance <STATE> <id>...
//        node --experimental-strip-types --no-warnings docs/lap-8/arms.ts <prereg.json> <STATE> [errors.json]
//        node --experimental-strip-types --no-warnings docs/lap-8/arms.ts --self-test
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const FAMILY: Record<string, string> = { c: 'claude-opus-5-5', x: 'gpt-6-astra' }
const readJson = (f: string) => JSON.parse(readFileSync(f, 'utf8'))

// ---- provenance ----
type Call = { role: string; requested: string | null; answered: string | null; counted?: true }
export function provenance(id: string, cost: { calls?: Call[]; countedCalls?: number; specFrom?: string | null } | null): string[] {
  const m = id.match(/^([a-z0-9]+)-([cx])([cx])-(\d+)(?:r\d+)?$/)
  if (!m) return [`${id}: not a lap-8 set name`]
  if (!cost?.calls) return [`${id}: no per-call record (draft-cost.json missing or from before lap 8)`]
  const [, req, a, b, k] = m, bad: string[] = []
  const of = (role: string) => cost.calls!.filter((c) => c.role === role)
  const wantFrom = a === b ? null : `${req}-${a}${a}-${k}`
  if ((cost.specFrom ?? null) !== wantFrom) bad.push(`${id}: spec from ${cost.specFrom ?? '(own draft)'}, expected ${wantFrom ?? '(own draft)'}`)
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
  const counted = cost.calls.filter((c) => c.counted).length
  if ((cost.countedCalls ?? 0) !== counted) bad.push(`${id}: countedCalls ${cost.countedCalls} != ${counted} counted calls listed`)
  return bad
}

function provenanceMain(sd: string, ids: string[]): number {
  const lines = ['| set | spec from | spec-drafter calls | scenario-drafter calls | classifier calls | counted calls | USD |', '|---|---|---|---|---|---|---|']
  const bad: string[] = []
  for (const id of ids) {
    const f = join(sd, 'runs', id, 'draft-cost.json')
    const cost = existsSync(f) ? readJson(f) : null
    bad.push(...provenance(id, cost))
    const n = (role: string) => (cost?.calls ?? []).filter((c: Call) => c.role === role).length
    lines.push(`| ${id} | ${cost?.specFrom ?? '-'} | ${n('spec-drafter')} | ${n('scenario-drafter')} | ${n('classifier')} | ${cost?.countedCalls ?? 0} | ${(cost?.totalUsd ?? 0).toFixed(4)} |`)
  }
  console.log(lines.join('\n'))
  if (bad.length) { console.error(['provenance check failed:', ...bad.map((b) => `- ${b}`)].join('\n')); return 1 }
  console.log(`provenance: ${ids.length} sets as named`)
  return 0
}

// ---- analysis ----
type Pair = { spec: 'c' | 'x'; own: string; cross: string | null } // cross null: the pair was dropped (its set could not be drafted)
export type Prereg = { k: number; requests: Record<string, { pairs: Pair[] }>; approvedVersions: Record<string, string>; lines: { effectPts: number; nullPts: number } }
type Rep = { n: number; builderOk: boolean; results: Record<string, { id: string; pass: boolean }[]> }
type Stratum = 'all' | 'spec' | 'rest'
export type Verdict = '+' | '-' | '0' | '?'
// Per set: one pass fraction per build (null: the stratum is empty for this set).
export type Rates = Record<string, (number | null)[]>

const mean = (xs: (number | null)[]): number | null => (xs.length && xs.every((x) => x !== null) ? (xs as number[]).reduce((a, b) => a + b, 0) / xs.length : null)
const pts = (x: number | null) => (x === null ? 'n/a' : (100 * x).toFixed(1))

// One contrast: diff of the arm means (points), and whether every listed combination of sets points the same way.
export function verdict(left: (number | null)[], right: (number | null)[], combos: [number, number][], lines: Prereg['lines']): { d: number | null; v: Verdict } {
  const l = mean(left), r = mean(right)
  if (l === null || r === null) return { d: null, v: '?' }
  const d = Math.round(1e9 * 100 * (l - r)) / 1e9 // the lines compare exact points: 0.95 as a float mean must not slip under 5
  const all = (f: (a: number, b: number) => boolean) => combos.every(([i, j]) => f(left[i] as number, right[j] as number))
  if (d >= lines.effectPts && all((a, b) => a > b)) return { d, v: '+' }
  if (d <= -lines.effectPts && all((a, b) => a < b)) return { d, v: '-' }
  if (Math.abs(d) < lines.nullPts) return { d, v: '0' }
  return { d, v: '?' }
}

// The attribution table of the runbook: two contrasts of one factor (one per level of the other factor) -> a reading.
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
export type Contrasts = Record<'D' | 'Ds_c' | 'Ds_x' | 'Dp_c' | 'Dp_x', { d: number | null; v: Verdict }>
// arms: per arm, the set ids in pair order (k = 1, 2).
export function contrasts(P: Record<string, number | null>, arms: Record<'cc' | 'cx' | 'xx' | 'xc', string[]>, lines: Prereg['lines']): Contrasts {
  const of = (a: keyof typeof arms) => arms[a].map((id) => P[id] ?? null)
  return {
    D: verdict(of('cc'), of('xx'), ALL2, lines),
    Ds_c: verdict(of('cc'), of('cx'), PAIRED, lines), // the same builds (a Claude spec), Claude vs Codex scenarios
    Ds_x: verdict(of('xc'), of('xx'), PAIRED, lines), // the same builds (a Codex spec)
    Dp_c: verdict(of('cc'), of('xc'), ALL2, lines), // Claude scenarios, Claude vs Codex specs
    Dp_x: verdict(of('cx'), of('xx'), ALL2, lines), // Codex scenarios
  }
}

export function conclusion(byReq: Record<string, Contrasts>): string {
  const cs = Object.values(byReq)
  const S = (c: Contrasts) => attribute(c.Ds_c.v, c.Ds_x.v, ['Claude-spec', 'Codex-spec'])
  if (cs.length && cs.every((c) => c.D.v === '+')) {
    return `the other family lowers the pass rate (D + in every request); scenario family: ${cs.map(S).join(' / ')}` +
      (cs.every((c) => S(c) === 'lower with the other family') ? '; same-family hidden scenarios are lenient (against premise 1)' : '')
  }
  if (cs.length && cs.every((c) => (['D', 'Ds_c', 'Ds_x', 'Dp_c', 'Dp_x'] as const).every((k) => c[k].v === '0'))) return 'no family difference visible in these requests'
  return 'depends on the request, or undecided (see the tables)'
}

// The spec layer (runbook, changed at the entrance before any build): every check other than a status code is
// readable from the spec (M, basis spec). A scenario of status checks only is not in it.
type Classified = { id: string; checks?: { check: string; result: string; basis?: string }[] }
export const inSpecLayer = (c: Classified) => {
  const ks = (c.checks ?? []).filter((k) => !k.check.startsWith('status'))
  return ks.length > 0 && ks.every((k) => k.result === 'M' && k.basis === 'spec')
}

// Pass fraction of each build on each set, per stratum. errors: scenario ids excluded per set (the corrected figures).
function rates(sd: string, specId: string, sets: string[], stratum: Stratum, errors: Record<string, string[]>): { rates: Rates; builds: number } {
  const dir = join(sd, 'runs', specId, 'replicates')
  const reps: Rep[] = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(join(dir, f))) : []
  const out: Rates = {}
  for (const id of sets) {
    const cls: Classified[] = readJson(join(sd, 'vault', id, 'classification.json'))
    const specLayer = new Set(cls.filter(inSpecLayer).map((c) => c.id))
    const keep = (sid: string) => !(errors[id] ?? []).includes(sid) && (stratum === 'all' || specLayer.has(sid) === (stratum === 'spec'))
    out[id] = reps.map((r) => {
      const rs = (r.results[id] ?? []).filter((x) => keep(x.id))
      return rs.length ? rs.filter((x) => x.pass).length / rs.length : null
    })
  }
  return { rates: out, builds: reps.length }
}

function analyse(pre: Prereg, sd: string, errors: Record<string, string[]>) {
  const res: Record<string, Record<Stratum, { P: Record<string, number | null>; c: Contrasts; complete: boolean }>> = {}
  for (const [req, { pairs }] of Object.entries(pre.requests)) {
    const arms = { cc: [] as string[], cx: [] as string[], xx: [] as string[], xc: [] as string[] }
    for (const p of pairs) { arms[`${p.spec}${p.spec}` as 'cc' | 'xx'].push(p.own); arms[(p.spec === 'c' ? 'cx' : 'xc')].push(p.cross) }
    res[req] = {} as never
    for (const st of ['all', 'spec', 'rest'] as Stratum[]) {
      const P: Record<string, number | null> = {}
      let complete = true
      for (const p of pairs) {
        const r = rates(sd, p.own, p.cross ? [p.own, p.cross] : [p.own], st, errors)
        if (r.builds !== pre.k) complete = false
        for (const [id, xs] of Object.entries(r.rates)) P[id] = mean(xs)
      }
      // A spec with fewer than k builds makes every contrast of the request undecided.
      const c = contrasts(P, arms, pre.lines)
      if (!complete) for (const v of Object.values(c)) v.v = '?'
      // A dropped pair (runbook): the request's verdicts are never stronger than undecided; the differences still show.
      if (pairs.some((p) => !p.cross)) for (const v of Object.values(c)) v.v = '?'
      res[req][st] = { P, c, complete }
    }
  }
  return res
}

// Scenarios that every build of a spec failed: candidates for the errors.json rule (runbook).
function unanimous(sd: string, pre: Prereg): string[] {
  const out: string[] = []
  for (const { pairs } of Object.values(pre.requests)) for (const p of pairs) {
    const dir = join(sd, 'runs', p.own, 'replicates')
    const reps: Rep[] = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readJson(join(dir, f))) : []
    if (!reps.length) continue
    for (const id of p.cross ? [p.own, p.cross] : [p.own]) {
      const ids = (reps[0].results[id] ?? []).map((x) => x.id)
      for (const sid of ids) if (reps.every((r) => r.results[id]?.find((x) => x.id === sid)?.pass === false)) out.push(`- ${id} / ${sid} (all ${reps.length} builds of ${p.own}'s spec fail)`)
    }
  }
  return out
}

function report(pre: Prereg, sd: string, errorsFile?: string): string {
  for (const [id, v] of Object.entries(pre.approvedVersions)) {
    const a = join(sd, 'vault', id, 'approval.json')
    if (!existsSync(a) || readJson(a).version !== v) throw new Error(`${id}: approved version is not the pre-registered ${v}`)
  }
  const errors: Record<string, string[]> = errorsFile ? readJson(errorsFile) : {}
  const raw = analyse(pre, sd, {}), cor = errorsFile ? analyse(pre, sd, errors) : null
  const lines = [`# Lap 8: first-attempt pass rates by drafter family`, '', `k = ${pre.k} builds per spec; lines: effect ${pre.lines.effectPts} pts (all combinations one way), null under ${pre.lines.nullPts} pts.` + (cor ? ` Corrected = without the scenarios in ${errorsFile}.` : ' No errors file: raw figures only.'), '']
  const keys = ['D', 'Ds_c', 'Ds_x', 'Dp_c', 'Dp_x'] as const
  const final: Record<string, Contrasts> = {}
  for (const req of Object.keys(pre.requests)) {
    for (const st of ['all', 'spec', 'rest'] as Stratum[]) {
      const r = raw[req][st], c = cor?.[req][st]
      const dropped = pre.requests[req].pairs.filter((p) => !p.cross).map((p) => p.own)
      lines.push(`## ${req}, scenarios: ${st}${r.complete ? '' : ' (INCOMPLETE: a spec has fewer than k builds)'}${dropped.length ? ` (PAIR DROPPED: no cross set for ${dropped.join(', ')}; every verdict undecided)` : ''}`, '', '| set | P raw (%) |' + (c ? ' P corrected (%) |' : ''), '|---|---|' + (c ? '---|' : ''))
      for (const id of Object.keys(r.P)) lines.push(`| ${id} | ${pts(r.P[id])} |` + (c ? ` ${pts(c.P[id])} |` : ''))
      lines.push('', '| contrast | raw d (pts) | raw | ' + (c ? 'corrected d | corrected | ' : '') + 'verdict |', '|---|---|---|' + (c ? '---|---|' : '') + '---|')
      const merged = {} as Contrasts
      for (const k of keys) {
        const v = c && c.c[k].v !== r.c[k].v ? '?' : r.c[k].v // raw and corrected disagree: undecided (depends on the errors)
        merged[k] = { d: r.c[k].d, v }
        lines.push(`| ${k} | ${r.c[k].d?.toFixed(1) ?? 'n/a'} | ${r.c[k].v} | ` + (c ? `${c.c[k].d?.toFixed(1) ?? 'n/a'} | ${c.c[k].v} | ` : '') + `${v}${c && c.c[k].v !== r.c[k].v ? ' (depends on the errors)' : ''} |`)
      }
      if (st === 'all') final[req] = merged
      lines.push('')
    }
    const f = final[req]
    lines.push(`**${req}**: D ${f.D.v}; scenario family (Ds_c, Ds_x): ${attribute(f.Ds_c.v, f.Ds_x.v, ['Claude-spec', 'Codex-spec'])}; spec family (Dp_c, Dp_x): ${attribute(f.Dp_c.v, f.Dp_x.v, ['Claude-scenario', 'Codex-scenario'])}`, '')
  }
  lines.push('## Conclusion', '', conclusion(final), '', '## Scenarios every build of a spec failed (read them against the errors rule)', '', ...(unanimous(sd, pre).length ? unanimous(sd, pre) : ['- none']), '')
  return lines.join('\n')
}

function selfTest() {
  const L = { effectPts: 10, nullPts: 5 }
  assert.deepEqual(verdict([0.9, 0.8], [0.6, 0.65], ALL2, L).v, '+')
  assert.deepEqual(verdict([1, 1], [0.9000000000000001, 1], PAIRED, L), { d: 5, v: '?' }) // exactly 5 points is not under 5 (lap 8, memo Ds_c)
  const ck = (check: string, result: string, basis = 'spec') => ({ check, result, basis })
  assert.ok(inSpecLayer({ id: 'a', checks: [ck('status 200', 'U'), ck('json', 'M')] })) // an open status code does not count
  assert.ok(!inSpecLayer({ id: 'b', checks: [ck('json', 'M'), ck('has id', 'U')] }))
  assert.ok(!inSpecLayer({ id: 'c', checks: [ck('json', 'M', 'convention')] })) // convention is not the spec
  assert.ok(!inSpecLayer({ id: 'd', checks: [ck('status 404', 'M')] })) // status checks only
  assert.deepEqual(verdict([0.9, 0.6], [0.7, 0.65], ALL2, L).v, '?') // 0.6 < 0.65: not every combination
  assert.deepEqual(verdict([0.6, 0.6], [0.62, 0.61], ALL2, L).v, '0')
  assert.deepEqual(verdict([0.5, 0.5], [0.7, 0.8], ALL2, L).v, '-')
  assert.deepEqual(verdict([0.9, null], [0.5, 0.5], ALL2, L).v, '?') // an empty stratum: no denominator
  assert.deepEqual(verdict([0.9, 0.6], [0.7, 0.4], PAIRED, L).v, '+') // paired: 0.9 > 0.7 and 0.6 > 0.4
  // The review's case: cc = cx = 90, xc = xx = 60 -> D + but no scenario-family effect; the spec family explains it.
  const P = { cc1: 0.9, cc2: 0.9, cx1: 0.9, cx2: 0.9, xx1: 0.6, xx2: 0.6, xc1: 0.6, xc2: 0.6 }
  const c = contrasts(P, { cc: ['cc1', 'cc2'], cx: ['cx1', 'cx2'], xx: ['xx1', 'xx2'], xc: ['xc1', 'xc2'] }, L)
  assert.equal(c.D.v, '+')
  assert.equal(attribute(c.Ds_c.v, c.Ds_x.v, ['a', 'b']), 'no effect')
  assert.equal(attribute(c.Dp_c.v, c.Dp_x.v, ['a', 'b']), 'lower with the other family')
  assert.equal(conclusion({ r: c }), 'the other family lowers the pass rate (D + in every request); scenario family: no effect')
  assert.equal(attribute('+', '0', ['Claude-spec', 'Codex-spec']), 'lower on the Claude-spec side only (interaction)')
  assert.equal(attribute('0', '-', ['Claude-spec', 'Codex-spec']), 'higher on the Codex-spec side only (interaction)')
  assert.equal(attribute('+', '-', ['a', 'b']), 'opposite directions by side (interaction)')
  const zero = { d: 0, v: '0' as Verdict }
  assert.equal(conclusion({ a: { D: zero, Ds_c: zero, Ds_x: zero, Dp_c: zero, Dp_x: zero } }), 'no family difference visible in these requests')
  // provenance
  const claude = (role: string): Call => ({ role, requested: FAMILY.c, answered: FAMILY.c })
  const codex = (role: string): Call => ({ role, requested: FAMILY.x, answered: null, counted: true })
  assert.deepEqual(provenance('settle-xx-1', { calls: [codex('spec-drafter'), codex('scenario-drafter'), claude('classifier')], countedCalls: 2, specFrom: null }), [])
  assert.deepEqual(provenance('settle-cx-2', { calls: [codex('scenario-drafter'), codex('scenario-drafter'), claude('classifier')], countedCalls: 2, specFrom: 'settle-cc-2' }), [])
  assert.deepEqual(provenance('settle-cx-1r1', { calls: [codex('scenario-drafter'), claude('classifier')], countedCalls: 1, specFrom: 'settle-cc-1' }), []) // a redraft keeps its source
  assert.equal(provenance('settle-cx-2', { calls: [claude('scenario-drafter'), claude('classifier')], countedCalls: 0, specFrom: 'settle-cc-2' }).length, 1) // wrong family
  assert.equal(provenance('settle-xc-1', { calls: [claude('scenario-drafter'), claude('classifier')], countedCalls: 0, specFrom: 'settle-cc-1' }).length, 1) // wrong lineage
  assert.equal(provenance('memo-cc-1', { calls: [claude('spec-drafter'), claude('scenario-drafter'), { ...claude('classifier'), answered: 'gpt-6-astra' }], countedCalls: 0, specFrom: null }).length, 1)
  assert.equal(provenance('memo-cc-1', null).length, 1)
  console.log('arms.ts self-test: ok')
}

if (import.meta.main ?? process.argv[1]?.endsWith('arms.ts')) {
  const [a, b, ...rest] = process.argv.slice(2)
  if (a === '--self-test') selfTest()
  else if (a === '--provenance' && b && rest.length) process.exit(provenanceMain(b, rest))
  else if (a && b && !existsSync(a)) { console.error(`arms.ts: ${a} does not exist (the lap stopped before gate "entrance" fixed it); no analysis`); process.exit(1) }
  else if (a && b) console.log(report(readJson(a), b, rest[0]))
  else { console.error('usage: arms.ts --self-test | --provenance <STATE> <id>... | <prereg.json> <STATE> [errors.json]'); process.exit(2) }
}
