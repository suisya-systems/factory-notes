# 14 周目の手順書（準備まで。本番の draft・build・replicate・run はこの書類では流さない）

14 周目は、13 周目（[../lap-13/report.md](../lap-13/report.md)）が 495 語・Q = 100 % で測定にならなかったことを受けて、題材 A + B + C を合わせた 1 本の依頼（1,658 語）を Q ≥ 90 % の線で測る周である（オーナー決定 2026-10-27、[../../decisions.md](../../decisions.md) D14-1〜）。題材は runtime の A（pane id、#240）、B（`spawn-prompt-step` の判定記録、#244 / #245）、C（attention の ntfy 通知先、open の #21）。設計と比較は [design.md](design.md)、事前登録は [prereg.json](prereg.json)、工場の前提の変更（別ワーカーが実装）は [factory-issues.md](factory-issues.md)。

13 周目と同じ仕組み（依存の環境、出荷先の作り方、`--base-path`、費用の測り方、手順の並び）を使い回す。**13 周目の手順書は [../lap-13/runbook.md](../lap-13/runbook.md)。この書類は 13 周目と違う所を詳しく書き、同じ所は「13 周目の手順 N」と指す。** 印は 13 周目と同じ: **【root】** root が要る、**【費用】** モデルを呼ぶ、**【人】** 人が読んで決める。

実行は窓口がホスト側で行う（準備の作業環境では factory の sandbox が入れ子にできず、factory は動かない）。

## この準備で決めたこと・作ったこと・測れなかったこと

| 項目 | 決めたこと / 作った物 | 状態 |
|---|---|---|
| 題材 | A + B + C を 1 本の依頼にする | オーナー決定 |
| 依頼文 | [requests/runtime-abc.md](requests/runtime-abc.md)、1,658 語（`wc -w`）。較正 L1（1,614〜1,798）の内側 | 書いた。factory には通していない（draft 未実行） |
| base | `003efef`（A・B・C のどれも入っていない。C は `719f865` と `attention/` が同一） | 実測（[design.md](design.md)） |
| 見せる範囲 | 16 範囲、約 143,200 字（`sed` と `wc -c`）。[prereg.json](prereg.json) の `base.paths` | 字数は実測。draft の数え方は未確認 |
| contract | [contract.json](contract.json)。コマンドは `python3 -m claude_org_runtime.cli`（サブコマンドは各シナリオの argv） | 13 周目の contract とコマンドが違う。factory では未検証 |
| 依存 | [requirements.lock](requirements.lock)。13 周目の lock と同一（sha256 `9d3778c3…7032` を確認）。`/opt/factory-deps` の 13 周目の環境をそのまま使う | 実測 |
| 成功の線 | Q ≥ 90 %、8 build 中 7 本以上が起動、周を無効にする不具合なし、`run` の出荷（オーナー: 出荷も残す） | [prereg.json](prereg.json) |
| 予測 | 割らない（点 93 %、範囲 80〜100 %、90 % を割る確率 0.35） | 事前登録 |
| 費用 | 期待 $55〜110、上限は仮に $150 | 外挿。未測定 |
| 工場の変更 | 4 本（transcript、費用の定数、`expect.jsonAbsent`、`run` と偽サービス）。別ワーカーが実装。**4 本がマージされるまで周を始めない** | Issue 案のみ |

**測れなかったこと**（準備の作業環境では factory も model CLI も動かない）:

1. `draft` を一度も流していない。依頼文が仕様とシナリオに落ちる形、シナリオの本数（見込み 40〜50）、`unstated` の数、費用はすべて未測定。
2. 契約のコマンドを `python3 -m claude_org_runtime.cli` までにして、argv に 3 つのサブコマンド（`dispatcher delegate-plan`、`dispatcher spawn-prompt-step`、`attention scan`）を書かせる形を、工場の草稿役が受けるかは未確認（`src/scenario.ts` の `argvData` は、インタフェースの「コマンドの語」を要約の漏れ検査から外す）。承認の要約で人が読む（手順 7）。
3. 工場の変更 4 の中身（偽の通知先の橋が、プログラムの sandbox で動くこと）。仕様は [factory-issues.md](factory-issues.md) の 4。
4. `stream-json` の出力の形（[factory-issues.md](factory-issues.md) の 1 の「未確認」）。
5. runtime の既存の pytest の基準値（13 周目の「残る懸念」4 と同じ。判定は隠しシナリオだけ）。

## 流れ（人が順番に実行する）

変数（13 周目の「流れ」と同じ。`SCR` は `$HOME` の下、`FACTORY_DEPS` は HOME・/tmp・/mnt・/run・/var/tmp の外）:

```
NOTES=<factory-notes の checkout>            # laps/lap-14/ を持つ
FACTORY=<suisya-systems/factory の checkout>  # 手順 0 の 4 つの変更を含む commit
SCR=<$HOME の下の作業用ディレクトリ>
SHIP=$SCR/runtime-ship-14                     # 13 周目の runtime-ship は使わない（run で HEAD が進んでいる）
export FACTORY_DEPS=/opt/factory-deps
```

### 0. 【人】工場の前提の変更がマージ済みであること（モデルを呼ばない）

- [factory-issues.md](factory-issues.md) の 1〜4 がすべて factory にマージされ、`$FACTORY` がその commit である。**1 つでも欠けるなら周を始めない。** 欠けたときの扱い: 3（`jsonAbsent`）だけが欠けるなら、窓口の判断で、B の record の不在を測らない形に事前登録を直して（`prediction` の `record-revocation` を除き、`amendments` に書く）から始めてよい。1・2・4 が欠ける場合は始めない（1: 汚染の検査が半分になる。2: draft が上限で失敗する。4: C のシナリオが書けない）。
- `cd $FACTORY && git log -1 --oneline`。この commit を [prereg.json](prereg.json) の `factory.commit` に書き、`amendments` に 1 行足して commit する。
- `npm ci --ignore-scripts && npm test` が通る。
- 定数の確認: `grep -n "maxCostUsd" $FACTORY/src/roles.ts $FACTORY/src/classify.ts`、`grep -n "CAPS = " $FACTORY/src/limits.ts`。分類 1、drafter 2、draft 全体 25 であること。一致したら [prereg.json](prereg.json) の `cost.caps.confirmed` を `true` にして commit する。
- 4 の確かめ（モデルを呼ばない）: 工場の試験に、プログラムのシナリオで `service` の手が通る試験が入っていること。可能なら、factory の試験の出力で「run と service の組」の試験名を控える。
- `claude` にログインしてある。`bwrap --ro-bind / / true` が通る（入れ子の sandbox の中では通らない）。

### 1. 【人】依存の環境があること（root 不要。無ければ【root】）

13 周目の環境（lock の sha256 が同じ）を使う:

```
ls -ld /opt/factory-deps /opt/factory-deps/9d3778c3e9335fda0b852970cca76ee606df561c191071beb796363a3b9b7032
ls /opt/factory-deps/9d3778c3e9335fda0b852970cca76ee606df561c191071beb796363a3b9b7032/meta.json   # 在り、所有者が root
sha256sum $NOTES/laps/lap-14/requirements.lock    # 9d3778c3…7032
```

無い場合だけ、13 周目の手順 1〜3（`deps build --lock $NOTES/laps/lap-14/requirements.lock --wheelhouse <wheels> --python /usr/bin/python3`、続けて root の持ち物にする）。

### 2. 出荷先の使い捨て clone を作る（root 不要）

13 周目の手順 4 のとおり、`$SHIP` を新しく作る（`git init` の後に `003efef` だけを fetch。runtime の GitHub から clone しない）。確かめは 13 周目と同じ。**調べる object を増やす**: B の変更の object も無いこと。

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

あわせて、transcript の保存が動くことを、手順 9 の最初の build の直後に確かめる（`ls $FACTORY_HOME/transcripts/runtime-abc-rep/`）。

### 4. 【人】費用の線を読み返す

[prereg.json](prereg.json) の `cost`。13 周目は別の実測 draft を流したが、この周は流さない（外挿で $20〜40 掛かり、本番の draft とほぼ同費用）。最初の本番 draft（手順 5）を実測として読み、止める線（手順 5）を守る。

### 5. 【費用】【人】本番の draft（rep）と、費用の読み

見せる範囲の配列（[prereg.json](prereg.json) の `base.paths` と同じ 16 範囲）:

```
export FACTORY_HOME=$SCR/state-lap14
cd $FACTORY
R=src/claude_org_runtime/dispatcher/runner.py
C=src/claude_org_runtime/attention
BP=(--base-path $R:84-100 --base-path $R:499-528 --base-path $R:589-866 --base-path $R:2279-2349 \
    --base-path $R:2549-2607 --base-path $R:2610-3160 --base-path $R:3213-3266 --base-path $R:3385-3642 \
    --base-path src/claude_org_runtime/dispatcher/spawn_prompt.py --base-path tests/test_spawn_prompt.py:1-200 \
    --base-path $C/notify.py --base-path $C/config.py --base-path $C/cli.py \
    --base-path $C/classifier.py:75-345 --base-path $C/classifier.py:535-710 --base-path $C/classifier.py:777-816)
REQ=$NOTES/laps/lap-14/requests/runtime-abc.md
npm run factory -- draft runtime-abc-rep --request $REQ --base $SHIP "${BP[@]}" --contract $NOTES/laps/lap-14/contract.json --service
```

- draft の出力の「shown chars」が 200,000 字未満であること。事前登録の 143,200 字との差を記録する。
- **draft が終わったら、承認や次の draft の前に費用を読む**: `$FACTORY_HOME/lap-ledger.jsonl` の確定の行（`usd` を持つ行、`role` が `spec-drafter` / `scenario-drafter` / `classifier`）から、役ごとの 1 呼び出しの最大と平均、分類の回数（= シナリオの本数）、合計。[prereg.json](prereg.json) の `cost.expectedUsd.lines` の draft の行（$20〜40）と比べる。
- **止める線**: (a) draft が上限（$25）に当たって失敗した、(b) 合計が $35 を超えた、(c) シナリオが 55 本を超えた、(d) 分類の 1 呼び出しが $0.8 を超えた、のどれかなら、次の draft の前に窓口へ報告して止まる。窓口は、上限を上げる（別ワーカーの定数変更。外挿では $40）、見せる範囲を削る（後述）、依頼を縮める、のどれかを人に諮る。
- 削る順（影響が小さい順）: `tests/test_spawn_prompt.py:1-200`（7,003 字）、`classifier.py:535-710`（6,089 字）、`classifier.py:777-816`（1,334 字）、`runner.py:2610-3160`（`build_plan`、27,224 字。最後）。範囲を変えると承認の版（`paths`）も変わり、事前登録の `base.paths` と `shownChars` を書き換える（承認の前に `amendments`）。

### 6. 【費用】本番の draft（run）

```
npm run factory -- draft runtime-abc-run --request $REQ --base $SHIP "${BP[@]}" --contract $NOTES/laps/lap-14/contract.json --service
```

`--spec-from` は `--base` と一緒に使えない（13 周目の「工場の側で分かった制約」）ので、rep と run は別の draft で、隠しシナリオは別の物になる。手順 5 の止める線は、この draft にも同じに効く。

### 7. 【人】承認の要約を読んで入口の承認

13 周目の手順 8 の確認に加えて、この周に固有の点:

- `Command-line program` と `External service` の両方の宣言が要約に出る。契約のコマンドが `python3 -m claude_org_runtime.cli`、deps の id が `9d3778c3…7032`。
- **インタフェースに 3 つのサブコマンドの語が入り、シナリオの argv の先頭がそのどれかである**（上の「測れなかったこと」の 2）。1 つでも欠ける、またはシナリオが別の語を先頭に書いているなら、承認せず窓口へ報告する。
- **C のシナリオ**: (a) 設定ファイルの `server` に `{{SERVICE_URL}}`（またはそれと同じ働きの値）が書かれ、`service` の手（応答の設定）→ `run`（`attention scan`）→ `GET /requests` の順になっている。(b) 入力は `pending_decisions.json`（`state.db` ではない）で、`received_at` が古い日時（2020 年）、設定の `pending_decision_max` / `pending_decision_drop` が大きく、`desktop` が false、`sound` が `off`。(c) 「何も送られていない」は `GET /requests` の `length` が 0 で書かれている。
- **B のシナリオ**: record の不在を言うものが `jsonAbsent` で書かれている。`{"files": {}}` のような部分一致で「無い」と言っているシナリオは、古い record が残っていても通るので、承認せず窓口へ報告する。
- **期待値の誤りの候補を探す**（[prereg.json](prereg.json) の `errorsRule`）: (a) `decide_argv` の `--state-dir` の値を、依頼が決めていない書き方（`./s` と `s`、末尾の `/`）で厳密に比べていないか。(b) `decided_at_ms` の絶対値や引き算、時刻の窓を期待していないか。(c) `spawn-prompt-step` の画面の例が、見せた `test_spawn_prompt.py` の画面から外れ、状態の分類が曖昧（`unknown`）になっていないか。(d) C で、event の title / body の文面を、見せたコード（`_default_text`）にない値で書いていないか（正しい期待値は、`--json` の出力から `capture` した値を `{{...}}` で渡す形）。(e) C で、依頼が決めていない点（`enabled` false のときの topic の検査、再送）を確かめていないか。見つけたら承認の注記に書き、`errors.json` の対象にする。
- 要約の「Undecided」に、依頼文が決めている点（`p10` = 64、小さい番号が先、target の文字の規則、record の項目、消す条件、`ntfy` の既定値・Priority・失敗の扱い）が回されていない。回されるべき点（認証、再送、種類別の絞り込み、他の通知先、tag）は回されている。
- 食い違い（`contradicts` / `unstated`）の一覧を控える（報告の素材）。シナリオを題材（A・B・C）で分けて数える（部ごとの Q のため）。

承認の前に [prereg.json](prereg.json) の `approvedVersions` に 2 つのハッシュを書いて commit する（承認の後に直さない）:

```
npm run factory -- approve runtime-abc-rep --by <name> --version <hash>
npm run factory -- approve runtime-abc-run --by <name> --version <hash>
```

### 8. 【人】二つの前提を確かめる（モデルを呼ばない）

13 周目の手順 9 と同じ: `cd $SHIP && git rev-parse HEAD` が `003efefd537f1d7f67d47f19f654a3b451de298f`、`/opt/factory-deps/9d3778c3…7032/meta.json` が在り、所有者が root。

### 9. 【費用】replicate K=8（Q を出す）と、揺れの検査

```
cd $FACTORY
npm run factory -- replicate runtime-abc-rep --k 8 --base $SHIP --max-cost 70
npm run factory -- tally runtime-abc-rep
npm run factory -- replicate runtime-abc-rep --rescore
npm run factory -- replicate runtime-abc-rep --rescore
npm run factory -- tally runtime-abc-rep
```

- 最初の build の直後に `ls $FACTORY_HOME/transcripts/runtime-abc-rep/` を見て、build ごとのファイルができていることを確かめる。**できていなければ replicate を止める**（`$FACTORY_HOME/STOP` を作る）。transcript 無しで 8 本を流さない。
- Q の読み方は 13 周目の手順 10 と同じ（揺れた組は分母と分子から除き、起動しなかった build は 0 として入れて本数を別に報告）。線は **90 %**。Q は全体と、題材ごと（A・B・C のシナリオだけの合格割合の build 平均）の両方を出す。
- 1 build の費用を読む。K=8 の見積もり（$10〜20）を超えて、次の build で `--max-cost 70`（draft の費用込み）に近づくなら止める。

### 10. 【人】学習汚染の検査（transcript を読む。モデルを呼ばない）

[prereg.json](prereg.json) の `contamination.check` のとおり、build ごとの transcript（replicate の 8 本と、手順 11 の後に run の分）を検索する。検索語（`-i`）:

```
T=$FACTORY_HOME/transcripts
grep -rliE 'github\.com/suisya-systems/claude-org-runtime|raw\.githubusercontent|pypi\.org|pip (download|install)|git fetch|git log --all|WebFetch|WebSearch' $T
grep -rliE 'b6ad40a|263ff3f|410fd8a|176bcf1|a021ebd|719f865|f79286f|v0\.1\.5[01]|#(21|240|242|244|245)\b' $T
```

- 1 つもヒットしなければ「transcript に痕跡は無かった」と書ける（学習データ経由の知識は、これでも検査できない）。ヒットがあれば、その build を別に挙げ、Q を含めた値と除いた値を出す。C は前向きなので、C のシナリオの合格が汚染の疑いのある build に偏っていないかも見る。
- build の数と transcript のファイルの数が合わない場合は、検査は不完全であり、そう報告する（「汚染が無かった」とは書かない）。
- 13 周目と同じ出力側の検索（各 build の `003efef` からの差分に修正の commit・版・Issue の言及があるか）も流す。
- transcript は秘密を含みうる。**リポジトリに commit しない**。報告には、ヒットの件数と、秘密の無い抜粋だけを書く。

### 11. 【費用】run 1 本（ff-only の出荷）

```
cd $FACTORY
npm run factory -- run runtime-abc-run --ship-target $SHIP --max-cost 50
```

13 周目の手順 11 と同じ（試行は最大 5 回、LLM の判定が入る、smoke・serve・合成トラフィック・observe は無い）。出荷の後の確かめ: `git log --oneline -3`、`git status --porcelain` が空、`git merge-base --is-ancestor 003efef HEAD`。通らなかった場合も結果。transcript は `$FACTORY_HOME/transcripts/runtime-abc-run/attempt-<n>`。手順 10 の検索を run の分にも流す。

### 12. 【人】報告

[prereg.json](prereg.json) の `successLine` と `prediction` に照らして、予測が当たったか、どこで落ちたかを `laps/lap-14/report.md` に書く。13 周目の報告の形に合わせ、次を含める: Q（素と補正、全体と題材ごと）、`whereItFalls` の各 site に当たった build の数、`unstated` の本数と classification ごとの合格率、費用の実測と見積もりの差（draft の止める線に当たったか）、13 周目・較正との位置関係（`comparability`）、汚染の検査の結果（transcript が全 build にあったか。C の前向きの部分を分けて）、決定の追記（[../../decisions.md](../../decisions.md)）。

## 費用の見積もり（外挿。未測定）

[prereg.json](prereg.json) の `cost.expectedUsd` を参照。要点:

- 13 周目の実測（draft rep $6.30、draft run $6.08、build $0.40〜0.51、run $0.58、probe $0.35）を、見せる字数 1.77 倍（分類は 1 呼び出し $0.33 → $0.58）、シナリオ本数 約 3 倍、builder 費用 3〜4 倍で伸ばした。分類が費用を支配する（シナリオごとに 1 回、各回に全文を入れる）。
- draft 2 本（rep と run）で $40〜80、replicate $10〜20、run $2〜8、probe $0.4。合計 $55〜110。上限は仮に $150（`--max-cost`: replicate $70、run $50。lap 台帳を各段の後に見る）。
- **1 つの draft の上限 $25（オーナーの値）は、シナリオ 45 本の外挿（約 $29）を下回る。** 手順 5 の止める線を置いた。上限を上げるか否かは人の判断。

## 残る懸念（準備の時点）

1. **工場の前提の変更 4 本が未実装**（別ワーカー）。特に 4（`run` と偽サービス）は橋を触る中規模の変更で、隔離の試験を落とさないこと。`stream-json` の形は未確認。
2. **draft が未実行。** 依頼文がどのくらいの本数のシナリオになるか、`unstated` がどのくらい出るか、契約のコマンドを `python3 -m claude_org_runtime.cli` までにした形が受け入れられるかは、手順 5〜7 で初めて分かる。受け入れられない場合の代案: 依頼を 2 つの change に分ける（Q が 1 つにならない。窓口に戻す）。
3. **C の仕様の一部は準備担当が決めた**（設定のキー名、既定値、Priority の対応、失敗の扱い）。issue #21 が決めていないので、オーナーの確認を要する（[design.md](design.md)）。変えるなら依頼文と事前登録を直し、承認の前に行う。
4. **学習汚染**: A・B は公開済みの変更の再現、C は前向き（ただし ntfy の API は公開の知識）。transcript で fetch・pip・git の経路は検査できるが、学習データの経路は検査できない。
5. **lap の上限 $150 は定数でなく運用で守る**（13 周目の「残る懸念」5）。
6. **B の `decided_at_ms` は時計に依る。** 確かめるのは両方の項目が整数であることだけ。時計を直接使う期待値は期待値の誤りとして除く規則を事前登録に置いた。
7. **見せる範囲を 13 周目より絞った**（`docs/cli.md` と `tests/test_dispatcher_runner.py` を外した）。A のシナリオの期待値の誤りが増えるおそれがある。
