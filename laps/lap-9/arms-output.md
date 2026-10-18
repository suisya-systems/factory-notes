# Lap 9: first-attempt pass rates by drafter family, per request

k = 8; lines: effect 10 pts (all combinations one way), null under 5 pts; ceiling: every set >= 95 %. No errors file: raw figures only.

## settle-shares-strict, scenarios: all (CEILING: every verdict undecided)

| set | P raw (%) |
|---|---|
| settle-shares-strict-cc-1 | 100.0 |
| settle-shares-strict-cx-1 | 97.5 |
| settle-shares-strict-xx-1 | 100.0 |
| settle-shares-strict-xc-1r1 | 100.0 |
| settle-shares-strict-cc-2r2 | 100.0 |
| settle-shares-strict-cx-2 | 97.7 |
| settle-shares-strict-xx-2 | 96.9 |
| settle-shares-strict-xc-2 | 100.0 |

| contrast | raw d (pts) | raw | verdict |
|---|---|---|---|
| D | 1.6 | 0 | ? |
| Ds_c | 2.4 | 0 | ? |
| Ds_x | 1.6 | 0 | ? |
| Dp_c | 0.0 | 0 | ? |
| Dp_x | -0.8 | 0 | ? |

## settle-shares-strict, scenarios: spec (CEILING: every verdict undecided)

| set | P raw (%) |
|---|---|
| settle-shares-strict-cc-1 | 100.0 |
| settle-shares-strict-cx-1 | 100.0 |
| settle-shares-strict-xx-1 | 100.0 |
| settle-shares-strict-xc-1r1 | 100.0 |
| settle-shares-strict-cc-2r2 | 100.0 |
| settle-shares-strict-cx-2 | 100.0 |
| settle-shares-strict-xx-2 | 100.0 |
| settle-shares-strict-xc-2 | 100.0 |

| contrast | raw d (pts) | raw | verdict |
|---|---|---|---|
| D | 0.0 | 0 | ? |
| Ds_c | 0.0 | 0 | ? |
| Ds_x | 0.0 | 0 | ? |
| Dp_c | 0.0 | 0 | ? |
| Dp_x | 0.0 | 0 | ? |

## settle-shares-strict, scenarios: rest (CEILING: every verdict undecided)

| set | P raw (%) |
|---|---|
| settle-shares-strict-cc-1 | 100.0 |
| settle-shares-strict-cx-1 | 96.9 |
| settle-shares-strict-xx-1 | 100.0 |
| settle-shares-strict-xc-1r1 | 100.0 |
| settle-shares-strict-cc-2r2 | 100.0 |
| settle-shares-strict-cx-2 | 96.9 |
| settle-shares-strict-xx-2 | 95.3 |
| settle-shares-strict-xc-2 | 100.0 |

| contrast | raw d (pts) | raw | verdict |
|---|---|---|---|
| D | 2.3 | 0 | ? |
| Ds_c | 3.1 | 0 | ? |
| Ds_x | 2.3 | 0 | ? |
| Dp_c | 0.0 | 0 | ? |
| Dp_x | -0.8 | 0 | ? |

**settle-shares-strict**: S-bar 2.0 pts; D ?; scenario family: undecided; spec family: undecided

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

- none

