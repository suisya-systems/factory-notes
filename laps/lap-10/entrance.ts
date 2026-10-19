// Lap 10 entrance (no model call; lap 9's entrance.ts without the U classes): per set, scenario counts, self-report and
// classifier layers, attempts (#32 redrafts) and calls per role over all attempts (a repair shows as a second call); per spec, U and the descriptive figures (lap 9);
// and prereg.json from the template, each set resolved to its last redraft, with its version (the hash its approval shows).
// usage: node --experimental-strip-types --no-warnings docs/lap-10/entrance.ts <STATE> <out dir>
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash, vaultDir } from '../../src/vault.ts'
import { inSpecLayer, lineage, median, resolve, undecidedShare } from './arms.ts'

const [sd, out] = process.argv.slice(2)
if (!sd || !out) { console.error('usage: entrance.ts <STATE> <out dir>'); process.exit(2) }
type Cls = { label: string; basis?: string; checks?: { check: string; result: string }[] }
const pre = JSON.parse(readFileSync(join(import.meta.dirname, 'prereg.template.json'), 'utf8'))
const reqs = pre.requests as Record<string, { pairs: { spec: string; own: string; cross: string | null }[] }>
// Every attempt of a set (#32 redrafts) keeps its draft-cost.json in runs/, failed ones included.
const runs = readdirSync(join(sd, 'runs')), attempts: Record<string, string[]> = {}
for (const { pairs } of Object.values(reqs)) for (const p of pairs) for (const k of ['own', 'cross'] as const) {
  const base = p[k]; if (!base) continue
  p[k] = resolve(sd, base); attempts[p[k]!] = lineage(runs, base)
}
const read = (id: string, f: string) => JSON.parse(readFileSync(join(vaultDir(sd, id), f), 'utf8'))
const ids = Object.values(reqs).flatMap((r) => r.pairs.flatMap((p) => (p.cross ? [p.own, p.cross] : [p.own])))

const rows = ['| set | attempts | scenarios | self: stated / unstated | readable-spec | readable-convention | unstated | contradicts | unknown | spec layer | spec-drafter calls (all attempts) | scenario-drafter calls (all attempts) | USD (all attempts) |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|']
for (const id of ids) {
  const sc: { inSpec: boolean }[] = read(id, 'scenarios.json'), cl: Cls[] = read(id, 'classification.json')
  const costs = attempts[id].map((a) => join(sd, 'runs', a, 'draft-cost.json')).filter(existsSync).map((f) => JSON.parse(readFileSync(f, 'utf8')))
  const n = (f: (c: Cls) => boolean) => cl.filter(f).length
  const calls = (role: string) => costs.reduce((t, c) => t + (c.calls ?? []).filter((x: { role: string }) => x.role === role).length, 0)
  rows.push(`| ${id} | ${attempts[id].length} | ${sc.length} | ${sc.filter((s) => s.inSpec).length} / ${sc.filter((s) => !s.inSpec).length} | ${n((c) => c.label === 'readable' && c.basis === 'spec')} | ${n((c) => c.label === 'readable' && c.basis !== 'spec')} | ${n((c) => c.label === 'unstated')} | ${n((c) => c.label === 'contradicts')} | ${n((c) => c.label === 'unknown')} | ${cl.filter(inSpecLayer as (c: Cls) => boolean).length} | ${calls('spec-drafter')} | ${calls('scenario-drafter')} | ${costs.reduce((t, c) => t + c.totalUsd, 0).toFixed(4)} |`)
  pre.approvedVersions[id] = hash(vaultDir(sd, id))
}

const uRows = ['| request | spec (own / cross) | U (%) | ## Undecided items | spec bytes |', '|---|---|---|---|---|']
const reqRows = ['| request | U per spec (%) | U (%) |', '|---|---|---|']
for (const [req, { pairs }] of Object.entries(reqs)) {
  const us: (number | null)[] = []
  for (const p of pairs) {
    const sets: Cls[][] = [read(p.own, 'classification.json'), ...(p.cross ? [read(p.cross, 'classification.json')] : [])]
    const spec = readFileSync(join(vaultDir(sd, p.own), 'spec.md'), 'utf8')
    const items = (spec.split(/^## Undecided.*$/m)[1] ?? '').split(/^## /m)[0].split('\n').filter((l) => l.startsWith('- ')).length
    const u = undecidedShare(sets); us.push(u)
    uRows.push(`| ${req} | ${p.own} / ${p.cross ?? '-'} | ${u?.toFixed(1) ?? 'n/a'} | ${items} | ${Buffer.byteLength(spec)} |`)
  }
  reqRows.push(`| ${req} | ${us.map((x) => x?.toFixed(1) ?? 'n/a').join(', ')} | ${us.every((x) => x !== null) ? median(us as number[]).toFixed(1) : 'n/a'} |`)
}
const text = [rows.join('\n'), '', uRows.join('\n'), '', reqRows.join('\n')].join('\n') + '\n'
writeFileSync(join(out, 'entrance-table.md'), text)
writeFileSync(join(out, 'prereg.json'), JSON.stringify(pre, null, 2) + '\n')
console.log(text)
