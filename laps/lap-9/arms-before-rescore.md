# Lap 9: first-attempt pass rates by drafter family, per request

k = 8; lines: effect 10 pts (all combinations one way), null under 5 pts; ceiling: every set >= 95 %. No errors file: raw figures only.

## settle-shares-strict, scenarios: all

| set | P raw (%) |
|---|---|
| settle-shares-strict-cc-1 | 64.3 |
| settle-shares-strict-cx-1 | 50.0 |
| settle-shares-strict-xx-1 | 53.8 |
| settle-shares-strict-xc-1r1 | 78.6 |
| settle-shares-strict-cc-2r2 | 80.0 |
| settle-shares-strict-cx-2 | 45.5 |
| settle-shares-strict-xx-2 | 50.0 |
| settle-shares-strict-xc-2 | 92.9 |

| contrast | raw d (pts) | raw | verdict |
|---|---|---|---|
| D | 20.2 | + | + |
| Ds_c | 24.4 | + | + |
| Ds_x | 33.8 | + | + |
| Dp_c | -13.6 | ? | ? |
| Dp_x | -4.2 | 0 | 0 |

## settle-shares-strict, scenarios: spec

| set | P raw (%) |
|---|---|
| settle-shares-strict-cc-1 | 55.6 |
| settle-shares-strict-cx-1 | 100.0 |
| settle-shares-strict-xx-1 | 60.0 |
| settle-shares-strict-xc-1r1 | 80.0 |
| settle-shares-strict-cc-2r2 | 81.8 |
| settle-shares-strict-cx-2 | 33.3 |
| settle-shares-strict-xx-2 | 75.0 |
| settle-shares-strict-xc-2 | 100.0 |

| contrast | raw d (pts) | raw | verdict |
|---|---|---|---|
| D | 1.2 | 0 | 0 |
| Ds_c | 2.0 | 0 | 0 |
| Ds_x | 22.5 | + | + |
| Dp_c | -21.3 | ? | ? |
| Dp_x | -0.8 | 0 | 0 |

## settle-shares-strict, scenarios: rest

| set | P raw (%) |
|---|---|
| settle-shares-strict-cc-1 | 80.0 |
| settle-shares-strict-cx-1 | 37.5 |
| settle-shares-strict-xx-1 | 50.0 |
| settle-shares-strict-xc-1r1 | 75.0 |
| settle-shares-strict-cc-2r2 | 75.0 |
| settle-shares-strict-cx-2 | 50.0 |
| settle-shares-strict-xx-2 | 37.5 |
| settle-shares-strict-xc-2 | 80.0 |

| contrast | raw d (pts) | raw | verdict |
|---|---|---|---|
| D | 33.8 | + | + |
| Ds_c | 33.8 | + | + |
| Ds_x | 33.8 | + | + |
| Dp_c | 0.0 | 0 | 0 |
| Dp_x | 0.0 | 0 | 0 |

**settle-shares-strict**: S-bar 29.1 pts; D +; scenario family: lower with the other family; spec family: undecided

## Undecided share U (checks other than status codes, own + cross)

| request | U per spec (%) | U (%) | class |
|---|---|---|---|
| settle-shares-strict | 14.8, 8.4, 8.1, 6.9 | 8.2 | few |

## Does the effect depend on the request?

- Delta_S (main) per domain: (none)
  verdict: undecided (fewer than 2 domains in the rule)
- Delta_D (secondary) per domain: (none)
  verdict: undecided (fewer than 2 domains in the rule)

## Scenarios every build of a spec failed (read them against the errors rule)

- settle-shares-strict-cc-1 / shares-split-owed (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cc-1 / tie-uses-member-order (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cc-1 / member-leave-rules (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cc-1 / left-member-old-expense (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cc-1 / replace-and-delete-expense (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cx-1 / equal-rounding-member-order (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cx-1 / weighted-fractions-and-large-shares (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cx-1 / replacement-and-deletion (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cx-1 / departure-and-historical-expenses (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-cx-1 / expense-input-validation (all 8 builds of settle-shares-strict-cc-1's spec fail)
- settle-shares-strict-xx-1 / equal-rounding-by-member-order (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xx-1 / weighted-largest-remainders (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xx-1 / replace-and-delete-expense (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xx-1 / departure-with-historical-expenses (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xx-1 / replacement-rechecks-active-members (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xx-1 / inclusive-size-and-amount-limits (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xc-1r1 / shares-split-largest-fraction (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xc-1r1 / shares-split-tie-member-order (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-xc-1r1 / left-member-in-replaced-expense (all 8 builds of settle-shares-strict-xx-1's spec fail)
- settle-shares-strict-cc-2r2 / shares-largest-fraction (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cc-2r2 / member-leave-rules (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cc-2r2 / settlement-read-only (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cx-2 / equal-rounding-member-order (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cx-2 / weighted-fractions-and-ties (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cx-2 / replace-and-remove (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cx-2 / greedy-settlement-reselection (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cx-2 / departure-and-historical-expenses (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-cx-2 / expense-validation-and-boundaries (all 8 builds of settle-shares-strict-cc-2r2's spec fail)
- settle-shares-strict-xx-2 / equal-remainders-use-member-order (all 8 builds of settle-shares-strict-xx-2's spec fail)
- settle-shares-strict-xx-2 / weighted-fractions-and-self-beneficiary (all 8 builds of settle-shares-strict-xx-2's spec fail)
- settle-shares-strict-xx-2 / replacement-and-deletion-recompute-ledger (all 8 builds of settle-shares-strict-xx-2's spec fail)
- settle-shares-strict-xx-2 / settlement-reselects-extremes-with-ties (all 8 builds of settle-shares-strict-xx-2's spec fail)
- settle-shares-strict-xx-2 / departed-members-and-historical-expenses (all 8 builds of settle-shares-strict-xx-2's spec fail)
- settle-shares-strict-xx-2 / expense-types-ranges-and-split-validation (all 8 builds of settle-shares-strict-xx-2's spec fail)
- settle-shares-strict-xc-2 / shares-largest-remainder (all 8 builds of settle-shares-strict-xx-2's spec fail)

