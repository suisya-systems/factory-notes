# 13 周目の手順書（準備まで。本番の build・replicate・ship はこの書類では流さない）

13 周目は、factory を claude-org-runtime（以下 runtime）の既存コードの変更に当てる最初の周である。第 1 段の監査は [../../research/runtime-fit-audit-2026-10-27.md](../../research/runtime-fit-audit-2026-10-27.md)、工場側の対応は suisya-systems/factory の PR #67（マージ済み。`draft --contract`、`--base-path`、`deps build`、`replicate --base`、program の ff-only の出荷）。この書類は、人が順番どおりに実行する手順と、準備で決めたこと・測れなかったことを書く。事前登録は [prereg.json](prereg.json)。

印: **【root】** は root が要る操作、**【費用】** はモデルを呼ぶ（お金がかかる）段、**【人】** は人が読んで決める段。印の無い段は、モデルを呼ばず root も要らない。

## 準備で決めたこと（ゲート 1 の決定 + 準備の決定）

| 項目 | 決めたこと | 根拠 |
|---|---|---|
| 手順 | `run` の手（`draft --contract`） | ゲート 1。工場 PR #67 |
| 依存 | `--require-hashes` の lock → wheelhouse → HOME の外の仮想環境（`deps build`） | ゲート 1 |
| 題材 | A: herdr の pane id が 10 個目以降でも `dispatcher delegate-plan` が通る（runtime の Issue #240、v0.1.50 で直った） | ゲート 1 |
| 費用の上限 | $150 | ゲート 1 |
| base | runtime の `003efef`（`feat(terminal): support herdr 0.9.x (wire protocol 22) (#238)`、2026-10-11）。修正のコミット `b6ad40a`（#242）と `263ff3f` の親 | 下の「題材 A の base」 |
| 見せる範囲 | `runner.py` の 7 つの行範囲、`docs/cli.md:1-160`、`tests/test_dispatcher_runner.py` の 3 つの行範囲 | 下の「見せる範囲」 |
| 実行 | 1 つの依頼文から `replicate`（K=8）1 本と、`run` 1 本（出荷先の ff-only） | 下の「流れ」 |
| 依頼文 | [requests/herdr-pane-id.md](requests/herdr-pane-id.md)（487 語） | 準備で作成 |

## 準備で作ったもの（実測済み）

| 物 | 場所 | 確かめたこと |
|---|---|---|
| lock | [requirements.lock](requirements.lock)（sha256 `9d3778c3e9335fda0b852970cca76ee606df561c191071beb796363a3b9b7032`） | 6 つの pin（`attrs` `jsonschema` `jsonschema-specifications` `referencing` `rpds-py` `typing-extensions`）。`deps build` の読み方（pin と `--hash=` の行だけ）に合う形 |
| contract | [contract.json](contract.json) | `{"command": ["python3", "-m", "claude_org_runtime.cli", "dispatcher", "delegate-plan"], "pythonPath": ["src"], "deps": "<lock の sha256>"}`。統一 CLI の入口を通す（監査 2 節: `jsonschema` が要る） |
| wheelhouse | 作業用の `.worker-scratch/wheels/`（git には入れない。6 本、計 約 640 KB） | 下の手順 2-2 で再現できる。`rpds-py` は `cp310-manylinux_2_17_x86_64` のネイティブ wheel |
| 出荷先 | 作業用の `.worker-scratch/runtime-ship/` | `003efef`、`main`、作業ツリーはクリーン、remote なし、修正のコミットを含む object を持たない（149 コミット） |

試した範囲: wheelhouse から `--no-index --require-hashes --only-binary=:all:` で仮想環境に入れ、base の木を `PYTHONPATH=src` に置いて `python3 -m claude_org_runtime.cli dispatcher delegate-plan --help` が動くところまで。`deps build` 本体と、factory の sandbox 内での実行は試していない（`deps build` は `/opt` を要し、factory の sandbox は bwrap を要する。準備の作業環境は、どちらも使えなかった）。

## 依存の準備（lock と wheelhouse の作り方）

### 作り方の根拠

- runtime の PyPI 依存は `jsonschema>=4.18` の 1 つ（`pyproject.toml`、base でも同じ）。統一 CLI は起動時に `broker.launcher` → `residents` の経路で必ず `jsonschema` を import する（監査 2 節）ので、contract の入口が統一 CLI のとき `jsonschema` は必須。
- 推移依存は `attrs` `jsonschema-specifications` `referencing` `rpds-py`、Python 3.10 では `typing-extensions` も。`rpds-py` だけがネイティブ wheel で、Python の版と OS の ABI に縛られる。
- 仮想環境を作る Python は **ホストの `/usr/bin/python3`（3.10.12）**。factory の sandbox の `PATH` は `/usr/local/bin:/usr/bin:/bin` だけ（`src/sandbox.ts`）で、HOME の下の Python は dangling link になる（`deps build --python /usr/bin/python3`）。lock と wheelhouse はこの Python の版・ABI（cp310、manylinux x86_64）に合わせる。
- lock は全 wheel のハッシュを持つ（`rpds-py` は百数十本。lock が 131 行ある理由）。`pip download --require-hashes` はこのうちホストに合う 1 本を選ぶ。

### 手順（ネット有り。factory の外。root 不要）

2-1. lock を作る（再現する場合。作り直すと sha256 が変わり、contract の `deps` と事前登録の値も変わる）:

```
printf 'jsonschema>=4.18\n' > requirements.in
uv pip compile requirements.in --python-version 3.10 --python-platform x86_64-manylinux_2_28 \
  --generate-hashes --no-header --no-annotate -o requirements.lock
sha256sum requirements.lock    # contract.json の "deps" と同じであること
```

2-2. wheelhouse を作る（ホストの Python で。ネットはここだけ）:

```
/usr/bin/python3 -m pip download --require-hashes --only-binary=:all: -d wheels -r requirements.lock
ls wheels    # 6 本。rpds_py-*-cp310-cp310-manylinux*_x86_64.whl を含む
```

注意（日付）: lock は **作った日（2026-10-27）の最新**を固定しており、題材 A の base の日（2026-10-11）の依存ではない。runtime の `jsonschema>=4.18` の範囲の中で、どの版に固定しても題材 A の挙動（pane id の読み方）には効かない見込みだが、「base の時点の依存」ではないことを報告に書く。

## 流れ（人が順番に実行する）

以下の変数を決める。パスは、HOME・`/tmp`・`/mnt`・`/run`・`/var/tmp` の中でよい（FACTORY_DEPS だけが外）。

```
NOTES=<factory-notes の checkout>          # laps/lap-13/ を持つ
FACTORY=<suisya-systems/factory の checkout>  # fea10ee（PR #67 のマージ）以降
SCR=<作業用ディレクトリ>                     # wheels/、出荷先、状態ディレクトリを置く
SHIP=$SCR/runtime-ship
export FACTORY_DEPS=/opt/factory-deps
```

### 0. 前提の確認（モデルを呼ばない）

- Node.js 22、bubblewrap（`bwrap --ro-bind / / true` が通る。**入れ子の sandbox の中では通らない**）、`python3-venv`（`/usr/bin/python3 -m venv` が通る）、`uv`（lock を作り直すときだけ）。
- `cd $FACTORY && git log -1 --oneline` が `fea10ee` 以降で、`npm ci --ignore-scripts && npm test` が通る。ブラウザは使わない（`--ui` なし）ので Playwright の chromium は要らないが、`npm test` の一部が要る場合は README「Setup」に従う。
- `claude` にログインしてある（モデル呼び出しの認証）。

### 1. 【root】依存の置き場を作る

`/opt/factory-deps` を、作る人が書ける形で作る（`deps build` が書き込むため）。実行するのは人。

```
sudo install -d -m 755 -o "$USER" -g "$(id -gn)" /opt/factory-deps
```

### 2. 依存の仮想環境を作る（root 不要、ネット不要）

```
cd $FACTORY
npm run factory -- deps build --lock $NOTES/laps/lap-13/requirements.lock --wheelhouse $SCR/wheels --python /usr/bin/python3
```

期待: `built dependency set 9d3778c3...7032 in /opt/factory-deps/9d3778c3...7032; name it in a contract as "deps": "9d3778c3...7032"`。この id が `contract.json` の `deps` と一致すること。`deps build` は最後に、仮想環境を実行用の sandbox の中で 1 回起動して確かめる（起動しなければ消してエラー）。

### 3. 【root】置き場を root のものにして固める

仮想環境は判定のとき再ハッシュされない（`src/program.ts` の `ponytail:` コメント）。書ける人が中身を変えられるので、root の持ち物にする。

```
sudo chown -R root:root /opt/factory-deps
sudo chmod -R go-w /opt/factory-deps
ls -ld /opt/factory-deps /opt/factory-deps/9d3778c3e9335fda0b852970cca76ee606df561c191071beb796363a3b9b7032
```

この後 `deps build` は同じ id を作り直せない（`is already built`）。作り直すときは root で消す。

### 4. 出荷先の使い捨て clone を作る（root 不要）

出荷先は、approved base の commit・`main`・クリーンの条件を満たす新しい repository にする。**runtime の GitHub から clone しない**。clone すると修正（`b6ad40a`、v0.1.50 以降）の object が入り、builder が `git log --all` や `git show` で答えを読める。`003efef` から先の object を持たないように、`003efef` だけを fetch する。

```
mkdir -p $SHIP && cd $SHIP
git init -q -b main .
git fetch -q <runtime の clone または https://github.com/suisya-systems/claude-org-runtime.git> 003efefd537f1d7f67d47f19f654a3b451de298f
git checkout -q -B main FETCH_HEAD
```

確かめる（すべて満たすこと）:

```
git rev-parse HEAD                  # 003efefd537f1d7f67d47f19f654a3b451de298f
git branch --show-current           # main
git status --porcelain              # 空
git remote                          # 空（push 先が無い）
git cat-file -t 263ff3fac0df20a1c062a0518ab7520e49e48c1e   # 失敗する（修正の object が無い）
git rev-list --count --all          # 149
```

出荷（`run`）はこの `main` を ff-only で進める。進めると base でなくなるので、**`replicate`（手順 10）を先に流し、`run`（手順 11）を後に流す**。`run` の後で `replicate` をやり直すときは、手順 4 で出荷先を作り直す。runtime の `main`（GitHub）には何も push しない。

### 5. 【費用】【人】隔離の確かめ（`probe-isolation`、約 $0.6）

builder の sandbox から vault が読めないことの確認（lap 8 以降の規則）。lap の状態ディレクトリを作って、`probe-isolation` を 1 回:

```
export FACTORY_HOME=$SCR/state-lap13
cd $FACTORY && npm run factory -- probe-isolation lap13-probe
```

### 6. 【費用】【人】費用の実測（`draft` を 1 回。$5 以内）

**準備では実測できなかった。** factory は sandbox の中で `bwrap` を使うが、準備の作業環境は入れ子の user namespace を作れず（`bwrap: No permissions to create new namespace`）、`draft` は `--base` の HEAD を読む段で失敗した（課金の前）。sandbox の解除は許されなかったので、回避せずにこの段を人に回す。

実測は、本番とは別の状態ディレクトリで、本番と同じ引数の `draft` を 1 回（spec drafter 1 回 + scenario drafter 1 回 + 分類）流す:

```
export FACTORY_HOME=$SCR/state-measure
cd $FACTORY
R=src/claude_org_runtime/dispatcher/runner.py
BP=(--base-path $R:84-100 --base-path $R:499-528 --base-path $R:589-866 --base-path $R:2279-2349 \
    --base-path $R:2610-3160 --base-path $R:3213-3266 --base-path $R:3385-3642 \
    --base-path docs/cli.md:1-160 \
    --base-path tests/test_dispatcher_runner.py:95-125 --base-path tests/test_dispatcher_runner.py:255-330 --base-path tests/test_dispatcher_runner.py:870-1070)
npm run factory -- draft herdr-a-measure --request $NOTES/laps/lap-13/requests/herdr-pane-id.md \
  --base $SHIP "${BP[@]}" --contract $NOTES/laps/lap-13/contract.json
```

- **分類はシナリオごとに 1 回呼ばれ、そのたびに見せた既存コード（約 81,000 字）を入れる**（`src/classify.ts` の `predictInstruction(spec, app, s)`）。シナリオが 12 本なら分類 12 回。この draft の合計は下の見積もりで $5 を超える見込みがあり、$5 を超えると人が判断したら流さずに範囲を削る（下の「費用が大きいときの削り方」）。1 呼び出しの上限は spec drafter $1、scenario drafter $1、分類 $0.5。上限に当たった呼び出しは draft を失敗させる（課金は上限まで）。1 change の既定の上限 $10 も効く。
- 読む物: `$FACTORY_HOME/runs/herdr-a-measure/draft-cost.json` の `calls`（役・モデル・金額）と `byRoleModel`。呼び出し 1 回あたりの金額を、spec drafter / scenario drafter / 分類（1 回ごと）で表にして、この書類の「費用の実測」に書き込む。
- この draft は本番の change にはしない（`herdr-a-measure` は承認も run もしない）。

### 7. 【人】上限を確定する（本番の draft の前）

下の「費用の見積もり」の判定の規則で、上限を [prereg.json](prereg.json) の `cost.caps` に確定してから、手順 8 へ進む。**上限は factory のコードの定数**（`src/roles.ts` の `draftTask` の `maxCostUsd: 1`、`src/classify.ts` の `CLASSIFIER_BUDGET.maxCostUsd: 0.5`）で、フラグでは変えられない。引き上げるなら factory の PR（定数の変更。テストは通る見込み）を先に出してマージし、`$FACTORY` をそれに合わせる。事前登録の値が決まったら、`prereg.json` の `cost.caps.confirmed` を `true` にして commit する。

### 8. 【費用】【人】本番の draft と入口の承認

同じ依頼文から、replicate 用と run 用に別々の change を draft する（`--spec-from` は `--base` と一緒に使えない。`src/cli.ts`）。状態ディレクトリは本番用（`FACTORY_HOME=$SCR/state-lap13`）。

```
export FACTORY_HOME=$SCR/state-lap13
cd $FACTORY
npm run factory -- draft herdr-a-rep --request $NOTES/laps/lap-13/requests/herdr-pane-id.md --base $SHIP "${BP[@]}" --contract $NOTES/laps/lap-13/contract.json
npm run factory -- draft herdr-a-run --request $NOTES/laps/lap-13/requests/herdr-pane-id.md --base $SHIP "${BP[@]}" --contract $NOTES/laps/lap-13/contract.json
```

`BP` は手順 6 と同じ。draft は承認待ちで止まる（`Summary: .../approval-summary.md`）。人が要約を読み、次を確かめてから承認する:

- 承認の要約に `Command-line program` の行と、contract の `deps` の id が出ている。
- 仕様の `## Command-line program (factory)` の節が contract と一致している。
- 要約の「Undecided」に、依頼文が決めている点（`p10` = 64、小さい番号が先、拒否する文字）が回されていない（回されていたら、手順 8 の draft を作り直すか、承認の注記に書く）。
- シナリオが `run` の手だけで書かれ、`files` に書く task JSON と panes JSON が現実の形（`task_id` ほか `build_plan` の必須項目）であること。
- 食い違い（`contradicts` / `unstated`）の一覧。工場は直さない。承認するか、新しい change を draft し直す。
- 期待値の誤り（依頼文に反する期待値、足し算が合わない数）。見つけたら `errors.json` の規則（prereg の `errorsRule`）で Q から除く。

```
npm run factory -- approve herdr-a-rep --by <name> --version <hash>
npm run factory -- approve herdr-a-run --by <name> --version <hash>
```

承認の前に `prereg.json` の `approvedVersions` へ 2 つのハッシュを書き、commit する（lap 8 以降と同じ。承認の後に直さない）。

### 9. 【人】二つの前提を確かめる（モデルを呼ばない）

- `cd $SHIP && git rev-parse HEAD` が承認時の base と同じ。
- `ls /opt/factory-deps/9d3778c3e9335fda0b852970cca76ee606df561c191071beb796363a3b9b7032/meta.json` が在り、所有者が root。

### 10. 【費用】replicate K=8（Q を出す）

```
cd $FACTORY
npm run factory -- replicate herdr-a-rep --k 8 --base $SHIP --max-cost 70
npm run factory -- tally herdr-a-rep
```

- 8 本の build は、それぞれ `$SHIP` の clone（approved base に固定）から始まる。builder は clone 全体を読める（見せる範囲の外も）。
- 採点は herdr-a-rep の隠しシナリオだけ（`--score` なし。1 組）。判定し直し（`--rescore`）は、揺れの検査のために 2 回かける:

```
npm run factory -- replicate herdr-a-rep --rescore
npm run factory -- replicate herdr-a-rep --rescore
npm run factory -- tally herdr-a-rep
```

- Q = 8 build の「通ったシナリオ / 全シナリオ」の平均。揺れた組（3 回の判定で結果が変わった (scenario, build)）は、その build の分母と分子から除く（prereg の `flakeRule`）。起動しなかった build（`builderOk` が偽）は 0 として Q に入れ、本数を別に報告する。

### 11. 【費用】run 1 本（ff-only の出荷）

```
cd $FACTORY
npm run factory -- run herdr-a-run --ship-target $SHIP --max-cost 30
```

- 試行は最大 5 回（`--max-attempts` の既定）。LLM の判定が 1 回入る。通れば `$SHIP` の `main` が ff-only で進む。**smoke の起動も `serve` も合成トラフィックも `observe` も無い**（program の出荷）。
- 出荷の後に確かめる: `cd $SHIP && git log --oneline -3`（base の上に builder のコミット）、`git status --porcelain` が空、`git merge-base --is-ancestor 003efef HEAD`。
- 通らなかった（試行を使い切った）場合も結果である。報告に書く。

### 12. 【人】報告

[prereg.json](prereg.json) の `successLine` と `prediction` に照らして、予測が当たったか・どこで落ちたかを報告する（`laps/lap-13/report.md`）。`errors.json` を書いたなら、補正の前と後の両方の Q を載せる。

## 題材 A の base と、見せる範囲

### base

- 修正は runtime の `b6ad40a`（PR #242、`Closes #240`）。同じ内容の `263ff3f` もある。どちらの親も `003efef`（`feat(terminal): support herdr 0.9.x (wire protocol 22) (#238)`）。これを approved base にする。
- 差分は `runner.py` の正規表現 `_HERDR_PANE_ID`（`[0-9]+` → 32 記号の表）と `_parse_pane_id` の復号（約 20 行）、CHANGELOG、`tests/test_dispatcher_runner.py` の 30 行。題材の実体は 1 か所。
- 出荷先に `003efef` より後の object を入れない（手順 4）。builder は出荷先の clone の中で `git log --all` を読めるため。

### 見せる範囲（`--base-path`）

**根拠**: 追跡ファイル 152 本のうち、`runner.py` だけで 166,147 字、`docs/cli.md` が 34,798 字、`tests/test_dispatcher_runner.py` が 69,814 字。全部を貼ると 200,000 字を超える（監査 3 節）ので、題材に関わる範囲に絞る。**範囲の外は、drafter と分類器には見えず、builder（clone 全体を読める）にだけ見える。**

| 範囲 | 字数 | 選んだ理由 |
|---|---|---|
| `runner.py:84-100` | 911 | `_HERDR_PANE_ID` の定義と、その上の説明 |
| `runner.py:499-528` | 1,381 | `delegate-plan` の task JSON の必須項目（`_REQUIRED_VARS` など）。シナリオが書く入力ファイルの形に要る |
| `runner.py:589-866` | 12,026 | `_parse_pane_id`、`_pane_id_parseable`、`Pane`、`rect_adjacent`、`choose_split`（番号の同点の決め方） |
| `runner.py:2279-2349` | 3,249 | `validate_task_id` `validate_cwd` と `ActionPlan`（出力の項目、終了コードの元） |
| `runner.py:2610-3160` | 27,224 | `build_plan` 全体。どの入力でどの `status` / `spawn` が出るか。シナリオの期待値の根拠 |
| `runner.py:3213-3266` | 2,722 | `_load_json` と `_parse_panes`（今回の症状の入り口。論理 pane の skip 規則） |
| `runner.py:3385-3642` | 11,332 | `cmd_delegate_plan`、引数の定義、`main`（終了コード 0 / 1 / 2） |
| `docs/cli.md:1-160` | 10,193 | `delegate-plan` の使い方・終了コード・出力の項目の文書 |
| `tests/test_dispatcher_runner.py:95-125, 255-330, 870-1070` | 約 12,400 | pane id の既存の試験と、CLI の試験（task JSON の実例） |

合計は約 81,000 字（実測。`--base-path` の字数の数え方と一致するかは `draft` の出力で確かめる）。上限の 200,000 字に十分収まる。**範囲を広げない理由**: 3 つの drafter と分類の入力が増え、費用が上がる（下の見積もり）。

### 範囲の外の手がかりを見落とすおそれ

drafter と分類器が見ないもの、見ないことで起きうる誤りを、題材に即して並べる。

1. **`_split_options`（`runner.py:731-762` は範囲内）以外の、同点の決め方。** 範囲内で足りる。見落としは小さい。
2. **`terminal/herdr.py`（pane id を作る側）。** herdr の番号の表と `list_panes` の形は範囲外。依頼文が表を書いているので、drafter は表を依頼文から取る。依頼文と herdr のコードの食い違いは見えない（依頼文は修正の PR の説明に由来し、食い違いは無い見込みだが、drafter はそれを確かめられない）。
3. **`transport/descriptor.py`、`broker/`。** 既定の transport は `broker`（`cmd_delegate_plan` に書いてある）。`broker` の経路が pane をどう使うかは `build_plan` の範囲内にあるが、`broker` 側のモジュール（`broker/placement.py` など）の挙動は範囲外。`--transport` を指定する/しないで、シナリオの期待値（`spawn.target` が `focused` か pane 名か）が変わる点を、drafter は `build_plan` の読みで決める。読み違えれば期待値の誤り（`errors.json` の対象）になる。
4. **範囲外の他のテスト（`tests/` の 150 本ほか）と `CHANGELOG.md`。** 既存の約束事（例: 他の transport の pane id の形）が drafter に見えない。シナリオが「前から通っていたこと」を壊す期待値を書くおそれは、範囲内の既存テスト（95-125、255-330、870-1070）で減らしたが、無くせない。
5. **task JSON を読む側（`render_instruction`、テンプレート）。** `--dry-run` でなければ、ひな形の探索（`_candidate_template_repos`）が走る。ひな形の置き場は範囲外。シナリオは `--dry-run` か `--template-repo` を使うべきだが、使い方を drafter が間違うと、builder の出来に関係なく落ちるシナリオができる（承認の要約で人が読む）。
6. **builder の側。** builder は clone 全体を読める。見せない範囲で builder だけが手がかり（例えば別の場所の `pane` 正規表現）を持つので、builder は drafter より多く知っている。これは意図した非対称（drafter が実装を見て期待値を書くと、builder の独立性が崩れるため）。

## 費用の見積もり

### 実測（人が手順 6 で埋める）

| 呼び出し | 1 回あたり | 上限 | 備考 |
|---|---|---|---|
| spec drafter | （未測定） | $1 | |
| scenario drafter | （未測定） | $1 | |
| 分類（1 回） | （未測定） | $0.5 | シナリオごとに 1 回 |

### 見積もり（実測の代わり。根拠が薄い）

- **根拠 1（既存 lap の単価）**: 13 周目の前の較正 L3（[../calibrate-80/l3-report.md](../calibrate-80/l3-report.md) の「計測: 費用」）の、新規の app の依頼（3,400〜3,600 語）の 1 呼び出しあたりの平均。spec drafter $1.10 / 3 回 = $0.37、scenario drafter $3.84 / 6 回 = $0.64、分類 $13.28 / 80 回 = $0.17。
- **根拠 2（表示する字数）**: 新規の app の draft は既存コードを見せない。ここでは約 81,000 字（コードと英語の文書。1 字 0.3 トークン前後とすると約 25,000 トークン）を drafter 2 つと分類の入力に足す。単価（トークンあたり）は工場の記録に無く、この見積もりでは仮定しない。入力が支配する呼び出し（分類）ほど倍率が大きく、出力が支配する呼び出し（scenario drafter）ほど小さいと見る。
- **見積もり**（低い確からしさ）: spec drafter $0.4〜1.0、scenario drafter $0.7〜1.4、分類は 1 回 $0.3〜0.8。**分類はシナリオごとに 1 回**（`src/classify.ts`、各回に約 81,000 字を入れる）で、これまでの lap のシナリオは 11〜15 本なので、12 本とすると分類だけで $3.6〜9.6。**1 つの draft は $4.7〜12 の見込み**で、$5 を超える可能性が高い。**scenario drafter と分類は現在の上限（$1、$0.5）に当たる可能性がある**（分類が上限 $0.5 に当たると draft が失敗する）。
- **本番**: draft 2 つで $9〜24。replicate の build は、新規の app の opus（平均 $1.13、最大 $1.58）より高く、$1.5〜3.5 / 本と見る（clone を読む。`runner.py` だけで 166,147 字ある）。K=8 で $12〜28。run は試行 1〜3 回 × （build $1.5〜3.5 + 判定 $0.3〜0.6）で $2〜12。隔離の確かめ $0.3〜0.6。実測の draft（別の状態ディレクトリ）は $5〜12。**合計の見込みは $30〜80**、ゲート 1 の上限 $150 の内側。ただし draft の費用が見積もりの上端なら余裕は小さい。
- **上限の強制**: lap 全体の上限は factory のコードの定数（`CAPS.lapCostUsd` = $260）で、$150 にするフラグは無い。$150 は、各 change の `--max-cost`（replicate $70、run $30、いずれも draft の費用込み）と、実測 draft（別の状態ディレクトリ、1 change の既定の上限 $10）、probe の約 $1 の和 約 $111 で縛る。lap の台帳 `$FACTORY_HOME/lap-ledger.jsonl` の合計も、各段の後に見る。

### 費用が大きいときの削り方（手順 6 の実測が $5 を超えるとき）

見せる範囲を狭めると、3 つの役（特に分類）の入力が減る。削る順（影響が小さい順）:

1. `tests/test_dispatcher_runner.py` の 3 つの範囲（約 12,400 字）。既存の試験は期待値の書き方の見本だが、依頼文とコードで足りる見込み。
2. `docs/cli.md:1-160`（10,193 字）。出力の項目は `ActionPlan` から読める。
3. `runner.py:2610-3160`（`build_plan`、27,224 字）。削ると、どの入力でどの `status` / `spawn` が出るかが見えず、期待値の誤りが増える。最後に削る。

3 つを全部削ると約 31,000 字（現在の 38 %）。ただし範囲を変えると、承認の版（`paths`）も変わり、この書類の「見せる範囲」と事前登録を書き換える（実測の前に決めるなら `prereg.json` の `base.paths` を直す）。

### 上限を確定する規則（手順 7、事前に決める）

実測した 1 呼び出しの金額が、その役の上限の **70 % 未満**なら、上限は据え置く。**70 % 以上**の役があれば、その役の上限を引き上げる:

| 役 | 現在 | 引き上げ案（実測で 70 % 以上のとき） |
|---|---|---|
| spec drafter / scenario drafter | $1 | $2 |
| 分類 | $0.5 | $1 |
| 1 つの draft 全体（`CAPS.maxCostUsd`。`draft` に `--max-cost` は無い） | $10 | $15（分類が 12 回で合計 $10 に近いとき） |

引き上げは factory の定数の変更（PR）。実測のときに上限に当たって draft が失敗したら、その役は引き上げ（案の値）を採って、実測をやり直す（もう $3〜5）。案の値は見積もりと上限の 2 倍で置いたもので、実測で変える。

## 工場の側で分かった制約（準備で読んだこと）

- 呼び出しごとの上限（drafter $1、分類 $0.5）、`draft` 1 つ分の上限（$10。`draft` は `--max-cost` を取らない）、lap の上限（$260）は定数で、フラグで変えられない（上の手順 7）。`replicate` と `run` の `--max-cost` は change ごとに効く（draft の費用込み）。
- `--spec-from` は `--base` と一緒に使えない（`src/cli.ts`）。replicate 用と run 用の change は、別々の draft（spec も scenario も別に下書きされる）になる。2 つの隠しシナリオは同じ物ではない。
- `replicate` と `run` は同じ change では混ぜられない。`replicate` は出荷先の HEAD が approved base であることを要求し、`run` は出荷で HEAD を進める。順番は「replicate → run」。
- `replicate --base` の clone は approved base に固定される（PR #67）。builder は clone 全体を読める。
- builder の model 呼び出しは網を切っていない（監査 2 節）。builder は `pip install` を試せ、公開の runtime の GitHub を読みに行ける。この周は「builder は何も入れない」を指示文でだけ守っている。
- `user-judge` と `probe` は program を受けない（HTTP と画面だけ）。この周の隔離の確かめ（`probe-isolation`）は工場自体の確かめで、program とは別。

## 残る懸念（準備の時点）

1. **費用の実測が無い。** 上の見積もりは、既存 lap の単価と字数からの外挿。上限に当たる可能性が高い役が 2 つある。
2. **`deps build` と factory の sandbox 内の実行は未検証。** 仮想環境の中での import（`jsonschema` → `rpds-py`）と、`python3 -m claude_org_runtime.cli` の起動は、sandbox の外では確かめた。sandbox（HOME と /tmp を隠す、`--unshare-net`）の中で `claude_org_runtime.cli` が起動時に HOME や環境変数を読んで落ちないかは未確認（落ちれば全シナリオが落ち、依存の解決の失敗として現れる）。手順 2 の `deps build` の最後の起動確認は `-c 'import sys'` までで、`claude_org_runtime` の import は見ない。
3. **学習の汚染。** 題材 A は公開済みの変更の後戻りの再現（prereg の `contamination`）。さらに builder の model 呼び出しは網を切っていないので、builder が GitHub の修正を読める経路がある。
4. **`runtime` の pytest の基準値が無い。** 監査で流せなかった（外部コードの実行として止められた）。この周の判定は隠しシナリオだけで、runtime の既存の pytest は使わない。
5. **lap の上限 $150 は定数でなく運用で守る。** 上の「上限の強制」。
6. **replicate は 1 組（own のみ）の採点。** 較正の Q は 2 組の平均だった。比較可能性は prereg の `comparability`。
