# 9 周目 入口の確認（作成担当、2026-10-19）

ゲート `entrance` で承認する 4 組（Claude の仕様に Codex のシナリオ = cx、Codex の仕様に Claude のシナリオ = xc）と、ゲートが固定する `prereg.json` の確認。本番に回る依頼は `settle-shares-strict` の 1 つ（[screen-summary.md](screen-summary.md)）。本番のビルドはまだ 1 本も無い。

## 来歴（工場の段の結果）

- `arms.ts --provenance`: ゲート `specs` の 4 組、ゲート `entrance` の 4 組とも「4 sets as named」（作成担当が手元で 8 組まとめて流し直しても「8 sets as named」）。呼び出しごとの依頼モデル・回答モデル・数えた印・仕様の出どころが組の名前どおりだった。書き直した組（`cc-2r2`、`xc-1r1`）は、同じ系統の仕様として読む（`arms.ts` の来歴の照合は `r1`・`r2` の付いた名前を同じ系統として受ける。窓口経由で承認済みの変更、規則と数字は不変）。
- `cmp`: 仕様を借りた 4 組の `spec.md` は、借り元と 1 バイトも違わない（4 段とも通過。`cc-1`→`cx-1`、`xx-1`→`xc-1r1`、`cc-2r2`→`cx-2`、`xx-2`→`xc-2`）。
- 隔離の確認（`lap9-probe`）: 段は通過、費用 $0.34。

## 組ごとの表

`entrance.ts` の出力（[entrance-table.md](entrance-table.md) と同じ）。列の意味は 8 周目と同じ。「spec layer」は 8 周目の入口で変えた定義（状態コード以外の確認がすべて仕様から読める）で仕様の層に入る本数。

| set | scenarios | self: stated / unstated | readable-spec | readable-convention | unstated | contradicts | unknown | spec layer | spec-drafter calls | scenario-drafter calls | USD |
|---|---|---|---|---|---|---|---|---|---|---|---|
| settle-shares-strict-cc-1 | 14 | 12 / 2 | 9 | 0 | 5 | 0 | 0 | 9 | 1 | 2 | 1.7718 |
| settle-shares-strict-cx-1 | 10 | 8 / 2 | 2 | 0 | 8 | 0 | 0 | 2 | 0 | 2 | 0.8147 |
| settle-shares-strict-xx-1 | 13 | 11 / 2 | 5 | 0 | 8 | 0 | 0 | 5 | 1 | 1 | 0.8974 |
| settle-shares-strict-xc-1r1 | 14 | 12 / 2 | 10 | 0 | 4 | 0 | 0 | 10 | 0 | 2 | 1.4512 |
| settle-shares-strict-cc-2r2 | 15 | 13 / 2 | 10 | 0 | 5 | 0 | 0 | 11 | 1 | 1 | 1.4082 |
| settle-shares-strict-cx-2 | 11 | 9 / 2 | 2 | 0 | 9 | 0 | 0 | 3 | 0 | 2 | 0.8161 |
| settle-shares-strict-xx-2 | 12 | 10 / 2 | 4 | 0 | 8 | 0 | 0 | 4 | 1 | 1 | 0.7838 |
| settle-shares-strict-xc-2 | 14 | 13 / 1 | 9 | 0 | 5 | 0 | 0 | 9 | 0 | 1 | 1.0411 |

- シナリオの数: Codex のシナリオ（cx, xx）は 10〜13、Claude のシナリオ（cc, xc）は 14〜15（8 周目と同じ傾き）。
- 8 周目の settle（曖昧な依頼）では readable-spec が全組 0 だった。厳密版では、Claude のシナリオで 9〜10 本、Codex のシナリオで 2〜5 本が仕様から読める。仕様の層は 2〜11 本。

## U（事前登録の量）

U = 状態コード以外の確認のうち、分類が U（仕様から決まらない）の割合。自組と借りた組の確認を合わせて、仕様ごとに出す。U(依頼) は 4 本の仕様の中央値。

| spec (own / cross) | U (%) | U with status checks (%) | ## Undecided items | spec bytes |
|---|---|---|---|---|
| cc-1 / cx-1 | 14.8 | 16.0 | 21 | 7214 |
| xx-1 / xc-1r1 | 8.4 | 7.9 | 16 | 5836 |
| cc-2r2 / cx-2 | 8.1 | 8.7 | 24 | 7699 |
| xx-2 / xc-2 | 6.9 | 7.7 | 16 | 6506 |

| request | U per spec (%) | **U (%)** | **class** |
|---|---|---|---|
| settle-shares-strict | 14.8, 8.4, 8.1, 6.9 | **8.2** | **few**（< 25） |

- 区分は事前登録どおり「少ない」。厳密版として狙った側に入った。
- 操作の確認（同じ題材の 2 つの版の U の差 ≥ 20 点）は、曖昧版 `settle-shares-loose` が選別で天井として外れたため、当てはめる相手が無い。依存の判定は選別の時点で「決められない（選別で残らなかった）」に決まっている（screen-summary.md）。この U は記述として報告に載せる。
- 「## Undecided items」と「spec bytes」は記述。仕様が未決として挙げた項目の数（16〜24）と U の大小は揃っていない（項目の多い `cc-2r2` の U は 8.1）。

## 修正の往復と書き直し（下書きの役が工場の検査に従えたか）

本番の下書きだけを数える（選別の分は screen-summary.md）。「2 回とも却下」は、1 回目と修正の往復の両方が検査で落ち、その名前の段が失敗したもの。

| シナリオの役 | 仕様 | 下書き | 1 回目で通った | 修正の往復で通った | 2 回とも却下 |
|---|---|---|---|---|---|
| Claude | Claude（cc） | 4（`cc-1`、`cc-2`、`cc-2r1`、`cc-2r2`） | 1（`cc-2r2`） | 1（`cc-1`） | 2（`cc-2`、`cc-2r1`） |
| Claude | Codex（xc） | 3（`xc-1`、`xc-1r1`、`xc-2`） | 1（`xc-2`） | 1（`xc-1r1`） | 1（`xc-1`） |
| Codex | Codex（xx） | 2 | 2 | 0 | 0 |
| Codex | Claude（cx） | 2 | 0 | 2 | 0 |

- 却下の理由: `cc-2` と `xc-1` は「要約が 1 行 200 字を超える」、`cc-2r1` は「要約に手順の値を含む（`"ann"`）」。却下された下書きは `runs/<組>/` の `rejected-*.json`。
- `cc-2` は 2 回書き直し（`cc-2r2` で通った）、`xc-1` は 1 回書き直し（`xc-1r1` で通った）。どちらも手順書の上限（2 回）の内側。
- 8 周目と向きが逆である。8 周目は Codex のシナリオ（cx）が 6 回の下書きで 2 回却下、Claude は 0 回だった。この周（選別を含む）は Claude の下書き 12 回で 4 回却下、Codex は 10 回で 0 回（Codex の CLI の失敗 2 回は検査の却下ではないので数えない）。

## 全員が落ちうるシナリオの見込み（記述、判定には使わない）

選別では、`settle-shares-strict` の 4 本の build が同じシナリオを落とした（screen-summary.md: 重みの端数の大きい順、上限額の精度、精算の貪欲な順、抜けた人を含む差し替え、余りの配り方、差し替えと削除、抜けた人と過去の支出、上限ちょうどの受け付け）。本番の 8 組にも同じ規則を確かめるシナリオがある（各組の `shares-largest-*` / `weighted-*`、`settlement-greedy-*` / `settlement-reselects-*`、`left-member-*` / `departure-*`、`max-amount-split`、`inclusive-size-and-amount-limits` など）。本番の仕様は新しく下書きしたものなので、同じように落ちるとは限らないが、全員が落ちるシナリオは 8 周目より多く出ると見込む。そのときは runbook の「全員が落ちたシナリオ」の規則（依頼文か仕様の「依頼が述べる規則」の文と食い違うか、計算が成り立たないものだけを誤りとする）で、1 本ずつ引用か手の計算を付けて `errors.json` に書く。

## 事前登録（`docs/lap-9/prereg.json`）

雛形（`prereg.template.json`）に、8 組それぞれの承認要約が示す version（vault の hash）を入れたもの。依頼は `settle-shares-strict` の 1 つ。k = 8、線は 10 点 / 5 点、U の区分は 40 / 25、操作の確認 20 点、天井 95 %。組の対応は `cc-1` ↔ `cx-1`、`xx-1` ↔ `xc-1r1`、`cc-2r2` ↔ `cx-2`、`xx-2` ↔ `xc-2`。

## ここまでの費用と、この先の見込み

- Claude: **$35.24**（lap 台帳の合計。上限 $260）。内訳: 分類 $16.43（273 回）、作る役 $9.93（選別の 24 本、1 本平均 $0.41）、シナリオの下書き $7.50、仕様の下書き $1.04、隔離の確認 $0.34。
- Codex: lap 内 20 回（費用記録のある呼び出し。CLI の失敗を含む）。
- この先: 本番の replicate 32 本（4 本の仕様 × k = 8、並列 4、仕様ごとに `--max-cost 20`）。選別の 1 本平均 $0.41 なら約 $13、手順書の見積もり（1 本 $0.70）なら約 $22。段の上限の合計は $80。どの場合も lap の上限 $260 の内側に収まる（台帳の合計は約 $48〜$58 の見込み、上限ちょうどまで使っても $115）。
