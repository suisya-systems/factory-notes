// Lap 7 rarity check (no model call): builds of the same spec made without any feedback run against the lap-7
// scenario sets: the 16 lap-5 replicates and the first attempt of each of the 6 lap-6 runs. A minority scenario most
// of them fail is a real minority answer for this builder population; one most of them pass is not.
// usage: node --experimental-strip-types --no-warnings docs/lap-7/baseline.ts <LAP5 STATE> <LAP6 STATE> <STATE> <id> [<id> ...]
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { exportTree, removeTree } from '../../src/sandbox.ts'
import { runScenarios, validateScenarios } from '../../src/scenario.ts'

const [LAP5, LAP6, STATE] = process.argv.slice(2, 5).map((p) => resolve(p)), ids = process.argv.slice(5) // absolute: git runs inside the sandbox
const signal = new AbortController().signal
const recs = join(LAP5, 'runs', 'settle-a1', 'replicates')
const builds: { name: string; repo: string; sha: string }[] = readdirSync(recs).filter((f) => f.endsWith('.json')).sort()
  .map((f) => ({ name: f.slice(0, -5), repo: join(LAP5, 'work', 'settle-a1-rep', f.slice(0, -5)), sha: JSON.parse(readFileSync(join(recs, f), 'utf8')).sha }))
for (const id of ['minor-1', 'minor-1-b', 'minor-1-c', 'minor-2', 'minor-2-b', 'minor-2-c']) {
  const f = join(LAP6, 'runs', id, 'run.json')
  if (existsSync(f)) builds.push({ name: `lap6-${id}-1`, repo: join(LAP6, 'work', id), sha: JSON.parse(readFileSync(f, 'utf8')).attempts[0].sha })
}
const sets = ids.map((id) => [id, validateScenarios(JSON.parse(readFileSync(join(STATE, 'vault', id, 'scenarios.json'), 'utf8')))] as const)
const passes: Record<string, Record<string, string[]>> = Object.fromEntries(ids.map((id) => [id, {}]))
for (const b of builds) {
  const dir = mkdtempSync(join(tmpdir(), 'lap7-base-'))
  try {
    await exportTree(b.repo, b.sha, dir, signal)
    for (const [id, sc] of sets) for (const r of await runScenarios(dir, sc, signal)) (passes[id][r.id] ??= []).push(r.pass ? 'P' : 'f')
  } finally { removeTree(dir) }
}
console.log(`builds (${builds.length}): ${builds.map((b) => b.name).join(', ')}`)
for (const [id, sc] of sets) {
  console.log(`\n## ${id}\n\n| scenario | passed / ${builds.length} | per build |\n|---|---|---|`)
  for (const s of sc) console.log(`| ${s.id} | ${passes[id][s.id].filter((x) => x === 'P').length} | ${passes[id][s.id].join('')} |`)
}
