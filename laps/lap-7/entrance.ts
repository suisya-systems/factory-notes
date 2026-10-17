// Lap 7 entrance check (no model call). Runs one scenario set on the reference app set to the answers the scenario
// writer declared, then reverts each declared answer alone to the majority one: the point x scenario dependency matrix.
// - A scenario that fails on the declared app: a wrong expectation, an undeclared choice, or a gap of the reference app.
// - revert[k]: scenarios that pass on the declared app and fail once k alone is reverted (with the failing check).
// - only[k]: those of revert[k] that no other revert fails: the point's own scenarios (point-level scoring).
// usage: node --experimental-strip-types --no-warnings docs/lap-7/entrance.ts <server.cjs> <STATE> <id> '<declared json>'
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runScenarios, validateScenarios } from '../../src/scenario.ts'

const [SERVER, STATE, id, declaredJson] = process.argv.slice(2)
// lap 5: 16/16 builds on this spec chose rem, net, payer; lap 6: the 16 lap-5 builds chose the others (baseline.ts).
// Keys added for lap 7 keep the reference app's default (the majority answer) when left out.
const MAJORITY: Record<string, string> = { rem: 'rotate', net: 'group', payer: 'listed', order: 'oldest', minMembers: '1', emptyBen: 'reject' }
const answers: Record<string, string> = JSON.parse(declaredJson), declared = { ...MAJORITY, ...answers }
const sc = validateScenarios(JSON.parse(readFileSync(join(STATE, 'vault', id, 'scenarios.json'), 'utf8')))
const signal = new AbortController().signal

async function results(s: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'lap7-ref-'))
  copyFileSync(SERVER, join(dir, 'server.cjs'))
  writeFileSync(join(dir, 'strategy.json'), JSON.stringify(s))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'ref', private: true, scripts: { start: 'node server.cjs' } }))
  return new Map((await runScenarios(dir, sc, signal)).map((r) => [r.id, r]))
}

const base = await results(declared)
const revert: Record<string, Record<string, string>> = {}
for (const k of Object.keys(answers).filter((k) => answers[k] !== MAJORITY[k])) {
  const s = { ...declared }
  if (k in MAJORITY) s[k] = MAJORITY[k]; else delete s[k] // a lap-7 key left out = the reference app's majority default
  const rev = await results(s)
  revert[k] = Object.fromEntries(sc.filter((x) => base.get(x.id)!.pass && !rev.get(x.id)!.pass).map((x) => [x.id, rev.get(x.id)!.detail]))
}
const only = Object.fromEntries(Object.entries(revert).map(([k, ids]) => [k, Object.keys(ids).filter((x) => Object.entries(revert).every(([k2, o]) => k2 === k || !(x in o)))]))
console.log(JSON.stringify({ id, declared, failOnDeclared: [...base.values()].filter((r) => !r.pass).map((r) => `${r.id}: ${r.detail}`), revert, only }, null, 1))
