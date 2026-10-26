# 較正の道具 A・B・E

[design.md](design.md)「道具と工場の変更」の A・B・E を書いた。どれも工場の外の道具で、モデルは呼ばない。工場のリポジトリへは、窓口が 12 周目と同じ形で `docs/calibrate-80/` に写す（[arms.ts](arms.ts)・[screen.json](screen.json)、作成担当の `rules.json`）。定義 F（系列 O の lap の定義）と L1 の依頼文・`rules.json` は並走の作成担当が書く。

| | ファイル | 中身 |
|---|---|---|
| A | [arms.ts](arms.ts) の `--screen` | 作る役のモデルで build を絞る（`--builder`）。段（`--stage look` は 2 build、`measure` は 4 build）ごとに窓・分かれ道・落ちの質で読む |
| B | [screen.json](screen.json) | 較正の規則。判定 3 回、揺れ 5 %、分かれ道 80 %、段ごとの k と窓、落ちの質の 2 条件、依頼と状態ディレクトリ |
| E | [arms.ts](arms.ts) の `--precheck` | 合わせた依頼の語数を大きさの段ごとの線で、部品の絡みの合計と部品の間の絡みを数えて確かめる |

`arms.ts` は 12 周目の [../lap-12/arms.ts](../lap-12/arms.ts) の写しに足した。`--provenance`・`--placeholders`・本番の集計は 12 周目のままである。`--screen` と `--precheck` は較正の形に置き換えた（12 周目の形は 12 周目の `arms.ts` に残っている）。

## A・B: `--screen`

```bash
node --experimental-strip-types --no-warnings docs/calibrate-80/arms.ts --screen <screen.json> <ROOT> \
  --stage look|measure --builder <model> [--errors <screen-errors.json>] [--flakes <screen-flakes.json>] <依頼>...
```

- **ROOT** は状態ディレクトリの親（工場の worktree の root。lap の中なら `.`）。`screen.json` の `requests` が依頼ごとの状態ディレクトリの名前を持ち、`<ROOT>/<名前>` を読む。系列 S の段 S1 は 12 依頼が 3 つの写し（`.factory-cal80-lap10`〜`lap12`）にまたがるので、1 回の `--screen` で 12 依頼を並べて選ぶためにこの形にした。
- **`--builder`** は必須。`replicates/` の build の名前 `<model>-<n>`（工場の `src/replicate.ts`）が `<model>-` に数字だけが続くものを数え、判定の履歴（`history/<build>.<k>.json`）も同じ build のものだけを読む。同じ `-cc-p` に opus と sonnet の build が並んでも、モデルごとに Q が出る。
- **`--stage`** は `screen.json` の `stages` を選ぶ。build の数が段の k と違えば止まる（「has 2 builds of claude-sonnet-5-5, the stage measure needs 4」）。
- **依頼**はコマンドに並べたものだけを読む。段 S2 は段 S1 で選ばれた依頼だけを、段 S3 と系列 O は L1（L2）の依頼だけを渡す。並べた順が同点のときの順になる。
- `--errors` と `--flakes` の中身は 12 周目の第 3・第 4 引数と同じ（組の名前ごと）。系列 S の L0 は、10〜12 周目の `screen-errors.json` を 1 つにまとめて渡す（組の名前は依頼ごとに違うので重ならない）。

段ごとの線（`screen.json`）:

| 段 | k | 窓 | 選ぶ数 | 落ちの質 | 使う場面 |
|---|---|---|---|---|---|
| `look` | 2 | 60 % ≤ Q < 95 % | 最大 6 | 見ない | 系列 S の段 S1（下見） |
| `measure` | 4 | 70 % ≤ Q < 90 % | 最大 3 | 見る | 段 S0（opus）・S2・S3、系列 O の L1・L2 |

- **選ぶ順**: 窓に入り、落ちの質を満たす依頼を、80 %（`splitPct`）に近い順に選ぶ。同点はコマンドに並べた順。12 周目の「Q の低い順」から変えた（design.md「選ぶ規則」の「80 % に近い順」）。
- **起動しなかった build**: `builderOk` が false か、自組・相手の組のどちらかの結果が無い build。Q では 0 として数える（12 周目のまま）。表の列「not started」がその数で、「Q started only」が起動した build だけで出した Q である。
- **落ちの質**（`measure` だけ）: 起動しなかった build が 2 本以上（`maxNotStarted` 1 を超える）か、起動した build だけの Q が 90 % 以上（`startedCeilingPct`）の依頼は、窓に入っても選ばない（表の列「quality」が NO）。
- **80 % の分かれ道**: Q < 80 % の依頼を「under 80」の行と表の Q の印に出す。系列 O の L1 の分かれ道（design.md「段の進め方」）はこの行で読む。
- 揺れの規則・期待値の誤り・Q の出し方は 12 周目のまま（[../lap-12/runbook.md](../lap-12/runbook.md)「揺れの規則」、[../lap-12/screen.json](../lap-12/screen.json) の `errorsRule`・`flakeRule`）。揺れは `--builder` のモデルの build だけで数える。

コマンドの例（工場の worktree の root で）:

```bash
A="node --experimental-strip-types --no-warnings docs/calibrate-80/arms.ts --screen docs/calibrate-80/screen.json ."
# 段 S0: 今の工場で判定し直した opus の L0（依頼は 1 つの写しずつでも 12 本まとめてもよい）
$A --stage measure --builder claude-opus-5-5 --errors screen-errors-l0.json cart-checkout task-board expense-wizard room-slots
# 段 S1: sonnet の下見（12 依頼）
$A --stage look --builder claude-sonnet-5-5 --errors screen-errors-l0.json settle-history stock-backorder library-holds task-deps \
  fx-invoice ship-orders pay-refunds notify-queue cart-checkout task-board expense-wizard room-slots
# 段 S2: 段 S1 で選ばれた依頼だけ
$A --stage measure --builder claude-sonnet-5-5 --errors screen-errors-l0.json <段 S1 の選んだ依頼>...
# 系列 O の L1（lap の定義の最後の段）と段 S3
$A --stage measure --builder claude-opus-5-5 stock-tasks pay-ship shop-expense
$A --stage measure --builder claude-sonnet-5-5 stock-tasks pay-ship shop-expense
```

- L2 の依頼の名前（stock-tasks-library・pay-ship-invoice・shop-expense-rooms、状態ディレクトリ `.factory-cal80-o2`）は、L2 の依頼文を書いたとき（L1 の結果の後）に `screen.json` の `requests` に足した。窓・線は変えていない（[l2-requests.md](l2-requests.md)）。L3 の依頼の名前（stock-tasks-library-settle・pay-ship-invoice-notify・shop-expense-rooms-board、状態ディレクトリ `.factory-cal80-o3`）も同じ形で足した（[l3-requests.md](l3-requests.md)）。
- `--precheck` の段は `rules.json` の `stages` から読む。L3（3,100〜3,600 語、部品の間の絡み 30 組以上）は `stages` に足しただけで、`arms.ts` は変えていない。

## E: `--precheck`

```bash
node --experimental-strip-types --no-warnings docs/calibrate-80/arms.ts --precheck docs/calibrate-80/rules.json
```

`rules.json` の形（作成担当と合わせた）:

- `stages`: 大きさの段ごとの線。`{"L1": {"words": [1500, 1800], "minCross": 10}, "L2": {"words": [2300, 2700], "minCross": 20}}`（design.md「大きさの段」の語数の目安と絡みの線）。
- 合わせた依頼: `requests.<名前>` に、12 周目と同じ `file`・`rules`・`pairs`（`ui` / `service` は持ってよいが数えない）と、`stage`（`"L1"` / `"L2"`）・`parts`（部品の依頼の名前）。規則の名前は `<部品>/<規則>` とし、頭は `parts` のどれかにする。部品をつなぐ新しい規則も、それが動きを変える側の部品の頭を付ける。
- 部品の依頼: `requests.<部品の名前>` に、10〜12 周目の `rules.json` の項目をそのまま写す（規則に頭は付けない、`stage` は付けない）。

合わせた依頼ごとの線（すべて満たして通る）:

1. 語数（空白で区切る、`wc -w` と同じ）が段の `words` の範囲にある（両端を含む）。
2. 絡みの数が、部品の絡みの数の合計以上。
3. 部品の間の絡み（頭の違う 2 規則の組。順と重複は数えない）が段の `minCross` 以上。
4. 部品の規則をすべて `<部品>/<規則>` の名前で持つ（足りない規則は出力に並ぶ）。

頭の無い規則、`parts` に無い頭、`parts` に無い依頼や `stage` を持つ依頼を部品に挙げたときは、数えずに止まる。部品の語数は数えない（部品の線は 10〜12 周目の `--precheck` で確かめ済み）。

## 確かめたこと（モデルは呼んでいない）

- `--self-test` が通る（12 周目の試験に、build の絞り、窓の両端、80 % に近い順の選び方と同点、落ちの質の 2 条件、起動しなかった build の 3 つの形、部品の間の絡みの数え、語数の両端、部品の絡みの合計、部品の規則の欠け、頭の誤りを足した）。12 周目の `arms.ts --self-test` も変わらず通る。
- 12 周目の状態ディレクトリ（工場の `factory-lap12-run/.factory-lap12`、読むだけ）を ROOT の下に置き、`--stage measure --builder claude-opus-5-5` で 4 依頼の Q が 12 周目の報告の除く前の値（92.9・90.6・98.2・100.0）と同じになった。sonnet の build の無い依頼に `--builder claude-sonnet-5-5` を渡すと止まる。
- 11 周目の ship-orders と pay-refunds を部品にした合わせた依頼の形の `rules.json`（作りもの、1600 語）で `--precheck` が通り、部品の絡みの合計（77）と部品の間の絡み（10）を数える。
- 型の確かめ（`tsc`）は、factory-notes にも工場の worktree にも `node_modules` が無いので流していない。Node 22 の `--experimental-strip-types` で読み込めることだけを確かめた。
