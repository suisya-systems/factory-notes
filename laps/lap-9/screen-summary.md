# Lap 9 screen summary

Output of `node --experimental-strip-types --no-warnings docs/lap-9/arms.ts --screen .factory-lap9/prereg/screen.json .factory-lap9` (rule fixed at gate `screen-specs`; k = 4 builds of each `<request>-cc-p`, scored on `-cc-p` and `-cx-p`):

| request | builds | Q cc-p (%) | Q cx-p (%) | Q (%) | ceiling |
|---|---|---|---|---|---|
| settle-shares-loose | 4 | 100.0 | 100.0 | 100.0 | yes |
| settle-shares-strict | 4 | 73.3 | 54.5 | 63.9 | no |
| booking-loose | 4 | 100.0 | 100.0 | 100.0 | yes |
| booking-strict | 4 | 100.0 | 100.0 | 100.0 | yes |
| memo-sync-loose | 4 | 100.0 | 100.0 | 100.0 | yes |
| memo-sync-strict | 4 | 100.0 | 100.0 | 100.0 | yes |

requests that go on: settle-shares-strict
whole domains (in the dependence rule): (none)
left out (delete their main steps and prereg entries): settle-shares-loose, booking-loose, booking-strict, memo-sync-loose, memo-sync-strict

## What this means under the pre-registered rules

- One request goes on to the main runs: `settle-shares-strict`. It went on as a single request, not as a whole domain, so it gets the per-request verdict only (lap 8 lines).
- No domain has both versions off the ceiling, so the request-dependence verdict (the main question of this lap) is **undecided (left out by the screen)**. No extra candidates are made in this lap.
- Fewer than 4 requests are off the ceiling, so the main runs go with 1 request (8 sets, 32 builds).

## Definition change at gate `main`

`examples/lap-9.json` and `docs/lap-9/prereg.template.json`: only the steps and entries of the five left-out requests were deleted (130 -> 50 steps). Deleted whole steps (80): their drafts (including the early Codex draft `settle-shares-loose-xx-1r2`, already run and now unused, as the runbook planned), their spec `cmp` steps and their `tally` steps. In the provenance steps, the gate `specs` / `entrance` approval lists and the main `replicate` step, only their ids were taken out. Nothing else changed.

## Facts recorded for the report (descriptive, not part of the rule)

- In `settle-shares-strict`, all 4 screen builds failed the same scenarios: on `-cc-p` shares-largest-fraction, max-amount-precision, settlement-greedy, left-member-blocks-replace (11/15 passed); on `-cx-p` equal-remainders, weighted-remainders, replacement-and-deletion, leaving-and-historical-expenses, inclusive-upper-limits (6/11 passed).
- Screen drafts: `memo-sync-strict-cc-p` was rejected once and redrafted as `memo-sync-strict-cc-pr1`. Codex scenario drafts: 4 passed on the first call, 2 (`settle-shares-strict-cx-p`, `memo-sync-strict-cx-p`) after one repair round, none redrafted.
- Lap ledger at gate `main`: $23.92 (screen and the isolation probe included).
