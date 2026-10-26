# 較正 系列 O の L3 と、系列 O・S のまとめ報告（2026-10-27）

合格率 80 % の条件を探す較正（[design.md](design.md)）の、最後の段の報告である。L3（4 本を合わせた依頼 3 本）に作る役 opus・sonnet・haiku を当てた結果を報告する。L1・L2 の依頼に haiku を当てた結果と、系列 S の段 S0〜S2（既存の 12 依頼に sonnet）の結果も、ここで初めて報告する。design.md の「2 系列を同時に回す順番」の時期 5（2 系列をまとめた報告）を兼ねる。系列 O と系列 S は、この報告で「この大きさとモデルの範囲では 80 % まで下がらない」として閉じる。L1・L2 の途中報告は [l1-report.md](l1-report.md)・[l2-report.md](l2-report.md)、L3 の依頼文と定義は [l3-requests.md](l3-requests.md)、道具は [tools.md](tools.md) にある。

## この文書での言葉

[design.md](design.md)・[l1-report.md](l1-report.md)・[l2-report.md](l2-report.md) の言葉を使う（較正、系列 O / 系列 S、合わせた依頼、大きさの段 L0〜L3、部品の間の絡み、目標の窓、起動しなかった build、Q、天井、判定し直し、揺れた組、期待値の誤り）。新しい言葉は次の 1 つだけである。

- **haiku の段**: L1〜L3 の合わせた依頼に、作る役 `claude-haiku-5-5` の build を 4 本ずつ当てた段。design.md の K2（作る役を Haiku の世代にする）を、段 S3 と同じ形（系列 O の状態ディレクトリの中で、同じ仕様・同じシナリオで採点）で流した。工場が haiku を作る役に受けるようにしたのは工場の PR #65（design.md の変更 C）である。

## 結論

- **80 % を割った依頼は無かった。系列 O と系列 S は、ここで閉じる。** 大きさ L0〜L3 と作る役 opus・sonnet・haiku のどの組でも、Q の最小は 85.6 % だった（下の「大きさ × 作る役の Q」）。結論は「この大きさ（約 700〜3,600 語）とモデル（opus・sonnet・haiku）の範囲では、Q は 80 % まで下がらない」である。
- **opus は L3 でも天井だった。** 3 依頼の Q は 100.0 / 100.0 / 99.0 % で、L0〜L3 のどの段でも窓に入っていない。
- **sonnet も L3 では天井だった。** Q は 100.0 / 100.0 / 100.0 %。
- **haiku は L3 の shop-expense-rooms-board で窓に入った。** Q は 99.0 / 98.0 / **89.7** %。89.7 % は窓（70 % ≤ Q < 90 %）の上の端で、落ちの質も満たす（起動しなかった build 0、起動した build だけの Q も 89.7 %）。
- **窓に入ったのは 3 回で、3 回とも画面を持つ shop 系の依頼だった。** L1 の shop-expense の sonnet（85.6 %）と haiku（86.5 %）、L3 の shop-expense-rooms-board の haiku（89.7 %）である。合わせた依頼のうち画面の無いもの（10・11 周目の系統）は、L1〜L3 と 3 モデルのどれでも 95.4 % 以上だった。これは事実として並べるだけで、原因（画面の軸のせいか、shop 系の依頼文のせいか、build の数の少なさか）は、この結果では分けられない（下の「窓に入った 3 回」）。
- **大きさで Q が下がる形は見えなかった。** opus は L0 90.6〜100.0、L1 96.9〜100.0、L2 96.2〜100.0、L3 99.0〜100.0 % で、段を上げても下がっていない。sonnet・haiku の最小は L1 → L2 で上がった。L3 では sonnet が 3 依頼とも 100.0 % で、haiku は shop だけが 89.7 % に下がった。
- **揺れは 0、起動しなかった build も 0。** L3 の 36 build、haiku の L1・L2 の 24 build、L0 の sonnet の 36 build のすべてで、揺れた組は 0 個、builderOk でなかった build は 0 本だった。L3 の opus の最も重い build は $1.58 で、作る役の 1 呼び出しの上限（$5・20 分）には遠い。
- **期待値の誤りが 1 本あった。** shop-expense-rooms-board-cc-p の `booking-refusal-order` 段 15（`length` 5 を求めるが、正しい答えは 6 枠）。ゲート `screen-specs` の読みが見つけ、`screen-errors.json` に置いて Q から除いた（下の「期待値の誤り」）。除かないと haiku の shop は 86.9 % で、窓に入ることは変わらない。
- **言えること。**
  - 同じ周の依頼を 4 本まで合わせ、語数を約 4 倍（3,422〜3,594 語）、部品の間の絡みを 37〜49 組にしても、opus の Q は天井のままだった。
  - 作る役を sonnet・haiku に替えても、80 % を割る依頼は無かった。窓に入ったのは shop 系の 3 回だけである。
- **言えないこと。**
  - 「opus は大きさでは下がらない」とは言えない。シナリオの本数が依頼の大きさで増えていない（L3 も 11〜15 本）。L3 では、つなぐ規則のうち 5 つを確かめる段が無かった（下の「何が言えないか」）。
  - 「haiku は L3 で弱くなる」とは言えない。窓に入ったのは 1 依頼、4 build で、同じ haiku が L2 の shop では 96.2 % だった。
- **費用。** L3 の状態ディレクトリ `.factory-cal80-o3` の lap 台帳で **$42.25**（系列 O の L3 が $32.44、sonnet の build が $5.71、haiku の build が $4.11）。Codex は **8 回**。較正全体（系列 O の L1〜L3、系列 S、haiku の段）は **$114.39** で、2 系列の合計の止める線（$170）の下にある（下の「計測: 費用」）。
- **次に進むかは決めていない（未決）。** 窓に入った依頼が 3 本（作る役 2 種）あるが、design.md の「80 % 付近を見つけた後の道筋」は haiku を想定していない。本番に進むか、進むならどの条件かは、窓口からオーナーに諮る（下の「オーナーに諮る項目」）。

## 大きさ × 作る役の Q

### まとめ

各段の Q の範囲と、窓（70 % ≤ Q < 90 %）に入った依頼の数。L0 は既存の 12 依頼、L1〜L3 は合わせた依頼 3 本ずつ。

| 大きさ | 語数 | opus | sonnet | haiku |
|---|---|---|---|---|
| L0（12 依頼） | 694〜901 | 90.6〜100.0（窓 0） | 91.7〜100.0（窓 0）※ | 流していない |
| L1（3 依頼） | 1,614〜1,798 | 96.9〜100.0（窓 0） | 85.6〜100.0（窓 1） | 86.5〜100.0（窓 1） |
| L2（3 依頼） | 2,385〜2,693 | 96.2〜100.0（窓 0） | 95.4〜99.0（窓 0） | 96.2〜100.0（窓 0） |
| L3（3 依頼） | 3,422〜3,594 | 99.0〜100.0（窓 0） | 100.0（窓 0） | 89.7〜99.0（窓 1） |

※ L0 の sonnet は、9 依頼が 2 build（段 S1）、3 依頼が 6 build（段 S2）の Q である（下の「L0 の sonnet の build の数」）。

80 % を割った組は 0。窓に入ったのは 3 組で、どれも shop 系（12 周目の画面の依頼を合わせたもの）である。

### L1〜L3（合わせた依頼）

| 周の系統 | 段 | 依頼 | opus | sonnet | haiku |
|---|---|---|---|---|---|
| 10 周目（規則の絡み） | L1 | stock-tasks | 100.0 | 100.0 | 100.0 |
| | L2 | stock-tasks-library | 100.0 | 99.0 | 100.0 |
| | L3 | stock-tasks-library-settle | 100.0 | 100.0 | 99.0 |
| 11 周目（外部サービスの偽物） | L1 | pay-ship | 100.0 | 100.0 | 98.9 |
| | L2 | pay-ship-invoice | 100.0 | 95.4 | 100.0 |
| | L3 | pay-ship-invoice-notify | 100.0 | 100.0 | 98.0 |
| 12 周目（画面） | L1 | shop-expense | 96.9 | **85.6** | **86.5** |
| | L2 | shop-expense-rooms | 96.2 | 96.2 | 96.2 |
| | L3 | shop-expense-rooms-board | 99.0 | 100.0 | **89.7** |

太字は窓に入った組。L1 の pay-ship と L3 の shop-expense-rooms-board は、期待値の誤りを除いた後の Q である（各状態ディレクトリの `screen-errors.json`）。

### L0（既存の 12 依頼）

| 周 | 依頼 | opus（4 build） | sonnet |
|---|---|---|---|
| 10 | settle-history | 96.2 | 96.2 |
| 10 | stock-backorder | 100.0 | 100.0 |
| 10 | library-holds | 96.9 | 95.8 |
| 10 | task-deps | 94.6 | 97.7 |
| 11 | fx-invoice | 96.9 | 96.3 |
| 11 | ship-orders | 96.9 | 95.8 |
| 11 | pay-refunds | 100.0 | 100.0 |
| 11 | notify-queue | 92.5 | 92.5（6 build） |
| 12 | cart-checkout | 100.0 | 91.7（6 build） |
| 12 | task-board | 90.6 | 100.0 |
| 12 | expense-wizard | 98.2 | 95.2（6 build） |
| 12 | room-slots | 100.0 | 100.0 |

- opus の列は段 S0（今の工場での判定し直し 3 回）の後の Q で、design.md の「これまでの Q」の表と 12 本とも同じだった。
- sonnet の列で build の数を書いていない 9 本は、段 S1 の 2 build の Q（`--stage look`）である。段 S1 の下見の線（60 % ≤ Q < 95 %）に入ったのは notify-queue・cart-checkout・expense-wizard の 3 本で、段 S2 へ進んだ。

### 数字の出し方

数字はすべて、この報告を書く前に `arms.ts --screen <screen.json> <root> --stage measure --builder <model> [--errors <screen-errors.json>] <依頼>...` を打ち直して得た（モデルは呼ばない）。`<screen.json>` は工場に写した [screen.json](screen.json)（L3 のゲートで固定した `.factory-cal80-o3/prereg/screen.json` とバイト単位で同じ）である。L1 は `.factory-cal80-o1/screen-errors.json`、L3 は `.factory-cal80-o3/screen-errors.json`、L0 は 10〜12 周目の期待値の誤りをまとめた `screen-errors-l0.json` を渡した。L2 は期待値の誤りが無いので渡していない。窓口の手元の集計（L3 の 3 モデル、L1・L2 の haiku）と、L0 の sonnet の前回の読み（段 S1 は 91.7〜100 %、段 S2 は 91.7 / 92.5 / 95.2 %）と、すべて同じ数字になった。

### L0 の sonnet の build の数

段 S2 を流した 3 依頼（notify-queue・cart-checkout・expense-wizard）には、sonnet の build が 6 本ある。段 S2 は「段 S1 の 2 build に 2 build を足して 4 本」とする設計だったが、`replicate --k` が「足す数」であるのに対して、窓口が合計の数として `--k 4` を渡したためである。

扱いは次のとおりにした。

- 登録した `screen.json` は変えていない。`--stage measure` は build の数が 4 でないと止まるので、`stages.measure.k` だけを 6 にした写しを一時ファイルで渡し、6 build の Q を出した（窓口の前回の読みと同じ）。表の 3 本の数字はこれである。
- 参考に、build 1〜4 だけで読んだ Q も出した（6 本の build の通ったシナリオの数から数えた）。notify-queue 92.5 %、cart-checkout 91.7 %、expense-wizard 92.8 % で、どれも天井である。6 build で読んでも 4 build で読んでも、結論は変わらない。
- 段 S1 の下見の Q（build 1・2）も、同じく通ったシナリオの数から数えて notify-queue 92.5 %、cart-checkout 91.7 %、expense-wizard 92.8 % だった。この 3 本が段 S2 に進んだのは下見の線（95 % 未満）のとおりである。

## 何が起きたか（時系列）

時刻は日本時間。lap の定義は [cal80-o3.json](cal80-o3.json)。sonnet・haiku の build は、段 S3 と同じく実行担当が同じ状態ディレクトリで手で打った。

| 時刻 | 段 | 結果 | 費用 |
|---|---|---|---|
| 10-26 16:56〜18:24 | 系列 S の段 S0〜S2（既存の 12 依頼の写しで） | 段 S0 は判定し直し 3 回で opus の Q が設計の表と一致。段 S1 は sonnet 24 build、段 S2 は 3 依頼に sonnet 12 build。どれも builderOk | $5.44 |
| 10-26 23:12 | 工場の PR #65（haiku を作る役に受ける） | 工場の 618cb0e。L3 の lap はこの版で流れた | — |
| 10-26 23:28 | 段 1（`npm test`、`arms.ts --self-test`、`--precheck`）と隔離の確認 | 段 1 は通った。隔離の確認は `modelOk=false`（「model reported an error (unknown)」）で落ち、lap が止まった。漏れの印は無かった（`canaryFound=false`、`loginFound=false`）。L2 の 1 回目と同じ落ち方で、2 回とも工場の #66 に起票済み | $0.26 |
| 10-26 23:29 | 隔離の確認（2 回目） | 定義の名前を `cal80-o3-probe-r2` に替えて流し直した。通った | $0.37 |
| 10-26 23:30 頃〜10-27 00:10 | haiku の段の L1・L2（`.factory-cal80-o1`・`-o2` で） | 6 依頼 × 4 build = 24 build。24 本とも builderOk。判定し直し 2 回で揺れ 0 | $4.19 |
| 10-26 23:29〜10-27 00:07 | 下書き `-cc-p` 3 組 | 3 組とも 1 回で通った | $12.13 |
| 00:17 | ゲート `screen-specs` | 窓口が承認した（版 bb0c1a44…）。同時に shop の期待値の誤り 1 本を `screen-errors.json` に置いた | — |
| 00:17〜01:02 | 下書き `-cx-p` 3 組 | 仕様は `--spec-from` で借りた（3 組とも `spec.md` が一致）。pay-ship-invoice-notify-cx-p が 1 回書き直しになった（シナリオの要約にステップの値 `currency` が入り検査で却下）。組は `pay-ship-invoice-notify-cx-p-r2` | $6.09 |
| 01:11 | ゲート `screen` | 窓口が承認した（版 27883308…）。足す期待値の誤りは 0 と読んでいた | — |
| 01:11〜01:35 | opus の build | 3 依頼 × 4 build = 12 build。12 本とも builderOk | $13.58 |
| 01:35〜01:38 | 判定し直し 2 回と集計 | 揺れ 0。lap は `done` で終わった | $0 |
| 01:38 頃〜01:55 | sonnet の build | 3 依頼 × 4 build = 12 build。12 本とも builderOk | $5.71 |
| 01:46 頃〜02:33 | haiku の build | 3 依頼 × 4 build = 12 build。12 本とも builderOk | $4.11 |
| 〜02:38 | 3 モデルの判定し直し 2 回と集計 | 揺れ 0。上の表 | $0 |

- lap の中の集計の段（定義の最後の `--screen`）は `--errors` を渡さない形なので、opus の shop を期待値の誤りを含めて 95.6 % と出した。上の表の 99.0 % は、置いた `screen-errors.json` を渡して打ち直したものである（L1 と同じ手順）。
- 工場の側の [cal80-o3.json](cal80-o3.json) は、隔離の確認の名前を `cal80-o3-probe-r2` に替えた版で流れた（ゲートの承認が固定した sha256 f74b62d5… はこの版）。L2 と同じく、この報告と一緒にここの写しも同じ 1 行を直し、工場の側と一致させた。

## L3 の予備選別の測り

| 依頼 | シナリオ（自組 / 借りた組） | 段の数 | opus（自組 / 借りた組 / Q） | sonnet（同） | haiku（同） | 揺れ（個） |
|---|---|---|---|---|---|---|
| stock-tasks-library-settle | 15 / 12 | 194 / 185 | 100.0 / 100.0 / **100.0** | 100.0 / 100.0 / **100.0** | 100.0 / 97.9 / **99.0** | 0 / 108 |
| pay-ship-invoice-notify | 15 / 11 | 258 / 248 | 100.0 / 100.0 / **100.0** | 100.0 / 100.0 / **100.0** | 98.3 / 97.7 / **98.0** | 0 / 104 |
| shop-expense-rooms-board | 15（数えるのは 14）/ 12 | 169 / 177 | 100.0 / 97.9 / **99.0** | 100.0 / 100.0 / **100.0** | 85.7 / 93.7 / **89.7** | 0 / 108 |

- 規則の出力: opus・sonnet は「under 80: (none)」「requests that go on: (none)」。haiku は「under 80: (none)」「requests that go on: shop-expense-rooms-board」。
- 起動しなかった build は、3 モデルとも 0 本。
- シナリオの本数は 11〜15 本で、L0（12〜15 本）・L1（11〜15 本）・L2（12〜15 本）とほぼ同じだった。依頼が約 4 倍になっても、下書き役はシナリオの本数を増やしていない。画面のシナリオは shop の自組 3 本、借りた組 2 本である。

build ごとの通ったシナリオの数（shop の自組は、期待値の誤りの 1 本を含む 15 本のうち）:

| 組 | opus（build 1〜4） | sonnet（build 1〜4） | haiku（build 1〜4） |
|---|---|---|---|
| stock-tasks-library-settle-cc-p / -cx-p | 15, 15, 15, 15 / 12, 12, 12, 12 | 15, 15, 15, 15 / 12, 12, 12, 12 | 15, 15, 15, 15 / 12, 12, 11, 12 |
| pay-ship-invoice-notify-cc-p / -cx-p-r2 | 15, 15, 15, 15 / 11, 11, 11, 11 | 15, 15, 15, 15 / 11, 11, 11, 11 | 15, 14, 15, 15 / 11, 10, 11, 11 |
| shop-expense-rooms-board-cc-p / -cx-p | 14, 14, 14, 14 / 11, 12, 12, 12 | 14, 14, 14, 14 / 12, 12, 12, 12 | 13, 12, 11, 12 / 12, 11, 11, 11 |

opus の落ち（期待値の誤りを除く）は、shop の build 1 の借りた組 `shop-page-batch-validation` 段 12 の 1 本だけである。sonnet は期待値の誤りの 1 本のほかに落ちが無い。

haiku の落ち（期待値の誤りを除く）:

- **stock-tasks-library-settle の build 3**: 借りた組の `preserve-name-whitespace` 段 1（名前の前後の空白を残すか）。ゲート `screen` の読みが「trim の build は全段を失う」と挙げていた段である。
- **pay-ship-invoice-notify の build 2**: 自組の `stock-hold-then-book-and-handover` 段 8 と、借りた組の `retry-stock-competition` 段 11（`retried` が 1 件のところ 2 件）。
- **shop-expense-rooms-board**: 4 build で計 11 本（自組 8、借りた組 3）。
  - 時計の答えの形: 自組の `checkout-success-effects` 段 1（`POST /clock` の本文）・`booking-cancel-window` 段 10（`GET /clock` の本文）が build 2・4、借りた組の `booking-conflict-precedence` 段 17（`GET /clock` の本文）が build 2・4 の、計 6 本。ゲート `screen-specs` の読みは、`POST /clock` に 200 だけを求める段（特に `checkout-success-effects` 段 1）を危険「低〜中」として挙げていた。
  - 報告の一覧: 自組の `report-limits-and-validation` 段 8 と `report-one-per-month` 段 4、借りた組の `report-limits-numbering-and-summary` 段 2。3 本とも build 3 で、`GET /reports` が配列を返していない。計 3 本。
  - 画面: 自組の `ui-board-filters-undo` 段 7（フィルタを押した後に `notice` が消えていない）が build 1・3。
- haiku の shop の落ち 11 本のうち、画面のシナリオは 2 本で、残る 9 本は API の段である。

## 期待値の誤り（shop-expense-rooms-board-cc-p / booking-refusal-order）

段 15 は `GET /slots?date=2026-11-03` に `length` 5 を求める。この日の枠は、段 1・2・4〜7 で作った 6 つである（段 3 は 409 で作られない）。工場の `length` は完全一致なので、正しい build は 6 を返して段 15 で落ちる。opus・sonnet・haiku の 12 build はすべて 6 を返した。

- ゲート `screen-specs` の読みが承認の前に見つけ、「作り直すと下書き役のふるまいを測り直すことになる」ので作り直さず、L1 の pay-ship-cx-p と同じく `screen-errors.json` で Q から除くとした。12 周目の errorsRule のとおりである。自組の分母は 14 本になる。
- 除かない Q は、opus 95.6 %、sonnet 96.7 %、haiku 86.9 % である。haiku が窓に入ることも、opus・sonnet が天井であることも変わらない。
- ゲート `screen` の読みは、借りた組に足す期待値の誤りを 0 とした。測りの後に全員が落ちたシナリオは、この 1 本だけだった。

## 窓に入った 3 回

| 段 | 依頼 | 作る役 | Q（自組 / 借りた組 / Q） | 主な落ち |
|---|---|---|---|---|
| L1 | shop-expense | sonnet | 90.0 / 81.3 / 85.6 | 全 build の `note` の段、build 2 の画面の段 9 本、build 4 の画面の段 2 本（[l1-report.md](l1-report.md)） |
| L1 | shop-expense | haiku | 91.7 / 81.3 / 86.5 | 全 build の `note` の段（cx-p の `report-calendar-and-type-validation` 段 7）、build 2 の画面の段 7 本、build 4 の画面の段 3 本 |
| L3 | shop-expense-rooms-board | haiku | 85.7 / 93.7 / 89.7 | 時計の答えの形 6 本、`GET /reports` 3 本（build 3）、画面 2 本 |

事実として次のことが言える。

- 3 回とも、12 周目の画面の依頼（cart-checkout・expense-wizard ほか）を合わせた shop 系の依頼で起きた。10・11 周目の系統の合わせた依頼は、L1〜L3 と 3 モデルのどれでも 95.4 % 以上だった（L1 の pay-ship は期待値の誤りを除いた後の値。除く前の最小は haiku の 94.8 %）。
- L1 の 2 回は、sonnet と haiku の落ちの形が似ている（`note` の段が全員、画面の段が特定の build に固まる）。L1 の `note` の段は、作る役に渡った仕様が依頼文の決めている点を Undecided に入れていたもので（[l2-report.md](l2-report.md)「全員が落ちたシナリオ」、工場の #64）、L3 の仕様では再発していない（ゲート `screen-specs` の読み）。
- L3 の haiku の落ちは、画面の段が 2 本で、API の段（時計の答えの形と報告の一覧）が 9 本だった。L1 の 2 回とは落ちの形が違う。
- 同じ haiku が、間の L2 の shop-expense-rooms では 96.2 %（落ちは全員の `note` の段だけ）だった。

原因（画面の軸のせいか、shop 系の依頼文や仕様のせいか、各 4 build の重みか）は、この結果では分けられない。3 回とも 1 依頼 4 build で、窓の幅（±10 点）は 4 build の Q のぶれ（約 5 点）を見込んだものである（design.md「目標の窓」）。

## ゲートの承認

- ゲート `screen-specs`（版 bb0c1a44…、00:17）と `screen`（版 27883308…、01:11）は、どちらも窓口が承認した（design.md の「ゲートの承認は窓口」）。
- 読みの結論は、6 組とも承認してよい、期待値の誤りは自組の shop の 1 本（上）、作り直す組は 0、待ちを抜いた画面の段は 0、というものだった。L2 で全員が落ちた型（工場の #64、依頼文が必須とした欄を仕様が Undecided に入れる）は、3 本とも再発していないと読んでいた。
- 読みが挙げた灰色の点のうち、実際に落ちが出たのは haiku の `preserve-name-whitespace` 段 1 と、`POST /clock` の段（`checkout-success-effects` 段 1）だった。最も重いと読んだ shop の G1（`booking-conflict-precedence` 段 5・`lunch-claim-validation-and-atomicity` 段 10 の名前の trim）と G3（取り消した予約の 404）は、3 モデルの 12 build とも落ちなかった。

## オーナーに諮る項目（未決）

1. **本番（2×2 の周）に進むか。** design.md の「80 % 付近を見つけた後の道筋」は、系列 O で窓に入る依頼が 2 本以上あれば opus で本番、無ければ系列 S（sonnet）で 2 本以上あれば sonnet で本番、どちらも 1 本だけなら帯に 1 つとして本番に回すが前提 1 の判定には使わない、としている。今回は、系列 O は 0 本、sonnet は 1 本（L1 の shop-expense）、haiku は 2 本（L1 の shop-expense と L3 の shop-expense-rooms-board）だった。haiku の条件は設計の道筋に無い。どの条件で進むか（進まないか）は、この報告では決めない。
2. **80 % を割る条件をさらに探すか。** この報告で 2 系列は閉じる。さらに探すなら、新しい軸（design.md の「つまみの候補」の K3〜K6 や、シナリオの本数を依頼の大きさに合わせて増やす下書きの変更）が要る。

## 計測: 費用（lap 台帳）

L3 の lap 台帳（`.factory-cal80-o3/lap-ledger.jsonl`、269 行）の終わりの行（`usd` の行）を、役とモデルで数えた。sonnet・haiku の build も同じ台帳に入っている。

| 役 | モデル | 費用 | 回数 |
|---|---|---|---|
| 隔離の確認 | claude-opus-5-5 / claude-opus-4-8 | $0.63（$0.31 / $0.32） | 2（1 回目は落ちた） |
| 仕様の下書き役 | claude-opus-5-5 | $1.10 | 3 |
| シナリオの下書き役 | claude-opus-5-5 | $3.84 | 6 |
| シナリオの下書き役 | gpt-6-astra | （数えた呼び出し） | 8（却下された 1 組の 2 回を含む） |
| 分類 | claude-opus-5-5 | $13.28 | 80 |
| 作る役（系列 O の L3） | claude-opus-5-5 | $13.58 | 12 |
| 作る役（L3 の sonnet） | claude-sonnet-5-5 | $5.71 | 12 |
| 作る役（L3 の haiku） | claude-haiku-5-5 | $4.11 | 12 |
| **合計（Claude）** | | **$42.25** | |
| **合計（Codex）** | | | **8 回** |

- 系列 O の L3 は $32.44 で、design.md の見込み（約 $40、悪い場合 約 $60）の内側、止める線（$75）の下だった。
- 依頼ごと（下書き・分類 + opus 4 build）は stock-tasks-library-settle $10.40、pay-ship-invoice-notify $9.62、shop-expense-rooms-board $11.79。
- opus の 1 build は $0.79〜$1.58（平均 $1.13）。L2（平均 $0.91）の約 1.2 倍、12 周目の L0（平均 $0.49）の約 2.3 倍だった。最も重いのは shop-expense-rooms-board の build 1（$1.58）で、L3 の止める線（$5）には遠い。
- sonnet の 1 build は $0.30〜$0.79（平均 $0.48）、haiku は $0.21〜$0.48（平均 $0.34）で、同じ依頼の opus の約 42 % と約 30 % だった。
- haiku の段の L1・L2 は、`.factory-cal80-o1` の台帳で $1.31（1 build $0.05〜$0.25）、`.factory-cal80-o2` の台帳で $2.88（1 build $0.06〜$0.52）だった。
- 系列 S の段 S0〜S2 は、写した 3 つの台帳（`.factory-cal80-lap10`〜`lap12`）の sonnet の build の行で $5.44（36 build、1 build $0.12〜$0.21）。段 S0 の判定し直しは $0 である。design.md が段 S0 に入れていた sonnet の作る役での隔離の確かめの行は、3 つの台帳に無かった。

較正全体:

| 範囲 | 状態ディレクトリ | 費用 |
|---|---|---|
| 系列 O（L1 $24.84 + L2 $30.57 + L3 $32.44） | `.factory-cal80-o1`〜`o3` | $87.85 |
| 系列 S（L0 $5.44 + 段 S3 の L1 $3.01・L2 $4.08・L3 $5.71） | 写し 3 つと `.factory-cal80-o1`〜`o3` | $18.24 |
| haiku の段（L1 $1.31 + L2 $2.88 + L3 $4.11） | `.factory-cal80-o1`〜`o3` | $8.30 |
| **合計** | | **$114.39** |

- 2 系列の合計の止める線（$170）、系列 S の線（$50）、系列 O の段ごとの線（L1 $50、L2・L3 $75）のどれにも当たっていない。
- Codex は L1 6 回、L2 5 回、L3 8 回の計 19 回。
- 計上できなかったもの: 実行担当・窓口の費用、Codex の下書きの金額（課金は ChatGPT アカウント側）、ゲートの読みの費用。

## 何が言えないか（既知の限界）

- **各段 3 依頼 × 4 build と少ない。** 統計的な検定はしていない。L0 の sonnet は 9 依頼が 2 build である。
- **シナリオの本数が増えていない。** 依頼が約 4 倍でも、シナリオは 11〜15 本で、L0 とほぼ同じだった。規則あたりの確かめは段を上げるほど薄く、Q が下がりにくい形になっている可能性がある。天井は「この本数のシナリオで測った」天井である。
- **L3 では、つなぐ規則のうち 5 つを確かめる段が無かった。** ゲート `screen-specs` の読みの「つなぐ規則の網羅」で、pay-ship-invoice-notify の `notify-queue/date-round`（日付の移動での digest のまとめ。借りた組には同じ日付の側だけがある）と `pay-refunds/notice-refund`、shop-expense-rooms-board の画面の 3 つ（`task-board/ui-overdue`・`expense-wizard/ui-add-order-pickup`・`expense-wizard/ui-submit-pickup`）は、自組・借りた組のどちらにも段が無かった。この 5 つについては、L3 で Q が落ちなくても何も言えない。L3 で足した部品とのつなぎのうち、画面の側は測れていない。
- **系列 O は、大きさと題材を同時に変えている。** L3 は部品の間の絡み（37〜49 組）も持つ。天井は「L3 の作り方で合わせた依頼」についての結果である。
- **haiku の段は L0 を流していない。** haiku の L0 の Q は無いので、「haiku は大きさで下がるか」は L1〜L3 の 3 段だけで読んでいる。
- **窓に入った 3 回の原因は分けていない。** 落ちたシナリオの段と、build が返した答えの形からは読んだが、build のコードは読んでいない。
- **L0 の sonnet の全員が落ちたシナリオは読んでいない。** 段 S1 の library-holds-cx-p `space-only-names` 段 1・ship-orders-cx-p `validation-and-atomicity` 段 13、段 S2 の cart-checkout-cx-p `ui-batch-quantity-validation` 段 16・`ui-add-cap-and-removal` 段 5 は、sonnet の build がすべて落ち、opus の build は通っていた。期待値の誤りかは読んでいない。除くと Q は上がるだけなので、天井の結論は変わらない。
- **依頼は作成担当（Claude）が書いた。** 部品の間の規則の選び方が Claude の作る役に有利だった可能性がある（10〜12 周目と同じ限界）。
- **前提 1 の問いには答えていない。** 較正は予備選別だけで、本番は流していない。
- 8〜12 周目から引き継いでいる限界（系統 = 1 モデルずつ、Codex の答えたモデルは確かめられない、Codex の費用は回数だけ、lap 台帳にロックが無い）。

## 同じディレクトリのファイル

- [design.md](design.md): 較正の設計（2 系列、目標の窓、落ちの質、費用の線）。
- [l1-report.md](l1-report.md)・[l2-report.md](l2-report.md): 系列 O の L1・L2 と段 S3 の途中報告。
- [l3-requests.md](l3-requests.md)・[requests/](requests/)・[cal80-o3.json](cal80-o3.json): L3 の依頼文と lap の定義。
- [tools.md](tools.md)・[arms.ts](arms.ts)・[screen.json](screen.json): 較正の道具と選ぶ規則。
