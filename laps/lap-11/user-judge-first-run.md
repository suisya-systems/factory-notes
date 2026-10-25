# ユーザー役の判定の最初の実走（11 周目の 16 build）

factory#49 で入ったユーザー役の判定（user-judge、別の腕）を、11 周目の予備選別の 16 build（4 依頼 × 4 build、各 build 2 セッション、計 32 セッション）に流した。その結果を読む。モデルは呼んでいない。lap も始めていない。状態は読むだけで、書き換えていない。材料は `.factory-lap11/runs/<id>/user/`（compare.md と各セッションの記録）、`.factory-lap11/vault/<id>/`（シナリオ・仕様・分類）、`.factory-lap11/work/notify-queue-cc-p-rep/`（build の中身）、工場のコード（main 相当）である。

## 結論

- **notify-queue の食い違いは 1 点から来ている。** 4 build とも、シナリオ `user-input-validation` の step 12 で落ちた。`PUT /users/{id}` に `{"mode": "digest"}`（`muted` なし）を送り、400 を期待するが、4 build とも 200 を返した。Codex のシナリオ `validation-is-atomic` の step 7（`{"mode": "instant"}` だけの PUT）も同じ点で、同じく 4 build とも 200 だった。
- **この期待は依頼文に書いてある。シナリオが勝手に足した要求ではない。** 依頼文は PUT の body を `{"mode", "muted"}` とし、POST の `"muted"?` と違って `?` を付けていない。そのうえで「a missing ... field ... is 400」と決めている。字面どおりに読めば、`muted` の無い PUT は 400 である。
- **build の欠陥と言うより、仕様の段で生まれた食い違いである。** 仕様の下書き役は、この点を「Undecided」に入れた（「Whether PUT /users/{id} requires both `mode` and `muted`, or accepts a partial body.」）。作る役は仕様しか見ない。そして「Undecided の点は任せる」と指示されている。だから 4 build とも部分更新を選んだのは、指示どおりの振る舞いである。一方、シナリオ役は仕様ではなく依頼文を見るので、依頼文どおりに 400 を書いた。11 周目の報告ではこれを「作る役の落ち」と分類した。ただし落とした原因は、仕様が依頼文の決めたことを未決に格下げした点にある。
- **ユーザー役の 8 セッションは、この点を一度も試していない。** 8 セッションとも PUT は 2 回だけで、2 回とも `mode` と `muted` の両方を送っていた（1 回目 200、2 回目は退会後で 409）。部分的な body も、不正な値の PUT も、送ったセッションは 1 つも無い。「試して問題なしと見た」のではなく、「試していない」のである。
- **32 セッションすべて満足だったのは、甘さより浅さの表れと読む。** ほぼ全セッションが行動の枠（5 ターン × 8 行動 = 40）を使い切っている。8 セッションの PUT の手順も、セッション間で同じだった。シナリオと食い違う余地があったのは notify-queue の 1 点だけで、そこに届いたセッションは無い。甘いかどうか（試していれば 200 を許したか）は、このデータでは測れていない。

## notify-queue の食い違いの中身

### シナリオが送るものと期待するもの

`.factory-lap11/vault/notify-queue-cc-p/scenarios.json:2082` からの `user-input-validation` は 15 step ある。

| step | 送るもの | 期待 |
|---|---|---|
| 1〜8 | 不正な `POST /users`（`@` なし、`@` 2 つ、`a@`、`mode: weekly`、`muted` の重複、`muted` が文字列、`email` が数値、`mode` なし） | 400 + `error` |
| 9 | `GET /users/nope` | 404 |
| 10 | 正しい `POST /users`（instant） | 201 |
| 11 | `PUT` に `{"mode": "hourly", "muted": ["z"]}` | 400 |
| **12** | **`PUT` に `{"mode": "digest"}`（`muted` なし）**（同ファイル 2245〜2251 行） | **400 + `error`** |
| 13 | `GET /users/{id}` | 200、`mode: instant`、`muted: []`（何も変わっていない） |
| 14〜15 | 存在しない user への `PUT` / `DELETE` | 404 |

4 build の結果（`.factory-lap11/runs/notify-queue-cc-p/replicates/claude-opus-5-5-{1..4}.json`）は、どれも「step 12: expected status 400, got 200」だった。step 1〜11 は 4 build とも通った。Codex 側の `validation-is-atomic`（`.factory-lap11/vault/notify-queue-cx-p/scenarios.json:1923`、PUT は 2031 行）も、4 build とも「step 7: expected status 400, got 200」だった。

### 各 build の実際の応答

4 build とも `server.js` を 1 つ持つ。PUT は `mode` と `muted` をそれぞれ「あれば検査して適用する」書き方で、片方だけの body を受け付ける（例: `.factory-lap11/work/notify-queue-cc-p-rep/claude-opus-5-5-1/server.js:166-171`、build 2 は 166〜173 行、build 3 は 179〜185 行、build 4 は 165〜171 行）。build 1〜3 は、両方とも無いときに限って 400 を返す。どの build でも step 12 は 200 になり、`mode` は digest に変わる（step 13 まで進めば、こちらも落ちる）。

### 依頼文・仕様・分類の突き合わせ

- **依頼文**（工場の `requests/notify-queue.md`）
  - 7 行: `POST /users` の body は `{"email": string, "mode": ..., "muted"?: [topic, ...]}`。`muted` は省略でき、既定は空。
  - 8 行: `PUT /users/{id}` の body は `{"mode", "muted"}`。こちらには `?` が無い。
  - 25 行: 「a missing or wrong-typed field ... is 400」。
- **仕様**（`.factory-lap11/vault/notify-queue-cc-p/spec.md`。cx-p の仕様は同じ内容）
  - 49 行: 「Body: `{"mode", "muted"}`」と依頼文を写している。
  - 151 行: 「a field is missing or has the wrong type」は 400。
  - 160 行: ところが「Undecided」に「Whether PUT /users/{id} requires both `mode` and `muted`, or accepts a partial body.」がある。
- **役ごとに見えるもの**（工場のコード）
  - 作る役は仕様だけを見て、「Points the spec lists under "Undecided" are left to you: choose sensible behaviour.」と指示される（`src/roles.ts:244-247`）。
  - シナリオ役は依頼文とインターフェースを見る。仕様は見ない（`src/roles.ts:217-218`）。
- **分類**（`.factory-lap11/vault/notify-queue-cc-p/classification.json:3627`）: step 12 の 2 つの確認は `U`（根拠 convention）で、予測は status `[200, 400]`。根拠には仕様 160 行の Undecided が引かれている。承認の要約（`approval-summary.md:101`）も、この点を「(b) The scenario requires what the spec does not determine」に挙げていた。食い違いは承認の前から見えており、承認者はそのまま通した。

### 判定

| 候補 | 判定 | 根拠 |
|---|---|---|
| シナリオが依頼文に無い要求をした | **違う** | 依頼文 8 行（PUT に `?` なし）と 25 行（欠けた field は 400）から、字面どおりに導ける。系統の違う 2 つのシナリオ役が、独立に同じ 400 を書いた |
| build の本物の欠陥 | **依頼文に照らせば欠陥、渡された仕様に照らせば欠陥ではない** | 作る役は仕様 160 行で選択を任され、4 build とも同じ「部分更新」を選んだ。依頼の利用者から見ると、`muted` を付け忘れた PUT が黙って通るのは、依頼文の決まりから外れる |
| ユーザー役が試しきれていない | **そのとおり** | 8 セッションとも PUT は完全な body の 2 回だけ（下）。部分的な body を送ったセッションは無い |

根は仕様の下書き役にある。依頼文が決めている点（PUT は両方の field が要る）を、「Undecided」に格下げした。そのせいで作る役の自由になり、依頼文を読むシナリオ役とずれた。

## ユーザー役はなぜそこを試さなかったか

- **試した中身。** 8 セッションの記録（`.factory-lap11/runs/notify-queue-cc-p/user/*.json`）を見ると、PUT は 8 セッションとも次の 2 回だけだった。
  - ターン 4: `{"mode": "instant", "muted": []}` → 200（digest から instant への切り替えで、即時に digest が作られることの確認）
  - ターン 5: `{"mode": "digest", "muted": []}` → 409（退会後）
- **入力の検査は試している。ただし POST と events と clock の側である。** 4xx が返った行動は、1 セッションあたり 8〜10 個あった。中身は不正な email、`muted` の重複、`advance` の範囲外、壊れた JSON、空の topic などで、どれも依頼文が値の規則として書いている点である。PUT の body から field を欠かした行動は、どのセッションにも無い。
- **枠が尽きている。** ユーザー役の枠は 6 ターン × 8 行動（`src/user.ts:23`）。8 セッションとも 5 ターンで 38〜40 行動を使い切り、6 ターン目で判定を返した。1 セッション（build 4 の s1）は「202 without id の結果を確かめるターンが残っていなかった」と自分で書いている。依頼の主筋（digest、429 の一時停止、退会）を確かめるだけで枠が埋まり、PUT の body の形は後回しになった。
- **仮に試していても、通した可能性がある。** ユーザー役への指示は「where the request leaves something open, any sensible behaviour is fine」（`src/user.ts:40`）である。依頼文 8 行の `{"mode", "muted"}` を「両方必須」と読むか「開いている」と読むかは、ユーザー役に任される。部分更新の 200 を許した可能性は残る。このデータからは決められない。

## 32 セッションすべて満足をどう読むか

- **3 依頼（fx-invoice・ship-orders・pay-refunds-r2）の一致には情報が無い。** 12 build とも自組のシナリオを 15/15 で通し、current は pass である。ユーザー役の 24 セッションも満足で、「both pass 24」になった。ただ、もともと落ちる build が無いので、ユーザー役が欠陥を見つけられるかどうかは試されていない。
- **食い違いが出られたのは notify-queue の 1 点だけで、そこを外した。** current だけが落とした 8 セッションは、どれも「Everything I tried behaved as the request describes」で、problems は 0 件だった。32 セッションとも problems は空である。
- **甘いのではなく、浅い。** 根拠は 3 つある。
  - 枠を使い切っている（全セッション 37〜40 行動）。
  - 同じ build の 2 セッションが同じ手順を踏む。notify-queue では 8 セッションの PUT が 1 字も違わない。各 build の 2 セッションは、独立な 2 回の試しになっていない。
  - 試した点についての報告は、具体的で正しい（Retry-After 90 → pausedUntil 62、「Digest: 2 updates」、Idempotency-Key の再利用など）。
- **甘さは測れていない。** ユーザー役が落とす側に立つ場面（明らかな欠陥を見て、それでも満足と言うか）が、この 16 build には無かった。
- **費用。** ユーザー役 32 セッションの費用（`user-judge-cost.json` の合計）は約 $16.3 だった。依頼ごとに $3.6〜$4.4、1 セッションあたり約 $0.44〜$0.56 である。

## factory#50 と 12 周目に効く点

- **ユーザー役の判定を合否に使うのは、まだ早い。** 最初の実走で、current と食い違えた唯一の点を見つけられなかった。合否に使う条件は少なくとも 2 つある。
  - 現在の判定を落とす欠陥のある build を、ユーザー役が「不満足」と言えること。わざと欠陥を入れた build で測る。
  - 同じ build の複数セッションが、違う所を試すこと。
- **枠を広げても問題は解けない。** 浅さの原因は枠だけではない。セッション間で手順がそろってしまうことにもある。セッションごとに試す重点を変える（例: 主筋 / 入力の形 / 状態の遷移）方が、ターン数を増やすより効きそうである。
- **今回の食い違いの原因は、ユーザー役ではなく仕様の下書きにある。** 依頼文が決めている点を「Undecided」に入れると、作る役とシナリオ役が分かれる。承認の要約の (b) 欄は、これを承認の前に示していた。12 周目では、(b) 欄に挙がった点を依頼文と照らす（依頼文が決めているなら仕様を直す）段を足すかどうかを決めておくと、同じ型の落ちを「作る役の落ち」と取り違えずに済む。
- **天井の周では、ユーザー役の比較から言えることが少ない。** 32 セッション中 24 は、両方 pass の一致で情報が無い。ユーザー役の腕を評価するなら、current が落とす build を一定数含む周、または欠陥を入れた対照の build が要る。
