# 系列 O の L3: 合わせた依頼 3 本と予備選別の定義（道具 F）

[design.md](design.md) の「道具と工場の変更」の F の L3 の分。L2（[l2-requests.md](l2-requests.md)）は opus の 4 build で 100.0 / 100.0 / 96.2 % と天井だった（[l2-report.md](l2-report.md)）。設計の「段の進め方」の 4 は L3 を「オーナーに諮るまで書かない」としていたが、オーナーは 2026-10-26 に L3 を流すと決めた（design.md の 5 に書いた）。L3 は L2 の 3 本に同じ周の残りの 1 本を足す形にした（L1 → L2 と同じ）。モデルは 1 度も呼んでいない。

## 置いたもの

| factory-notes | 工場での置き場（窓口が写す） | 中身 |
|---|---|---|
| [requests/stock-tasks-library-settle.md](requests/stock-tasks-library-settle.md) | `requests/stock-tasks-library-settle.md` | 10 周目: stock-tasks-library（L2）+ settle-history |
| [requests/pay-ship-invoice-notify.md](requests/pay-ship-invoice-notify.md) | `requests/pay-ship-invoice-notify.md` | 11 周目: pay-ship-invoice（L2）+ notify-queue |
| [requests/shop-expense-rooms-board.md](requests/shop-expense-rooms-board.md) | `requests/shop-expense-rooms-board.md` | 12 周目: shop-expense-rooms（L2）+ task-board |
| [rules.json](rules.json) | `docs/calibrate-80/rules.json`（置き換え） | L1・L2 の項目はそのまま。`stages` に L3 を、L3 の 3 本と足した部品 3 本（settle-history・notify-queue・task-board）の項目を足した |
| [screen.json](screen.json) | `docs/calibrate-80/screen.json`（置き換え） | `requests` に L3 の 3 本（状態ディレクトリ `.factory-cal80-o3`）を足した。窓・線は変えていない |
| [cal80-o3.json](cal80-o3.json) | `examples/cal80-o3.json` | 系列 O の L3 の lap 定義（状態ディレクトリ `.factory-cal80-o3`） |

- L1・L2 の状態ディレクトリ（`.factory-cal80-o1`・`-o2`）は、ゲート `screen-specs` で `prereg/screen.json` と `prereg/rules.json` を写して固定してある。`docs/calibrate-80/` の 2 つを置き換えても、L1・L2 の固定した写しは変わらない。
- 依頼文は L2 の依頼文の写しに足した。L2 の依頼文は変えていない。
- `arms.ts` は変えていない。`--precheck` は段の線を `rules.json` の `stages` から読むので、L3 は `stages` に足すだけで数えられる。

## 数え

`arms.ts --precheck rules.json` で確かめた（工場の `requests/`（da3de63 の worktree factory-cal80-run）と L1〜L3 の 9 本を一時ディレクトリに置き、工場と同じ並びで流した。モデルは呼ばない）。9 本とも `passes: yes`。`--self-test` も通る。

| 依頼 | 部品 | 語数（wc -w） | 規則 | 絡み | 部品の絡みの合計 | 部品の間の絡み |
|---|---|---|---|---|---|---|
| stock-tasks-library-settle | stock-backorder・task-deps・library-holds・settle-history（901 語） | 3,422 | 119 | 189 | 140 | 37 |
| pay-ship-invoice-notify | ship-orders・pay-refunds・fx-invoice・notify-queue（866 語） | 3,457 | 153 | 217 | 156 | 49 |
| shop-expense-rooms-board | cart-checkout・expense-wizard・room-slots・task-board（852 語） | 3,594 | 171 | 225 | 163 | 47 |

- 3 本とも L3 の線（3,100〜3,600 語、部品の間の絡み 30 組以上、絡みは部品の合計以上）の内側にある。線の決め方は下の「L3 の線」。
- 部品の間の絡みは、L2 の分（27・29・27）に、足した部品とつなぐ規則の組（10・20・20）を足したもの。
- **shop-expense-rooms-board は 3,594 語で、上の端に 6 語しかない。** L2 の shop-expense-rooms がすでに 2,693 語（L2 の上の端の 7 語下）で、task-board の 852 語を足すと重なりを除いても線に近い。つなぐ文を詰めた（下の「部品の文言から変えたところ」）。依頼文を直すときは語数を測り直すこと。
- stock-tasks-library-settle の絡みは 191 行で、L2 から引き継いだ重なり 2 組（[l2-requests.md](l2-requests.md)「数え」）を除いて 189。

## L3 の線

design.md の「大きさの段」の表に L3 の行を足した（語数 約 3,100〜3,600、部品の間の絡み 30 組以上）。

- **語数**: 下の端は L0 → L1 → L2 で 694 → 1,500 → 2,300 と約 800 ずつ、上の端は 901 → 1,800 → 2,700 と約 900 ずつ延びてきた。同じ幅で延ばして 3,100〜3,600 にした。真ん中の 3,350 は部品 4 本分（1 本 約 840 語）で、オーナーの決めた「約 3,300 語」を中に持つ。
- **部品の間の絡み**: L1 の 10 組、L2 の 20 組から、1 段 10 組ずつ延ばして 30 組にした。L2 の 3 本は 27〜29 組なので、足した部品とつなぐ規則の組が少なくとも 1〜3 組要る。
- 「絡みは部品の絡みの合計以上」と「部品の規則をすべて持つ」は L1・L2 と同じ。

## 組み合わせの選び方

L3 は各周の 4 本すべてなので、足す部品に選ぶ余地は無い（L2 で選ばなかった 1 本）。L2 で選ばなかった理由（データを共有しにくい）は、次のようにデータの共有を作って埋めた。

- **10 周目: + settle-history**。グループの仲間を工場の客にした（`customerId`）。客が出荷済みの注文を立て替えの費用にでき（金額は注文の `total`）、その注文の返品が費用の返金になる。日付は工場の `today` より後にできない。
- **11 周目: + notify-queue**。L2 で問題にした時計は、日付と分を 1 つの `GET /clock` に並べて解いた。日付は `POST /clock`、分は `POST /clock/minutes` で進める。日付を進めると、出荷の再送の後に配信の回を 1 回まわし、digest の利用者には必ずまとめを作る（「1 日が過ぎた」を 60 分の倍数を越えたのと同じに扱う）。注文は利用者（`userId`）を持てて、運送の予約・返金の成功・請求書による支払いのたびに、その利用者にイベントが記録される。メッセージのサービスは同じ `SERVICE_URL` の 6 つ目の口（`POST /messages`）で、工場の偽物は口を method とパスで分けるので 1 つの偽物で足りる（L1・L2 と同じ）。
- **12 周目: + task-board**。1 人用の板を事務所で共有する板にし、画面を 5 枚目の `/board` にした（部品の `/` は店の画面と重なる）。会計のたびに「受け取り」の作業（`Pick up order {id}`、期限は時計の日付）が板に足され、その作業が `done` でない間は注文を経費に請求できない。作業は時計の日付を過ぎると `overdue` になる。12 周目の「画面の判定の制約」（1 画面 500 要素、一覧の件数、時間で動く表示を入れない、ボタンを無効にしない）は部品の文のまま守っている。`overdue` は時計で変わるが、画面はクリックか読み込みでしか変わらない（部品の文のまま）。新しく足した文で要素を消す書き方はしていない（12 周目の候補 4）。

## 部品の間の絡み（つなぐ規則）

つなぐ規則は、L1・L2 と同じく動きを変える側の部品の頭を付けた。各組の理由は `rules.json` の `pairs` にある。

**stock-tasks-library-settle**（新しい規則: `settle-history/customer-member`、`settle-history/expense-today`、`settle-history/order-expense`、`settle-history/order-no-manual-refund`、`settle-history/return-refund`）

- グループの仲間は客である（`customerId`、知らない客は 404）。`POST /groups` の一覧で同じ客を 2 回挙げると 400、すでに仲間か、仲間だった客を足すと 409。
- 費用と返金の日付は `today` より後にできない（409）。時計を進めると後の日付が使える。
- 費用は `amount` の代わりに `orderId` を持てる（どちらか一方だけ。両方か無しは 400）。金額は注文の `total`。注文は `shipped` で、客が払った仲間の客であり、他のどの費用にも挙がっていないこと（409）。
- 注文の費用は、手で返金できない（409）。返品が返金になる: 返した数 × 行の `unitPrice`、日付は `today`。仲間が抜けた後でも記録する。返品は数の線（行の数から返した数を引いたもの）を超えないので、返金は費用の金額を超えない。

**pay-ship-invoice-notify**（新しい規則: `notify-queue/clock-shared`、`notify-queue/date-round`、`notify-queue/notice-events`、`ship-orders/order-user`、`ship-orders/notice-booked`、`pay-refunds/notice-refund`、`fx-invoice/notice-paid`）

- `GET /clock` は `{"today", "now"}`。分は `POST /clock/minutes` で進め、答えは部品の `POST /clock` の答え（`{"now", "sent"}`）のまま。
- 日付を後に進めると、再送の後に配信の回をまわす。digest の利用者は 60 分の倍数を越えたのと同じにまとめを作る。`now` は変わらないので、止まっている利用者は止まったまま。答えに `sent`（その移動で受け付けられたメッセージ）を足した。
- 注文は `userId` を持てる（省略は null、知らない利用者は 404、抜けた利用者は 409）。
- 運送の予約（`shipment`）、返金の成功（`refund`、再送の成功も）、請求書での支払い（`invoice`）のたびに、`POST /events` と同じイベントを記録する。メッセージは要求が答える前に送る。抜けた利用者には記録しない。メッセージのサービスの答えは、注文・返金・請求書と要求の答えを変えない。

**shop-expense-rooms-board**（新しい規則: `cart-checkout/checkout-pickup`、`task-board/order-field`、`task-board/pickup-task`、`task-board/overdue`、`expense-wizard/pickup-done`、`task-board/ui-overdue`、`expense-wizard/ui-add-order-pickup`、`expense-wizard/ui-submit-pickup`）

- 作業は `order`（受け取る注文の id、`POST /tasks` では null）と `overdue` を持つ。
- 会計のたびに `Pick up order {id}` の作業を足す（`todo`、期限は時計の `now` の日付）。足したことは追加として記録されるので、`POST /undo` で消せる（注文は残る）。
- 作業は、期限が時計の日付より前で `done` でない間 `overdue`。`/board` の `taskDue` に ` (overdue)` を付ける。
- 報告の注文の行は、その注文の受け取りの作業が残っていて `done` でない間 409。作業を消せば止めは外れ、消したことを取り消すと戻る。
- `/new` の 2 段目の `Order {id} has not been picked up`（「not yours」の後、「already claimed」の前）と、3 段目の 409 の一覧（受け取っていない注文も `Order {id} cannot be claimed` に入る）。

## 部品の文言から変えたところ

部品の規則と文言は、L1・L2 と同じくできるだけそのまま残した。L2 の部分は L2 の依頼文から、つなぐ文の入る所だけを変えた。

- **必須と省略可を書いた（L2 の型を避ける）**。L2 の shop-expense-rooms の全員が落ちたシナリオは、依頼文が必須としていた報告の行の `note` を、仕様の下書き役が Undecided に入れたものだった（[l2-report.md](l2-report.md)「全員が落ちたシナリオ」、factory#64）。依頼文は `?` を付けた欄だけを省略可として書いていたが、「`?` の無い欄は必須」とはどこにも書いていなかった。3 本とも冒頭に「`?` の付いた欄は省略でき（既定値を書いてある）、ほかの欄はすべて必須で、無ければ 400」の 1 文を足した。そのうえで、紛れやすい欄は欄ごとに書いた: 報告の行の `note`（必須、空でよい）、クーポンの `category`（必須、無しは null）、費用の `amount` と `orderId`（どちらか一方だけ）、注文の `userId`（省略は null）。新しく足した欄は、省略できるものに `?` を付け、既定値を書いた。これは L2 の部分の文言を変える唯一の所で、規則は変えていない（L2 でも依頼文の上では必須だった）。
- **重なりをまとめた**: 冒頭（JSON・ID・日付・メモリに置く）とエラーの行（404 の対象は和）。pay-ship-invoice-notify では notify-queue の「変えたものは何も送らない」を L2 のエラーの文にまとめ、外部サービスの冒頭を 4 つのサービスの文にした。shop-expense-rooms-board では task-board の画面の共通の文（test id・ボタン）を落とし、「タイマーが無い」は `/board` に残した。
- **stock-tasks-library-settle**: settle-history の仲間の `name` を `customerId` にし、「名前はグループの中で重ならない」を「同じ客を 2 回挙げない」にした。費用の本文に `orderId` を足し、`amount` を省略可にした（どちらか一方）。費用の形に `orderId` を足した。L2 の返品の文に「費用に挙がった注文の返品は、その費用も返金する」を足した。
- **pay-ship-invoice-notify**: notify-queue の時計の文を店の時計の文にまとめた（上）。利用者・イベント・メッセージ・送り方・まとめ・配信の回の文は文言のまま。
- **shop-expense-rooms-board**: task-board の「1 人用」を事務所で共有する板にした。作業の形に `order` と `overdue` を足し、`POST /tasks` の作業は `order` が null と書いた。語数の線に収めるため、つなぐ文を詰めた（受け取りの作業の文、`overdue` の文）。

## L1・L2 の未決を L3 で決めるか

L2 と同じく、**L3 では決めず、L2 の文のまま残した**（上の必須と省略可の 1 文を除く）。

- 設計の「部品の規則と文言は、できるだけそのまま残す」は、L3 の Q が下がったときに「大きくなったから」と「規則を書き換えたから」を分けるためである（[l2-requests.md](l2-requests.md)「L1 の未決を L2 で決めるか」と同じ理由）。
- 必須と省略可の 1 文は、規則を変えずに依頼文の決めていることを読み違えにくくするもので、L2 の `note` の型への手当てである。これで L2 → L3 の差に「1 本足したこと」以外の変化が少し混ざる。`note` の段のような「依頼文が必須とした欄」の段で L3 の落ちが減っても、それは 1 本足したことの効果ではない。
- 新しく足した文では、未決を作らないように書いた（`amount` と `orderId` の両方・無しは 400、注文の費用に手で返金は 409、返品の返金は仲間が抜けた後でも記録、日付の移動での `now` と止まった利用者、`order` が null の作業、作業を消したときの請求）。

## 長さを確かめる書き方への注意（L1 の screen の期待値の誤り）

- L3 の依頼文も、L2 と同じく外部サービスの本文の書き方（どの口の本文がどの項目を持つか）を変えていない。足した口 `POST /messages` は、notify-queue の文のまま本文 `{"to", "subject", "text"}` を書いてある。新しい配列の項目は、どの外部サービスの本文にも足していない。
- 足した API の配列（`members`・`weights`・`sent`）は、部品の文のまま、どの物が持つかを書いてある。日付を進めたときの `sent` は、`retried` と並べて答えに持つと書いた。
- 依頼文の側で防げるのはここまでで、シナリオの並び（`GET /requests` の何番目が何か）の読み違いは防げない。L3 の screen でも、全員が落ちたシナリオは期待値の誤りから読む（12 周目と同じ規則）。pay-ship-invoice-notify では、1 回の要求で運送の口と `POST /messages` が続けて呼ばれることがある（予約の通知）ので、`GET /requests` の何番目がどの口かは L2 より読み違えやすい。

## rules.json

- L1・L2 と同じ形（[tools.md](tools.md)）。L3 の 3 本は `stage` が `"L3"`、`parts` が 4 つ。`stages.L3` は `{"words": [3100, 3600], "minCross": 30}`。
- 足した部品の項目（settle-history・notify-queue・task-board）は、10〜12 周目の `rules.json` の項目をそのまま写した。
- 生成の手順: L2 の合わせた依頼の項目（規則・`pairs`・`ui`・`service`）をそのまま引き継ぎ、足した部品の項目に頭を付けて足し、つなぐ規則と絡みを足した。手で書いたのは新しい規則と、その絡みだけである。生成の時に「規則の重なりが無いこと」「絡みの両端が規則にあること」「手で書いた絡みが足した部品か新しい規則を含むこと」「新しい規則がどれも手で書いた絡みに出ること」「`ui`・`service` の規則が規則にあること」を確かめた。
- `ui` には task-board の画面の規則と `task-board/ui-overdue`・`expense-wizard/ui-add-order-pickup`・`ui-submit-pickup`、`service` には notify-queue のメッセージのサービスの規則を足した。

## lap 定義（cal80-o3.json）

`cal80-o2.json` の依頼の名前・状態ディレクトリ・隔離の確かめの名前（`cal80-o3-probe`）・`--placeholders` の出力の名前（`-o3`）を L3 のものにした写しである。段の並び、`--service`（pay-ship-invoice-notify）・`--ui`（shop-expense-rooms-board）、ゲート、`replicate --k 4 --score --max-cost 30`（並列 3）、判定し直し 2 回、`tally`、`arms.ts --screen` は L2 と同じ。工場の `parseLap`（`src/lap.ts`、da3de63）で読めることを確かめた（30 段）。

- **`--max-cost` は $30 のまま**にした。L2 の実績は 1 変更あたり約 $10（下書き・分類と opus の 4 build で $7.95〜$11.77、却下された下書きを含む）。L3 の語数は L2 の約 1.4 倍で、L1 → L2（語数 約 1.5 倍で費用 約 1.2 倍）と同じに延ばすと約 $14 になる。悪い場合でも、4 build がすべて作る役の 1 呼び出しの上限（$5）に当たって $20、下書き（L2 で 1 変更 約 $3.5、L3 で約 $5）を足して $25 で、$30 の内側にある。$40 に上げると、すべての build が上限に当たるような崩れを 1 変更の中で止められなくなる。
- 系列 O の L3 の止める線は $75（design.md「上限と止める線」に足した）。見込みは約 $40（L2 の実績 $30.57 の約 1.3 倍）、悪い場合 約 $60。2 系列の合計の線 $170 は変えない。L1・L2 と段 S3 の実績 $62.50 に L3 の見込みを足すと約 $102 で、系列 S の段 S0〜S2 の費用を足して $170 に届くかは、L3 を流す前に窓口が確かめる。
- 最後の `arms.ts --screen` は `--builder claude-opus-5-5 stock-tasks-library-settle pay-ship-invoice-notify shop-expense-rooms-board`。読む `screen.json` はゲート `screen-specs` で `.factory-cal80-o3/prereg/` に固定したもの。
- 並列は 3。設計の「2 系列合わせて同時 4 build まで」を守るため、この段と同時に系列 S の build を流すときは 1 本までにする（L1・L2 と同じ）。
- L2 の 1 回目の隔離の確かめは `modelOk=false` で落ち、名前を替えて流し直した（[l2-report.md](l2-report.md)）。L3 も落ちたら同じく名前を替える（例 `cal80-o3-probe-r2`）。替えたらここの写しも直して工場の側と一致させる。
- 段 S3（同じ依頼に sonnet を当てる）を L3 にも流すかは、この定義の外（実行担当が手で打つ）で、窓口が決める。

## 何が言えないか

- 部品の間の絡みは作成担当（Claude）が選んで書いた（L1・L2 と同じ限界）。
- `--precheck` が確かめるのは語数と数えだけである。部品の間の絡みが本文に本当に書いてあるかは、作成担当が読んで確かめただけである。
- 依頼文は、下書き役が読める英語として作成担当が読み直しただけで、モデルに読ませていない。仕様の書き漏れや曖昧さは、ゲート `screen-specs` で読む。必須と省略可の 1 文で、仕様の下書き役が依頼文の決めた点を Undecided に入れる型（factory#64）が減るかは、L3 の仕様を読むまで分からない。
- L2 → L3 で足したのは「1 本の部品」と「その部品とのつなぐ規則」と「必須と省略可の 1 文」で、L2 の部分もつなぐ文の所だけ変わっている（例: 返品が費用の返金になる、注文が `userId` を持つ、注文の行は受け取ってから請求する）。L3 で Q が下がっても、L2 の部分の規則が変わったせいかどうかは、つなぐ規則に掛かるシナリオを読んで分ける。
- L2 と同じく、シナリオの本数が依頼の大きさで増えない形は残る（[l2-report.md](l2-report.md)「何が言えないか」）。L3 で天井でも「opus は大きさでは下がらない」とは言えない。
