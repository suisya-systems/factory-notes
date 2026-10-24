# 11 周目の前に要る工場の変更（Issue の草案）

[runbook.md](runbook.md)「工場の側の確かめ」で挙げた 4 つの変更の、suisya-systems/factory に立てる Issue の草案。本文は英語（工場のリポジトリの方針）。

作成担当の sandbox からは `gh` が使えなかったので、この草案をもとに窓口が 2026-10-25 に起票した（factory#42〜#45）。読んだのは工場の main 6194c56 である。A は、作成担当が手元の写しで `validateScenarios` を呼んで再現した（モデルは呼んでいない）。

| | Issue | 題 | 11 周目の前に |
|---|---|---|---|
| A | factory#42 | 偽物の段の枠のキーとメソッド名を、要約の検査が値として数える | 要る |
| B | factory#43 | 承認の要約に、偽物の段の中身（設定する応答・確かめる要求）が出ない | 要る |
| C | factory#44 | `replicate --score` で偽物を使う仕様を採点するテストが無い | 要る |
| D | factory#45 | 偽物の段で落ちたとき、アプリが実際に送った要求が結果に残らない | 強く勧める |

---

## A（factory#42）

**Title**: Scenario summary check rejects the fake's control envelope (method, path, status, json, headers) as scenario values

**Body**:

`validateScenarios` (src/scenario.ts) rejects a summary that contains a value from the steps. For a service step it adds `objKeys(st.body)` and `strings(st.body)`. The body of `POST /responses` is the control envelope `{method, path, status, json?, headers?}`, so the check also counts:

- the envelope keys `method`, `path`, `status`, `json`, `headers`, which every set step has;
- the method name (`GET`, `PUT`, `POST`, `PATCH`, `DELETE`), matched as a lower-case substring.

None of these is canned data. As a result, ordinary summaries are rejected. Reproduced on main 6194c56 with one set step `{"method": "GET" | "PUT", "path": "/rates", "status": 200, "json": {"rate": 151}}`:

| summary | rejected for |
|---|---|
| "a failed service status gives an error" | `status` |
| "each method of payment is quoted" | `method` |
| "the target currency comes from the service" | `get` (in "target") |
| "the converted amount is computed from the rate" (PUT set) | `put` (in "computed") |

Why it matters for lap 11: each false rejection costs a repair round or a redraft, and the two drafter families may word summaries differently, so the rejection counts (which the lap reports) would differ for a reason unrelated to the scenarios.

**Proposed fix**: for a service set step, count only the canned answer. That is the strings and keys of `json` and `headers`, and the string `path`. Leave out the envelope keys and `method`. Add the four summaries above to the `service steps: ... summary must not carry the canned data` test as accepted, and keep a summary that does contain a canned key as rejected.

---

## B（factory#43）

**Title**: Approval summary shows a service step as `service POST /responses` only; show the canned answer and the request checks

**Body**:

#39 made the approval summary show every app step as the runner sends it (path, headers, body after substitution). A service step is still one line, `service <method> <path>` (`requestLines` in src/cli.ts), so the approver does not see:

- for `POST /responses`: which method and path on the service is set, the status, and the canned `json` / `headers` after substitution;
- for `GET /requests`: what the step checks (`expect`), which is where a scenario can expect a query string order or a header value that the request does not fix.

Lap 11 is the first lap that uses the fake. In laps 8 and 9 the factory's scoring bugs showed up exactly where a new step form was first used, and they read as a family effect. The approver needs to see what the fake will answer before any build is judged.

**Proposed fix**: in `requestLines`, for a set step print `service set <method> <path> -> <status>` and the canned body and headers, using the same substitution, truncation and secret-header rules as app steps. For a requests step, print `service requests` and its `expect` (truncated). No change to judging.

---

## C（factory#44）

**Title**: Test: `replicate --score` judges both scenario sets of a service spec against a fresh fake

**Body**:

The fake is covered for `run` (test/fake.test.ts: "run end to end with a fake model"). The path a lap uses is not covered. In that path, `draft --service` creates one set, `draft --spec-from <it>` creates the second set with another model, and `replicate <own> --k n --score <cross>` judges every build with both sets (`judgeOpts(a.spec)` in src/replicate.ts). Lap 11 runs its screen and its 2x2 this way.

**Proposed test** (fake model, no spend): draft a service spec and a `--spec-from` set, replicate with `--k 2 --score`, and check:

1. both sets are judged against the fake, with a fresh fake per scenario;
2. a leading set step answers the app at startup;
3. a `GET /requests` check sees only the app's own requests;
4. `--rescore` gives the same results.

---

## D（factory#45）

**Title**: Keep what the app sent to the fake in the result of a failed service step

**Body**:

When a `GET /requests` check fails, the result detail is `step n: response body did not match expected subset`. The fake's log is dropped with the fake. A lap reads every scenario that all builds failed before it goes on (lap 10 runbook: "suspect the factory first"). Without the log, the reader cannot tell a wrong expectation from a wrong app without re-running the build.

**Proposed fix**: when a step with `"service": true` fails, append the fake's log (method and path of each request, plus the body, truncated like the approval summary) to `detail`. The detail never reaches a builder (src/roles.ts keeps the summary as the only path), so the hidden-scenario rule is unchanged.
