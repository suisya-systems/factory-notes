// Lap 8 entrance (no model call): per set, scenario counts, self-report and classifier layers, calls per role
// (a repair shows as a second call), and prereg.json from the template with each set's version (the hash its
// approval summary shows; approval writes the same).
// usage: node --experimental-strip-types --no-warnings docs/lap-8/entrance.ts <STATE> <out dir>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash, vaultDir } from '../../src/vault.ts'
import { inSpecLayer } from './arms.ts'

const [sd, out] = process.argv.slice(2)
if (!sd || !out) { console.error('usage: entrance.ts <STATE> <out dir>'); process.exit(2) }
const pre = JSON.parse(readFileSync(join(import.meta.dirname, 'prereg.template.json'), 'utf8'))
const ids: string[] = Object.values(pre.requests as Record<string, { pairs: { own: string; cross: string | null }[] }>).flatMap((r) => r.pairs.flatMap((p) => (p.cross ? [p.own, p.cross] : [p.own])))
const rows = ['| set | scenarios | self: stated / unstated | readable-spec | readable-convention | unstated | contradicts | unknown | spec layer | spec-drafter calls | scenario-drafter calls | USD |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
for (const id of ids) {
  const v = vaultDir(sd, id)
  const sc: { inSpec: boolean }[] = JSON.parse(readFileSync(join(v, 'scenarios.json'), 'utf8'))
  const cl: ({ label: string; basis?: string } & Parameters<typeof inSpecLayer>[0])[] = JSON.parse(readFileSync(join(v, 'classification.json'), 'utf8'))
  const cost = JSON.parse(readFileSync(join(sd, 'runs', id, 'draft-cost.json'), 'utf8'))
  const n = (f: (c: { label: string; basis?: string }) => boolean) => cl.filter(f).length
  const calls = (role: string) => cost.calls.filter((c: { role: string }) => c.role === role).length
  rows.push(`| ${id} | ${sc.length} | ${sc.filter((s) => s.inSpec).length} / ${sc.filter((s) => !s.inSpec).length} | ${n((c) => c.label === 'readable' && c.basis === 'spec')} | ${n((c) => c.label === 'readable' && c.basis !== 'spec')} | ${n((c) => c.label === 'unstated')} | ${n((c) => c.label === 'contradicts')} | ${n((c) => c.label === 'unknown')} | ${cl.filter(inSpecLayer).length} | ${calls('spec-drafter')} | ${calls('scenario-drafter')} | ${cost.totalUsd.toFixed(4)} |`)
  pre.approvedVersions[id] = hash(v)
}
writeFileSync(join(out, 'entrance-table.md'), rows.join('\n') + '\n')
writeFileSync(join(out, 'prereg.json'), JSON.stringify(pre, null, 2) + '\n')
console.log(rows.join('\n'))
