builds (22): claude-opus-5-5-1, claude-opus-5-5-2, claude-opus-5-5-3, claude-opus-5-5-4, claude-opus-5-5-5, claude-opus-5-5-6, claude-opus-5-5-7, claude-opus-5-5-8, claude-sonnet-5-5-1, claude-sonnet-5-5-2, claude-sonnet-5-5-3, claude-sonnet-5-5-4, claude-sonnet-5-5-5, claude-sonnet-5-5-6, claude-sonnet-5-5-7, claude-sonnet-5-5-8, lap6-minor-1-1, lap6-minor-1-b-1, lap6-minor-1-c-1, lap6-minor-2-1, lap6-minor-2-b-1, lap6-minor-2-c-1

## hard-1

| scenario | passed / 22 | per build |
|---|---|---|
| create-and-get-group | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| single-member-group-rejected | 0 | ffffffffffffffffffffff |
| record-and-fetch-expense | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| expense-with-outsider-rejected | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| invalid-amounts-rejected | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| unknown-ids-not-found | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| settlement-empty-when-even | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| simple-even-split-settlement | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| offsetting-expenses-settle-to-net | 11 | ffPffPfPPPffPfffPfPPPP |
| remainder-rotates-between-two-members | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| remainder-spread-across-three-expenses | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| empty-beneficiaries-means-everyone | 0 | ffffffffffffffffffffff |
| pairwise-chain-not-routed | 0 | ffffffffffffffffffffff |
| pairwise-cycle-not-cancelled | 0 | ffffffffffffffffffffff |

## hard-2

| scenario | passed / 22 | per build |
|---|---|---|
| create-and-get-group | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| record-and-read-expense | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| simple-settlement | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| payer-among-beneficiaries | 17 | PPfPPfPPPPPPPPPPPPfffP |
| settled-group-has-no-transfers | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| remainder-rotates-across-expenses | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| remainder-rotation-skips-non-beneficiaries | 19 | PPPPPPPPffPPfPPPPPPPPP |
| settlement-pays-the-actual-payer | 0 | ffffffffffffffffffffff |
| settlement-cycle-is-not-collapsed | 0 | ffffffffffffffffffffff |
| omitted-beneficiaries-means-everyone-else | 0 | ffffffffffffffffffffff |
| repeated-beneficiary-takes-extra-share | 0 | ffffffffffffffffffffff |
| duplicate-member-names-rejected | 10 | PffffPfffPPffPPfPPPfPf |
| invalid-expenses-rejected | 22 | PPPPPPPPPPPPPPPPPPPPPP |
| unknown-resources-not-found | 22 | PPPPPPPPPPPPPPPPPPPPPP |
