# 10 周目: 予備選別の要約（ゲート main）

予備選別（4 依頼、k = 4）の結果と、全員が落ちたシナリオ 3 本の読み。読みの順は手順書のとおり（工場を先に疑い、次に期待値の誤りの規則）。

## 集計（`arms.ts --screen`、`screen-errors.json` あり）

| 依頼 | Q 自組（%） | Q 借りた組（%） | Q（%） | 帯 | 除く前の Q（%） |
|---|---|---|---|---|---|
| settle-history | 92.3 | 100.0 | 96.2 | 天井 | 92.9 |
| stock-backorder | 100.0 | 100.0 | 100.0 | 天井 | 100.0 |
| library-holds | 100.0 | 93.7 | 96.9 | 天井 | 96.9 |
| task-deps | 98.3 | 90.9 | 94.6 | 天井 | 94.6 |

- 帯は 30 % ≤ Q < 90 %。4 依頼とも Q ≥ 90 % で天井。除いた後も同じ。
- 規則の出力: 「requests that go on: (none)」。本番に回す依頼は無い。
- task-deps の自組は `task-deps-cc-p-r2`（`task-deps-cc-p` はシナリオの要約が 200 字を超えたため工場が書き直した）。
- 置き換えの確かめ（`placeholders-screen.md`）は 4 組とも問題 0。

## 全員が落ちたシナリオの読み

| 組 / シナリオ | 落ちた段 | 工場 | 期待値の誤りか | 分類 |
|---|---|---|---|---|
| settle-history-cc-p / weights-history | 9（期待 400、実際 409） | 異常なし | いいえ | 作る役の落ち（仕様が決めていない点の選択の違い） |
| settle-history-cc-p / expense-list-filters | 11（本文が期待と不一致） | 異常なし | **はい** | 期待値の誤り（計算が成り立たない） |
| task-deps-cx-p / unknown-and-foreign-references | 14（期待 400、実際 404） | 異常なし | いいえ | 作る役の落ち（仕様が決めていない点の選択の違い） |

工場の確かめ: 3 本とも落ちた段より前の段は通っており、キーや `{{name}}` を使った段（取り出した id をキー・path・body に置く段）も通っている。たとえば expense-list-filters は段 5 で `"owed": {"{{c}}": 40}` を照らして通っている。落ちた段のリクエストも、シナリオに書かれたとおりに送られている。

### settle-history-cc-p / weights-history（段 9）

- 段 9 は、グループにすでにいる名前 `Bob`（`joinedOn` 2024-02-01）をメンバー追加で送り、400 を期待する。4 build とも 409 を返した。
- 仕様の「依頼が述べる規則」は、名前の一意を `POST /groups` についてだけ述べる。追加（`POST /groups/{id}/members`）での重複名の状態コードは、仕様の「Undecided」に「Status for a duplicate member name on add, including names of members who left (400 vs 409)」として残っている。依頼文（`requests/settle-history.md`）にも書かれていない。
- 期待値は依頼文と食い違わず、計算の問題でもない。誤りの規則に当たらないので、`screen-errors.json` には載せない。決まっていない点でシナリオが 400 を、4 build が 409 を選んだ。作る役の落ちとして数える。

### settle-history-cc-p / expense-list-filters（段 11）

- 段 11 は、3 人（Ann・Bob・Cy）の `all` 分割（30 円、2024-03-01）の後に Dee（`joinedOn` 2024-02-01、重み 1）を追加し、`?member=Dee` の一覧で e1 の `owed` を `{Ann: 8, Bob: 7, Cy: 7, Dee: 8}` と期待する。
- 手の計算: 4 人とも重み 1、`all` 分割は読むたびにその日の在籍で計算し直す。30·1/4 = 7.5、床は各 7 円で、残り 2 円。端数部分はどの人も 0.5 で同じ。依頼文「ties go to the beneficiary earlier in the member order」により、残り 2 円は member order の早い Ann と Bob へ行き、`{Ann: 8, Bob: 8, Cy: 7, Dee: 7}` になる。期待値の Bob 7 と Dee 8 は依頼文の規則と合わない。
- 誤りの規則（依頼文と食い違う期待値、または計算が成り立たない期待値）に当たる。4 build が同じ値を返したことも、これと合う。
- `screen-errors.json` に載せ、settle-history の自組 Q から除く（85.7 → 92.3 %、全体 92.9 → 96.2 %）。帯には入らない。

### task-deps-cx-p / unknown-and-foreign-references（段 14）

- 段 14 は、別のプロジェクトのタスク（`x`）を `dependsOn` に入れてタスクを作り、400 を期待する。4 build とも 404 を返した。
- 仕様の「Undecided」に「Status code when a `dependsOn` id, or `on` ..., names an existing task of a different project (400, 404 or 409)」がある。依頼文は「each id a task of the same project」と「404 for an unknown id」だけを述べ、別プロジェクトの状態コードは決めていない。build は「このプロジェクトのタスクの中に無い id」として 404 を選んだ。
- 期待値は依頼文と食い違わず、計算の問題でもない。誤りに載せない。決まっていない点の選択の違いで、作る役の落ちとして数える。
- 同じシナリオの段 16 以降（`on` が別プロジェクトのタスク・数値・欠落）も同じ形の選択を含むが、段 14 で止まるので走らない。

## まとめ

- 工場の不具合: 3 本とも無し。
- 期待値の誤り: 1 本（expense-list-filters）。
- 作る役の落ち（仕様が決めていない点の選択の違い）: 2 本。
- 誤りを除いても、4 依頼とも天井。帯に依頼が無いので、本番は流さない。
