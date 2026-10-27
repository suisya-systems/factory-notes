# 14 周目の前提になる工場の変更（Issue 案。起票していない）

factory のコードは触っていない。読んだのは suisya-systems/factory の `fea10ee`（PR #67 のマージ）。出典は `factory:path:line`。

## 1. builder の transcript を保存する（14 周目の前提。このマージが先）

### 調べたこと（D13-8 の問い: 既存の設定・フラグで足りるか）

**足りない。保存する経路が工場のコードに無い。**

- model CLI の呼び出しは `claude -p ... --output-format json ... --no-session-persistence ...`（`factory:src/adapter.ts:87`）。`--output-format json` は最終結果の 1 つの JSON（`result`、`total_cost_usd`、`modelUsage`）しか返さず、途中の tool 呼び出し（Bash、fetch、git）は出力に出ない。`--no-session-persistence` は CLI 自身の履歴ファイルも作らない。
- 履歴ファイルに頼る道もない。sandbox は `$HOME` を空の tmpfs で隠し（`factory:src/sandbox.ts:54`）、`~/.claude`（履歴・transcript の置き場）は意図して渡さない（`factory:src/adapter.ts:38-41` のコメント: 「drafter / 承認の session のシナリオ文が入りうる」）。渡す物は `~/.local/share/claude`・認証ファイル・最小化した `~/.claude.json` の写しだけ（`factory:src/adapter.ts:41-42`）。
- stdout は `spawnModel` が文字列に溜めて（`factory:src/adapter.ts:116`）、`runCli` が `JSON.parse` して `result` だけを `Result.text` に取る（`factory:src/adapter.ts:138-142`）。raw の出力はどこにも書かない。stderr は捨てる（`factory:src/adapter.ts:117`）。
- builder の呼び出しは `build()`（`factory:src/roles.ts:301-306`）。`Task` に出力先を渡す欄が無い（`factory:src/adapter.ts:10`）。replicate は `build(model, ws, approved.spec, '', guard.signal)` と呼ぶだけ（`factory:src/replicate.ts:136`）。
- 環境変数の入口は `FACTORY_HOME`・`FACTORY_STOP_FILE`・`FACTORY_DEPS` の 3 つだけ（`factory:src/lap.ts:140-146`、`factory:src/program.ts:74`）。transcript の設定は無い。
- 13 周目に状態ディレクトリを探して transcript が無かったことと一致する（[../lap-13/report.md](../lap-13/report.md)「学習汚染の事後検査」）。

### 変更案（Issue の本文案）

題: **Save the builder's model-session transcript under the state directory**

1. `Task` に任意の `transcript?: string`（ホスト上の絶対パス。workdir の外）を足す（`factory:src/adapter.ts:10`）。
2. `runCli` は `transcript` があるときだけ `--output-format stream-json --verbose` で呼ぶ（`--no-session-persistence` は残す）。stream-json は 1 行 1 イベントで、tool 呼び出しと結果を含み、最後の `type: "result"` の行が今の単一 JSON と同じ項目（`result`、`total_cost_usd`、`modelUsage`、`is_error`、`subtype`）を持つ。`runCli` はその行を `j` として今の分岐に渡す。raw の stdout は `transcript` に追記する。`transcript` が無い役（drafter、分類、judge）は今のまま。
3. `build()` に `transcript` の引数を足し（`factory:src/roles.ts:301`）、呼ぶ側が `$FACTORY_HOME/transcripts/<change>/<build の名前>.jsonl` を渡す: replicate は `<model>-<n>`（`factory:src/replicate.ts:136`）、run は `attempt-<n>`（`factory:src/run.ts:84`）。
4. 置き場の条件: 状態ディレクトリの下（`$HOME` の下で、どの sandbox にも渡さない。`factory:src/sandbox.ts:23-27` の保護の対象）。builder の入力は spec だけで scenario の文は含まない（`factory:src/roles.ts:300`）ので、保存してよい。drafter・分類・judge の transcript は保存しない（シナリオ文を含む）。
5. 試験: (a) fake の CLI（`runCli(t, bin)`）が stream-json を返し、`transcript` のファイルに全行が残り、`Result` が従来と同じになる。(b) `transcript` 無しの呼び出しは従来の引数（`--output-format json`）のまま。(c) 隔離の試験（`factory:src/adapter.ts:33` の `cliSandbox` のマウントの検査）が変わらず通る。(d) `CLI_MARKERS`（`factory:test/helpers.ts:89`）は `stream-json` を含み、CLI の語が `adapter.ts` の外へ漏れない検査なので、変更が `adapter.ts` の中に収まっていることの確認にもなる。

**未確認（この作業環境では model CLI を流せない）**: `--verbose` 付きの stream-json が `-p` で最後に `result` の行を返す形と、その `result` の項目名。実装の最初に実機で 1 回確かめる（`probe-isolation` と同じ約 $0.3 の呼び出しで足りる）。形が違えば、`runCli` の解析だけを直す。

14 周目でこの変更に頼る点: 汚染の検査（[prereg.json](prereg.json) の `contamination.check`）が builder の fetch・git・pip の記録を直接読める。

## 2. 費用の上限の定数を上げる（14 周目の前提。値は外挿で、実測していない）

依頼が大きくなると（1,082 語、見せる範囲 約 117,000 字、シナリオ 26〜34 本の見込み）、13 周目の上限を超える見込みがある。

| 定数 | 場所 | 今の値 | 案 | 理由 |
|---|---|---|---|---|
| `CLASSIFIER_BUDGET.maxCostUsd` | `factory:src/classify.ts:54` | $0.5 | $1 | 13 周目の分類は平均 $0.33（最大 $0.334、上限の 67 %）。見せる字数が 81,000 → 約 117,000 で 1.45 倍なら約 $0.48（上限の 96 %）。上限に当たると draft が失敗する |
| `draftTask` の `maxCostUsd` | `factory:src/roles.ts:152` | $1 | $2 | spec drafter 平均 $0.37・scenario drafter 平均 $0.51（最大 $0.53）が、依頼と範囲の増加で上限の 7 割を超える見込み |
| `CAPS.maxCostUsd`（1 つの draft 全体） | `factory:src/limits.ts:13` | $10 | $25 | 13 周目の draft は 14 シナリオで $6.3〜6.4。分類はシナリオごとに 1 回なので、30 本なら分類だけで約 $14、合計 約 $16 |

`CAPS.lapCostUsd`（$260）と `CAPS.builderCallUsd`（$5）は変えない。13 周目の build は最大 $0.51 で、14 周目は 2 倍としても $5 に遠い。

これを先に入れる理由: 上限に当たると draft は課金の途中で失敗する（13 周目の runbook 手順 6 の注意）。実測の draft を別に 1 回流して上限を決める 13 周目の方式は、この周では $16 前後の測定費用が掛かるので使わず、上限を先に十分高く置き、本番の draft の台帳で実測する（[runbook.md](runbook.md) 手順 5）。この点は人の判断に回す（完了報告の「判断仰ぎ」）。

## 3. 14 周目では要らない変更（記録）

- 偽サービスと `run` の手の組み合わせ（題材 C に要る。[design.md](design.md) の案 2）: `run` の手はネットワークを切って走り（`factory:src/program.ts:54`、`factory:src/program.ts:165` の `isolateNet: true`）、`run` の手の許すキーは `run` `stdin` `files` `read` `env` `expect` `capture` だけで、`service` の手は HTTP の手に限る（`factory:src/scenario.ts:77, 98`）。通知先の偽物をプログラムから叩かせるには、`run` の sandbox の中に loopback の偽サービスを立てる変更が要る。14 周目の推奨案には入らない。
