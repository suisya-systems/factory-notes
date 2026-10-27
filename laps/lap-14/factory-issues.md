# 14 周目の前提になる工場の変更（Issue 案。起票していない。実装は別ワーカー）

オーナー決定（2026-10-27）: 14 周目は題材 A + B + C で組み、下の 4 本を別ワーカーが factory に実装する。factory のコードはここでは触っていない。読んだのは suisya-systems/factory の `fea10ee`（PR #67 のマージ）。出典は `factory:path:line`。**4 本すべてが factory にマージされるまで 14 周目は始めない**（[runbook.md](runbook.md) 手順 0）。

| # | 変更 | 規模の見込み | 14 周目で要る理由 |
|---|---|---|---|
| 1 | builder の transcript を保存する | 小（`adapter.ts` が中心） | 汚染の検査（D13-8） |
| 2 | 費用の上限の定数 | 定数 3 つ | 依頼が 3.4 倍になり 13 周目の上限に当たる |
| 3 | 期待値に「無いこと」を書ける（`expect.jsonAbsent`） | 小（`jsonHas` の逆） | B の record の消去を言う |
| 4 | `run` の手と偽サービスを 1 つのシナリオで使える | 中（前例 #17・#24 より小さい見込み） | C の通知先（ntfy）を確かめる |

## 1. builder の transcript を保存する

### 調べたこと（D13-8 の問い: 既存の設定・フラグで足りるか）

**足りない。保存する経路が工場のコードに無い。**

- model CLI の呼び出しは `claude -p ... --output-format json ... --no-session-persistence ...`（`factory:src/adapter.ts:87`）。`--output-format json` は最終結果の 1 つの JSON（`result`、`total_cost_usd`、`modelUsage`）しか返さず、途中の tool 呼び出し（Bash、fetch、git）は出力に出ない。`--no-session-persistence` は CLI 自身の履歴ファイルも作らない。
- 履歴ファイルに頼る道もない。sandbox は `$HOME` を空の tmpfs で隠し（`factory:src/sandbox.ts:54`）、`~/.claude`（履歴・transcript の置き場）は意図して渡さない（`factory:src/adapter.ts:38-41` のコメント: 「drafter / 承認の session のシナリオ文が入りうる」）。渡す物は `~/.local/share/claude`・認証ファイル・最小化した `~/.claude.json` の写しだけ（`factory:src/adapter.ts:41-42`）。
- stdout は `spawnModel` が文字列に溜めて（`factory:src/adapter.ts:116`）、`runCli` が `JSON.parse` して `result` だけを `Result.text` に取る（`factory:src/adapter.ts:138-142`）。raw の出力はどこにも書かない。stderr は捨てる（`factory:src/adapter.ts:117`）。
- builder の呼び出しは `build()`（`factory:src/roles.ts:301-306`）。`Task` に出力先を渡す欄が無い（`factory:src/adapter.ts:10`）。replicate は `build(model, ws, approved.spec, '', guard.signal)` と呼ぶだけ（`factory:src/replicate.ts:136`）、run も同じ（`factory:src/run.ts:84`）。
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

## 2. 費用の上限の定数

オーナー決定の値: 分類 $1、drafter $2、1 つの draft $25。

| 定数 | 場所 | 今の値 | 決定 |
|---|---|---|---|
| `CLASSIFIER_BUDGET.maxCostUsd` | `factory:src/classify.ts:54` | $0.5 | $1 |
| `draftTask` の `maxCostUsd` | `factory:src/roles.ts:152` | $1 | $2 |
| `CAPS.maxCostUsd`（1 つの draft 全体） | `factory:src/limits.ts:13` | $10 | $25 |

`CAPS.lapCostUsd`（$260）と `CAPS.builderCallUsd`（$5）は変えない。

**実装担当に伝える懸念（外挿。実測していない）**: 14 周目の見せる範囲は約 143,200 字（13 周目の 81,000 字の 1.77 倍）、シナリオは 40〜50 本の見込み（13 周目は 14〜15 本）。13 周目の分類は平均 $0.33（最大 $0.334）なので、字数の比で約 $0.58 / 呼び出し（上限の 58 %）になり、$1 の上限には収まる。ただし分類はシナリオごとに 1 回なので、45 本なら分類だけで約 $25、draft 全体では約 $28 になり、**1 つの draft の上限 $25 を超えうる**。超えると draft は課金の途中で失敗する。$25 のまま進めるか、$40 に上げるか、見せる範囲を削るかは、人の判断（[runbook.md](runbook.md) 手順 5 で最初の draft の費用を読み、止める線を決めてある）。

## 3. 期待値に「無いこと」を書けるようにする（`expect.jsonAbsent`）

B の中心の性質は「古い record を消す」（wait / escalate / 不正な入力 / 書けないとき）で、期待値は「ファイルが無い」になる。今の工場では書けない。

- `Expect` は `status`・`json`（部分一致）・`jsonHas`（あること）・`isArray`・`length`（配列の長さ）だけ（`factory:src/scenario.ts:10`）。`checkStep` は `jsonHas` を存在、`json` を部分一致で見る（`factory:src/scenario.ts:181-196`）。
- `run` の手は、`read` に挙げたファイルが無いと封筒の `files` から落とす（`factory:src/program.ts:170-176`、コメント「absent from the envelope, so `jsonHas` / `length` can tell」）。落ちたことを言う期待値が無い。`expect.json: {"files": {}}` は部分一致なので、古い record が残っていても通る。`length` は配列にしか使えない（`factory:src/scenario.ts:184-187`）。
- したがって、「消えている」を期待値にしたシナリオは、消えない実装でも通る（偽の合格）か、書けない。C の「サービスが何も受け取っていない」は、受け取った要求の配列の長さ 0（`length`）で言えるので、`jsonAbsent` が無くても書ける。必要なのは B の側。

変更案: `expect` に `jsonAbsent: string[]`（`jsonHas` の逆。`get(json, p) !== undefined` なら失敗）を足す。`validateScenarios` の許すキー、シナリオの漏れ検査、草稿役への指示（`factory:src/roles.ts` の期待値の説明）、分類の予測の照合（`factory:src/classify.ts`）、承認の要約の表示、試験を含む。規模は小さい（`jsonHas` と同じ作り）。

なお `expires_at_ms - decided_at_ms = 30000` の引き算は `capture` では書けない（`capture` は値を取るだけ。`factory:src/scenario.ts:191-194`）。これは工場に足さず、Q には入れない（シナリオは両方の項目が整数であることまで）。

## 4. `run` の手と偽サービスを 1 つのシナリオで使えるようにする（偽の通知先の手）

C（ntfy）は、プログラムが外のサービスへ HTTP を送る変更で、確かめるには「偽の通知先を立て、プログラムを走らせ、偽の通知先が受け取った要求を見る」が 1 本のシナリオに要る。今の工場は両方を別々に持つが、組み合わせられない。

### 今の状態（出典）

- `run` の手のプログラムはネットワークなしで走る: `sandboxRun(..., { workdir, writable: true, extraRo: [appDir], isolateNet: true }, ...)`（`factory:src/program.ts:165`）。loopback だけの名前空間で、外へ出ない。
- 偽サービス（`startFake()`、`factory:src/fake.ts:32`）は工場のプロセスの中にあり、自分の listener を持たない（builder が同じホストのネットワークを共有しているので、ポートを開けると並走する builder に見える）。アプリは、自分の名前空間の中の loopback ポート（`SERVICE_URL`）に繋ぎ、**fd 3 のパイプ**で工場に橋渡しされる（`factory:src/sandbox.ts:100-152` の `RELAY`、`factory:src/sandbox.ts:163-215` の `spawnApp` の `service`）。偽の応答の設定と、受け取った要求の取得は、`service: true` の手（`POST /responses`、`GET /requests`。`factory:src/fake.ts:19`）。
- HTTP アプリのシナリオは偽サービスを持てる（`factory:src/scenario.ts:342-` の `fake = o.service ? startFake()`）が、プログラムのシナリオは `fake` を渡されない（`factory:src/scenario.ts:338` の `runSteps(0, s.steps, 0, {}, undefined, ...)`）。
- 4 つの壁: (a) `draft` が拒む: `--contract` と `--service` の組（`factory:src/cli.ts:324`）、spec が両方を宣言する組（`factory:src/roles.ts:256`）、プログラムの spec のシナリオに `run` 以外の手が 1 つでもある場合（`factory:src/roles.ts:264-265`）。(b) `runSteps` が、プログラムのシナリオの `service` の手を拒む（`factory:src/scenario.ts` の `else if (prog) return ... run steps only` が `st.service` の分岐より前にある）。(c) `runProgram` に橋が無い。(d) `SERVICE_URL` をプログラムの環境にもシナリオの変数にも渡す道が無い。

### 変更案（Issue の本文案）

題: **A command-line program can reach the fake external service in `run` scenarios**

1. **draft の許可**: `--contract` と `--service` を一緒に使える（`factory:src/cli.ts:324` と `factory:src/roles.ts:256` の拒否を、`--ui` との組だけに狭める。`factory:src/roles.ts:264-265` の「プログラムのシナリオの手はすべて `run`」は、「`run` と `service: true` の手だけ」に直す）。spec の `## External service (factory)` の節（`factory:src/fake.ts:13` の `withService`）の文面を、プログラムのときは「`process.env.SERVICE_URL`」でなく「環境変数 `SERVICE_URL`（プログラムの環境）と、シナリオの変数 `{{SERVICE_URL}}`」と書く。実行契約の文（`factory:src/roles.ts:285`、「no network at runtime except the external service at process.env.SERVICE_URL」）も、プログラム用の契約（`factory:src/roles.ts:291-299` の `programContract`）に同じ例外を足す。
2. **橋**: `runProgram` が任意の `service?: { port: number; connect: () => Duplex }` を受け、`spawnApp` と同じ橋を張る。つまり、プログラムの名前空間の loopback の `service.port` で listen する `RELAY` を、プログラムと同じ sandbox の中で先に起動し（ready の印が出てから、プログラムを `exec`）、受けた接続を fd 3 経由で `fake.connect()` へ渡す。プログラムが終わったら中継を止める。`RELAY` の「host → app」の側（`port` を待つ `wait()`）は、プログラムには要らない（`port` を 0 にして待たない形にする）。fd 3 は、プログラム本体には閉じる（`3>&-`。`factory:src/sandbox.ts:165` と同じ）。builder の書いたプログラムが fd 3 を読み書きして橋を悪用できないこと。
3. **環境と変数**: spec が service を宣言しているとき、プログラムの環境に `SERVICE_URL=http://127.0.0.1:<port>` を足す（`factory:src/sandbox.ts:95-97` の `appEnv` の `SERVICE_URL` と同じ形）。`port` はシナリオごとに空きを取る（`factory:src/scenario.ts:301-302` と同じ）。さらに、シナリオの変数 `SERVICE_URL`（`vars`）に同じ値を入れ、`argv`・`stdin`・`files`・`env` の `{{SERVICE_URL}}` が置き換わる（`factory:src/scenario.ts` の `fill` と `runSteps` の `run` の分岐）。これで、シナリオが書く設定ファイルに通知先の URL を書ける。**`env` の予約名（`factory:src/program.ts:22` の `RESERVED_ENV`）には `SERVICE_URL` を足す**（シナリオが上書きできない）。
4. **シナリオの手**: プログラムのシナリオに `service: true` の手（`POST /responses` と `GET /requests` の 2 形だけ）を混ぜられる。`runSteps` の `st.service` の分岐を `prog` の拒否より前に置き、`validateScenarios` の許可（`factory:src/scenario.ts:77, 98`）も同じにする。順序は書いたとおりに実行する: 偽の応答を設定 → `run` → `GET /requests` で受け取った要求を見る、を 1 本のシナリオで書ける。偽サービスはシナリオごとに新しい（`factory:src/scenario.ts:342`）。
5. **偽サービスの上限**: 既存の上限（`FAKE_LIMITS`: 要求 100、接続 20、本文 64,000 バイト、合計 512,000 バイト。`factory:src/fake.ts:18`）をそのまま使い、超えたらそのシナリオを落とす（`factory:src/scenario.ts:352` と同じ）。
6. **下書きと分類**: 草稿役への指示（`factory:src/roles.ts:72-79` の `SERVICE_STEPS`、`factory:src/roles.ts:113` の `RUN_STEPS`）と分類器への注意（`factory:src/classify.ts:61, 75` の `SERVICE_NOTE`、`RUN_NOTE`）に、両方を使うときの書き方（設定ファイルに `{{SERVICE_URL}}`、`service` の手で応答を先に設定、`run`、`GET /requests`）を足す。分類は、`service` の手を今も扱っている（`factory:src/classify.ts:58-64`）。プログラムのシナリオの `GET /requests` の予測の扱い（予測は「プログラムが送るはずの要求」になる）が成り立つか確かめ、成り立たなければ、`GET /requests` を含むシナリオの分類は「プログラムの要求の列」を予測させる形に直す。要約の漏れ検査（`factory:src/scenario.ts:116-120` の `lits`）は、`service` の手の `body` を既に数えている。
7. **承認の要約と台帳**: 承認の要約が、プログラムと service の両方の宣言を表示する。
8. **試験**: (a) 偽の通知先に POST するだけの小さな Python プログラム（またはシェル）で、`service` の設定 → `run` → `GET /requests` のシナリオが通り、受け取った要求の `method`・`path`・`headers`（小文字の名前）・`body` が封筒で読める。(b) 応答を設定しないと、プログラムは 404 を受ける（偽サービスの既存の動き）。(c) 何も listen していない URL（`http://127.0.0.1:9`）へ送るプログラムは接続拒否で落ちるが、シナリオは続く。(d) プログラムが fd 3 を閉じられていること、`SERVICE_URL` がシナリオの `env` で上書きできないこと。(e) `--contract` と `--ui` の組は今も拒否される。(f) service を宣言しない spec の挙動が変わらないこと。

### 規模と注意

前例（ブラウザの手 #24: +590/-40 行・14 ファイル、外部サービスの偽物 #17: +374/-37 行・9 ファイル。監査 1 節の `factory` の `584eac1` と `a84e482`）より小さい見込み（橋と偽サービスは再利用）。ただし橋は fd 3 と sandbox の組を触るので、隔離の試験（builder のコードから vault や fd が読めないこと）を落とさないこと。

**未確認**: プログラムの sandbox（`isolateNet: true`、`/run` を隠す）の中で、`RELAY` の node がプログラムの前に立ち上がること（`NODE_DIR` は読み取りで見える。`factory:src/sandbox.ts` の `ro = [NODE_DIR, ...]`）。この作業環境では factory の sandbox が入れ子にできず、動かして確かめていない。

## 5. 14 周目では要らない変更（記録）

- 通知先を 5 種（Slack・Discord・ntfy・Gotify・Pushover）に広げること。14 周目は ntfy だけ。
- 本番を見る段（`observe`）、`serve`、smoke（プログラムの出荷は ff-only のみ。13 周目と同じ）。
