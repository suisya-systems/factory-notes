# 7 周目 入口の確認（作成担当、2026-10-18）

対象: hard-1（version af72cb29…81b6）と hard-2（version 555cf482…707a）。仕様は settle-a1 とバイト単位で同じ（定義の cmp の段で確認済み）。手順は runbook の「入口の確認」のとおり。モデルは呼んでいない。

## 結論

- **期待値の誤りは 0 件。** 宣言どおりに設定した参照実装（`docs/lap-7/refapps/server.cjs`）で、2 組の全シナリオが通った。金額の期待値は作成担当が手でも計算し、一致した。
- **確かめた少数派の点は、hard-1 が 3 個、hard-2 が 4 個。** 端数の点はどちらの組でも外れた。
- **事前に決めた承認の条件「金額に絡む点が 2 個以上」は、2 組とも満たさない。** 金額に絡むのはペアごとの相殺だけである。向きが読めない（opaque）要約も 0 件。
- **オーナーは、この結果を見たうえで、2 組をこのまま承認して流すと決めた（選択肢 A）。** 条件を、データを見た後で外したことになる。報告書に明記する。

## 点ごとの結果

「22 回」は、同じ仕様で要約なしに作った作る役の commit である（5 周目の 16 回と、6 周目の 6 run の 1 回目）。数字は、その点のシナリオを落とした回数（つまり多数派の答えを選んだ回数）。

| 組 | 点（宣言の答え） | その点のシナリオ | 22 回で落ちた数 | 金額に絡む | 要約の向き | 扱い |
|---|---|---|---|---|---|---|
| hard-1 | 精算をペアごとに相殺する（第三者を経由しない） | pairwise-chain-not-routed、pairwise-cycle-not-cancelled | 22、22 | ○（2 本、送金に効く） | 読める | 使う |
| hard-1 | 空の受益者はグループの全員で割る | empty-beneficiaries-means-everyone | 22 | — | 読める | 使う |
| hard-1 | 1 人のグループは拒む | single-member-group-rejected | 22 | — | 読める | 使う |
| hard-1 | 端数は N 件目の支出で受益者の N mod k 番目から配る | offsetting-expenses-settle-to-net | 11 | — | — | **外す**（半数がすでにこの答え） |
| hard-2 | 精算をペアごとに相殺する | settlement-pays-the-actual-payer、settlement-cycle-is-not-collapsed | 22、22 | ○（2 本） | 読める | 使う |
| hard-2 | 受益者を省くと、支払った人以外の全員 | omitted-beneficiaries-means-everyone-else | 22 | — | 読める | 使う |
| hard-2 | 同じ人を 2 回並べると 2 人分を負担する | repeated-beneficiary-takes-extra-share | 22 | — | 読める | 使う |
| hard-2 | 同名のメンバーがいるグループは拒む | duplicate-member-names-rejected | 12 | — | 読める | 使う（ぎりぎりの過半。10 回はすでに拒んでいた） |
| hard-2 | 端数はグループに 1 つのカーソルで、受益者でない人を飛ばして配る | （なし） | — | — | — | **外す**（参照実装で、多数派に戻しても落ちるシナリオが無い） |

- 端数の点を当てたはずのシナリオ（hard-1 の remainder-rotates-between-two-members・remainder-spread-across-three-expenses、hard-2 の remainder-rotates-across-expenses・remainder-rotation-skips-non-beneficiaries・payer-among-beneficiaries）は、多数派の作り方（それまでの端数が最も少ない人へ、同数ならグループの順）でも同じ金額になる。下書き役の「多数派は最初の受益者に配る」という見立ては、6 周目の「送金の並び」と同じく外れていた。
- 少数派以外のシナリオで、22 回のうちに落ちたものがある: hard-2 の payer-among-beneficiaries（5 回）、remainder-rotation-skips-non-beneficiaries（3 回）、hard-1 の offsetting-expenses-settle-to-net（11 回、上の表）。どれも、端数を誰に配るかの同数時の選び方が作る役によって違うためで、期待値の誤りではない（参照実装と手計算で確認した）。これらは「ほか」の列に入る。1 回目にここで落ちる run がありうる。

## 事前登録

`docs/lap-7/prereg.json`（ゲートで状態ディレクトリの `prereg/prereg.json` に固定される）。

- hard-1 の少数派シナリオ: single-member-group-rejected、empty-beneficiaries-means-everyone、pairwise-chain-not-routed、pairwise-cycle-not-cancelled
- hard-2 の少数派シナリオ: settlement-pays-the-actual-payer、settlement-cycle-is-not-collapsed、omitted-beneficiaries-means-everyone-else、repeated-beneficiary-takes-extra-share、duplicate-member-names-rejected
- 腕: 組ごとに 要約あり 2 本・bare 2 本（定義のとおり）。判定の線は runbook の「判定の線」。

## 費用

ここまでの lap 台帳は $2.69（隔離の確認 $0.12、下書き 2 本 $1.27・$1.30）。残りの見込みは、run 8 本で約 $16（最悪約 $23）。
