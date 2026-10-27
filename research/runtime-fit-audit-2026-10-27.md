# factory は claude-org-runtime を対象にできるか（2026-10-27）

## まず結論

今の factory では通せない。理由は依存の供給よりも手前にある。

- factory は「Node.js 22 の HTTP サーバーを新規に作るアプリ」を前提に、役割の指示・実行・出荷までが固く作られている。Python は `src/` に 1 回も出てこない（`grep -ri python factory:src` が 0 件）。
- 外せない壁は 3 つ。(1) プロセスを起動して標準出力・終了コード・生成ファイルを見る手順が無い。(2) 既存コードの取り込み（`--base`）が 200,000 文字で止まり、runtime は約 119 万文字ある。(3) 計測の道具である `replicate` は、既存アプリの拡張を拒む。
- 依頼文の前提には事実と違う点が 2 つある。runtime は core-harness に依存しておらず、herdr も Python の依存ではない。builder の model 呼び出しの sandbox は網を切っていない（切っているのは builder が書いたアプリを動かす sandbox だけ）。どちらも依存供給の設計を変える。争点 1・2 に置いた。
- 題材は 3 つ選べた（A: herdr の pane id、B: spawn-prompt-step、C: ntfy の通知先）。現状は 3 つとも ×。手順を足し、`--base` の取り込みと `replicate` を直せば、A は ○、B と C は △ になる見込み。
- 工場に足すものは Issue 案 6 本にまとめた（末尾）。ゲート 1 で決めてもらう 4 点（手順、依存供給、題材、費用上限）も末尾に並べた。

調べた版: factory 26e4e1b（2026-10-26）、claude-org-runtime 719f865（v0.1.51、2026-10-15）、factory-notes は本ブランチの基点。この段では工場のコードも runtime も変えていない。両方とも `.worker-scratch/` へ clone して読んだだけである。

## 読み方と、今回できなかったこと

- 出典は `repo:path:line`。`factory` は suisya-systems/factory、`runtime` は suisya-systems/claude-org-runtime、`notes` はこのリポジトリ（factory-notes）。
- **runtime の pytest は流せなかった。** 取得した外部コードの実行として、この作業環境の自動判定に止められた。回避はしていない。そのため既存テストの合格数・skip 数は無い。件数は `def test_` の静的な数え上げで、実行結果ではない。
- **`gh` が使えなかった**（`~/.config/gh/hosts.yml` の読み取りが sandbox で拒否される）。open issue は GitHub の公開 API（認証なし）で 2026-10-27 に取った。ラベルと本文だけを読み、コメントは読んでいない。
- 費用の見立てはすべて、l3-report の実測（greenfield のアプリ）からの外挿で、この対象では測っていない。

## 1. シナリオの手順

### 工場が今できること

- シナリオの 1 手は HTTP 要求、service（偽サービスの操作）、ui（ブラウザ操作）の 3 種だけ（`factory:src/scenario.ts:13-14`）。検証は未知のキーを拒む（`factory:src/scenario.ts:21-23, 55, 64`）。
- 1 本のシナリオごとに、アプリを `npm start` で新しく起動し、host の loopback に橋を架けて HTTP で叩く（`factory:src/scenario.ts:243-268, 285`、`factory:src/sandbox.ts:163-167`）。アプリは常駐プロセスで、終了コードは見ない。
- 手の結果は `checkStep(step, status, json, …)` に渡して判定する（`factory:src/scenario.ts:138-154`）。ui の手は、ページを JSON にして同じ `checkStep` に渡している（`factory:src/scenario.ts:196-214`）。つまり「結果を JSON の封筒にして `checkStep` に渡す」型はすでにある。

### runtime の CLI が要求すること

| CLI | 入力 | 出力と判定の材料 | 出典 |
|---|---|---|---|
| `settings generate` | フラグ、スキーマ | 標準出力または `--out` のファイル（JSON） | `runtime:docs/cli.md:229-264`、`runtime:src/claude_org_runtime/cli.py:76-84` |
| `dispatcher delegate-plan` | `--task-json` `--panes-json` のファイル、`--state-dir` | 標準出力の JSON、`--state-dir` 配下へのファイル書き込み、終了コード 0 / 1 / 2 | `runtime:docs/cli.md:14-35, 119-125` |
| `dispatcher spawn-prompt-step` | 標準入力の JSON | 標準出力の JSON、終了コード 0 / 10 / 2、`--target` を付けると判定記録のファイル | `runtime:docs/cli.md:163-181` |
| `migrate v1-to-v2` | `--in` のファイル | `--out` のファイル、終了コード 0 | `runtime:src/claude_org_runtime/migrate/v1_to_v2.py:246-288`、`runtime:src/claude_org_runtime/cli.py:150-163` |

どれも「作業ディレクトリを用意し、入力ファイルを置き、コマンドを 1 回（または続けて数回）走らせ、終了コード・標準出力・出力ファイルを見る」という形である。常駐しないので、ポートも橋も要らない。

### 既存の 3 種で代替できるか

| 案 | 判定 | 理由 |
|---|---|---|
| HTTP の薄い殻（`npm start` の小さなサーバーが CLI を起動して結果を返す） | △ で採らない | 動くが、殻はリポジトリ内の追跡ファイルになる。判定は builder が commit した木を書き出して走らせる（`factory:src/sandbox.ts:268-281`）ので、builder が殻を書き換えて結果を偽れる。殻を工場側から注入するなら、それは新しい手順を足すのと同じ |
| service | × | 偽の外部サービスの操作用で、アプリの起動ではない（`factory:README.md:38`） |
| ui | × | ブラウザ用 |

**判定: 新しい手順が要る。** 提案は `"run"` の手で、1 本のシナリオに 1 つの作業ディレクトリを持たせる。

- 入力: `argv`（シェル文字列でなく配列。`factory:README.md:44` の `exec` と同じ考え方）、`stdin`、置いておく `files`、`env`（許可リスト）。
- 結果の封筒: `status` に終了コード、`json` に `{"stdout": <JSONとして読めれば値、でなければ文字列>, "stderr": <文字列>, "files": {<パス>: <JSON または文字列>}}`。こうすれば `expect` の `status` / `json`（部分一致）/ `length` / `capture` をそのまま使える。ui の手と同じ作り（`factory:src/scenario.ts:206`）。
- sandbox: 作業ディレクトリだけ書き込み可、`--unshare-net`、HOME と /tmp を隠す、時間制限と出力の上限（`factory:src/sandbox.ts:54-70` の既存の作りを使う）。
- 落ちたときの理由（要約）に具体的な値を入れてはいけない規則は、`argv`・`stdin`・`files`・期待値の文字列にも広げる（`factory:src/scenario.ts:82-91`）。
- 下書き側の指示も変える。`HTTP JSON API` と固定した文面（`factory:src/roles.ts:205, 218`）、インタフェースの鍵（`endpoints` など。`factory:src/roles.ts:35`）には、コマンド名・フラグ名・ファイル名・JSON の項目名を入れる口が要る。
- 分類（独立した分類）は「各要求への応答を予測して期待値と機械的に照合する」（`factory:README.md:22-28`）。標準出力が長文のものは予測が合いにくい。JSON で読める出力に限る方針にすると扱いやすい。
- 同じ作りの前例の大きさ: ブラウザの手（#24）は +590/-40 行・14 ファイル（`factory` の 584eac1）、外部サービスの偽物（#17）は +374/-37 行・9 ファイル（a84e482）。これに近い規模で、後続の直しが数本付く見込み（ブラウザの手は #27・#54〜#63 が続いた）。実測ではなく、前例からの見立て。

## 2. 依存の供給

### 事実

- runtime の PyPI 依存は `jsonschema>=4.18` の 1 つだけ。dev は `pytest`（`runtime:pyproject.toml:17-22`）。Python は `>=3.10`（同 :6）。CI は OS 3 種 × Python 3.10 / 3.11 / 3.12（`runtime:.github/workflows/test.yml:15-17`）。
- `jsonschema` を import するのは `broker/residents.py` の 1 か所だけ（`runtime:src/claude_org_runtime/broker/residents.py:48, 441`）。ほかの src は標準ライブラリ。
- **core-harness は依存ではない。** README は「姉妹リポジトリ」と書く（`runtime:README.md:4-5, 116`）。テストには「core_harness はここでは依存ではないので、その規則を書き直した」とある（`runtime:tests/test_settings_generator.py:43-45`）。pyproject に出てこない。pin（版固定）も runtime のリポジトリには無い。
- **herdr も Python の依存ではない。** PATH 上のバイナリの存在確認だけで、アダプタの操作は Unix ソケット経由（`runtime:src/claude_org_runtime/terminal/herdr.py:262-275`）。テストは偽のソケットサーバーで動く（`runtime:tests/terminal/test_herdr.py:58`、Windows では全体を skip :53）。版の境界は、herdr の wire protocol の表（`SUPPORTED_PROTOCOLS`、`protocol_for_version`）として runtime 側のコードに書かれている（`runtime:README.md:85-96`、`runtime:CHANGELOG.md:37-46, 76-85`）。
- 条件付き skip が複数ある: 実機の claude が要るもの（`runtime:tests/test_env_template_carve_out.py:114`、`test_docker_push_deny.py:90`、`test_live_claude_mcp_env_expansion.py:28`）、bwrap が要るもの（`test_sandbox_symlink_deny.py:64, 79`）。factory の sandbox 内で bwrap は入れ子にできない見込み（未確認）なので、bwrap を要するテストは skip になる。

### builder の sandbox と網（依頼文との食い違い）

依頼文は「builder の sandbox は網を切っている」とした。実際は 2 つに分かれる。

| 何が動くか | 網 | 出典 |
|---|---|---|
| builder の model 呼び出し（コードを書く側） | **切っていない。** API に出る必要があり、`unshare-net` を使わない。プロキシ変数も通す | `factory:src/adapter.ts:34-44, 97-106`、`factory:README.md:38`（「builder sessions share the host network」） |
| builder が書いたアプリ（判定・smoke・本番） | 切っている（loopback のみ） | `factory:src/sandbox.ts:69`、`factory:src/scenario.ts:243-268` |

builder に「依存を入れるな、網を使うな」と言っているのは指示文だけである（`factory:src/roles.ts:229-234`）。つまり今の工場では、builder は `pip install` できてしまうが、入れた先（HOME の下）は判定の sandbox では隠れる（`factory:src/sandbox.ts:54`）。

### 判定の sandbox で Python を動かすために要るもの

- `PATH` は node の場所と `/usr/local/bin:/usr/bin:/bin` だけ（`factory:src/sandbox.ts:15`）。`python3` が `/usr/bin` にあれば見える。pyenv や uv の置き場が HOME の下にあれば隠れる（同 :54）。
- アプリの env は `PATH` `HOME` `PORT` `DATA_DIR` `NODE_ENV` だけ（`factory:src/sandbox.ts:95-97`）。`PYTHONPATH` も仮想環境も無い。
- 隠れる場所: `$HOME`、`/tmp`、`/mnt`、`/run/user`、`/var/tmp`、`XDG_RUNTIME_DIR`、網を切る場合は `/run`（`factory:src/sandbox.ts:54-62`）。仮想環境はそれ以外（例 `/opt` の下）に置く必要がある。

### 候補の比較

| 案 | 中身 | 良い点 | 悪い点 | 判定 |
|---|---|---|---|---|
| 1. wheel の事前配置 | 運用者が、ハッシュ固定の wheel 群（wheelhouse）から仮想環境を HOME の外に作り、判定・smoke・builder の sandbox に読み取り専用でマウント（`extraRo`。`factory:src/sandbox.ts:36, 47, 65`）。env に `PYTHONPATH` を足す | 版とハッシュが決まる。判定が網なしで再現する。ship の「判定した木と出荷する木は同じバイト」（`factory:src/sandbox.ts:268-273`）を崩さない | 運用者が先に作る手が 1 つ増える。`jsonschema` の依存（`rpds-py` はネイティブ wheel のはず。**PyPI のメタデータは未確認**）が、Python の版と OS の ABI に縛られる。pin を動かす変更には対応できない（下の 3 節） | **推奨** |
| 2. vendoring | 依存を追跡ファイルとしてリポジトリに入れる | 木に入るので判定と出荷で同じバイトになる | runtime のリポジトリを汚す（出荷先は使い捨ての clone）。`--base` の取り込みがさらに膨らむ。ネイティブ wheel は入れにくい。測っている対象が「vendor 経由で動く runtime」になり、インストールした runtime と違う | 不採用 |
| 3. キャッシュの読み取り専用マウント | pip のキャッシュを mount し、sandbox 内で `pip install --no-index` | 事前配置と似るが、wheel の置き場だけ共有 | 1 本のシナリオごとにアプリを新しく起動する（`factory:src/scenario.ts:243`）ので、そのたびに install が走って遅い。書き込み先も要る。仮想環境を 1 回作る案 1 のほうが単純 | 不採用（案 1 に吸収） |
| 4. 何もしない（builder が入れる） | 今の状態 | 手がかからない | 判定の sandbox から入れた物が見えず、そもそも動かない。動かせてしまった場合は再現性が無い | 不採用 |

core-harness と herdr については、今回選んだ 3 題材（下の 4 節）は標準ライブラリだけで動き、どちらも要らない。pytest が要るのは builder が自分のテストを走らせたいとき（builder の sandbox にホストの Python と pytest が見えること）で、判定には要らない。

## 3. base の扱い

### 事実

- `draft --base` は ship target の HEAD の 1 コミットを取り、追跡されている文字ファイルを全部プロンプトに貼る。**上限は 200,000 文字**（`factory:src/cli.ts:85-105`、上限は :88、超えると例外 :102）。絞る口は無い。
- runtime は、`src/` が約 1,190,510 文字、`tests/` が約 1,285,871 文字、追跡ファイルは 152 本（`git ls-files | wc -m` の実測）。題材の周辺だけでも、`dispatcher/` が 186,494 文字、`settings/` が 125,845 文字、`migrate/` が 10,537 文字で、`dispatcher/` + `settings/` だけで 200,000 を超える。**`--base` は runtime では draft の段階で必ず落ちる。**
- 承認は base の commit を含む版に結びつく（`factory:src/vault.ts:15-17, 59`）。`run` は ship target の HEAD が承認時の base と違えば止まる（`factory:src/run.ts:75-76`）。builder は ship target の clone の上で作業する（同 :77）。
- **`replicate` は拡張の変更を拒む**（`factory:src/replicate.ts:55`）。毎回空のリポジトリから始める（同 :121）。較正の予備選別と Q（build ごとの合格割合の平均。`notes:laps/calibrate-80/design.md:186`）は `replicate` で測っている。**既存コードの拡張では、同じ道具で Q が出せない。** `run`（やり直しあり・LLM 判定あり・出荷あり）は拡張に対応しているが、別の指標になる。
- 出荷は ship target が `main` の上でクリーンなことを要求し、`git merge --ff-only` で進める（`factory:src/ship.ts:40-44, 53`）。push はしない（同 :53 のコメント）。

### plan / part と base

- 計画の分割は「1 つ目は新しいアプリ、後の部分がそれを拡張する」前提で、1 つ目の draft は `--base` を付けず、承認済みの base が `null` でなければ失敗にする（`factory:src/plan.ts:184, 202`）。**既存リポジトリを対象にした計画は、1 つ目の部分から作れない。**
- 2 つ目以降は `--base <ship target>` で draft し、1 つ前が出荷した commit に一致することを要求する（`factory:src/plan.ts:184, 196`）。最後に `<plan>-whole` のシナリオを最終 commit に流す（`factory:README.md:17`）。
- **core-harness の pin を動かす依頼が出た場合。** 前提として、runtime のリポジトリには core-harness の pin が無い（2 節）。あるとすれば pyproject の依存行を足す変更になる。今の factory の扱い:
  1. 依存は git の外（仮想環境）にあるため、base の commit や承認の版（`factory:src/vault.ts:15`、`Base` は `baseSha` と `requestSha256` だけ :17）に入らない。pin を動かしても承認は無効にならず、検知もされない。
  2. 計画の 1 つ目の部分が pin を動かすと、2 つ目以降の部分と最後の `<plan>-whole` は、運用者が用意した別の仮想環境で走る必要がある。部分ごとに仮想環境を切り替える仕組みは無い。
  3. インタフェースの縛り（`draft --iface-from`）は名前だけで、版は縛らない。
  4. 部分が上限で落ちて `-r2` で再試行しても、承認済みの組は同じ（`factory:README.md:17`）なので、依存の組も変わらない。
- 整理案: 依存の組（lock のハッシュと wheelhouse の一覧）を承認の版と `Base` に入れる。仮想環境は lock のハッシュごとに 1 つ。pin を動かす変更は、挙動を変える部分より前の独立した部分に分けるか、この段では禁止する。後者がやさしい。ゲート 1 には載せず、第 2 段の設計で扱う提案とする（pin が実在しない以上、争点 1 の答えに従う）。

## 4. 題材の候補

### 選び方

- 母集団: open issue 8 本（2026-10-27 時点、PR を除く）と、直近 10 リリース（v0.1.42〜v0.1.51、`runtime:CHANGELOG.md:10-500`）の変更。
- 条件: Python 層、入出力が決まっている、依頼文が 300〜900 語に収まる、既存の pytest で部分的に確かめられる、live の herdr / Claude / tmux を要らない。
- open issue のうち 7 本は条件に合わない: #241 は herdr の実機を要る（`investigation/run_09_probe.sh` を host で走らせる）、#177 は実機の dogfood、#131 / #81 は Claude Code 側の信号待ち、#124 は設計の議論、#47 は tmux 実機、#45 は低優先の spike。合うのは #21 だけ。
- release の変更は「過去に出荷した変更をその直前の commit から再現する」形（後戻りの試し）になる。公開リポジトリなので、答えが model の学習に入っている可能性は排除できない（争点 6）。

### 3 つの候補

**A. herdr の pane id が 10 個目以降でも delegate-plan が通る**（v0.1.50、runtime の #240、`runtime:CHANGELOG.md:99-106`）

- 入出力: `dispatcher delegate-plan --panes-json --task-json --state-dir --dry-run` の標準出力 JSON と終了コード 0 / 1 / 2（`runtime:docs/cli.md:14-35, 119-125`）。pane id は `w1:pA` `w1:p0` `w1:p11` のような形で、数字でなく herdr 独自の 32 文字表（`runtime:src/claude_org_runtime/dispatcher/runner.py:90-100`）。
- 既存の pytest: `runtime:tests/test_dispatcher_runner.py`（107 件、`w1:p11` を含む）。
- 依存: 標準ライブラリのみ。
- 依頼文の長さ: 300〜500 語で書ける（手前の commit のコードで、10 個目以降の id が拒否されるところが出発点）。

**B. spawn-prompt-step が判定記録を書く**（v0.1.50、#244 / #245、`runtime:CHANGELOG.md:28-36`）

- 入出力: 標準入力 `{"screen","previous_screen","elapsed_ms"}`、標準出力に次の操作、終了コード 0 / 10 / 2、`--target` を付けると `<state-dir>/dispatcher/spawn-prompt/<target>.json` を書く（`runtime:docs/cli.md:163-181`）。記録の形は「安定した契約」として文書化されている（同 :182 以降）。
- 既存の pytest: `runtime:tests/test_spawn_prompt.py`（55 件）。
- 依存: 標準ライブラリのみ。
- 注意: 記録に 30 秒の期限が付く（`runtime:CHANGELOG.md:33`）。時計に依存する確認は決定的にならない。期限の項目は「あること・形」までしか確かめられない。

**C. attention の通知先に ntfy を足す**（open issue #21、2026-05-12）

- 入出力: 設定 JSON で 1 つの通知先を有効にする。通知先の失敗は記録して握りつぶす。ネットワーク呼び出しのテストは mock にする（issue 本文の要件）。`attention scan --config --json`（`runtime:src/claude_org_runtime/attention/cli.py:368-395`）。
- 既存の pytest: `runtime:tests/attention/`（`test_cli.py` が 34 件。ほかのファイルは数えていない）。
- 依存: 標準ライブラリ（`urllib`）のはず。
- 注意: 本文は Slack / Discord / ntfy / Gotify / Pushover を列挙している。1 つに絞る前提で、送る本文の形は issue が決めていない（`## Undecided` に多く入る）。外部サービスの偽物（`factory:README.md:38`）で相手側を再現できるが、**手が終了コード・ファイルの run の手と、偽サービスの操作の手が同じシナリオで組めるかは未確認**。

### 現状の factory で通せるか

壁の記号: P = run の手が無い（1 節）、S = `--base` が 200,000 文字で止まる（3 節）、R = `replicate` が拡張を拒む（3 節）、T = 時計に依存、N = run の手と偽サービスの組み合わせ。

| 候補 | 現状 | 当てはまる壁 | 手順 + 取り込み + replicate を直した後の見込み |
|---|---|---|---|
| A | × | P, S, R | ○（入出力が決まり、依存が無く、時計も使わない） |
| B | × | P, S, R, T | △（期限の確認が限られる。標準入力を渡せる手が要る） |
| C | × | P, S, R, N | △（Undecided が多い。偽サービスとの組み合わせが未検証） |

3 つとも、現状は × である。「通せない原因が題材でなく工場側にある」ことを示すため、記号を壁ごとに分けた。

### 規模について

l3-report の合わせた依頼（L0〜L3）の語数は約 700〜3,600 語（`notes:laps/calibrate-80/l3-report.md:13`）。単独の A は 300〜500 語で L0 より小さい。「依頼を大きくしても」を試すなら、A + B（+ C）を 1 本のアプリの依頼として合わせる必要がある。これはゲート 1 の題材の選び方に関わる（争点 7）。

## 費用の見立て（外挿、未測定）

- 較正 L3 は 1 依頼あたり約 $9.6〜11.8（下書き・分類・opus の 4 build）、opus の 1 build は $0.79〜$1.58（`notes:laps/calibrate-80/l3-report.md:207-208`）。
- 拡張では builder が既存コードを読むので、build は greenfield より高くなると見る。分類も既存コード全体を貼る（`factory:src/cli.ts:244`）ため上がる。
- 1 題材（A）× 4 build を想定すると $15〜40 程度の見込み（根拠の薄い外挿）。3 題材をまとめた 1 周で $45〜120 程度。仮の上限 $150 は 1 周には収まる見込みだが、余裕は大きくない。
- 1 変更の既定の上限は $10（`factory:README.md:9`）。拡張の build が $5 の 1 呼び出し上限（`notes:laps/calibrate-80/l3-report.md:19`）に近づく可能性は、測るまで分からない。
- 工場の変更を作る費用は台帳に入らない（`notes:laps/lap-8/report.md:146-151` の「計上できなかったもの」と同じ）。

## 争点一覧（推測で埋めずに止めたもの）

1. **依存の前提が実装と違う。** runtime の PyPI 依存は `jsonschema` だけで、core-harness は姉妹リポジトリ（依存ではない）、herdr は PATH 上のバイナリで、テストは偽ソケットで動く（2 節）。pin は runtime に無い。「本物の依存関係とバージョン境界を持つ対象で続くか」という測定の目的に、Python 層だけの runtime が合うか。実在する境界は、`jsonschema>=4.18`、Python 3.10〜3.12、herdr の protocol の表（コード内の定数）に限られる。
   - 選択肢: (a) このまま Python 層を対象にし、境界は上の 3 つと理解する。(b) pin を持つリポジトリ（claude-org-ja など）へ対象を変える。(c) herdr の実機を要る部分まで含める（factory の sandbox 外になる）。
2. **「builder の sandbox は網を切っている」は半分違う。** model 呼び出しは切っていない（2 節）。依存の供給を「builder に入れさせない」で守るなら、網の絞り込み（API だけ許可）を工場に足す必要がある。足さないなら、守っているのは指示文だけであることを承知して進める。
3. **glossary に無い語。** `vault` `replicate` `plan / part / whole` `base` `lap definition` `較正` `Q` `天井` `窓` `系列 O / 系列 S` `予備選別` `起動しなかった build` `揺れ`。factory の README の Terms と calibrate-80/design.md で意味は追えたが、glossary には無い。glossary への追記を別依頼にするか。
4. **runtime の pytest を流せていない。** 外部コードの実行として止められた。既存テストの基準値（合格数・skip 数）が無いまま、題材の「既存の pytest で部分的に確かめられる」を静的な件数だけで判断している。基準値を取るなら、別の許可（または運用者が手で実行）が要る。
5. **成功の線が決まっていない。** 依頼文の「85 %」は、較正で観測した Q の最小値 85.6 %（`notes:laps/calibrate-80/l3-report.md:13`）で、事前に登録した線ではない。runtime でどの線を割ったら「続かなかった」とするか。窓（70〜90 %）を使うのか。
6. **後戻りの試しの汚染。** 題材 A・B は出荷済みの変更の再現で、公開リポジトリのため model が答えを知っている可能性がある。前向きの題材は C（open issue）だけ。許すか。
7. **「大きくしても」の規模をどう作るか。** 単独の題材は小さい（A は 300〜500 語）。較正と同じく複数の題材を合わせた依頼にするなら、合わせる題材とその順序の決めが要る。
8. **`replicate` を拡張に対応させるか、`run` で測るか。** 前者は工場に手が入るが Q が較正と比べられる。後者は別の指標になる（3 節）。
9. **出荷先。** `ship` は ship target の `main` を進める（`factory:src/ship.ts:42, 53`）。「runtime の main には何も push しない」を守るため、出荷先は使い捨ての local clone にする前提でよいか。
10. **プラットフォーム。** factory は linux x64 のみ（`factory:README.md:40`）。runtime の CI は Linux・macOS・Windows（`runtime:.github/workflows/test.yml:15-17`）。Linux 以外の挙動の確認は factory ではできない。選んだ 3 題材は OS 依存が小さい。

## ゲート 1 で決めること

工場のコードは、この段では触っていない。以下はオーナーが決める 4 点で、推奨に従うなら第 2 段の承認になる。

### 1. 工場に足す手順

| 選択肢 | 内容 |
|---|---|
| **a. `run` の手を新設する（推奨）** | 1 節の設計。前例（ブラウザの手）に近い規模。入出力が決まった CLI を直接確かめられ、builder が結果を偽れない |
| b. 殻の HTTP アプリで代替する | 工場の変更は最小だが、殻が builder の書き換え可能な木に入る（1 節）。測定の信頼を下げる |
| c. 隠しの pytest を vault に置く | 手順・分類・要約の前提（シナリオの 1 手 = 1 要求）が崩れる。採らない |

### 2. 依存供給の方式

| 選択肢 | 内容 |
|---|---|
| **a. wheel の事前配置（推奨）** | 2 節の案 1。運用者がハッシュ固定の仮想環境を HOME の外に作る。依存の組を承認の版に入れる（3 節の整理案） |
| b. vendoring | 2 節の案 2。測る対象が変わる |
| c. キャッシュのマウント | 2 節の案 3。案 1 に劣る |

付随して決めること: builder の網を絞るか（争点 2）。推奨は「第 2 段では絞らない。指示文だけで守っていることを報告に書く」（絞るのは別の工場変更で、費用の外）。

### 3. 題材 1 つ

| 選択肢 | 内容 |
|---|---|
| **A. herdr の pane id（推奨）** | 標準ライブラリのみ、時計なし、ファイル入力と JSON 出力、既存の pytest が多い。工場の壁が手順・取り込み・replicate の 3 つに絞れる。規模を上げるのは後で B・C を合わせる |
| B. spawn-prompt-step | 標準入力と判定記録を試せるが、期限の確認が限られる |
| C. ntfy の通知先 | 前向きの題材（汚染が小さい）だが、Undecided が多く、偽サービスとの組み合わせが未検証 |

### 4. lap の費用上限

| 選択肢 | 内容 |
|---|---|
| **$150（仮置きのまま、推奨）** | 1 題材 × 数 build の予備選別には十分な見込み（外挿）。足りなければ測ってから上げる |
| $75 | 1 題材だけで足りる見込みだが、再試行の余地が小さい |
| $260 | lap 9 以降の既定値。拡張の費用が分かっていないうちは大きすぎる |

付随: 1 変更の上限（既定 $10）を拡張では $15 に上げるかは、最初の 1 build の実費を見てから決める案。

## factory の Issue 案（起票しない）

1. **シナリオに `run` の手を足す**（プロセスを起動して終了コード・標準出力・生成ファイルを見る）。1 節の設計。検証（`validateScenarios`）、runner、要約の漏れ検査、承認要約の表示、分類の予測、下書きの指示とインタフェースの鍵、`user-judge` の行動、テストを含む。規模は前例（#24、#17）並みの見込み。
2. **アプリの言語と実行契約を指定可能にする。** 今は `RUN_CONTRACT`（Node.js 22・標準ライブラリのみ・`npm start`。`factory:src/roles.ts:229-234`）と `spawnApp`（`npm start`。`factory:src/sandbox.ts:163-167`）に固定されている。lap の定義か `draft` の宣言で実行契約（Python の版、許可する依存、起動の方法）を持たせ、`appEnv` に `PYTHONPATH` 等を足す（`factory:src/sandbox.ts:95-97`）。
3. **依存の組を承認の版に入れる。** `Base` に lock のハッシュを足し（`factory:src/vault.ts:17`）、仮想環境を lock のハッシュごとに HOME の外から読み取り専用でマウントする（`extraRo`）。builder の sandbox にも同じ物を見せるか決める。
4. **`--base` を現実の大きさのリポジトリに対応させる。** 取り込みの範囲指定（パスの絞り込み、除外、要約）と、貼る代わりに builder・下書き役に読み取り権限を与える案（`factory:src/cli.ts:87` の ponytail コメントが既に挙げている）を検討する。分類（`factory:src/classify.ts`）にも同じ絞りを通す。
5. **`replicate` を拡張の変更に対応させる**（`factory:src/replicate.ts:55, 121`）。空のリポジトリでなく、base の commit の clone から各 build を始める。較正の Q と比べられるようにする。あわせて `plan` の 1 つ目の部分でも既存リポジトリを許す（`factory:src/plan.ts:184, 202`）。
6. **CLI・ライブラリ向けの出荷。** `ship` の smoke（ポートで待つ。`factory:src/ship.ts:70-80`）、`serve` による本番（`factory:src/serve.ts`）、`run` の合成トラフィック（CRUD の形に固定。`factory:src/run.ts:24-31, 103`）は HTTP アプリ前提。出荷を「ship target の fast-forward のみ」にする型を足す。本番を見る段（`observe`）は対象外と明記する。

## この監査で確かめていないこと

- `run` の手や依存供給を実際に作って動かすこと（この段では工場のコードに触らない）。
- 3 題材の依頼文を実際に書いて語数を数えること（300〜500 語などは見立て）。
- `jsonschema` の依存先と wheel の ABI（PyPI のメタデータは読んでいない）。
- factory の sandbox 内で bwrap が使えないこと（bwrap を要する runtime のテストが skip になる件）。
- runtime の open issue のコメント、PR、ラベルの詳細。
