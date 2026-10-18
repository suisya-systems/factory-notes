// Lap 9 entrance (no model call; lap 8's entrance.ts plus U): per set, scenario counts, self-report and classifier
// layers, calls per role (a repair shows as a second call); per spec, U (pre-registered) and the descriptive figures;
// and prereg.json from the template with each set's version (the hash its approval summary shows; approval writes the same).
// usage: node --experimental-strip-types --no-warnings docs/lap-9/entrance.ts <STATE> <out dir>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash, vaultDir } from '../../src/vault.ts'
import { inSpecLayer, median, uClass, undecidedShare } from './arms.ts'

const [sd, out] = process.argv.slice(2)
if (!sd || !out) { console.error('usage: entrance.ts <STATE> <out dir>'); process.exit(2) }
type Cls = { label: string; basis?: string; checks?: { check: string; result: string }[] }
const pre = JSON.parse(readFileSync(join(import.meta.dirname, 'prereg.template.json'), 'utf8'))
const reqs = pre.requests as Record<string, { pairs: { spec: string; own: string; cross: string | null }[] }>
const read = (id: string, f: string) => JSON.parse(readFileSync(join(vaultDir(sd, id), f), 'utf8'))
const ids = Object.values(reqs).flatMap((r) => r.pairs.flatMap((p) => (p.cross ? [p.own, p.cross] : [p.own])))

const rows = ['| set | scenarios | self: stated / unstated | readable-spec | readable-convention | unstated | contradicts | unknown | spec layer | spec-drafter calls | scenario-drafter calls | USD |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
for (const id of ids) {
  const sc: { inSpec: boolean }[] = read(id, 'scenarios.json'), cl: Cls[] = read(id, 'classification.json')
  const cost = JSON.parse(readFileSync(join(sd, 'runs', id, 'draft-cost.json'), 'utf8'))
  const n = (f: (c: Cls) => boolean) => cl.filter(f).length
  const calls = (role: string) => cost.calls.filter((c: { role: string }) => c.role === role).length
  rows.push(`| ${id} | ${sc.length} | ${sc.filter((s) => s.inSpec).length} / ${sc.filter((s) => !s.inSpec).length} | ${n((c) => c.label === 'readable' && c.basis === 'spec')} | ${n((c) => c.label === 'readable' && c.basis !== 'spec')} | ${n((c) => c.label === 'unstated')} | ${n((c) => c.label === 'contradicts')} | ${n((c) => c.label === 'unknown')} | ${cl.filter(inSpecLayer as (c: Cls) => boolean).length} | ${calls('spec-drafter')} | ${calls('scenario-drafter')} | ${cost.totalUsd.toFixed(4)} |`)
  pre.approvedVersions[id] = hash(vaultDir(sd, id))
}

// U as pre-registered (status checks out, own + cross pooled); descriptive: U with status checks, ## Undecided items, spec bytes.
const withStatus = (sets: Cls[][]) => { let n = 0, u = 0; for (const cl of sets) for (const c of cl) for (const k of c.checks ?? []) { n++; if (k.result === 'U') u++ } return n ? Math.round(1000 * u / n) / 10 : null }
const uRows = ['| request | spec (own / cross) | U (%) | U with status checks (%) | ## Undecided items | spec bytes |', '|---|---|---|---|---|---|']
const reqRows = ['| request | U per spec (%) | U (%) | class |', '|---|---|---|---|']
for (const [req, { pairs }] of Object.entries(reqs)) {
  const us: (number | null)[] = []
  for (const p of pairs) {
    const sets: Cls[][] = [read(p.own, 'classification.json'), ...(p.cross ? [read(p.cross, 'classification.json')] : [])]
    const spec = readFileSync(join(vaultDir(sd, p.own), 'spec.md'), 'utf8')
    const items = (spec.split(/^## Undecided.*$/m)[1] ?? '').split(/^## /m)[0].split('\n').filter((l) => l.startsWith('- ')).length
    const u = undecidedShare(sets); us.push(u)
    uRows.push(`| ${req} | ${p.own} / ${p.cross ?? '-'} | ${u?.toFixed(1) ?? 'n/a'} | ${withStatus(sets)?.toFixed(1) ?? 'n/a'} | ${items} | ${Buffer.byteLength(spec)} |`)
  }
  const U = us.every((x) => x !== null) ? median(us as number[]) : null
  reqRows.push(`| ${req} | ${us.map((x) => x?.toFixed(1) ?? 'n/a').join(', ')} | ${U?.toFixed(1) ?? 'n/a'} | ${U === null ? 'n/a' : uClass(U, pre.u)} |`)
}
const text = [rows.join('\n'), '', uRows.join('\n'), '', reqRows.join('\n')].join('\n') + '\n'
writeFileSync(join(out, 'entrance-table.md'), text)
writeFileSync(join(out, 'prereg.json'), JSON.stringify(pre, null, 2) + '\n')
console.log(text)
