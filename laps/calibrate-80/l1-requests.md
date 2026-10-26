# 系列 O の L1: 合わせた依頼 3 本と予備選別の定義（道具 F）

[design.md](design.md) の「道具と工場の変更」の F。系列 O の L1 の依頼文 3 本、`--precheck` が読む `rules.json`、予備選別の部分だけの lap 定義 `cal80-o1.json` を置く。モデルは 1 度も呼んでいない。較正も始めていない。L2 の依頼文は、設計のとおり L1 の結果を見てから書く。

## 置いたもの

| factory-notes | 工場での置き場（窓口が写す） | 中身 |
|---|---|---|
| [requests/stock-tasks.md](requests/stock-tasks.md) | `requests/stock-tasks.md` | 10 周目: stock-backorder + task-deps |
| [requests/pay-ship.md](requests/pay-ship.md) | `requests/pay-ship.md` | 11 周目: ship-orders + pay-refunds |
| [requests/shop-expense.md](requests/shop-expense.md) | `requests/shop-expense.md` | 12 周目: cart-checkout + expense-wizard |
| [rules.json](rules.json) | `docs/calibrate-80/rules.json` | `--precheck` の規則と絡み（下の「rules.json の形」） |
| [cal80-o1.json](cal80-o1.json) | `examples/cal80-o1.json` | 系列 O の L1 の lap 定義（状態ディレクトリ `.factory-cal80-o1`） |

`arms.ts`（道具 A・E）と `screen.json`（道具 B）は factory-calib-tools（#36）が同じ `laps/calibrate-80/` に置いた。工場では `docs/calibrate-80/` に写す。定義はこの 2 つの置き場と引数の形を [tools.md](tools.md) に合わせてある（下の「lap 定義」）。

## 数え

作成担当が数え、[tools.md](tools.md) の `arms.ts --precheck rules.json` でも確かめた（工場と同じ並びの一時ディレクトリに、工場の `requests/`（da3de63）とこの 3 本を置いて流した。モデルは呼ばない）。3 本とも `passes: yes` で、`--precheck` の数えは下の表と同じ（stock-tasks の絡みは重なりを除いた 84、部品の合計は 69）。

| 依頼 | 部品 | 語数（wc -w） | 規則 | 絡み | 部品の絡みの合計 | 部品の間の絡み |
|---|---|---|---|---|---|---|
| stock-tasks | stock-backorder（725 語）+ task-deps（694 語） | 1,614 | 54 | 85 | 70 | 14 |
| pay-ship | ship-orders（814 語）+ pay-refunds（848 語） | 1,625 | 75 | 94 | 77 | 15 |
| shop-expense | cart-checkout（868 語）+ expense-wizard（840 語） | 1,798 | 85 | 98 | 81 | 13 |

- 3 本とも L1 の線（1,500〜1,800 語、部品の間の絡み 10 組以上、絡みは部品の合計以上）の内側にある。
- shop-expense は 1,798 語で、上の端に 2 語しかない。2 本の部品が 1,708 語あり、つなぐ文を足すと 1,800 語を超えたので、つなぐ文を詰めた（下の「部品の文言から変えたところ」）。依頼文を直すときは語数を測り直すこと。
- stock-tasks の絡み 85 には、task-deps から写した `start|finish` と `finish|start`（理由の違う同じ組）が両方入っている。順を数えなければ 84 組で、部品の合計 70 以上なのは変わらない。
- 絡みは「部品の絡み（頭を付けて全部写した）+ 部品の間の絡み + 同じ部品の中で新しく生まれた絡み」である。同じ部品の中の新しい絡みは 1〜4 組で、部品の間の絡みには数えていない。

## 組み合わせの選び方

設計のとおり、同じ周の 2 本で、データを共有しやすい組を選んだ。

- **10 周目: stock-backorder + task-deps**（「作業場の在庫・客の注文・部品を使う工程」）。工程が在庫の部品を使い、部品の行が注文の行と同じ取り置きの列に並ぶ。settle-history と library-holds は、在庫とも工程とも共有するデータが無い。
- **11 周目: ship-orders + pay-refunds**（設計の例のとおり、注文を共有する）。支払いの状態が出荷の可否を決め、返金した数が出荷する数を減らす。偽物は 1 つの `SERVICE_URL` に 4 つの口（charges・refunds・shipments・DELETE shipments）を持つ。工場の偽物は口を method とパスで分けるので（`src/fake.ts` の canned）、1 つの偽物で足りる。
- **12 周目: cart-checkout + expense-wizard**（「事務用品の店と、注文を請求する経費の報告」）。店の注文を経費の報告の行が請求する。task-board と room-slots は、店とも経費とも自然に共有するデータが無い。画面は 3 枚（`/`・`/new`・`/reports`）で、12 周目の「画面の判定の制約」（時間で動く表示を入れない、ボタンを無効にしない）は部品の文のまま守っている。12 周目の候補 4（空になった要素の読み）は、新しく足した文で要素を消す書き方をしていない。

## 部品の間の絡み（つなぐ規則）

つなぐ規則は、動きを変える側の部品の頭を付けた（例: 返金が出荷の数を決める `pay-refunds/open-units`）。各組の理由は `rules.json` の `pairs` にある。

**stock-tasks**（新しい規則: `stock-backorder/part-lines`、`task-deps/task-parts`、`task-deps/sched-missing`）

- 工程の部品の行は、注文の行と同じく free から取り、残りは取り置きの列に並ぶ。製品の `allocated` / `backordered`、入荷の答え、取り置きの一覧（`taskId`）に部品の行が入る。客の `openValue` には入らない。
- 工程の `blocked` と `start` は、依存の完了に加えて部品の行がそろっていることを要る。入荷・取り消し・返品で工程の `blocked` が外れる。
- `finish` で部品は作業場を出る。`reopen` は部品を 0 から取り直し、列の最後に並ぶ（`reopen` で `todo` に戻る依存先は部品を持ったまま）。`delete`（cascade を含む）は、完了していない工程の部品を工程の順に放す。予定表の `missing` は部品の不足数。

**pay-ship**（新しい規則: `pay-refunds/open-units`、`pay-refunds/refund-ship-lock`、`ship-orders/confirm-paid`、`ship-orders/refunded-cancel`）

- 出荷の確定は、支払いが `paid` か `partially_refunded` のときだけ（`blocked`・`refunded`・`unpaid` は 409、運送会社には何も送らない）。
- 行の「未出荷の数」= `qty - refundedQty`。在庫の確かめ、送る `items`、`reserved` に足す数、取り消しと引き渡しで減らす数は、すべてこれを使う。
- 出荷が `retrying` か `booked` の間は、返金も返金の再送も 409。`shipped`・`cancelled` の後は返金できる。
- 返金で注文が `refunded` になったとき、出荷が `new` か `on_hold` なら出荷は `cancelled` になる。

**shop-expense**（新しい規則: `cart-checkout/checkout-buyer`、`cart-checkout/ui-buyer`、`expense-wizard/order-line`、`expense-wizard/claim`、`expense-wizard/month-409-first`、`expense-wizard/ui-add-order`、`expense-wizard/ui-submit-claimed`）

- 精算は社員の名前を取り（報告の `employee` と同じ検査・同じ保存）、注文は `employee` と `claimedBy` を持つ。
- 報告の行は `order` で注文を請求できる。行は `supplies` で金額は注文の `total`（クーポンの割引と送料の後）。本人の注文で、まだ請求されておらず、1 回だけ書かれていること。請求した注文は supplies の上限（30,000）に入る。受け付けた報告の番号が注文の `claimedBy` になる。
- `/new` の 2 段目に注文の行を足す操作（`orderInput`・`addOrderButton`）と、3 段目の 409（同じ月の報告が先に判定される。注文の 409 は請求できなくなった注文を行の順に出す）。`/` の精算は `buyerInput` の名前を使う。

## 部品の文言から変えたところ

部品の規則と文言は、できるだけそのまま残した（設計の「系列 O」）。変えたのは次だけである。

- **重なりをまとめた**: 冒頭（JSON・ID・日付・金額・メモリに置く）、エラーの行（404 の対象は両方の和）、12 周目の画面の共通の文（test id・ボタン・金額の書き方。例は cart-checkout の `¥12,300`・`¥0` を残し、expense-wizard の `¥5,000` を落とした）。
- **名前がぶつかる所を分けた（pay-ship）**: ship-orders の `status` を `shipStatus`、`attempts` を `shipAttempts`、`items` を pay-refunds の `lines` にそろえた。一覧の絞り込みは `GET /orders?shipStatus=`。ship-orders の「A refused request changes nothing」と pay-refunds の「サービスに送るのは他の検査の後」を 1 文にし、運送会社の 409（取り消しの答え）と矛盾しないよう「400・404・自前の検査の 409」と書いた。
- **stock-tasks**: 末尾に「A refused request changes nothing.」を足した（stock-backorder は注文の与信の拒否だけに書いていた。task-deps には無かった）。
- **shop-expense**: 語数の線に収めるため、expense-wizard の 2 段目の文を「行を足す」と「2 段目を出る」の 2 つの箇条に分け（文言は同じ）、つなぐ文を詰めた。注文には日付を持たせず、注文の行の日付は 2 段目の `dateInput` から取る（日付の検査は `addLineButton` と同じ）。

## rules.json の形

E の `--precheck` が読む形（詳しくは [tools.md](tools.md)）。

- top-level の `stages` に段ごとの語数の線と部品の間の絡みの下限（L1: 1,500〜1,800 語・10 組、L2: 2,300〜2,700 語・20 組）。
- 合わせた依頼は `stage`（`"L1"`）と `parts`（部品の依頼の名前）を持ち、規則は `<部品>/<規則>`。部品の規則をすべて持ち、部品の `pairs` を頭付きですべて持つ。`ui` / `service` は 12 周目と同じく数えない一覧。
- 部品の依頼（6 本）は 10〜12 周目の `rules.json` の項目をそのまま写した（規則は頭なし）。
- 生成に使った手順: 部品の項目を読み、頭を付けて足し、つなぐ規則と絡みを足した。手で書いた部分は部品の間の絡みと新しい規則だけで、生成の時に「絡みの両端が規則にあること」「部品の間の絡みは頭が違うこと」を確かめた。

## lap 定義（cal80-o1.json）

[../lap-12/lap-12.json](../lap-12/lap-12.json) から予備選別の部分だけを残した。工場の `parseLap`（`src/lap.ts`、da3de63）で読めることを確かめた（30 段）。

- 残した段: `npm test` → `arms.ts --self-test` → `arms.ts --precheck` → 隔離の確かめ → `-cc-p` の下書き 3 本 → 由来と穴の確かめ → ゲート `screen-specs` → `-cx-p` の下書き 3 本（Codex のシナリオ）→ 仕様の一致（`cmp`）→ 由来と穴の確かめ → ゲート `screen` → `replicate --k 4 --score --max-cost 30`（並列 3）→ 判定し直し 2 回 → `tally` → `arms.ts --screen`。
- 落とした段: 先頭の Codex の下書き（`-xx-1`）、ゲート `main` と本番の 2×2 のすべて。
- 下書きの段は、11 周目の依頼の合わせ（pay-ship）に `--service`、12 周目（shop-expense）に `--ui` を付けた。stock-tasks は 10 周目と同じく付けない。
- ゲート `screen-specs` で `prereg/screen.json`（道具 B）と `prereg/rules.json` を固定する。最後の `arms.ts --screen` は factory-calib-tools の形（`<screen.json> <ROOT> --stage measure --builder claude-opus-5-5 <依頼名>...`、ROOT は工場の worktree の root = `.`）。依頼名と状態ディレクトリの対応は `screen.json` の `requests` にある（3 本とも `.factory-cal80-o1`）。
- `--max-cost 30` は設計の値（L1 の `-cc-p` は下書きと opus の 4 build で $10〜$20 の見込み）。
- 並列は 3（依頼が 3 本）。設計の「2 系列合わせて同時 4 build まで」を守るため、この段と同時に系列 S の build を流すときは 1 本までにする。

## 何が言えないか

- 部品の間の絡みは作成担当（Claude）が選んで書いた（設計の「合わせた依頼は作成担当が書く」と同じ限界）。
- `--precheck` が確かめるのは語数と数えだけである。部品の間の絡みが本文に本当に書いてあるかは、作成担当が読んで確かめただけで、道具は確かめない。
- 依頼文は、下書き役が読める英語として作成担当が読み直しただけで、モデルに読ませていない。仕様の書き漏れや曖昧さは、ゲート `screen-specs` で読む。
