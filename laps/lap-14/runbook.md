# 14 周目の手順書（準備まで。本番の draft・build・replicate・run はこの書類では流さない）

14 周目は、13 周目（[../lap-13/report.md](../lap-13/report.md)）で Q = 100 %（495 語、題材 A 単独）になり、「依頼を大きくしても合格率が保たれるか」の測定にならなかったことを受けて、依頼を大きくして Q 90 % の線に置く周である（オーナー判断 2026-10-27、[../../decisions.md](../../decisions.md) D14-1）。題材は runtime の A（pane id）と B（`spawn-prompt-step` の判定記録）を 1 本の依頼にしたもの（比較と推奨は [design.md](design.md)）。事前登録は [prereg.json](prereg.json)。工場の前提の変更は [factory-issues.md](factory-issues.md)。

13 周目と同じ仕組み（依存の環境、出荷先の作り方、`--base-path`、費用の測り方、手順の並び）を使い回す。**13 周目の手順書は [../lap-13/runbook.md](../lap-13/runbook.md)。この書類は 13 周目と違う所だけを詳しく書き、同じ所は「13 周目の手順 N」と指す。** 印は 13 周目と同じ: **【root】** root が要る、**【費用】** モデルを呼ぶ、**【人】** 人が読んで決める。

実行は窓口がホスト側で行う（準備の作業環境では factory の sandbox が入れ子にできず、factory は動かない）。

## この準備で決めたこと・作ったこと・測れなかったこと

| 項目 | 決めたこと / 作った物 | 状態 |
|---|---|---|
| 題材 | A + B を 1 本の依頼にする（[design.md](design.md) の案 1） | 推奨。窓口が承認するまで暫定 |
| 依頼文 | [requests/herdr-pane-id-and-spawn-record.md](requests/herdr-pane-id-and-spawn-record.md)、1,082 語（`wc -w`） | 書いた。factory には通していない（draft は未実行） |
| base | `003efef`（A・B とも）。B の差分が `003efef` に当たることは `patch --dry-run` で確認した | 実測 |
| 見せる範囲 | 14 範囲、約 117,500 字（`sed` と `wc -c`）。[prereg.json](prereg.json) の `base.paths` | 字数は実測。draft の数え方は未確認 |
| contract | [contract.json](contract.json)。コマンドは `python3 -m claude_org_runtime.cli dispatcher`（サブコマンドは各シナリオの argv） | 13 周目の contract とコマンドが違う。factory では未検証 |
| 依存 | [requirements.lock](requirements.lock)。13 周目の lock と同一（sha256 `9d3778c3…7032` を確認）。`/opt/factory-deps` の 13 周目の環境をそのまま使う | 実測 |
| 成功の線 | Q ≥ 90 %（オーナー）。ほかの 3 条件は 13 周目から引き継ぐ | [prereg.json](prereg.json) |
| 予測 | 割らない（点 95 %、範囲 85〜100 %、90 % を割る確率 0.25） | 事前登録 |
| 費用 | 期待 $40〜90、上限は仮に $150 | 外挿。未測定 |
| 工場の変更 | 3 本（transcript の保存、費用の定数、「無いこと」の期待値）。**これがマージされるまで周を始めない**（3 だけは欠けても事前登録を直せば始められる） | Issue 案のみ |

**測れなかったこと**（準備の作業環境では factory も model CLI も動かない）:

1. `draft` を一度も流していない。依頼文が仕様とシナリオに落ちる形、シナリオの本数、`unstated` の数、費用はすべて未測定。
2. 契約のコマンドを `dispatcher` までにして、argv に `delegate-plan` / `spawn-prompt-step` を書かせる形を、工場の草稿役が受けるかは未確認（`src/scenario.ts` の `argvData` が、インタフェースの「コマンドの語」を要約の漏れ検査から外す。2 つのサブコマンドを両方挙げるか）。承認の要約で人が読む（手順 7）。
3. `stream-json` の出力が `-p` で最後に `result` を返す形（[factory-issues.md](factory-issues.md) の 1 の「未確認」）。
4. runtime の既存の pytest の基準値（13 周目の「残る懸念」4 と同じ。この周の判定は隠しシナリオだけで、既存の pytest は使わない）。

## 流れ（人が順番に実行する）

変数（13 周目の「流れ」と同じ。`SCR` は `$HOME` の下、`FACTORY_DEPS` は HOME・/tmp・/mnt・/run・/var/tmp の外）:

```
NOTES=<factory-notes の checkout>            # laps/lap-14/ を持つ
FACTORY=<suisya-systems/factory の checkout>  # 手順 0 の 3 つの変更を含む commit
SCR=<$HOME の下の作業用ディレクトリ>
SHIP=$SCR/runtime-ship-14                     # 13 周目の runtime-ship は使わない（run で HEAD が進んでいる）
export FACTORY_DEPS=/opt/factory-deps
```

### 0. 【人】工場の前提の変更がマージ済みであること（モデルを呼ばない）

- [factory-issues.md](factory-issues.md) の 1（transcript の保存）、2（費用の定数）、3（期待値の「無いこと」、`expect.jsonAbsent`）が factory にマージされ、`$FACTORY` がその commit である。**どちらかが欠けるなら周を始めない**（transcript が無いと汚染の検査が 13 周目と同じ半分になる。費用の定数が無いと draft が上限で失敗する）。3 だけが欠けるなら、窓口の判断で、B の record の不在を測らない形に事前登録を直して（`prediction` の `record-revocation` を除き、`amendments` に書く）から始めてよい。
- `cd $FACTORY && git log -1 --oneline`。この commit を [prereg.json](prereg.json) の `factory.commit` に書き、`amendments` に 1 行足して commit する。
- `npm ci --ignore-scripts && npm test` が通る。
- 定数の確認: `grep -n "maxCostUsd" $FACTORY/src/roles.ts $FACTORY/src/classify.ts`、`grep -n "CAPS = " $FACTORY/src/limits.ts`。事前登録の `cost.caps.proposed` と一致すること。一致したら `cost.caps.confirmed` を `true` にして commit する。
- transcript の保存が動くことの 1 回の確かめ: 手順 3 の `probe-isolation` の後に、`$FACTORY_HOME/transcripts/` の下にファイルができたかを見る（`probe-isolation` が builder の役を呼ぶなら。呼ばないなら、手順 9 の最初の build の直後に見る。無ければ replicate を止める）。
- `claude` にログインしてある。`bwrap --ro-bind / / true` が通る（入れ子の sandbox の中では通らない）。

### 1. 【人】依存の環境があること（root 不要。無ければ【root】）

13 周目の環境（lock の sha256 が同じ）を使う:

```
ls -ld /opt/factory-deps /opt/factory-deps/9d3778c3e9335fda0b852970cca76ee606df561c191071beb796363a3b9b7032
ls /opt/factory-deps/9d3778c3e9335fda0b852970cca76ee606df561c191071beb796363a3b9b7032/meta.json   # 在り、所有者が root
sha256sum $NOTES/laps/lap-14/requirements.lock    # 9d3778c3…7032
```

無い場合だけ、13 周目の手順 1〜3（`deps build --lock $NOTES/laps/lap-14/requirements.lock --wheelhouse <wheels> --python /usr/bin/python3`、続けて root の持ち物にする）。wheelhouse の作り方は 13 周目の「依存の準備」。

### 2. 出荷先の使い捨て clone を作る（root 不要）

13 周目の手順 4 のとおり、`$SHIP` を新しく作る（`git init` の後に `003efef` だけを fetch。runtime の GitHub から clone しない）。確かめは 13 周目と同じ（`rev-parse HEAD`、`branch --show-current`、`status --porcelain` が空、`remote` が空、修正の object が無い）。**ここで調べる object を増やす**: B の変更の object も無いこと。

```
git cat-file -t b6ad40a3c4ea4ef636a931cf3f9c91f2ee597dd7   # 失敗する
git cat-file -t 410fd8af8567c87f2d645f46b2c7d16b4f0b5047   # 失敗する
git rev-list --count --all                                  # 149
```

`replicate`（手順 9）を先に、`run`（手順 11）を後に流す（`run` が HEAD を進める）。

### 3. 【費用】【人】隔離の確かめ（`probe-isolation`、約 $0.4）

```
export FACTORY_HOME=$SCR/state-lap14
cd $FACTORY && npm run factory -- probe-isolation lap14-probe
```

### 4. 【人】費用の上限を確認する（手順 0 で済んでいる場合は読むだけ）

13 周目は、実測の draft を別に 1 回流して上限を決めた（$6.39）。この周は、上限を先に上げ（[factory-issues.md](factory-issues.md) の 2）、**本番の最初の draft（手順 5）を実測として読む**。別の実測 draft は流さない（外挿で $16 前後掛かり、本番の draft とほぼ同じ費用になるため）。

### 5. 【費用】【人】本番の draft（rep）と、費用の読み

見せる範囲の配列（[prereg.json](prereg.json) の `base.paths` と同じ 14 範囲）:

```
export FACTORY_HOME=$SCR/state-lap14
cd $FACTORY
R=src/claude_org_runtime/dispatcher/runner.py
T=tests/test_dispatcher_runner.py
BP=(--base-path $R:84-100 --base-path $R:499-528 --base-path $R:589-866 --base-path $R:2279-2349 \
    --base-path $R:2549-2607 --base-path $R:2610-3160 --base-path $R:3213-3266 --base-path $R:3385-3642 \
    --base-path docs/cli.md:1-160 \
    --base-path src/claude_org_runtime/dispatcher/spawn_prompt.py \
    --base-path $T:95-125 --base-path $T:255-330 --base-path $T:870-1070 \
    --base-path tests/test_spawn_prompt.py)
REQ=$NOTES/laps/lap-14/requests/herdr-pane-id-and-spawn-record.md
npm run factory -- draft runtime-ab-rep --request $REQ --base $SHIP "${BP[@]}" --contract $NOTES/laps/lap-14/contract.json
```

- draft の出力の「shown chars」が 200,000 字未満であること。事前登録の 117,500 字との差を記録する。
- **draft が終わったら、承認や次の draft の前に費用を読む**: `$FACTORY_HOME/lap-ledger.jsonl` の確定の行（`usd` を持つ行、`role` が `spec-drafter` / `scenario-drafter` / `classifier`）から、役ごとの 1 呼び出しの最大と平均、分類の回数（= シナリオの本数）、合計。[prereg.json](prereg.json) の `cost.expectedUsd.lines` の draft の行（$11〜22）と比べる。合計が $22 を超える、またはシナリオが 34 本を超えるなら、次の draft の前に窓口へ報告して止まり、見せる範囲を削る（[design.md](design.md) の削る順）か、見積もりを直す。
- 上限に当たって draft が失敗した場合は、窓口へ報告して止まる（定数が反映されていないか、見積もりが足りない）。

### 6. 【費用】本番の draft（run）

```
npm run factory -- draft runtime-ab-run --request $REQ --base $SHIP "${BP[@]}" --contract $NOTES/laps/lap-14/contract.json
```

`--spec-from` は `--base` と一緒に使えない（13 周目の「工場の側で分かった制約」）ので、rep と run は別の draft で、隠しシナリオは別の物になる。

### 7. 【人】承認の要約を読んで入口の承認

13 周目の手順 8 の確認に加えて、この周に固有の点:

- `Command-line program` の行と、contract の `deps` の id（`9d3778c3…7032`）が出ている。契約のコマンドが `python3 -m claude_org_runtime.cli dispatcher` である。
- **インタフェースに `delegate-plan` と `spawn-prompt-step` の両方のコマンドの語が入り、シナリオの argv の先頭がそのどちらかである**（上の「測れなかったこと」の 2）。片方しか無い、またはシナリオが argv の先頭に別の語を書いているなら、承認せず、窓口へ報告する。
- 仕様の `## Command-line program (factory)` の節が contract と一致している。
- シナリオが `run` の手だけで書かれ、`spawn-prompt-step` のシナリオは `stdin` に `{"screen", "previous_screen", "elapsed_ms"}` を持ち、`read` で `<state-dir>/dispatcher/spawn-prompt/<target>.json` を読む。`files` に書く task JSON と panes JSON が現実の形（`task_id` ほか `build_plan` の必須項目）。
- **record の不在を言うシナリオが `jsonAbsent` で書かれている**こと。`{"files": {}}` のような部分一致で「無い」と言っているシナリオは、古い record が残っていても通るので、承認せず窓口へ報告する。
- **期待値の誤りの候補を探す**（[prereg.json](prereg.json) の `errorsRule`）: (a) `decide_argv` の `--state-dir` の値を、依頼が決めていない書き方（`./s` と `s`、末尾の `/`）で厳密に比べていないか。(b) `decided_at_ms` の絶対値や、時刻の窓、引き算（`expires_at_ms - decided_at_ms`）を期待していないか（引き算は書けない。両方の項目が整数であることまで）。(c) 画面の例（`spawn-prompt-step` の標準入力）が、見せた `test_spawn_prompt.py` の画面から外れて、状態の分類が曖昧な形（`unknown`）になっていないか。見つけたら、承認の注記に書き、`errors.json` の対象にする。
- 要約の「Undecided」に、依頼文が決めている点（`p10` = 64、小さい番号が先、拒否する文字、target の文字の規則、record の項目、30000、消す条件）が回されていない。
- 食い違い（`contradicts` / `unstated`）の一覧を控える（報告の素材）。`unstated` が 0 本なら、B の「推測が要る場面」が草稿役に拾われていない（13 周目と同じ）。報告で述べる。

承認の前に [prereg.json](prereg.json) の `approvedVersions` に 2 つのハッシュを書いて commit する（承認の後に直さない）:

```
npm run factory -- approve runtime-ab-rep --by <name> --version <hash>
npm run factory -- approve runtime-ab-run --by <name> --version <hash>
```

### 8. 【人】二つの前提を確かめる（モデルを呼ばない）

13 周目の手順 9 と同じ: `cd $SHIP && git rev-parse HEAD` が `003efefd537f1d7f67d47f19f654a3b451de298f`、`/opt/factory-deps/9d3778c3…7032/meta.json` が在り、所有者が root。

### 9. 【費用】replicate K=8（Q を出す）と、揺れの検査

```
cd $FACTORY
npm run factory -- replicate runtime-ab-rep --k 8 --base $SHIP --max-cost 70
npm run factory -- tally runtime-ab-rep
npm run factory -- replicate runtime-ab-rep --rescore
npm run factory -- replicate runtime-ab-rep --rescore
npm run factory -- tally runtime-ab-rep
```

- 最初の build の直後（または別の端末から）に `ls $FACTORY_HOME/transcripts/runtime-ab-rep/` を見て、build ごとのファイルができていることを確かめる。**できていなければ replicate を止める**（`$FACTORY_HOME/STOP` を作る）。transcript 無しで 8 本を流さない。
- Q の読み方は 13 周目の手順 10 と同じ（揺れた組は分母と分子から除き、起動しなかった build は 0 として入れて本数を別に報告）。線は **90 %**。
- 1 build の費用を読む。K=8 の見積もり（$6.5〜12）を超えて、次の build で `--max-cost 70` に近づくなら、止める。

### 10. 【人】学習汚染の検査（transcript を読む。モデルを呼ばない）

[prereg.json](prereg.json) の `contamination.check` のとおり、build ごとの transcript（replicate の 8 本と、手順 11 の後に run の分）を検索する。検索語（大文字小文字を区別しない `-i`）:

```
T=$FACTORY_HOME/transcripts
grep -rliE 'github\.com/suisya-systems/claude-org-runtime|raw\.githubusercontent|pypi\.org|pip (download|install)|git fetch|git log --all|WebFetch|WebSearch' $T
grep -rliE 'b6ad40a|263ff3f|410fd8a|176bcf1|a021ebd|719f865|f79286f|v0\.1\.5[01]|#(240|242|244|245)\b' $T
```

- ファイルが 1 つもヒットしなければ「transcript に痕跡は無かった」と書ける（学習データ経由の知識は、これでも検査できない）。ヒットがあれば、その build を別に挙げ、Q を含めた値と除いた値を出す。
- build の数と transcript のファイルの数が合わない場合は、検査は不完全であり、そう報告する（「汚染が無かった」とは書かない）。
- 13 周目と同じ出力側の検索（各 build の `003efef` からの差分に修正の commit・版・Issue の言及があるか）も流す。
- transcript は秘密を含みうる（ログイン情報は sandbox に渡していないが、builder が読んだファイルは入る）。**リポジトリに commit しない**。報告には、ヒットの件数と、ヒットした行の抜粋（秘密の無いもの）だけを書く。

### 11. 【費用】run 1 本（ff-only の出荷）

```
cd $FACTORY
npm run factory -- run runtime-ab-run --ship-target $SHIP --max-cost 35
```

13 周目の手順 11 と同じ（試行は最大 5 回、LLM の判定が入る、smoke・serve・合成トラフィック・observe は無い）。出荷の後の確かめ: `git log --oneline -3`、`git status --porcelain` が空、`git merge-base --is-ancestor 003efef HEAD`。通らなかった場合も結果。transcript は `$FACTORY_HOME/transcripts/runtime-ab-run/attempt-<n>`（工場の変更の実装による。名前は Issue 案の値）。手順 10 の検索を run の分にも流す。

### 12. 【人】報告

[prereg.json](prereg.json) の `successLine` と `prediction` に照らして、予測が当たったか、どこで落ちたかを `laps/lap-14/report.md` に書く。13 周目の報告の形に合わせ、次を含める: Q（素と補正の両方）、`whereItFalls` の各 site に当たった build の数、`unstated` の本数と classification ごとの合格率、費用の実測と見積もりの差、13 周目・較正との位置関係（`comparability`）、汚染の検査の結果（transcript が全 build にあったか）、決定の追記（[../../decisions.md](../../decisions.md)）。

## 費用の見積もり（外挿。未測定）

[prereg.json](prereg.json) の `cost.expectedUsd` を参照。要点:

- 13 周目の実測（draft rep $6.30、draft run $6.08、build $0.40〜0.51、run $0.58、probe $0.35、実測 draft $6.39、合計 $23.35）を、見せる字数 1.45 倍、シナリオ本数 約 2 倍、依頼 2.2 倍で伸ばした。分類が費用を支配する（シナリオごとに 1 回、各回に全文を入れる）。
- draft 2 本（rep と run）で $22〜44、replicate $6.5〜12、run $1.5〜5、probe $0.4。合計 $30〜62、draft をやり直す余裕 $22 を入れて $40〜90。
- 上限の強制は 13 周目と同じ（`--max-cost`: replicate $70、run $35、lap 台帳を各段の後に見る）。$150 は仮置きで、人が決めるまで変えない。

## 残る懸念（準備の時点）

1. **工場の前提の変更が未マージ。** 3 本とも Issue 案で、実装も試験も無い。`stream-json` の形は未確認。
2. **draft が未実行。** 依頼文がどのくらいの本数のシナリオになるか、`unstated` がどのくらい出るか、契約のコマンドを `dispatcher` までにした形が受け入れられるかは、手順 5〜7 で初めて分かる。受け入れられない場合の代案: 契約のコマンドを 2 つの contract に分け、依頼を 2 つの change にする（その場合、1 つの Q にならない。窓口に戻す）。
3. **依頼文は 1,082 語で、目安（900 語前後）より長く、較正の L1（1,614 語〜）より短い。** 「依頼を大きくしても」の問いには、まだ小さい側である。
4. **学習汚染は 13 周目と同じ性質**（公開済みの変更の再現）。transcript で fetch・pip・git の経路は検査できるが、学習データの経路は検査できない。
5. **lap の上限 $150 は定数でなく運用で守る**（13 周目の「残る懸念」5）。
6. **B の `decided_at_ms` は時計に依る。** 確かめるのは差と形だけ。時計を直接使う期待値は期待値の誤りとして除く規則を事前登録に置いた。
