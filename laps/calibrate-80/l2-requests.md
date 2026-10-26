# 系列 O の L2: 合わせた依頼 3 本と予備選別の定義（道具 F）

[design.md](design.md) の「道具と工場の変更」の F の L2 の分。L1（[l1-requests.md](l1-requests.md)）は opus の 4 build で stock-tasks 100 %・pay-ship 95.8 %・shop-expense 96.9 % で、すべて 90 % 以上だった。設計の「段の進め方」の表のとおり L2 へ進む。L2 は L1 の 3 本に同じ周の 1 本を足す形にした（設計の「大きさの段」）。モデルは 1 度も呼んでいない。

## 置いたもの

| factory-notes | 工場での置き場（窓口が写す） | 中身 |
|---|---|---|
| [requests/stock-tasks-library.md](requests/stock-tasks-library.md) | `requests/stock-tasks-library.md` | 10 周目: stock-tasks（L1）+ library-holds |
| [requests/pay-ship-invoice.md](requests/pay-ship-invoice.md) | `requests/pay-ship-invoice.md` | 11 周目: pay-ship（L1）+ fx-invoice |
| [requests/shop-expense-rooms.md](requests/shop-expense-rooms.md) | `requests/shop-expense-rooms.md` | 12 周目: shop-expense（L1）+ room-slots |
| [rules.json](rules.json) | `docs/calibrate-80/rules.json`（置き換え） | L1 の項目はそのまま。L2 の 3 本と、足した部品 3 本（library-holds・fx-invoice・room-slots）の項目を足した |
| [screen.json](screen.json) | `docs/calibrate-80/screen.json`（置き換え） | `requests` に L2 の 3 本（状態ディレクトリ `.factory-cal80-o2`）を足した。窓・線は変えていない |
| [cal80-o2.json](cal80-o2.json) | `examples/cal80-o2.json` | 系列 O の L2 の lap 定義（状態ディレクトリ `.factory-cal80-o2`） |

- L1 の状態ディレクトリ `.factory-cal80-o1` は、ゲート `screen-specs` で `prereg/screen.json` と `prereg/rules.json` を写して固定してあり、L1 の lap はすべての段を終えている。`docs/calibrate-80/` の 2 つを置き換えても、L1 の固定した写しは変わらない。
- 依頼文は L1 の依頼文の写しに足した。L1 の依頼文（`requests/stock-tasks.md` など）は変えていない。

## 数え

`arms.ts --precheck rules.json` で確かめた（工場の `requests/`（da3de63 の worktree factory-cal80-run）と L1・L2 の 6 本を一時ディレクトリに置き、工場と同じ並びで流した。モデルは呼ばない）。6 本とも `passes: yes`。`--self-test` も通る。

| 依頼 | 部品 | 語数（wc -w） | 規則 | 絡み | 部品の絡みの合計 | 部品の間の絡み |
|---|---|---|---|---|---|---|
| stock-tasks-library | stock-backorder・task-deps・library-holds（807 語） | 2,385 | 87 | 135 | 105 | 27 |
| pay-ship-invoice | ship-orders・pay-refunds・fx-invoice（901 語） | 2,494 | 113 | 153 | 119 | 29 |
| shop-expense-rooms | cart-checkout・expense-wizard・room-slots（798 語） | 2,690 | 124 | 153 | 119 | 26 |

- 3 本とも L2 の線（2,300〜2,700 語、部品の間の絡み 20 組以上、絡みは部品の合計以上）の内側にある。
- 部品の間の絡みは、L1 の分（14・15・13）に、足した部品との組（13・14・13）を足したもの。
- **shop-expense-rooms は 2,690 語で、上の端に 10 語しかない。** L1 の shop-expense がすでに 1,798 語で、room-slots の 798 語を足すと重なりを除いても線に近い。つなぐ文を詰めた（下の「部品の文言から変えたところ」）。依頼文を直すときは語数を測り直すこと。
- 絡みの数（`--precheck` の `pairs`）は順を数えない重なりを除いた数。stock-tasks-library は 137 行のうち、L1 から引き継いだ `start|finish` と `finish|start`、library-holds から写した `loan-ready-hold|loan-refuse` と `loan-refuse|loan-ready-hold`（どちらも理由の違う同じ組）の重なり 2 組を除いて 135。

## 組み合わせの選び方

設計のとおり、L1 の 2 本に同じ周の残りの 2 本から 1 本を足した。データを共有しやすい方を選んだ。

- **10 周目: + library-holds**（settle-history を選ばなかった）。作業場が客に本を貸す形にし、図書館の利用者を客そのものにした。客の未払いの延滞料が与信と注文に効く。settle-history（仲間の立て替え）は、在庫・注文・工程のどれとも共有する人やお金が無い。
- **11 周目: + fx-invoice**（notify-queue を選ばなかった）。注文を外貨の請求書で払えるようにした。両方の部品が同じ日付の時計（`today`、`2026-11-02` から、前に戻すと 409）を持つので、時計を 1 つにまとめられる。notify-queue は分単位の時計（`now`、Retry-After の秒）を持ち、日付の時計と 1 つにできない。為替のサービスは同じ `SERVICE_URL` の 5 つ目の口（`GET /rates/{currency}/JPY`）で、工場の偽物は口を method とパスで分けるので 1 つの偽物で足りる（L1 と同じ）。
- **12 周目: + room-slots**（task-board を選ばなかった）。社員が会議室の枠を予約し、昼食つきの枠の昼食代を経費の報告で請求する。予約の `user` と報告の `employee` は、どちらも前後の空白を除いて大文字小文字を区別せずに比べるので、同じ人として扱える。task-board は 1 人用で、社員を持たない。room-slots の画面は 4 枚目の `/rooms` にした（部品の `/` は店の画面と重なる）。12 周目の「画面の判定の制約」（時間で動く表示を入れない、ボタンを無効にしない）は部品の文のまま守っている。新しく足した文で要素を消す書き方はしていない（12 周目の候補 4）。

## 部品の間の絡み（つなぐ規則）

つなぐ規則は、L1 と同じく動きを変える側の部品の頭を付けた。各組の理由は `rules.json` の `pairs` にある。

**stock-tasks-library**（新しい規則: `library-holds/customer-member`、`stock-backorder/fines-open-value`、`stock-backorder/blocked-orders`、`stock-backorder/ship-overdue`）

- 図書館の利用者は客である。`POST /members` は無く、客が `fines`・`loans`・`holds` を持つ。延滞料の支払いは `POST /customers/{id}/payments`。
- 客の `openValue` に未払いの `fines` が入る。延滞料が付くと新しい注文と行の増加の与信が狭まり、払うと広がる。
- 延滞料で止められた客（`fines` 500 以上）は、注文も行の増加も 409。
- 客に期限を過ぎた貸し出しがある間は、注文の出荷が 409。時計を進めると期限を過ぎ、返すか延長すると外れる。

**pay-ship-invoice**（新しい規則: `fx-invoice/order-invoice`、`fx-invoice/void-frees-order`、`pay-refunds/invoice-id`、`pay-refunds/invoice-blocks-card`、`pay-refunds/invoice-paid`、`pay-refunds/invoice-no-refund`）

- 請求書は `orderId` で注文を請求できる。注文は `unpaid` で、`void` でない請求書を他に持たないこと。注文の `invoiceId` は `void` でない請求書。請求書の通貨と行は注文と照らさない（照らすかを未決に残さないよう文に書いた）。
- `invoiceId` のある注文は、カードで払えず（409、何も送らない）、消せない（409）。下書きの請求書でも同じ。請求書を取り消す（void）と外れる。
- 請求書が全額払われると注文は `paid`（`chargeId` は null）になり、カードで払った注文と同じく出荷を確定できる。一部だけ払われた間は `unpaid` のまま。請求書で払った注文は返金できない（409）。
- 時計は 1 つで、時計を進めると出荷の再送が走り、為替の取り置き（その日だけ使う）が切れる。

**shop-expense-rooms**（新しい規則: `room-slots/lunch`、`room-slots/booking-get`、`expense-wizard/booking-line`、`expense-wizard/booking-claim`、`expense-wizard/ui-add-booking`、`expense-wizard/ui-submit-booking`）

- 枠は昼食代 `lunch`（1 人分、0〜3,000、既定 0）を持つ。`GET /bookings/{id}` は始まった予約も含めて読め、`lunch`・`started`・`claimedBy` を持つ。
- 報告の行は `booking` で予約の昼食代を請求できる。行は `meals` で、金額は枠の `lunch`、日付は枠の日付。本人の予約で、枠が始まっていて、まだ請求されておらず、1 回だけ書かれていること。`order` と `booking` の両方を持つ行は 400。昼食代は 1 日の meals の上限（5,000）に入る。受け付けた報告の番号が予約の `claimedBy` になる。
- `/new` の 2 段目に予約の行を足す操作（`bookingInput`・`addBookingButton`）と、3 段目の 409（注文の行の後に、請求できなくなった予約を行の順に出す）。

## 部品の文言から変えたところ

部品の規則と文言は、L1 と同じくできるだけそのまま残した。L1 の部分は L1 の依頼文から、つなぐ文の入る所だけを変えた。

- **重なりをまとめた**: 冒頭（JSON・ID・日付・メモリに置く）とエラーの行（404 の対象は和）。pay-ship-invoice では fx-invoice の時計の文を落とし（L1 の店の時計と同じ規則）、外部サービスの冒頭を 3 つのサービスの文にした。fx-invoice の「エラーの本文は 502・503 も `{"error"}`」は、L1 の「名前を挙げた追加の項目」と 1 文にした。shop-expense-rooms では room-slots の画面の共通の文（test id・ボタン）を落とし、「タイマーが無い」は `/rooms` に残した。
- **stock-tasks-library**: library-holds の利用者の登録（`POST /members`）と読み出し（`GET /members/{id}`）を客の登録と読み出しにまとめた。客の `name` に library-holds の線（1〜100 文字）を付けた（stock-backorder は線を書いていなかった）。利用者の規則の文の「member」はそのまま残し、「客が利用者である」と定義した。
- **pay-ship-invoice**: fx-invoice の「Getting a rate」「Converting」と請求書の文は文言のまま。外貨の金額が cents であることは、冒頭から Converting の文に移した。
- **shop-expense-rooms**: 語数の線に収めるため、つなぐ文を詰めた。枠と予約の ID が「サーバの付ける文字列」であることと時刻の形を、Rooms API の冒頭に置いた（店の注文の ID は `"1"`・`"2"` のまま）。

## L1 の未決を L2 で決めるか

L1 の pay-ship の仕様（`pay-ship-cc-p-r2`）には、依頼文が決めていない点が残った（返金の行の重複が 400 か 409 か、空の `lines`、`qty` 0、`failed`・`cancelled`・`shipped` の注文の返金、返金の再送が成功したときの 201 など）。**L2 では決めず、L1 の文のまま残した。**

- 設計の「部品の規則と文言は、できるだけそのまま残す」は、L2 の Q が下がったときに「大きくなったから」と「規則を書き換えたから」を分けるためである。L1 の部分の文を変えると、L1 → L2 の差に「1 本足したこと」以外の変化が混ざる（設計の「L1 と L2 の差を 1 本足したことに寄せる」）。
- L1 の Q は 95.8 % で、未決の点は Q を下げる向きに大きく効いていない。未決は工場の仕組み（仕様の「Undecided」と、ゲート `screen-specs` での読み）で扱える。
- 新しく足した文では、未決を作らないように書いた（請求書と注文を照らさない、`order` と `booking` の両方は 400、3 段目の 409 は注文の後に予約）。

## 長さを確かめる書き方への注意（L1 の screen の期待値の誤り）

L1 の pay-ship-cx-p では、Codex のシナリオが `GET /requests` の 0 番目（`POST /charges`）の `body.items` に長さ 0 を求めていた（charge の本文には `items` が無い）。

- L2 の依頼文は、L1 の外部サービスの本文の書き方（どの口の本文がどの項目を持つか）を変えていない。新しく足した口 `GET /rates/{currency}/JPY` は、fx-invoice の文のまま「no query or body」と書いてある。新しい配列の項目は、どの外部サービスの本文にも足していない。
- 足した API の配列（`loans`・`holds`・`queue`・`expired`・`payments`・`invoices`）は、部品の文のまま、どの物が持つかを書いてある。
- 依頼文の側で防げるのはここまでで、シナリオの並び（`GET /requests` の何番目が何か）の読み違いは防げない。L2 の screen でも、全員が落ちたシナリオは期待値の誤りから読む（12 周目と同じ規則）。

## rules.json

- L1 と同じ形（[tools.md](tools.md)）。L2 の 3 本は `stage` が `"L2"`、`parts` が 3 つ。
- 足した部品の項目（library-holds・fx-invoice・room-slots）は、10〜12 周目の `rules.json` の項目をそのまま写した。
- 生成の手順: L1 の合わせた依頼の項目（規則・`pairs`・`ui`・`service`）をそのまま引き継ぎ、足した部品の項目に頭を付けて足し、つなぐ規則と絡みを足した。手で書いたのは新しい規則と、その絡みだけである。生成の時に「規則の重なりが無いこと」「絡みの両端が規則にあること」「手で書いた絡みが足した部品か新しい規則を含むこと」を確かめた。
- `ui` には room-slots の画面の規則と `expense-wizard/ui-add-booking`・`ui-submit-booking`、`service` には fx-invoice の為替の規則を足した。

## lap 定義（cal80-o2.json）

`cal80-o1.json` の依頼の名前・状態ディレクトリ・隔離の確かめの名前を L2 のものにした写しである。段の並び、`--service`（pay-ship-invoice）・`--ui`（shop-expense-rooms）、ゲート、`replicate --k 4 --score --max-cost 30`（並列 3）、判定し直し 2 回、`tally`、`arms.ts --screen` は L1 と同じ。工場の `parseLap`（`src/lap.ts`、da3de63）で読めることを確かめた（30 段）。

- **`--placeholders` の出力の名前だけ変えた**（`docs/calibrate-80/placeholders-screen-specs-o2.md`・`placeholders-screen-o2.md`）。L1 の 2 つのファイルは L1 のゲートで読んだもので、L1 のゲートの版はその中身の sha256 を持つ。同じ名前に L2 の出力を書くと、L1 の記録が L2 の中身で上書きされる。
- `--max-cost 30` は設計の値のまま。L1 の `-cc-p` は下書き（約 $3〜$4）と build（opus と sonnet の両方で $3〜$5）で $30 に遠く、L2 の見込み（1 依頼 約 $13、悪い場合 約 $23）も内側にある。足りなくなったら設計のとおり $40 にする。
- 最後の `arms.ts --screen` は `--builder claude-opus-5-5 stock-tasks-library pay-ship-invoice shop-expense-rooms`。読む `screen.json` はゲート `screen-specs` で `.factory-cal80-o2/prereg/` に固定したもの。
- 並列は 3。設計の「2 系列合わせて同時 4 build まで」を守るため、この段と同時に系列 S の build を流すときは 1 本までにする（L1 と同じ）。

## 何が言えないか

- 部品の間の絡みは作成担当（Claude）が選んで書いた（L1 と同じ限界）。
- `--precheck` が確かめるのは語数と数えだけである。部品の間の絡みが本文に本当に書いてあるかは、作成担当が読んで確かめただけである。
- 依頼文は、下書き役が読める英語として作成担当が読み直しただけで、モデルに読ませていない。仕様の書き漏れや曖昧さは、ゲート `screen-specs` で読む。
- L1 → L2 で足したのは「1 本の部品」と「その部品とのつなぐ規則」で、L1 の部分もつなぐ文の所だけ変わっている（例: 客の `openValue` に延滞料が入る、`invoiceId` のある注文はカードで払えない）。L2 で Q が下がっても、L1 の部分の規則が変わったせいかどうかは、つなぐ規則に掛かるシナリオを読んで分ける。
