# 較正 系列 O の L1 と段 S3 の途中報告（2026-10-26）

合格率 80 % の条件を探す較正（[design.md](design.md)）のうち、系列 O の L1（2 本を合わせた依頼 3 本、作る役は opus）と、同じ依頼に sonnet を当てた段 S3 の結果を報告する。較正はまだ終わっていない。系列 O の L2 は流している途中である。系列 S の段 S0〜S2（既存の 12 依頼）は、この報告では扱わない。L1 の依頼文と定義は [l1-requests.md](l1-requests.md)、道具は [tools.md](tools.md)、12 周目の報告は [../lap-12/report.md](../lap-12/report.md) にある。

## この文書での言葉

[design.md](design.md) の言葉を使う（較正、系列 O / 系列 S、合わせた依頼、大きさの段 L0・L1・L2、部品の間の絡み、目標の窓、起動しなかった build）。12 周目の言葉（系統 c / x、組の名前 R-ab-k、Q、天井、帯、判定、判定し直し、揺れた組、期待値の誤り）もそのまま使う。新しい言葉は無い。

## 結論

- **opus は L1 でも天井だった。** 3 依頼の Q は 100.0 / 100.0 / 96.9 % で、どれも 90 % 以上である。80 % を割った依頼は無く、目標の窓（70 % ≤ Q < 90 %）に入った依頼も無い。設計の表（「段の進め方」の 3）の「すべて 90 % 以上」に当たるので、L2 へ進んだ。
- **sonnet は shop-expense だけが窓に入った。** 同じ仕様・同じシナリオで、sonnet の Q は 100.0 / 100.0 / 85.6 % だった。shop-expense の 85.6 % は窓の中で、落ちの質も ok（起動しなかった build 0、起動した build だけの Q も 85.6 %）。80 % は割っていない。
- **期待値の誤りを 1 本除いた。** pay-ship-cx-p の `open-units-and-reconfirmation` は、どの build でも通らない段を持つ（下の「期待値の誤り」）。`screen-errors.json` に書いて Q から除いた。除く前の pay-ship の Q は、opus・sonnet とも 95.8 % である。
- **揺れは 0 だった。** 最後の 3 回の判定（1 回目と判定し直し 2 回）で合否が変わった組は、opus・sonnet とも 3 依頼で 0 個である。
- **言えること。**
  - 10〜12 周目の依頼を 2 本ずつ合わせ、語数を約 2 倍（1,614〜1,798 語）にしても、opus の Q は天井のままだった。L0 の 12 依頼（90.6〜100.0 %）と同じ線にいる。
  - 作る役を sonnet に替えると、3 依頼のうち画面を持つ shop-expense だけが下がった。stock-tasks と pay-ship は、sonnet でも全シナリオを通した。
- **言えないこと。**
  - 「sonnet なら L1 の大きさで 80 % 付近になる」とは言えない。窓に入ったのは 3 依頼のうち 1 本で、その下げの多くは 1 本の build から来ている（下の「sonnet の shop-expense の落ち」）。
  - 「opus は大きさでは下がらない」とも言えない。L2 の結果がまだ無い。
- **費用。** 状態ディレクトリ `.factory-cal80-o1` の lap 台帳で **$27.85**（系列 O の L1 が $24.84、段 S3 の sonnet の build が $3.01）。Codex は **6 回**。

## 何が起きたか（時系列）

時刻は 2026-10-26 の日本時間。lap の定義は [cal80-o1.json](cal80-o1.json)。段 S3 は、design.md のとおり実行担当が同じ状態ディレクトリで手で打った。

| 時刻 | 段 | 結果 | 費用 |
|---|---|---|---|
| 17:06 | 段 1（`npm test`、`arms.ts --self-test`、`--precheck`）と隔離の確認 | 通った。隔離の確認は問題なし | $0.37 |
| 17:07〜17:49 | 下書き `-cc-p` 3 組 | pay-ship-cc-p だけが 1 回書き直しになった（シナリオの要約 2 本が検査で却下。1 本は 200 字を超え、1 本は段の値を含んだ）。組は `pay-ship-cc-p-r2` | — |
| 17:57 | ゲート `screen-specs` | 窓口が承認した（版 66838cd1…） | — |
| 〜18:37 | 下書き `-cx-p` 3 組 | 仕様は `--spec-from` で借りた（3 組とも `spec.md` が一致） | — |
| 18:37 | ゲート `screen` | 窓口が承認した（版 7e4ab0ba…）。読みの段で、pay-ship-cx-p の 1 本がどの build でも落ちると分かっていた（下の「期待値の誤り」） | — |
| 18:39〜18:53 | opus の build | 3 依頼 × 4 build = 12 build。12 本とも builderOk | build $8.64 |
| 〜18:58 | 判定し直し 2 回と集計 | 揺れ 0。lap は `done` で終わった | $0 |
| 19:12〜19:20 | 段 S3: sonnet の build | 3 依頼 × 4 build = 12 build。12 本とも builderOk | build $3.01 |
| 後 | sonnet の判定し直し 2 回、`screen-errors.json` を置いて集計し直し | 揺れ 0。下の表 | $0 |

## 予備選別の測り

Q は 4 build × 2 組（自組 = Claude のシナリオ、借りた組 = Codex のシナリオ）の合格割合の平均で、`screen-errors.json` のシナリオと揺れた組を除いて出す（[screen.json](screen.json) の `stages.measure`）。数字は `arms.ts --screen <state>/prereg/screen.json <root> --stage measure --builder <model> --errors <state>/screen-errors.json stock-tasks pay-ship shop-expense` の出力で、この報告を書く前に作る役ごとに打ち直して同じ数字を得た（モデルは呼ばない）。

| 依頼 | 部品 | シナリオ（自組 / 借りた組） | opus の Q（自組 / 借りた組 / Q） | sonnet の Q（自組 / 借りた組 / Q） | 揺れ（個） |
|---|---|---|---|---|---|
| stock-tasks | stock-backorder + task-deps | 15 / 11 | 100.0 / 100.0 / **100.0** | 100.0 / 100.0 / **100.0** | 0 / 104 |
| pay-ship | ship-orders + pay-refunds | 15 / 11（除く前 12） | 100.0 / 100.0 / **100.0** | 100.0 / 100.0 / **100.0** | 0 / 108 |
| shop-expense | cart-checkout + expense-wizard | 15 / 12 | 100.0 / 93.8 / **96.9** | 90.0 / 81.3 / **85.6** | 0 / 108 |

- 規則の出力: opus は「requests that go on: (none)」、sonnet は「requests that go on: shop-expense」。どちらも「under 80: (none)」。
- 起動しなかった build は、opus・sonnet とも 0 本。
- シナリオの本数は、12 周目の L0 の 4 依頼（12〜15 本）とほぼ同じだった。依頼が約 2 倍になっても、下書き役はシナリオを増やしていない（design.md の「長い依頼で効きうる工場の限界」が見込んだ形）。

build ごとの通ったシナリオの数（除く前。pay-ship-cx-p は 12 本中、除く 1 本がどの build でも落ちている）:

| 組 | opus（build 1〜4） | sonnet（build 1〜4） |
|---|---|---|
| stock-tasks-cc-p / -cx-p | 15, 15, 15, 15 / 11, 11, 11, 11 | 15, 15, 15, 15 / 11, 11, 11, 11 |
| pay-ship-cc-p-r2 / -cx-p | 15, 15, 15, 15 / 11, 11, 11, 11 | 15, 15, 15, 15 / 11, 11, 11, 11 |
| shop-expense-cc-p / -cx-p | 15, 15, 15, 15 / 11, 11, 11, 12 | 15, 10, 15, 14 / 11, 7, 11, 10 |

## 期待値の誤り（pay-ship-cx-p / open-units-and-reconfirmation）

- 段 17（`GET /requests`、外のサービスに届いた要求の一覧）は `"length": {"0.body.items": 0, ...}` を求めた。このシナリオで外へ出る 0 番目の要求は charge で、その body（`{reference, amount, token}`）は `items` を持たない。工場の長さの確かめは、その場所が配列でなければ落とす。依頼文どおりの build も、この段で必ず落ちる。opus・sonnet の 8 build とも、この段で落ちた。
- ゲート `screen` の読みで、承認の前に見つかっていた。下書き役への説明は API の長さを「for arrays inside the body」と書いているので、Codex の下書き役の書き誤りと読んだ。工場の判定の側に食い違いは無い（12 周目の factory#62 とは違う）。
- 扱いは 12 周目の errorsRule のまま。承認し、測る対象（Codex の下書き役の出力）には手を入れず、`screen-errors.json` に書いて Q から除いた。工場を「無いキーは 0 件」と読むよう直す手は、キーを返さない build でも長さ 0 の確かめが通るようになるので採らなかった。
- 段 17 はシナリオの最後の段で、その前の 16 段は確かめられている。それでもシナリオの合否は、どの build でも「落ち」になる。

## 全員が落ちたシナリオ（sonnet の shop-expense-cx-p / report-calendar-and-type-validation）

- 段 7 で、報告書の行から `note` を抜いて `POST /reports` を送り、400 を期待した。sonnet の 4 build はすべて 201 を返した。opus も build 1〜3 が同じ段で落ち、build 4 だけが通った。
- 依頼文は行を `{"date", "category", "amount", "note", "order"?}` と書いて `order` だけを省略可とし、Errors で「a missing or wrong-typed field ... is 400」と決めている。ゲート `screen` の読みも、この点（E4）を依頼文が決めている点として挙げた。期待値の誤りではなく、作る役の落ちとして数えた。
- 12 周目の expense-wizard でも、同じ `note` を抜いた 400 の段が 1 build で落ちている。部品の規則を残した合わせた依頼で、同じ点が opus でも sonnet でも落ちた。

## sonnet の shop-expense の落ち

| build | 自組の落ち | 借りた組の落ち | 落ちた段 |
|---|---|---|---|
| 1 | 0 | 1 | 上の `note` の段だけ |
| 2 | 5 | 5 | `note` の段のほか、画面の段で落ちた 9 本（自組の `ui-*` 5 本、借りた組で要素の長さが 0 だった 4 本）。どれも最初の数段の画面の段で、期待した要素が見つからないか、読んだ画面が期待と合わなかった |
| 3 | 0 | 1 | `note` の段だけ |
| 4 | 1 | 2 | `note` の段のほか、`ui-wizard-submit` の段 24 と `wizard-keeps-lines-and-rechecks-month` の段 20（どちらも後ろの方の画面の段） |

- 窓に入った下げの多くは build 2 から来ている。build 2 を除いた 3 build で出すと、自組 97.8 %、借りた組 88.9 %、Q は 93.3 % で、窓の外になる。4 build の Q のぶれ（design.md で約 5 点）を超える 1 build の重みである。
- build 2 の画面の落ちの原因（画面の作りか、test id の取り違えか）は、まだ読んでいない。どれも画面の段なので、読むときは 12 周目と同じく工場の読み（見えている要素の数え方）を先に疑う。opus の 4 build は同じシナリオの画面の段をすべて通しているので、工場の不具合の見込みは低い。
- 落ちの質の規則は「起動しなかった build」だけを見るので、build 2 は起動した build として数えた。画面がほぼ使えない build は、規則の上では「作り切れなかった」形に入らない。

## L2

系列 O の L2（3 本を合わせた依頼、状態ディレクトリ `.factory-cal80-o2`）の結果は [l2-report.md](l2-report.md) にある。L2 もすべて 90 % 以上で、系列 O は閉じた。上の「全員が落ちたシナリオ」の `note` の段は、作る役に渡った仕様が Undecided にしていた点として、l2-report.md で読み直している。

## ゲートの承認

- ゲート `screen-specs`（版 66838cd1…、17:57）と `screen`（版 7e4ab0ba…、18:37）は、どちらも窓口が承認した（design.md の「ゲートの承認は窓口」）。
- `screen` の読みは、3 組とも承認してよい、pay-ship-cx-p の 1 本は期待値の誤りとして除く、という結論だった。待ちを抜いた画面のシナリオは 0 本、12 周目の factory#62（期待値の側の空白）の型は直した後の工場で通る形だった。

## 計測: 費用（lap 台帳）

lap 台帳（`.factory-cal80-o1/lap-ledger.jsonl`、246 行）の終わりの行（`usd` の行）123 個を、役とモデルで数えた。段 S3 の sonnet の build も同じ台帳に入っている。

| 役 | モデル | 費用 | 回数 |
|---|---|---|---|
| 隔離の確認 | claude-opus-5-5 / claude-opus-4-8 | $0.37（$0.16 / $0.21） | 1 |
| 仕様の下書き役 | claude-opus-5-5 | $0.93 | 4 |
| シナリオの下書き役 | claude-opus-5-5 | $4.70 | 8 |
| シナリオの下書き役 | gpt-6-astra | （数えた呼び出し） | 6 |
| 分類 | claude-opus-5-5 | $10.20 | 80 |
| 作る役（系列 O の L1） | claude-opus-5-5 | $8.64 | 12 |
| 作る役（段 S3） | claude-sonnet-5-5 | $3.01 | 12 |
| **合計（Claude）** | | **$27.85** | |
| **合計（Codex）** | | | **6 回** |

- 系列 O の L1 は $24.84 で、design.md の見込み（約 $28、悪い場合 約 $45）の内側、止める線（$50）の下だった。段 S3 の L1 は $3.01 で、見込み（約 $3.6）の内側だった。
- opus の 1 build は $0.49〜$1.12（平均 $0.72）。12 周目の L0（平均 $0.49）の約 1.5 倍で、design.md の見込み（2 倍）より軽い。最も重い build は shop-expense の build 4（$1.12）で、L1 の止める線（$3）には遠い。
- sonnet の 1 build は $0.18〜$0.33（平均 $0.25）で、同じ依頼の opus の約 35 % だった。見込み（$0.30）の内側である。
- 計上できなかったもの: 実行担当・窓口の費用、Codex の下書きの金額（課金は ChatGPT アカウント側）、ゲートの読みの費用。

## 何が言えないか（既知の限界）

- **3 依頼 × 4 build と少ない。** 統計的な検定はしていない。sonnet の shop-expense の窓入りは、1 build の重みが大きい（上）。
- **系列 O は、大きさと題材を同時に変えている。** 合わせた依頼は部品の間の絡み（13〜15 組）も持つ。opus の天井は「L1 の作り方で合わせた依頼」についての結果である。
- **シナリオの本数が増えていない。** 依頼が約 2 倍でも、シナリオは 11〜15 本で、12 周目の L0（12〜15 本）とほぼ同じだった。規則あたりの確かめが薄くなり、Q が下がりにくい形になっている可能性がある。
- **sonnet が下がったのは、画面を持つ依頼だけである。** 画面の軸のせいか、依頼の大きさのせいかは、L1 だけでは分けられない。L0 の sonnet（系列 S の段 S1・S2）と並べて読む必要がある。
- **期待値の誤りの判断は、ゲートの読みの分類である。** pay-ship の 1 本を除かなければ、pay-ship の Q は opus・sonnet とも 95.8 % で、どちらでも天井である。
- **依頼は作成担当（Claude）が書いた。** 部品の間の規則の選び方が Claude の作る役に有利だった可能性がある（10〜12 周目と同じ限界）。
- **前提 1 の問いには答えていない。** 較正は予備選別だけで、本番は流していない。
- 8〜12 周目から引き継いでいる限界（系統 = 1 モデルずつ、Codex の答えたモデルは確かめられない、Codex の費用は回数だけ、lap 台帳にロックが無い）。

## 同じディレクトリのファイル

- [design.md](design.md): 較正の設計（2 系列、目標の窓、落ちの質、費用の線）。
- [l1-requests.md](l1-requests.md)・[requests/](requests/)・[rules.json](rules.json)・[cal80-o1.json](cal80-o1.json): L1 の依頼文、事前の基準、lap の定義。
- [l2-requests.md](l2-requests.md)・[cal80-o2.json](cal80-o2.json): L2 の依頼文と lap の定義。結果は [l2-report.md](l2-report.md)。
- [tools.md](tools.md)・[arms.ts](arms.ts)・[screen.json](screen.json): 較正の道具と選ぶ規則。
