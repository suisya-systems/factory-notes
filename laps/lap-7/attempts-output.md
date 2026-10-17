## hard-1 (minority: single-member-group-rejected, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled)

### hard-1 / summaries

| run | attempt | all tests | minority | others | LLM | pass | failed |
|---|---|---|---|---|---|---|---|
| hard-1 | 1 | 9/14 | 0/4 | 9/10 | true | false | single-member-group-rejected, offsetting-expenses-settle-to-net, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1 | 2 | 13/14 | 4/4 | 9/10 | true | false | offsetting-expenses-settle-to-net |
| hard-1 | 3 | 14/14 | 4/4 | 10/10 | true | true |  |
| hard-1 | **CONV** | status shipped | full suite first passed: 3 | | | |  |
| hard-1-b | 1 | 9/14 | 0/4 | 9/10 | true | false | single-member-group-rejected, offsetting-expenses-settle-to-net, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-b | 2 | 13/14 | 4/4 | 9/10 | true | false | offsetting-expenses-settle-to-net |
| hard-1-b | 3 | 14/14 | 4/4 | 10/10 | true | true |  |
| hard-1-b | **CONV** | status shipped | full suite first passed: 3 | | | |  |

First attempt passing each point's own scenarios (- never, n/a not identifiable):

| run | net | emptyBen | minMembers |
|---|---|---|---|
| hard-1 | 2 | 2 | 2 |
| hard-1-b | 2 | 2 | 2 |

### hard-1 / bare

| run | attempt | all tests | minority | others | LLM | pass | failed |
|---|---|---|---|---|---|---|---|
| hard-1-bare-a | 1 | 10/14 | 0/4 | 10/10 | true | false | single-member-group-rejected, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-a | 2 | 10/14 | 0/4 | 10/10 | true | false | single-member-group-rejected, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-a | 3 | 9/14 | 0/4 | 9/10 | true | false | single-member-group-rejected, offsetting-expenses-settle-to-net, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-a | 4 | 9/14 | 0/4 | 9/10 | true | false | single-member-group-rejected, offsetting-expenses-settle-to-net, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-a | 5 | 10/14 | 0/4 | 10/10 | true | false | single-member-group-rejected, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-a | **STUCK** | status failed | full suite first passed: - | | | | retry cap reached: 5 attempts without a pass |
| hard-1-bare-b | 1 | 9/14 | 0/4 | 9/10 | true | false | single-member-group-rejected, offsetting-expenses-settle-to-net, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-b | 2 | 9/14 | 0/4 | 9/10 | true | false | single-member-group-rejected, offsetting-expenses-settle-to-net, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-b | 3 | 9/14 | 0/4 | 9/10 | true | false | single-member-group-rejected, offsetting-expenses-settle-to-net, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-b | 4 | 10/14 | 0/4 | 10/10 | true | false | single-member-group-rejected, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-b | 5 | 10/14 | 0/4 | 10/10 | true | false | single-member-group-rejected, empty-beneficiaries-means-everyone, pairwise-chain-not-routed, pairwise-cycle-not-cancelled |
| hard-1-bare-b | **STUCK** | status failed | full suite first passed: - | | | | retry cap reached: 5 attempts without a pass |

First attempt passing each point's own scenarios (- never, n/a not identifiable):

| run | net | emptyBen | minMembers |
|---|---|---|---|
| hard-1-bare-a | - | - | - |
| hard-1-bare-b | - | - | - |

hard-1 summaries: undecided (2 exercised complete runs); bare: undecided (2 exercised complete runs); summary effect: d in [1.00, 1.00]: effect observed

## hard-2 (minority: settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected)

### hard-2 / summaries

| run | attempt | all tests | minority | others | LLM | pass | failed |
|---|---|---|---|---|---|---|---|
| hard-2 | 1 | 10/14 | 1/5 | 9/9 | true | false | settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share |
| hard-2 | 2 | 14/14 | 5/5 | 9/9 | true | true |  |
| hard-2 | **CONV** | status shipped | full suite first passed: 2 | | | |  |
| hard-2-b | 1 | 9/14 | 0/5 | 9/9 | true | false | settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-b | 2 | 14/14 | 5/5 | 9/9 | true | true |  |
| hard-2-b | **CONV** | status shipped | full suite first passed: 2 | | | |  |

First attempt passing each point's own scenarios (- never, n/a not identifiable):

| run | net | emptyBen | dupBen | dupNames |
|---|---|---|---|---|
| hard-2 | 2 | 2 | 2 | 1 |
| hard-2-b | 2 | 2 | 2 | 2 |

### hard-2 / bare

| run | attempt | all tests | minority | others | LLM | pass | failed |
|---|---|---|---|---|---|---|---|
| hard-2-bare-a | 1 | 9/14 | 0/5 | 9/9 | true | false | settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-a | 2 | 8/14 | 0/5 | 8/9 | true | false | payer-among-beneficiaries, settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-a | 3 | 8/14 | 0/5 | 8/9 | true | false | payer-among-beneficiaries, settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-a | 4 | 8/14 | 0/5 | 8/9 | true | false | payer-among-beneficiaries, settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-a | 5 | 9/14 | 0/5 | 9/9 | true | false | settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-a | **STUCK** | status failed | full suite first passed: - | | | | retry cap reached: 5 attempts without a pass |
| hard-2-bare-b | 1 | 9/14 | 0/5 | 9/9 | true | false | settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-b | 2 | 9/14 | 0/5 | 9/9 | true | false | settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-b | 3 | 9/14 | 0/5 | 9/9 | true | false | settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-b | 4 | 8/14 | 0/5 | 8/9 | true | false | remainder-rotation-skips-non-beneficiaries, settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-b | 5 | 8/14 | 0/5 | 8/9 | true | false | remainder-rotation-skips-non-beneficiaries, settlement-pays-the-actual-payer, settlement-cycle-is-not-collapsed, omitted-beneficiaries-means-everyone-else, repeated-beneficiary-takes-extra-share, duplicate-member-names-rejected |
| hard-2-bare-b | **STUCK** | status failed | full suite first passed: - | | | | retry cap reached: 5 attempts without a pass |

First attempt passing each point's own scenarios (- never, n/a not identifiable):

| run | net | emptyBen | dupBen | dupNames |
|---|---|---|---|---|
| hard-2-bare-a | - | - | - | - |
| hard-2-bare-b | - | - | - | - |

hard-2 summaries: undecided (2 exercised complete runs); bare: undecided (2 exercised complete runs); summary effect: d in [1.00, 1.00]: effect observed

All sets, summaries: supported
All sets, bare: not supported
All sets, summary effect: d in [1.00, 1.00]: effect observed
lap lap7: done
