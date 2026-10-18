# Lap 8: first-attempt pass rates by drafter family

k = 8 builds per spec; lines: effect 10 pts (all combinations one way), null under 5 pts. Corrected = without the scenarios in docs/lap-8/errors.json.

## settle, scenarios: all

| set | P raw (%) | P corrected (%) |
|---|---|---|
| settle-cc-1 | 100.0 | 100.0 |
| settle-cx-1r2 | 100.0 | 100.0 |
| settle-cc-2 | 100.0 | 100.0 |
| settle-cx-2 | 100.0 | 100.0 |
| settle-xx-1 | 100.0 | 100.0 |
| settle-xc-1 | 100.0 | 100.0 |
| settle-xx-2 | 100.0 | 100.0 |
| settle-xc-2 | 100.0 | 100.0 |

| contrast | raw d (pts) | raw | corrected d | corrected | verdict |
|---|---|---|---|---|---|
| D | 0.0 | 0 | 0.0 | 0 | 0 |
| Ds_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Ds_x | 0.0 | 0 | 0.0 | 0 | 0 |
| Dp_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Dp_x | 0.0 | 0 | 0.0 | 0 | 0 |

## settle, scenarios: spec

| set | P raw (%) | P corrected (%) |
|---|---|---|
| settle-cc-1 | 100.0 | 100.0 |
| settle-cx-1r2 | 100.0 | 100.0 |
| settle-cc-2 | n/a | n/a |
| settle-cx-2 | n/a | n/a |
| settle-xx-1 | 100.0 | 100.0 |
| settle-xc-1 | n/a | n/a |
| settle-xx-2 | 100.0 | 100.0 |
| settle-xc-2 | n/a | n/a |

| contrast | raw d (pts) | raw | corrected d | corrected | verdict |
|---|---|---|---|---|---|
| D | n/a | ? | n/a | ? | ? |
| Ds_c | n/a | ? | n/a | ? | ? |
| Ds_x | n/a | ? | n/a | ? | ? |
| Dp_c | n/a | ? | n/a | ? | ? |
| Dp_x | n/a | ? | n/a | ? | ? |

## settle, scenarios: rest

| set | P raw (%) | P corrected (%) |
|---|---|---|
| settle-cc-1 | 100.0 | 100.0 |
| settle-cx-1r2 | 100.0 | 100.0 |
| settle-cc-2 | 100.0 | 100.0 |
| settle-cx-2 | 100.0 | 100.0 |
| settle-xx-1 | 100.0 | 100.0 |
| settle-xc-1 | 100.0 | 100.0 |
| settle-xx-2 | 100.0 | 100.0 |
| settle-xc-2 | 100.0 | 100.0 |

| contrast | raw d (pts) | raw | corrected d | corrected | verdict |
|---|---|---|---|---|---|
| D | 0.0 | 0 | 0.0 | 0 | 0 |
| Ds_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Ds_x | 0.0 | 0 | 0.0 | 0 | 0 |
| Dp_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Dp_x | 0.0 | 0 | 0.0 | 0 | 0 |

**settle**: D 0; scenario family (Ds_c, Ds_x): no effect; spec family (Dp_c, Dp_x): no effect

## memo, scenarios: all

| set | P raw (%) | P corrected (%) |
|---|---|---|
| memo-cc-1 | 100.0 | 100.0 |
| memo-cx-1 | 90.0 | 90.0 |
| memo-cc-2 | 100.0 | 100.0 |
| memo-cx-2 | 100.0 | 100.0 |
| memo-xx-1 | 9.1 | 9.1 |
| memo-xc-1 | 100.0 | 100.0 |
| memo-xx-2 | 91.7 | 91.7 |
| memo-xc-2 | 100.0 | 100.0 |

| contrast | raw d (pts) | raw | corrected d | corrected | verdict |
|---|---|---|---|---|---|
| D | 49.6 | + | 49.6 | + | + |
| Ds_c | 5.0 | ? | 5.0 | ? | ? |
| Ds_x | 49.6 | + | 49.6 | + | + |
| Dp_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Dp_x | 44.6 | ? | 44.6 | ? | ? |

## memo, scenarios: spec

| set | P raw (%) | P corrected (%) |
|---|---|---|
| memo-cc-1 | 100.0 | 100.0 |
| memo-cx-1 | 100.0 | 100.0 |
| memo-cc-2 | 100.0 | 100.0 |
| memo-cx-2 | 100.0 | 100.0 |
| memo-xx-1 | 25.0 | 25.0 |
| memo-xc-1 | 100.0 | 100.0 |
| memo-xx-2 | 100.0 | 100.0 |
| memo-xc-2 | 100.0 | 100.0 |

| contrast | raw d (pts) | raw | corrected d | corrected | verdict |
|---|---|---|---|---|---|
| D | 37.5 | ? | 37.5 | ? | ? |
| Ds_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Ds_x | 37.5 | ? | 37.5 | ? | ? |
| Dp_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Dp_x | 37.5 | ? | 37.5 | ? | ? |

## memo, scenarios: rest

| set | P raw (%) | P corrected (%) |
|---|---|---|
| memo-cc-1 | 100.0 | 100.0 |
| memo-cx-1 | 66.7 | 66.7 |
| memo-cc-2 | 100.0 | 100.0 |
| memo-cx-2 | 100.0 | 100.0 |
| memo-xx-1 | 0.0 | 0.0 |
| memo-xc-1 | 100.0 | 100.0 |
| memo-xx-2 | 83.3 | 83.3 |
| memo-xc-2 | 100.0 | 100.0 |

| contrast | raw d (pts) | raw | corrected d | corrected | verdict |
|---|---|---|---|---|---|
| D | 58.3 | + | 58.3 | + | + |
| Ds_c | 16.7 | ? | 16.7 | ? | ? |
| Ds_x | 58.3 | + | 58.3 | + | + |
| Dp_c | 0.0 | 0 | 0.0 | 0 | 0 |
| Dp_x | 41.7 | ? | 41.7 | ? | ? |

**memo**: D +; scenario family (Ds_c, Ds_x): undecided; spec family (Dp_c, Dp_x): undecided

## Conclusion

depends on the request, or undecided (see the tables)

## Scenarios every build of a spec failed (read them against the errors rule)

- memo-cx-1 / missing-required-content (all 8 builds of memo-cc-1's spec fail)
- memo-xx-1 / create-and-read (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / list-created-memo (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / independent-memos (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / update-memo (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / delete-memo (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / delete-preserves-other-memo (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / preserve-text-exactly (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / successive-updates (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / reject-missing-content (all 8 builds of memo-xx-1's spec fail)
- memo-xx-1 / reject-null-content (all 8 builds of memo-xx-1's spec fail)
- memo-xx-2 / empty-text (all 8 builds of memo-xx-2's spec fail)

