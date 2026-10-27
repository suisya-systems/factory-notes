# 13 周目の報告（2026-10-27）

工場の 13 周目の結果を報告する。この周のねらいは、工場を新規のアプリではなく、claude-org-runtime（以下 runtime）の**既存の Python リポジトリの変更**に当てて、作る役の合格率 Q が 80 % の線を割らないかを測ることである。題材 A は、runtime の Issue #240（herdr の pane id が 10 個目以降でも `dispatcher delegate-plan` が通る）で、修正は #242（`b6ad40a`、v0.1.50）。12 周目までは依頼文から新規のアプリを作らせていたが、この周は `draft --contract`（プログラムを `run` 手順で確かめる）、`--base-path`（既存コードの一部を見せる）、`deps build`（hash 固定の依存）、`replicate --base`、出荷先への ff-only の出荷（factory の PR #67）を初めて本番で使った。設計と手順は [runbook.md](runbook.md)、事前登録は [prereg.json](prereg.json)、依頼文は [requests/herdr-pane-id.md](requests/herdr-pane-id.md)（495 語）、準備の監査は [../../research/runtime-fit-audit-2026-10-27.md](../../research/runtime-fit-audit-2026-10-27.md) にある。

## この文書での言葉

12 周目までの報告と 13 周目の runbook の言葉を使う（Q、天井、シナリオ、build、揺れ、期待値の誤り、承認の要約、独立ラベル）。新しい言葉は次だけである。

- **13 周目 / この周**: 2026-10-27 に回した、工場の 13 回目の実行。状態ディレクトリは `/home/happy_ryo/factory-lap13/state-lap13`、実測用は `state-measure`。窓口がホスト側で実行した。
- **独立ラベル**: 承認の要約の表。仕様だけを読む別の session に各応答を予測させ、シナリオの確認との一致を見た分類。`readable`（仕様 `spec` / コード `code` / 慣習 `convention` から読める）と `unstated`（読めない）に分かれる。シナリオの書き手の自己申告（stated / unstated）とは別。
- **rep / run**: 変更 ID `herdr-a-rep`（replicate 用、K=8 の Q を出す）と `herdr-a-run`（`run` 用、出荷先へ ff-only で出荷）。draft は別々で、隠しシナリオも別の物になる。

## 結論

- **「割らない」の予測は当たり、成功の線の 4 条件をすべて満たした。lap は「held」（既存の Python リポジトリへ持ち越せた）。**
  - Q = **100.0 %**（8 build × 14 シナリオ = 112 / 112）。予測は点 94 %、範囲 82〜100 %。範囲の上端で、「天井」（Q ≥ 95 %）に当たった（事前の確率 45 %）。
  - 8 build すべてで builderOk=true。落ちたシナリオは 0、揺れた組は 0 / 112、期待値の誤り（`errors.json`）は無い。補正の前も後も Q は 100.0 % で、80 % の線の同じ側に居る。
  - `run` は 1 回目の試行で出荷した。出荷先は `003efef` の上に `01eb9cb` が 1 commit（ff-only、clean）。15 / 15 シナリオを通り、LLM の判定も通した。
- **落ちた項目は 0 件だった。** 「作る役の失敗」0、「確かめ方の誤り」0、「対象の揺れ」0（下の「落ちた項目の数え方」）。事前登録の「落ちる所」の 4 か所（依存の解決、base の移動、CLI の終了コード、生成ファイルの差分）のどれにも当たらなかった。
- **合格率は classification で分けても差が出ない。** rep のシナリオ 14 本は独立ラベルがすべて `readable`（仕様 10、慣習 2、コード 2）で、`unstated` は 0 本。run の 15 本は `readable` 13 本（仕様 8、コード 4、慣習 1）と `unstated` 2 本で、すべて通った。
- **学習汚染の事後検査は、半分しかできなかった。** builder の transcript は状態ディレクトリのどこにも残っていないので、GitHub への fetch は**検査できなかった**。検査できたのは各 build の出力（base からの差分）で、修正の commit や版・Issue への言及は 9 件（rep 8 + run 1）のすべてで 0 件だった（下の「学習汚染の事後検査」）。
- **満点は「80 % を割らない」の確認としては強いが、点推定としては上限寄りに読む。** 公開済みの変更の再現で、題材が小さく、依頼文が規則を書き切っている（下の「満点の解釈と限界」）。較正の曲線上の 1 点ではない。
- **費用。** lap 台帳（`state-lap13`）の合計 **$16.96**、実測用（`state-measure`）**$6.39**、合わせて約 **$23.35**（上限 $150 の内側、事前登録の見込み $30〜80 の下端より下）。

## 何が起きたか（時系列）

時刻は台帳・ログの記録（UTC、`Z`）に日本時間（JST = UTC + 9 時間）を添える。準備は [runbook.md](runbook.md) の手順 1〜7 で、実行は窓口がホスト側で行った。

| 時刻 | 段 | 結果 | 費用 |
|---|---|---|---|
| 07:59Z（16:59 JST） | 隔離の確認（`probe-isolation`） | canaryFound=false、loginFound=false。問題なし | $0.35（claude-opus-5-5 $0.15 / claude-opus-4-8 $0.20） |
| 07:59Z〜08:05Z | 実測の draft `herdr-a-measure`（`state-measure`） | 合計 $6.387。1 呼び出しの最大: spec 0.378 / scenario 0.532 / classifier 0.334。すべて現在の上限の 70 % 未満（classifier 67 %）なので、上限は据え置き。caps は `confirmed: true` で commit `ad74958` に記録 | $6.39 |
| 08:05Z〜08:10Z | draft `herdr-a-rep` | spec 2 回、scenario 2 回、分類 14 回（シナリオ 14 本）。discrepancy は (a) 0、(b) 0 | $6.30 |
| 08:10Z〜08:13Z | draft `herdr-a-run` | spec 2 回、scenario 1 回、分類 15 回（シナリオ 15 本）。discrepancy (a) 0、(b) 2 件（下の「run」） | $6.08 |
| 08:29Z（17:29 JST） | 承認 | happy-ryo が 2 つとも承認。版は rep `a2bf487b…`、run `e6188f61…`。run は (b) の 2 件をそのまま承認 | — |
| 08:29Z〜08:46Z | `replicate` K=8（`--base` 出荷先、`--max-cost 70`）と判定し直し 2 回、`tally` | 8 build すべて builderOk=true、14 / 14 シナリオ。判定し直しで変わった判定は無い | builder $3.66 |
| 08:46Z〜08:48Z（17:46〜17:48 JST） | `run` herdr-a-run（`--ship-target`、`--max-cost 30`） | shipped、attempts 1 | builder $0.44 + judge $0.14 |

事前登録の `amendments` は 1 件（caps の確定と approvedVersions の記録、承認の前）だけで、予測と規則は変えていない。

## replicate K=8 の結果

Q = 8 build の「通ったシナリオ / 採点したシナリオ」の平均。この周は除くシナリオも除く build も無いので、素の Q と補正した Q は同じ **100.0 %** である。

| build | sha | builderOk | 通った / 14 | 費用 |
|---|---|---|---|---|
| claude-opus-5-5-1 | ae962cb | true | 14 | $0.505 |
| claude-opus-5-5-2 | b7f9a49 | true | 14 | $0.491 |
| claude-opus-5-5-3 | bf0ca5d | true | 14 | $0.401 |
| claude-opus-5-5-4 | 110d17b | true | 14 | $0.402 |
| claude-opus-5-5-5 | 851df6a | true | 14 | $0.481 |
| claude-opus-5-5-6 | 0d74739 | true | 14 | $0.421 |
| claude-opus-5-5-7 | 98f33e3 | true | 14 | $0.493 |
| claude-opus-5-5-8 | ef3aca7 | true | 14 | $0.462 |

- 8 build とも、変えたファイルは同じ 3 本（`src/claude_org_runtime/dispatcher/runner.py`、`tests/test_dispatcher_runner.py`、`CHANGELOG.md`）。追加行は 43〜96 行、削除は 10〜12 行。既存の試験の期待値（`w9:p99` を 99 から 297、`w0:p0` を 0 から 32 など）も builder が自分で更新した。
- 1 回目の判定と判定し直し 2 回の 3 回で、合否が変わった（シナリオ × build）は 112 個中 0 個（揺れ 0 %）。止める線（5 %）に遠い。`tally` の「Verdicts that changed across judgements」は none。
- 1 build は $0.40〜$0.50。runbook の見積もり（$1.5〜3.5 / build）の 3 分の 1 以下で、K=8 の合計は $3.66（見積もり $12〜28）。

### classification ごとの合格率

承認の要約の独立ラベル（仕様だけを読む別 session の予測と、シナリオの確認の一致）で分ける。rep の分母は 14 本 × 8 build、run の分母は 15 本 × 1 build。

| 独立ラベル | rep: シナリオ数 | rep: 通った（cell） | run: シナリオ数 | run: 通った |
|---|---|---|---|---|
| readable (spec) | 10 | 80 / 80 | 8 | 8 / 8 |
| readable (code) | 2 | 16 / 16 | 4 | 4 / 4 |
| readable (convention) | 2 | 16 / 16 | 1 | 1 / 1 |
| **readable 計** | **14** | **112 / 112** | **13** | **13 / 13** |
| unstated | 0 | — | 2 | 2 / 2 |
| **全体** | **14** | **112 / 112（100.0 %）** | **15** | **15 / 15** |

- 書き手の自己申告（stated / unstated）は、rep が stated 13・unstated 1（`leading-zero-symbol-is-large`。独立ラベルは `readable (spec)`）、run が stated 13・unstated 2。独立ラベルと自己申告がずれたのは、rep のこの 1 本だけ（自己申告は「依頼文が決めていない」、独立ラベルは「仕様から読める」）。
- 種類（kind）は rep が tie-break 3、decoding 4、regression 2、acceptance 2、validation 3。run が tie-break 4、decoding 2、acceptance 2、rejection 2、regression 3、exit-codes 1、side-effects 1。
- **`unstated` の分母が小さい。** rep は 0 本なので、「仕様に書いていない所を builder が推測で埋めて外した」場合の合格率は rep では測っていない。run の 2 本（下）は 1 build で 2 / 2 通っただけである。

## 事前登録の予測と結果

[prereg.json](prereg.json) の `prediction` と `successLine` に並べる。

### 予測

| 項目 | 予測 | 結果 | 判定 |
|---|---|---|---|
| 側 | 割らない（`does-not-drop-below-80`） | Q = 100.0 % | 当たり |
| Q の点 | 94 % | 100.0 % | +6 ポイント。範囲内の上端 |
| Q の範囲 | 82〜100 % | 100.0 % | 範囲の上端 |
| 80 % を割る確率 | 0.15 | 割らなかった | — |
| 天井（Q ≥ 95 %）の確率 | 0.45 | 天井だった | 当たった側 |
| run が出荷する確率 | 0.8 | 出荷した | 当たり |
| run の試行回数 | 1 か 2（最大 5） | 1 | 範囲の下端 |
| 費用 | $30〜80（見込み） | 約 $23.35 | 下端の下 |

### 落ちる所（`whereItFalls`）

各所の確率は「8 build のうち少なくとも 1 build が、少なくとも 1 シナリオを、その理由で落とす」確率で、足して 1 にならない。結果は全部 0 だった。

| 落ちる所 | 事前の確率 | 結果 | 備考 |
|---|---|---|---|
| dependency-resolution（周を無効にする） | 0.15 | 起きなかった | 8 build × 14 シナリオが全部通ったので、`python3 -m claude_org_runtime.cli` は run の sandbox で起動できた。runbook の懸念 2（sandbox 内の起動は未検証）はここで解消した |
| base-move（周を無効にする） | 0.05 | 起きなかった | replicate は拒否せず始まり、8 build とも base `003efef` を親にしている（`baseSha` が全 build で一致）。出荷先は `run` の前に base のままで、`run` の後に `003efef` + 1 commit |
| cli-exit-code（最初に落ちると見た所） | 0.35 | 起きなかった | 依頼文が 3 つの場合（`p10` は 10 でなく表の読み、`w1:pa` は拒否、桁だけの場合）を書いており、8 build とも終了コードを合わせた |
| generated-file-diff | 0.20 | 起きなかった | 期待値の誤り 0 |

### 成功の線（`successLine`）の 4 条件

| 条件 | 内容 | 結果 | 判定 |
|---|---|---|---|
| (1) | Q ≥ 80 % | 100.0 %（素も補正後も） | 満たした |
| (2) | 8 build 中 7 本以上が起動（builderOk） | 8 / 8 | 満たした |
| (3) | 周を無効にする不具合（依存の解決、base の移動）が採点されたシナリオに無い | 0 件 | 満たした |
| (4) | `run` が出荷し、新しい HEAD が判定した commit で、`003efef` を祖先に持つ | status shipped、HEAD `01eb9cb8a63033237e55b0422b1e3866e6ff7803`、その親が `003efefd537f1d7f67d47f19f654a3b451de298f`、ff-only、作業ツリー clean、remote 無し、object 150（base の 149 + 1） | 満たした |

4 条件すべてを満たしたので、判定は **held**。「did not hold」の場合に名指しする「最初の失敗の所」は無い。

## 落ちた項目の数え方

落ちた（シナリオ × build）を、runbook の方針で 3 つに分けて数える。この周は全部 0 件である。

| 分類 | 内容 | 件数 | 根拠 |
|---|---|---|---|
| 作る役の失敗 | builder が依頼どおりに作らず、正しい期待値のシナリオが落ちた。builder が起動しなかった（builderOk=false）も含む | **0** | 112 cell すべて通過。builderOk=false は 0 build。run の試行は 1 回で、LLM の判定も通した |
| 確かめ方の誤り | 期待値の誤り（依頼文と矛盾する期待値、数えが合わない値）、工場の採点の不具合、待ちの誤り、範囲の外の手がかりを見落とした期待値 | **0** | 落ちたシナリオが 0 なので読む対象が無い。`errors.json` は書いていない。承認の要約の discrepancy は rep で (a) 0・(b) 0 |
| 対象の揺れ | 判定し直し 2 回を含む 3 回の判定で合否が変わった（シナリオ × build）。生成物や環境の揺れ | **0** | 112 cell のうち 0（0 %）。`tally` の変わった判定は none |

- 3 つとも 0 件なので、Q の補正（素と補正後）、揺れの規則（5 % 超で verdict なし）、未起動 build の別掲は、どれも使っていない。
- **確かめ方の誤りを「見つけられなかった」可能性は残る。** 全員が通ったシナリオの期待値が、依頼文の読みの狭さ（広く通る）で作られていて、builder が本当に正しいかを確かめていないおそれがある。この周は全員が落ちたシナリオが無いので、12 周目のような「全員が落ちたシナリオの読み」の機会が無かった。承認の要約の独立ラベルで、14 本とも `readable` と読まれたことが、期待値が仕様から読めるという意味では確かめになっている。

## run

`herdr-a-run` は、rep とは別に下書きされた隠しシナリオ 15 本（`run` 手順）で、builder の試行 1 回目 `01eb9cb8…` が通った。

- 15 本の内訳は、独立ラベル `readable (spec)` 8、`readable (code)` 4、`readable (convention)` 1、`unstated` 2。全部通過（`passRate` は inSpec 13 / 13、notInSpec 2 / 2）。
- **承認した discrepancy (b) の 2 件。** どちらも「シナリオが要求するが、仕様が決めていない」で、happy-ryo がそのまま承認した。
  - `fixed-target-accepts-letter-pane`: 固定 target の transport で、10 個目の pane を含む layout を計画する。
  - `state-files-written-with-letter-pane`: `--dry-run` 無しで、名前付き workspace の pane に文字記号を含む layout の計画が、state_writes を 2 件出して成功する。
  - 2 件とも builder は通した。仕様が決めていない所を、依頼文（と既存コード）から推測して合わせたことになる。これは `unstated` の 2 / 2 で、n が小さい。
- LLM の判定は、コードを読んで仕様どおり（`_HERDR_PANE_ID` が表の 32 記号の 1 個以上を受ける、双方向の桁の読み、`p10` は 64、`p0` は 32、renga の数字と tmux の `%N` は前の読み、workspace の部分は同じ）と判定した。builder は既存の試験の期待値を新しい値に直した。判定役の記述に「試験は流していない」とあり、判定役がコードを読んで確かめたもので、builder が試験を流したかは記録から分からない。判定は通っているので、落ちた扱いにはならない。
- 出荷先 `runtime-ship` は `003efef` の上に `01eb9cb` が 1 commit（`factory: builder attempt`）。`main`、作業ツリー clean、remote 無し。runtime の GitHub には何も push していない。
- 費用: builder $0.44 + judge $0.14 = $0.58（見込み $2〜12）。

## 学習汚染の事後検査

事前登録の `contamination.check`: 「replicate の後、各 build の transcript か workspace を、`github.com/suisya-systems/claude-org-runtime` への fetch、または commit id `b6ad40a` / `263ff3f` について検索する。ヒットがあれば報告し、その build を別に挙げて、Q を含めた値と除いた値の両方を出す」。

### 検査できたこと

| 検査 | 対象 | 結果 |
|---|---|---|
| 差分の検索 | 8 build（rep）と run の builder の出力（base `003efef` から builder の commit までの差分、各 3 ファイル） | `b6ad40a`、`263ff3f`、`0.1.50`、`#240`、`#242`、`github.com`、`curl`、`wget`、`fetch` のどれも **0 件**。9 件すべて |
| workspace の object | 8 build と run の clone | `b6ad40a`、`263ff3f` の object は **無い**（`git cat-file -t` が失敗）。clone 元の出荷先が `003efef` までの object しか持たないための当然の結果で、builder が持ち込んだ形跡ではない |
| 出荷先の object | `runtime-ship` | `b6ad40a` の object 無し。object 数は準備時の 149 から、出荷の 1 commit で 150。`003efef` より後の object を持ち込んでいない |

### 検査できなかったこと

- **builder の transcript は残っていない。** 状態ディレクトリ（`state-lap13`）を探したが、transcript にあたるファイルは無い（見つかった `*.jsonl` は lap 台帳と、runtime の試験の fixture だけ）。工場は builder の model session に設定ディレクトリ全体を渡さない作りで（`src/adapter.ts` の `cliSandbox`。履歴や transcript を渡さないため）、状態ディレクトリへ transcript を写す処理も見つからなかった（工場のコードは読んだ範囲のみ）。
- よって、**GitHub への fetch があったかどうかは、検査できなかった**。builder の model 呼び出しは網を切っていない（事前登録の漏れの道 2）ので、fetch の経路は塞がれていなかった。「0 件」は、出力の側に言及が無かったという意味にとどまる。fetch して読んだ builder が、修正の commit 名や版を出力に書くとは限らない。
- 漏れの道 1（model の学習データ）は、事前登録のとおり、ここでは試験できない。
- 検査の結果としてヒットが無かったので、「ヒットした build を別に挙げる」「Q を含めた値と除いた値を出す」は、使っていない。Q は 100.0 % の 1 通り。

### 読み

「汚染が無かった」とは言えない。言えるのは、**出力に汚染の痕跡は見つからなかったが、transcript が無く、fetch の有無は確かめていない**ことだけである。次の周で同じ検査をするなら、builder の transcript（または網の接続記録）を残す手が要る（下の「次の周への候補」）。

## 満点の解釈と限界

prereg の `comparability` に照らして、Q = 100 % をどこまで読めるかを書く。

- **「80 % を割らない」の確認としては十分に強い。** 8 build × 14 シナリオの 112 cell で 0 件落ち、判定の揺れも無い。成功の線の 4 条件を満たした。統計的な検定はしていない（K=8）。
- **点推定としては上限寄りに読む。** 予測 94 % より高く、範囲の上端である。次の理由で、点を 100 % と読む根拠にはならない。
  - **題材 A が小さい。** 修正の実体は `runner.py` の正規表現と復号の約 20 行の 1 か所。依頼文は 495 語で、較正の L0（694〜901 語）より短い。較正の「Q は依頼の大きさで下がらない」は、短い依頼を既存のコードに当てた場合について何も言わない（prereg の差異）。
  - **依頼文が規則を書き切っている。** 表、順序、桁だけの場合、拒否する場合を、Issue #240 と同じ粒度で書いてあり、builder は規則を再発見しなくてよい。rep の 14 本は独立ラベルが全部 `readable` で、依頼文に書いていない所を推測で埋める試験（`unstated`）が 0 本だった。**builder が推測する場面を、rep は測っていない。**
  - **公開済みの変更の再現である。** 修正は public で、v0.1.50 に入っている。model が答えを知っている可能性（漏れの道 1）は検査できず、道 2 の fetch も transcript が無くて検査できなかった。Q は、依頼文だけから builder が導ける値の上限かもしれない。
  - **較正の Q とは別の測定である。** 同じ式（build ごとの合格割合の平均）だが、コマンドライン（`run` 手順、終了コードと標準出力の JSON）で HTTP ではない。既存の 152 ファイルの拡張で、較正の build は空のリポジトリから始めた。組は rep の 1 組（own）で、較正は 2 組の平均。シナリオ数は 14 本で、1 本が Q の約 7 ポイントを持つ。したがって「80 % の線に照らす目安」として読み、較正の曲線上の 1 点には置かない。
  - **範囲の外を builder だけが見る。** drafter と分類器は `--base-path` の範囲（約 81,000 字）だけを見て、builder は clone 全体を読める。builder は drafter より多く知っているので、合格は有利に働く方向の非対称である（意図した設計だが、Q を押し上げうる）。
  - **依存の版が base の時点ではない。** lock は作った日（2026-10-27）の最新を固定した。base の日（2026-10-11）の依存ではない。`jsonschema>=4.18` の範囲内で、pane id の読み方に効かない見込みだが、確かめていない（runbook に書いたとおり）。
  - **作る役は 1 モデル**（claude-opus-5-5）。シナリオの下書き役も同じ系統で、別系統のシナリオ（Codex）を使っていない。
  - **依頼文は作成担当（Claude）が準備で書いた。** 規則の書き方が、Claude の作る役に有利だった可能性がある。
  - **期待値の誤りを見つける機会が無かった。** 全員が通ったので、期待値の読みを確かめる場面が無い（上の「落ちた項目の数え方」）。
- **この周が答えたこと。** 工場が既存の Python リポジトリの小さな変更に当たる道（`draft --contract`、`--base-path`、`deps build`、`replicate --base`、ff-only の出荷）が、本番で最後まで通った。sandbox の中で `python3 -m claude_org_runtime.cli` が起動し、hash 固定の依存で動いた。
- **この周が答えていないこと。** より大きな変更や、依頼文が規則を書き切らない変更で Q が保たれるか。公開されていない（model が答えを知らない）変更で Q が保たれるか。後者は事前登録に書いたとおり、この周では使っていない（監査で見つかった前向きの題材は runtime の open の Issue #21、ntfy だけ）。

## 費用（lap 台帳）

`state-lap13/lap-ledger.jsonl` の終わりの行（`usd` の行）を数え直した。

| 役 | 費用 | 回数 |
|---|---|---|
| 隔離の確認 | $0.35 | 1 |
| 仕様の下書き役（rep 2 + run 2） | $1.48 | 4 |
| シナリオの下書き役（rep 2 + run 1） | $1.42 | 3 |
| 分類（rep 14 + run 15） | $9.48 | 29 |
| 作る役（rep 8 build $3.66 + run 1 試行 $0.44） | $4.10 | 9 |
| 判定（run の LLM judge） | $0.14 | 1 |
| **合計（lap 状態ディレクトリ）** | **$16.96** | |
| 実測の draft（`state-measure`: spec 2、scenario 2、分類 14） | $6.39 | 18 |
| **合計（実測を含む）** | **約 $23.35** | |

- 窓口の「draft の合計 $12.73」は、本番 draft 2 つ（rep $6.30 + run $6.08 = $12.38）に、隔離の確認 $0.35 を足した値と一致する。
- 上限 $150（`stopLineUsd`）の内側で、事前登録の見込み $30〜80 の下端より小さい。作る役が見積もりの 3 分の 1 以下だったこと（既存コードを読む費用が思ったほど大きくなかった）が大きい。分類（29 回）は $9.48 で費用の過半を占め、1 回 $0.33 前後。
- 各 change の `--max-cost`（replicate $70、run $30）には当たっていない。
- 工場の実験予算（合計 $1000）の残りは、この報告では出していない。12 周目の報告の残りに、その後の較正（[../calibrate-80/l3-report.md](../calibrate-80/l3-report.md)）の費用と、この周の約 $23.35 を引く必要があり、台帳との突き合わせを済ませていないため。
- 計上できなかったもの: 作成担当・実行担当・窓口の費用。

## 何が言えないか（既知の限界）

- **1 題材・1 変更・1 作る役・K=8。** 「既存リポジトリへ持ち越せる」の最初の 1 点であり、一般の既存コードの変更の合格率ではない。
- **汚染は、確かめられた範囲が狭い。** transcript が無い。上の「学習汚染の事後検査」。
- **推測の場面が少ない。** rep は `unstated` 0 本、run は 2 本・1 build。
- **揺れ 0 は、同じ機械・同じ負荷の 3 回の判定についての結果。** 本番の負荷での揺れは確かめていない。run の判定（LLM judge）は 1 回で、揺れを見ていない。
- **builder の試験の実行。** run の LLM 判定は、試験を流さずコードを読んで判定した。builder が既存の試験を流したか、rep の builder が runtime 自身の pytest を通したかは確かめていない（判定は隠しシナリオだけで、runtime の既存の pytest は使わない。runbook の懸念 4）。
- **依存の版は base の時点ではない。**
- 1〜12 周目から引き継いでいる限界。系統 = 1 モデル。lap 台帳にロックが無い。

## 次の周への候補（判断はオーナー）

この周の結果から、問いが変わる候補だけを挙げる。

1. **前向きの題材。** model が答えを知らない変更（監査で見つかった runtime の open の Issue #21、ntfy）で測る。汚染の問いが消える。ただし題材が大きい可能性がある。
2. **transcript を残す手を先に入れる。** 汚染の検査を完全にするために、builder の model session の transcript（または網の接続の記録）を状態ディレクトリへ残す。工場の変更で、どの周でも効く。
3. **推測の場面を足す。** 依頼文が決めていない所（`unstated`）を意図して含む依頼で測る。rep が測らなかった側。

## この周で置かなかったファイル

- `errors.json` と `flakes` の記録は書いていない。期待値の誤りも揺れも 0 件で、書く中身が無いため。
- 工場の worktree の `docs/lap-13/` にも、この報告の写しは置いていない（記録は factory-notes の側にだけある）。
- builder の transcript は、元から無い。

## 同じディレクトリのファイル

- [runbook.md](runbook.md): 13 周目の設計と実行手順。
- [prereg.json](prereg.json): 事前登録（予測、成功の線、caps の確定、承認した版）。
- [contract.json](contract.json)・[requirements.lock](requirements.lock): contract と hash 固定の依存の lock。
- [requests/](requests/): 依頼文。
