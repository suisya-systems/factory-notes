// Lap 9 tools (no model call). The lap 8 analysis (docs/lap-8/arms.ts in feat/factory-16-cross-family-lap) per request,
// plus the undecided share U of each spec, the screen and the request-dependence rule. Rules: docs/lap-9/runbook.md.
// --provenance <STATE> <id>...: the calls in draft-cost.json match the set's name <req>-<spec family><scenario family>-<k|p>.
// --screen <screen.json> <STATE>: Q per request from <req>-cc-p (k builds x the cc-p and cx-p sets); which domains go on.
// <prereg.json> <STATE> [errors.json]: per request the lap 8 tables, U and the ceiling mark; then the dependence rule.
// usage: node --experimental-strip-types --no-warnings docs/lap-9/arms.ts --self-test | --provenance ... | --screen ... | <prereg.json> <STATE> [errors.json]
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const FAMILY: Record<string, string> = { c: 'claude-opus-5-5', x: 'gpt-6-astra' }
const readJson = (f: string) => JSON.parse(readFileSync(f, 'utf8'))

// ---- provenance (lap 8, with request names that contain '-' and the screen's -p sets) ----
type Call = { role: string; requested: string | null; answered: string | null; counted?: true }
export function provenance(id: string, cost: { calls?: Call[]; countedCalls?: number; specFrom?: string | null } | null): string[] {
  const m = id.match(/^([a-z0-9][a-z0-9-]*?)-([cx])([cx])-(\d+|p)(?:r\d+)?$/)
  if (!m) return [`${id}: not a lap-9 set name`]
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

// ---- lap 8 contrasts ----
type Pair = { spec: 'c' | 'x'; own: string; cross: string | null } // cross null: the pair was dropped
type Lines = { effectPts: number; nullPts: number }
export type Prereg = {
  k: number; requests: Record<string, { pairs: Pair[] }>; approvedVersions: Record<string, string>; lines: Lines
  u: { manyPct: number; fewPct: number; manipPts: number }; ceilingPct: number
}
type Rep = { results: Record<string, { id: string; pass: boolean }[]> }
type Stratum = 'all' | 'spec' | 'rest'
export type Verdict = '+' | '-' | '0' | '?'
type Classified = { id: string; checks?: { check: string; result: string; basis?: string }[] }

const mean = (xs: (number | null)[]): number | null => (xs.length && xs.every((x) => x !== null) ? (xs as number[]).reduce((a, b) => a + b, 0) / xs.length : null)
const pts = (x: number | null) => (x === null ? 'n/a' : (100 * x).toFixed(1))
const round = (x: number) => Math.round(1e9 * x) / 1e9 // the lines compare exact points: 4.9999.. must not slip under 5

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
  return {
    D: verdict(of('cc'), of('xx'), ALL2, lines),
    Ds_c: verdict(of('cc'), of('cx'), PAIRED, lines),
    Ds_x: verdict(of('xc'), of('xx'), PAIRED, lines),
    Dp_c: verdict(of('cc'), of('xc'), ALL2, lines),
    Dp_x: verdict(of('cx'), of('xx'), ALL2, lines),
  }
}

export const inSpecLayer = (c: Classified) => {
  const ks = (c.checks ?? []).filter((k) => !k.check.startsWith('status'))
  return ks.length > 0 && ks.every((k) => k.result === 'M' && k.basis === 'spec')
}

const reps = (sd: string, specId: string): Rep[] => {
  const dir = join(sd, 'runs', specId, 'replicates')
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(join(dir, f))) : []
}

// Pass fraction of each build on each set, per stratum. errors: scenario ids excluded per set.
function rates(sd: string, specId: string, sets: string[], stratum: Stratum, errors: Record<string, string[]>) {
  const rs = reps(sd, specId), out: Record<string, (number | null)[]> = {}
  for (const id of sets) {
    const specLayer = new Set((readJson(join(sd, 'vault', id, 'classification.json')) as Classified[]).filter(inSpecLayer).map((c) => c.id))
    const keep = (sid: string) => !(errors[id] ?? []).includes(sid) && (stratum === 'all' || specLayer.has(sid) === (stratum === 'spec'))
    out[id] = rs.map((r) => {
      const xs = (r.results[id] ?? []).filter((x) => keep(x.id))
      return xs.length ? xs.filter((x) => x.pass).length / xs.length : null
    })
  }
  return { rates: out, builds: rs.length }
}

// ---- lap 9: the undecided share U ----
// Of the checks other than status codes, the share the classifier left open (U), over the given sets (own + cross).
export function undecidedShare(sets: Classified[][]): number | null {
  let n = 0, u = 0
  for (const cls of sets) for (const c of cls) for (const k of c.checks ?? []) if (!k.check.startsWith('status')) { n++; if (k.result === 'U') u++ }
  return n ? round(100 * u / n) : null
}
export const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2 }
export const uClass = (u: number, t: Prereg['u']) => (u >= t.manyPct ? 'many' : u < t.fewPct ? 'few' : 'middle')

// ---- lap 9: the screen ----
// A request is at the ceiling when Q >= ceilingPct. Whole domains first (both versions off it; lowest mean Q first, at most
// maxDomains); then, while fewer than maxRequests, single requests off it (lowest Q first). Ties: the listed order.
// Only whole domains enter the dependence rule; a single request gets its own lap 8 verdicts.
export const domainOf = (req: string) => req.match(/^(.*)-(loose|strict)$/)?.slice(1) as [string, 'loose' | 'strict'] | undefined
export function screen(Q: Record<string, number>, maxDomains: number, maxRequests: number, ceilingPct: number): { domains: string[]; requests: string[] } {
  const reqs = Object.keys(Q), off = (r: string) => Q[r] < ceilingPct
  const byQ = (a: { q: number; i: number }, b: { q: number; i: number }) => a.q - b.q || a.i - b.i
  const doms = [...new Set(reqs.map((r) => domainOf(r)![0]))]
  const domains = doms.map((d, i) => ({ d, i, q: (Q[`${d}-loose`] + Q[`${d}-strict`]) / 2 }))
    .filter((x) => off(`${x.d}-loose`) && off(`${x.d}-strict`)).sort(byQ).slice(0, maxDomains).map((x) => x.d)
  const requests = reqs.filter((r) => domains.includes(domainOf(r)![0]))
  const rest = reqs.map((r, i) => ({ r, i, q: Q[r] })).filter((x) => off(x.r) && !requests.includes(x.r)).sort(byQ)
  requests.push(...rest.slice(0, Math.max(0, maxRequests - requests.length)).map((x) => x.r))
  return { domains, requests }
}

type ScreenRule = { k: number; ceilingPct: number; maxDomains: number; maxRequests: number; requests: string[] }
function screenMain(rule: ScreenRule, sd: string): number {
  const Q: Record<string, number> = {}
  const lines = ['| request | builds | Q cc-p (%) | Q cx-p (%) | Q (%) | ceiling |', '|---|---|---|---|---|---|']
  for (const req of rule.requests) {
    const own = `${req}-cc-p`, cross = `${req}-cx-p`, rs = reps(sd, own)
    if (rs.length !== rule.k) { console.error(`screen: ${own} has ${rs.length} builds, the rule needs ${rule.k}`); return 1 }
    // A build without results for a set (it did not start) counts as failing all of that set's scenarios.
    const q = (id: string) => mean(rs.map((r) => { const xs = r.results[id] ?? []; return xs.length ? xs.filter((x) => x.pass).length / xs.length : 0 }))!
    Q[req] = round(100 * (q(own) + q(cross)) / 2)
    lines.push(`| ${req} | ${rs.length} | ${pts(q(own))} | ${pts(q(cross))} | ${Q[req].toFixed(1)} | ${Q[req] >= rule.ceilingPct ? 'yes' : 'no'} |`)
  }
  const s = screen(Q, rule.maxDomains, rule.maxRequests, rule.ceilingPct)
  console.log([...lines, '', `requests that go on: ${s.requests.join(', ') || '(none)'}`, `whole domains (in the dependence rule): ${s.domains.join(', ') || '(none)'}`,
    `left out (delete their main steps and prereg entries): ${rule.requests.filter((r) => !s.requests.includes(r)).join(', ') || '(none)'}`].join('\n'))
  return 0
}

// ---- lap 9: the request-dependence rule ----
export type ReqResult = { c: Contrasts; S: number | null; U: number | null; ceiling: boolean }
export const sBar = (c: Contrasts) => (c.Ds_c.d === null || c.Ds_x.d === null ? null : round((c.Ds_c.d + c.Ds_x.d) / 2))
export function dependence(byReq: Record<string, ReqResult>, pre: Pick<Prereg, 'u' | 'lines'>, key: 'S' | 'D' = 'S'): { verdict: string; domains: Record<string, number | null> } {
  const val = (r: ReqResult) => (key === 'S' ? r.S : r.c.D.d)
  const domains: Record<string, number | null> = {}
  for (const req of Object.keys(byReq)) {
    const dv = domainOf(req); if (!dv) continue
    const L = byReq[`${dv[0]}-loose`], T = byReq[`${dv[0]}-strict`]
    if (!L || !T || dv[0] in domains) continue
    const usable = !L.ceiling && !T.ceiling && L.U !== null && T.U !== null && L.U - T.U >= pre.u.manipPts && val(L) !== null && val(T) !== null
    domains[dv[0]] = usable ? round(val(L)! - val(T)!) : null
  }
  const ds = Object.values(domains).filter((x): x is number => x !== null)
  const loose = (d: string) => val(byReq[`${d}-loose`])!
  const used = Object.keys(domains).filter((d) => domains[d] !== null)
  let verdict = 'undecided'
  if (ds.length < 2) verdict = 'undecided (fewer than 2 domains in the rule)'
  else if (ds.every((x) => x >= pre.lines.effectPts) && used.every((d) => loose(d) >= pre.lines.nullPts)) verdict = 'larger where the spec leaves more open'
  else if (ds.every((x) => x <= -pre.lines.effectPts)) verdict = 'larger where the spec leaves less open (reverse)'
  else if (ds.every((x) => Math.abs(x) < pre.lines.nullPts)) verdict = 'does not depend on how much the spec leaves open'
  return { verdict, domains }
}

function analyse(pre: Prereg, sd: string, errors: Record<string, string[]>) {
  const res: Record<string, Record<Stratum, { P: Record<string, number | null>; c: Contrasts; complete: boolean }>> = {}
  for (const [req, { pairs }] of Object.entries(pre.requests)) {
    const arms = { cc: [] as string[], cx: [] as string[], xx: [] as string[], xc: [] as string[] }
    for (const p of pairs) { arms[`${p.spec}${p.spec}` as 'cc' | 'xx'].push(p.own); arms[p.spec === 'c' ? 'cx' : 'xc'].push(p.cross ?? '') }
    res[req] = {} as never
    for (const st of ['all', 'spec', 'rest'] as Stratum[]) {
      const P: Record<string, number | null> = {}
      let complete = true
      for (const p of pairs) {
        const r = rates(sd, p.own, p.cross ? [p.own, p.cross] : [p.own], st, errors)
        if (r.builds !== pre.k) complete = false
        for (const [id, xs] of Object.entries(r.rates)) P[id] = mean(xs)
      }
      const c = contrasts(P, arms, pre.lines)
      if (!complete || pairs.some((p) => !p.cross)) for (const v of Object.values(c)) v.v = '?'
      res[req][st] = { P, c, complete }
    }
  }
  return res
}

function unanimous(sd: string, pre: Prereg): string[] {
  const out: string[] = []
  for (const { pairs } of Object.values(pre.requests)) for (const p of pairs) {
    const rs = reps(sd, p.own)
    if (!rs.length) continue
    for (const id of p.cross ? [p.own, p.cross] : [p.own]) for (const { id: sid } of rs[0].results[id] ?? [])
      if (rs.every((r) => r.results[id]?.find((x) => x.id === sid)?.pass === false)) out.push(`- ${id} / ${sid} (all ${rs.length} builds of ${p.own}'s spec fail)`)
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
  const lines = ['# Lap 9: first-attempt pass rates by drafter family, per request', '',
    `k = ${pre.k}; lines: effect ${pre.lines.effectPts} pts (all combinations one way), null under ${pre.lines.nullPts} pts; ceiling: every set >= ${pre.ceilingPct} %.` + (cor ? ` Corrected = without the scenarios in ${errorsFile}.` : ' No errors file: raw figures only.'), '']
  const fin: Record<string, ReqResult> = {}, finCor: Record<string, ReqResult> = {}
  const uRows = ['| request | U per spec (%) | U (%) | class |', '|---|---|---|---|']
  for (const [req, { pairs }] of Object.entries(pre.requests)) {
    const cls = (id: string | null): Classified[] => (id ? readJson(join(sd, 'vault', id, 'classification.json')) : [])
    const us = pairs.map((p) => undecidedShare([cls(p.own), cls(p.cross)]))
    const U = us.every((x) => x !== null) ? median(us as number[]) : null
    uRows.push(`| ${req} | ${us.map((x) => x?.toFixed(1) ?? 'n/a').join(', ')} | ${U?.toFixed(1) ?? 'n/a'} | ${U === null ? 'n/a' : uClass(U, pre.u)} |`)
    for (const st of ['all', 'spec', 'rest'] as Stratum[]) {
      const r = raw[req][st], c = cor?.[req][st]
      const ceiling = Object.values(raw[req].all.P).every((x) => x !== null && 100 * x >= pre.ceilingPct)
      lines.push(`## ${req}, scenarios: ${st}${r.complete ? '' : ' (INCOMPLETE: a spec has fewer than k builds)'}${ceiling ? ' (CEILING: every verdict undecided)' : ''}`, '',
        '| set | P raw (%) |' + (c ? ' P corrected (%) |' : ''), '|---|---|' + (c ? '---|' : ''))
      for (const id of Object.keys(r.P)) lines.push(`| ${id} | ${pts(r.P[id])} |` + (c ? ` ${pts(c.P[id])} |` : ''))
      lines.push('', '| contrast | raw d (pts) | raw | ' + (c ? 'corrected d | corrected | ' : '') + 'verdict |', '|---|---|---|' + (c ? '---|---|' : '') + '---|')
      const merged = {} as Contrasts
      for (const k of KEYS) {
        const v = ceiling || (c && c.c[k].v !== r.c[k].v) ? '?' : r.c[k].v
        merged[k] = { d: r.c[k].d, v }
        lines.push(`| ${k} | ${r.c[k].d?.toFixed(1) ?? 'n/a'} | ${r.c[k].v} | ` + (c ? `${c.c[k].d?.toFixed(1) ?? 'n/a'} | ${c.c[k].v} | ` : '') + `${v} |`)
      }
      if (st === 'all') {
        fin[req] = { c: merged, S: sBar(r.c), U, ceiling }
        if (c) finCor[req] = { c: c.c, S: sBar(c.c), U, ceiling: Object.values(c.P).every((x) => x !== null && 100 * x >= pre.ceilingPct) }
      }
      lines.push('')
    }
    const f = fin[req].c
    lines.push(`**${req}**: S-bar ${fin[req].S?.toFixed(1) ?? 'n/a'} pts; D ${f.D.v}; scenario family: ${attribute(f.Ds_c.v, f.Ds_x.v, ['Claude-spec', 'Codex-spec'])}; spec family: ${attribute(f.Dp_c.v, f.Dp_x.v, ['Claude-scenario', 'Codex-scenario'])}`, '')
  }
  const dep = (key: 'S' | 'D') => {
    const r = dependence(fin, pre, key), c = cor ? dependence(finCor, pre, key) : null
    const v = c && c.verdict !== r.verdict ? `undecided (depends on the errors: raw "${r.verdict}", corrected "${c.verdict}")` : r.verdict
    return [`- ${key === 'S' ? 'Delta_S (main)' : 'Delta_D (secondary)'} per domain: ${Object.entries(r.domains).map(([d, x]) => `${d} ${x?.toFixed(1) ?? 'not in the rule'}`).join(', ') || '(none)'}`, `  verdict: ${v}`]
  }
  const un = unanimous(sd, pre)
  lines.push('## Undecided share U (checks other than status codes, own + cross)', '', ...uRows, '', '## Does the effect depend on the request?', '', ...dep('S'), ...dep('D'), '',
    '## Scenarios every build of a spec failed (read them against the errors rule)', '', ...(un.length ? un : ['- none']), '')
  return lines.join('\n')
}

function selfTest() {
  const L = { effectPts: 10, nullPts: 5 }, U = { manyPct: 40, fewPct: 25, manipPts: 20 }
  // lap 8 lines, boundaries included (lap 8 proposal 2)
  assert.equal(verdict([0.9, 0.8], [0.6, 0.65], ALL2, L).v, '+')
  assert.deepEqual(verdict([1, 1], [0.9000000000000001, 1], PAIRED, L), { d: 5, v: '?' }) // exactly 5 is not under 5
  assert.deepEqual(verdict([1, 1], [0.9, 0.9], PAIRED, L), { d: 10, v: '+' }) // exactly 10 is an effect
  assert.equal(verdict([0.9, 0.6], [0.7, 0.65], ALL2, L).v, '?')
  assert.equal(verdict([0.6, 0.6], [0.62, 0.61], ALL2, L).v, '0')
  assert.equal(verdict([0.5, 0.5], [0.7, 0.8], ALL2, L).v, '-')
  assert.equal(verdict([0.9, null], [0.5, 0.5], ALL2, L).v, '?')
  assert.equal(attribute('+', '0', ['Claude-spec', 'Codex-spec']), 'lower on the Claude-spec side only (interaction)')
  const ck = (check: string, result: string, basis = 'spec') => ({ check, result, basis })
  assert.ok(inSpecLayer({ id: 'a', checks: [ck('status 200', 'U'), ck('json', 'M')] }))
  assert.ok(!inSpecLayer({ id: 'd', checks: [ck('status 404', 'M')] }))
  // U: status checks are not counted; own and cross pooled
  assert.equal(undecidedShare([[{ id: 'a', checks: [ck('status 200', 'U'), ck('json', 'U'), ck('has id', 'M')] }], [{ id: 'b', checks: [ck('length x 2', 'M'), ck('json', 'M')] }]]), 25)
  assert.equal(undecidedShare([[{ id: 'a', checks: [ck('status 200', 'U')] }]]), null)
  assert.equal(median([23.6, 44.7, 86.6, 78.3]), 61.5) // lap 8 settle
  assert.equal(uClass(40, U), 'many'); assert.equal(uClass(25, U), 'middle'); assert.equal(uClass(24.9, U), 'few')
  // screen: whole domains under the ceiling first (lowest mean Q, listed order on ties), then single requests up to 4
  const Q6 = (a: number[]) => Object.fromEntries(['a-loose', 'a-strict', 'b-loose', 'b-strict', 'c-loose', 'c-strict'].map((r, i) => [r, a[i]]))
  assert.deepEqual(screen(Q6([80, 70, 90, 50, 60, 60]), 2, 4, 90), { domains: ['c', 'a'], requests: ['a-loose', 'a-strict', 'c-loose', 'c-strict'] }) // b-loose exactly 90: ceiling
  assert.deepEqual(screen(Q6([60, 60, 60, 60, 60, 60]), 2, 4, 90).domains, ['a', 'b'])
  assert.deepEqual(screen(Q6([90, 80, 100, 55, 80, 80]), 2, 4, 90), { domains: ['c'], requests: ['c-loose', 'c-strict', 'b-strict', 'a-strict'] })
  assert.deepEqual(screen(Q6([95, 95, 95, 95, 95, 50]), 2, 4, 90), { domains: [], requests: ['c-strict'] })
  // dependence
  const con = (dsc: number, dsx: number, D = 0): Contrasts => {
    const z = { d: 0, v: '0' as Verdict }
    return { D: { d: D, v: '?' }, Ds_c: { d: dsc, v: '?' }, Ds_x: { d: dsx, v: '?' }, Dp_c: z, Dp_x: z }
  }
  const rr = (dsc: number, dsx: number, u: number, ceiling = false, D = 0): ReqResult => { const c = con(dsc, dsx, D); return { c, S: sBar(c), U: u, ceiling } }
  assert.equal(sBar(con(5, 0)), 2.5)
  const P = { u: U, lines: L }
  assert.equal(dependence({ 'a-loose': rr(20, 10, 60), 'a-strict': rr(0, 0, 20), 'b-loose': rr(12, 10, 50), 'b-strict': rr(1, 0, 10) }, P).verdict, 'larger where the spec leaves more open')
  assert.equal(dependence({ 'a-loose': rr(10, 10, 60), 'a-strict': rr(0, 0, 20), 'b-loose': rr(5, 5, 50), 'b-strict': rr(-5, -5, 10) }, P).verdict, 'larger where the spec leaves more open') // Delta exactly 10, loose S exactly 5
  assert.equal(dependence({ 'a-loose': rr(4, 4, 60), 'a-strict': rr(-6, -6, 20), 'b-loose': rr(12, 10, 50), 'b-strict': rr(1, 0, 10) }, P).verdict, 'undecided') // loose S under 5
  assert.equal(dependence({ 'a-loose': rr(2, 0, 60), 'a-strict': rr(0, 0, 20), 'b-loose': rr(0, 0, 50), 'b-strict': rr(3, 3, 10) }, P).verdict, 'does not depend on how much the spec leaves open')
  assert.equal(dependence({ 'a-loose': rr(0, 0, 60), 'a-strict': rr(10, 10, 20), 'b-loose': rr(0, 0, 50), 'b-strict': rr(12, 12, 10) }, P).verdict, 'larger where the spec leaves less open (reverse)')
  assert.match(dependence({ 'a-loose': rr(20, 10, 60), 'a-strict': rr(0, 0, 45), 'b-loose': rr(12, 10, 50), 'b-strict': rr(1, 0, 10) }, P).verdict, /fewer than 2/) // a: manipulation check fails (15 < 20)
  assert.match(dependence({ 'a-loose': rr(20, 10, 60, true), 'a-strict': rr(0, 0, 20), 'b-loose': rr(12, 10, 50), 'b-strict': rr(1, 0, 10) }, P).verdict, /fewer than 2/) // a: ceiling
  assert.equal(dependence({ 'a-loose': rr(0, 0, 60, false, 15), 'a-strict': rr(0, 0, 20, false, 0), 'b-loose': rr(0, 0, 50, false, 12), 'b-strict': rr(0, 0, 10, false, 1) }, P, 'D').verdict, 'larger where the spec leaves more open')
  // provenance: request names with '-', the screen's -p sets
  const claude = (role: string): Call => ({ role, requested: FAMILY.c, answered: FAMILY.c })
  const codex = (role: string): Call => ({ role, requested: FAMILY.x, answered: null, counted: true })
  assert.deepEqual(provenance('booking-loose-cx-p', { calls: [codex('scenario-drafter'), claude('classifier')], countedCalls: 1, specFrom: 'booking-loose-cc-p' }), [])
  assert.deepEqual(provenance('memo-sync-strict-xx-2r1', { calls: [codex('spec-drafter'), codex('scenario-drafter'), claude('classifier')], countedCalls: 2, specFrom: null }), [])
  assert.equal(provenance('booking-loose-xc-1', { calls: [claude('scenario-drafter'), claude('classifier')], countedCalls: 0, specFrom: 'booking-loose-cc-1' }).length, 1) // wrong lineage
  assert.equal(provenance('booking-loose-cx-1', { calls: [claude('scenario-drafter'), claude('classifier')], countedCalls: 0, specFrom: 'booking-loose-cc-1' }).length, 1) // wrong family
  console.log('arms.ts self-test: ok')
}

if (import.meta.main ?? process.argv[1]?.endsWith('arms.ts')) {
  const [a, b, ...rest] = process.argv.slice(2)
  if (a === '--self-test') selfTest()
  else if (a === '--provenance' && b && rest.length) process.exit(provenanceMain(b, rest))
  else if (a === '--screen' && b && rest[0]) process.exit(screenMain(readJson(b), rest[0]))
  else if (a && b && !existsSync(a)) { console.error(`arms.ts: ${a} does not exist (the lap stopped before gate "entrance" fixed it); no analysis`); process.exit(1) }
  else if (a && b) console.log(report(readJson(a), b, rest[0]))
  else { console.error('usage: arms.ts --self-test | --provenance <STATE> <id>... | --screen <screen.json> <STATE> | <prereg.json> <STATE> [errors.json]'); process.exit(2) }
}
