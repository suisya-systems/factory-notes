# 11 周目: 予備選別の要約（ゲート main）

予備選別（4 依頼、k = 4）の結果と、全員が落ちたシナリオ 2 本の読み。読みの順は手順書のとおり（工場を先に疑い、次に期待値の誤りの規則、最後に作る役の落ち）。

## 集計（`arms.ts --screen`、`screen-errors.json` なし）

| 依頼 | Q 自組（%） | Q 借りた組（%） | Q（%） | 帯 |
|---|---|---|---|---|
| fx-invoice | 100.0 | 93.7 | 96.9 | 天井 |
| ship-orders | 100.0 | 93.7 | 96.9 | 天井 |
| pay-refunds | 100.0 | 100.0 | 100.0 | 天井 |
| notify-queue | 93.3 | 91.7 | 92.5 | 天井 |

- 帯は 30 % ≤ Q < 90 %。4 依頼とも Q ≥ 90 % で天井。
- 規則の出力: 「requests that go on: (none)」。本番に回す依頼は無い。
- 期待値の誤りは 0 本（下）。`screen-errors.json` は空（`{}`）で、除く前と後の Q は同じ。
- pay-refunds の自組は `pay-refunds-cc-p-r2`（`pay-refunds-cc-p` はシナリオ `pay-service-failures` の要約が 214 字で 200 字を超えたため、工場が書き直した）。
- 置き換えの確かめ（`placeholders-screen-specs.md`・`placeholders-screen.md`）は 8 組とも問題 0。

## 全員が落ちたシナリオの読み

| 組 / シナリオ | 落ちた段 | 工場 | 期待値の誤りか | 分類 |
|---|---|---|---|---|
| notify-queue-cc-p / user-input-validation | 12（期待 400、実際 200） | 異常なし | いいえ | 作る役の落ち（依頼文が決めた点を、仕様が Undecided に回した） |
| notify-queue-cx-p / validation-is-atomic | 7（期待 400、実際 200） | 異常なし | いいえ | 同上（同じ点） |

2 本は、組も下書き役の系統も違うが、落ちた点は同じである。`PUT /users/{id}` に `mode` だけを送り（`muted` を欠く）、400 を期待した。4 build とも 200 を返した。

### 工場を先に疑う

- 2 本とも、落ちた段は偽物の段ではない（アプリへの `PUT`）。落ちた段より前の段は通っており、`{{uid}}`・`{{user}}` を path に置く段も通っている。落ちた段のリクエストも、シナリオに書かれたとおりの path と body で送られている。
- 工場の変更 D（factory#45）は、偽物の段（`"service": true`）で落ちたときにだけ、アプリが偽物に送った要求を結果の detail に残す。この 2 本は偽物の段より前で止まったので、detail は「expected status 400, got 200」だけで、要求の記録は無い。validation-is-atomic の最後の段（要求の確認段、偽物へは 0 件を期待）は、段 7 で止まったので走っていない。
- 代わりに build の作業場の実装を読んだ（読み取りだけ）。4 build とも `PUT` で `mode` と `muted` を別々に任意として扱い、欠けた方は今の値のまま残す（3 build は `mode` も `muted` も無いときだけ 400、1 build はそれも 400 にしない）。200 はこの実装どおりの答えで、工場の採点の誤りではない。
- 選別全体で、偽物の段で落ちたシナリオは 1 本も無い（下の「偽物の段の数」）。

### 期待値の誤りか

いいえ。期待値 400 は依頼文（`requests/notify-queue.md`）と合う。

- 依頼文は `POST /users` の body を `{"email": string, "mode": "instant" | "digest", "muted"?: [topic, ...]}` と書き、`muted` に `?`（省略可、既定は空）を付ける。`PUT /users/{id}` の body は `{"mode", "muted"}` で、`?` が無い。
- 依頼文の誤りの行: 「a body that is not valid JSON, a missing or wrong-typed field, or a value outside the rules above is 400」。`PUT` で `muted` を欠く要求は「missing field」に当たり、400 になる。
- 金額・日付・個数の計算の問題ではない。偽物の応答の設定段の問題でもない（落ちた段は設定段ではない）。

### 作る役の落ち（仕様の Undecided）

- 仕様（`notify-queue-cc-p` の `spec.md`、借りた組も `--spec-from` で同じ仕様）は、`PUT /users/{id}` の body を `{"mode", "muted"}` と書き、誤りの節にも「a field is missing or has the wrong type」を 400 として挙げる。そのうえで「Undecided」に「Whether PUT /users/{id} requires both `mode` and `muted`, or accepts a partial body.」を残した。
- 作る役は仕様しか見ない。4 build とも、この Undecided を部分更新を許す側で選んだ。依頼文は決めているのに、仕様の下書き役（Claude）が Undecided に回した点で、作る役が割れずに同じ選択をした形である。
- runbook の規則（工場でも期待値の誤りでもなければ作る役の落ち）に従い、作る役の落ちとして数える。ただし落ちの元は、作る役が規則の絡みで間違えたことではなく、仕様の Undecided の 1 行である。10 周目の「決まっていない点」の 2 本は依頼文も決めていなかったが、この周の 2 本は依頼文が決めている点が違う。
- 2 つの系統のシナリオの下書き役は、どちらも依頼文どおり 400 を書いた。系統の差はこの点には出ていない。

## 全員ではないが落ちたシナリオ（参考）

読む対象ではない（runbook は全員が落ちたシナリオだけを読む）が、借りた組の Q を下げたものとして挙げる。どちらも偽物の段ではない。

| 組 / シナリオ | 落ちた build | 落ちた段 |
|---|---|---|
| fx-invoice-cx-p / reversed-report-interval | 4 中 3 | 1（期待 400 か 422、実際 200） |
| ship-orders-cx-p / validation-and-atomicity | 4 中 3 | 13（期待 200、実際 400） |

## 偽物の段の数（runbook の「計る量」、記述だけ）

| 組 | シナリオ | 段 | 応答の設定段 | 要求の確認段 | 偽物の段を持つシナリオ | 確認段を持つシナリオ | 確認段で落ちた割合 |
|---|---|---|---|---|---|---|---|
| fx-invoice-cc-p | 15 | 200 | 31 | 11 | 13 | 8 | 0 / 60 |
| fx-invoice-cx-p | 12 | 157 | 24 | 12 | 12 | 11 | 0 / 48 |
| ship-orders-cc-p | 15 | 149 | 16 | 13 | 10 | 9 | 0 / 60 |
| ship-orders-cx-p | 12 | 183 | 18 | 14 | 11 | 11 | 0 / 48 |
| pay-refunds-cc-p-r2 | 15 | 147 | 26 | 17 | 14 | 14 | 0 / 60 |
| pay-refunds-cx-p | 12 | 138 | 26 | 13 | 12 | 12 | 0 / 48 |
| notify-queue-cc-p | 15 | 188 | 25 | 14 | 14 | 12 | 0 / 60 |
| notify-queue-cx-p | 12 | 153 | 22 | 12 | 12 | 12 | 0 / 48 |

- 「確認段で落ちた割合」は、要求の確認段で落ちた（シナリオ × build）の数 / （シナリオ × 4 build）。8 組とも 0。選別で落ちた 14 件（シナリオ × build）は、どれもアプリへの段で落ちた。
- 数えたのは `scenarios.json` の段で、`"service": true` の `POST /responses` を設定段、`GET /requests` を確認段とした。

## まとめ

- 工場の不具合: 2 本とも無し。偽物の段で落ちたシナリオは選別全体で 0。
- 期待値の誤り: 0 本。
- 作る役の落ち: 2 本（同じ 1 点。依頼文は決めているが、仕様が Undecided に回した `PUT` の部分更新）。
- 4 依頼とも天井。帯に依頼が無いので、本番は流さない。
