# 較正 系列 O の L2 と段 S3 の途中報告（2026-10-26）

合格率 80 % の条件を探す較正（[design.md](design.md)）のうち、系列 O の L2（3 本を合わせた依頼 3 本、作る役は opus）と、同じ依頼に sonnet を当てた段 S3 の結果を報告する。L1 の結果は [l1-report.md](l1-report.md) にある。系列 O は、この L2 で「3 本を合わせても天井」として閉じる（design.md「段の進め方」の 4）。較正全体はまだ終わっていない。系列 S の段 S0〜S2（既存の 12 依頼）は、この報告でも扱わない。L2 の依頼文と定義は [l2-requests.md](l2-requests.md)、道具は [tools.md](tools.md) にある。

## この文書での言葉

[design.md](design.md) と [l1-report.md](l1-report.md) の言葉を使う（較正、系列 O / 系列 S、合わせた依頼、大きさの段 L0・L1・L2、部品の間の絡み、目標の窓、起動しなかった build、Q、天井、判定し直し、揺れた組、期待値の誤り）。新しい言葉は無い。

## 結論

- **opus は L2 でも天井だった。系列 O はここで閉じる。** 3 依頼の Q は 100.0 / 100.0 / 96.2 % で、どれも 90 % 以上である。80 % を割った依頼も、目標の窓（70 % ≤ Q < 90 %）に入った依頼も無い。design.md「段の進め方」の 4 の「L2 でもすべて 90 % 以上なら、系列 O は『3 本を合わせても天井』で閉じる」に当たる。
- **sonnet も L2 では天井だった。** 同じ仕様・同じシナリオで、sonnet の Q は 99.0 / 95.4 / 96.2 % だった。窓に入った依頼は無い。
- **L1 で sonnet が窓に入った shop-expense は、L2 の shop-expense-rooms では 96.2 % だった。** L1 の 85.6 % から上がり、opus と同じ数字になった。依頼は room-slots を足した別の依頼で、仕様とシナリオも下書きし直している。上がった原因は、この結果だけでは分けられない（下の「L1 の shop-expense との違い」）。
- **揺れは 0 だった。** 最後の 3 回の判定（1 回目と判定し直し 2 回）で合否が変わった組は、opus・sonnet とも 3 依頼で 0 個である。
- **起動しなかった build は 0 本。** 24 本とも builderOk で、作る役の 1 呼び出しの上限（$5・20 分）に当たった build も無い（最も重い build は $1.32）。工場の変更 G は要らなかった。
- **全員が落ちたシナリオが 1 本ある。** shop-expense-rooms-cx-p の `strict-validation-and-unknown-resources` 段 17（`note` を抜いた報告に 400 を期待し、8 build とも 201）。工場の判定と期待値は正しく、作る役に渡った仕様が、依頼文の決めている点を Undecided に入れていた（下の「全員が落ちたシナリオ」）。期待値の誤りではないので Q からは除いていない。除いても shop-expense-rooms の Q は opus・sonnet とも 100.0 % で、天井のままである。
- **言えること。**
  - 10〜12 周目の依頼を 3 本ずつ合わせ、語数を約 3 倍（2,385〜2,693 語）、部品の間の絡みを 27〜29 組にしても、opus の Q は天井のままだった。L0（90.6〜100.0 %）・L1（96.9〜100.0 %）と同じ線にいる。
  - 系列 O の作り方（部品の規則を残して合わせる）では、依頼を L2 の大きさにしても、opus の Q は 80 % に近づかなかった。
- **言えないこと。**
  - 「opus は大きさでは下がらない」とは言えない。シナリオの本数が依頼の大きさで増えていない（下の「何が言えないか」）。
  - 「sonnet は L2 の方が L1 より強い」とは言えない。依頼・仕様・シナリオがすべて違い、各 4 build である。
- **オーナーに諮る項目が残る（未決）。** L3（4 本を合わせる）を書くかと、作る役を Haiku の世代にするか（design.md の K2・C）。どちらもオーナーの判断はまだ出ていない（下の「オーナーに諮る項目」）。
- **費用。** 状態ディレクトリ `.factory-cal80-o2` の lap 台帳で **$34.65**（系列 O の L2 が $30.57、段 S3 の sonnet の build が $4.08）。Codex は **5 回**。

## 何が起きたか（時系列）

時刻は 2026-10-26 の日本時間。lap の定義は [cal80-o2.json](cal80-o2.json)。段 S3 は、L1 と同じく実行担当が同じ状態ディレクトリで手で打った。

| 時刻 | 段 | 結果 | 費用 |
|---|---|---|---|
| 19:34 | 段 1（`npm test`、`arms.ts --self-test`、`--precheck`）と隔離の確認 | 段 1 は通った。隔離の確認は `modelOk=false`（「model reported an error (unknown)」）で落ち、lap が止まった。漏れの印は無かった（`canaryFound=false`、`loginFound=false`） | $0.26 |
| 19:35 | 隔離の確認（2 回目） | lap の定義の名前を `cal80-o2-probe-r2` に替えて流し直した（落ちた段は流し直さない規則のため）。通った | $0.29 |
| 19:35〜20:26 | 下書き `-cc-p` 3 組 | pay-ship-invoice-cc-p が 2 回書き直しになった（どちらもシナリオの要約が 200 字を 1〜3 字超えて検査で却下）。組は `pay-ship-invoice-cc-p-r3` | $13.66（却下された 2 回の $3.16 を含む） |
| 20:35 | ゲート `screen-specs` | 窓口が承認した（版 944cc53b…） | — |
| 20:35〜21:12 | 下書き `-cx-p` 3 組 | 仕様は `--spec-from` で借りた（3 組とも `spec.md` が一致） | $5.40 |
| 21:21 | ゲート `screen` | 窓口が承認した（版 ae307df7…）。期待値の誤りは 3 組とも 0 と読んでいた | — |
| 21:24〜21:42 | opus の build | 3 依頼 × 4 build = 12 build。12 本とも builderOk | $10.96 |
| 21:43〜21:48 | 判定し直し 2 回と集計 | 揺れ 0。lap は `done` で終わった | $0 |
| 21:50〜22:11 | 段 S3: sonnet の build | 3 依頼 × 4 build = 12 build。12 本とも builderOk | $4.08 |
| 〜22:17 | sonnet の判定し直し 2 回と集計 | 揺れ 0。下の表 | $0 |

- 工場の側の [cal80-o2.json](cal80-o2.json) は、隔離の確認の名前を `cal80-o2-probe-r2` に替えた版で流れた（ゲートの承認が固定した sha256 b9a566ab… はこの版）。この報告と一緒に、ここの写しも同じ 1 行を直して工場の側と一致させた。

## 予備選別の測り

Q の出し方は L1 と同じ（4 build × 2 組の合格割合の平均。[screen.json](screen.json) の `stages.measure`）。L2 では `screen-errors.json` を置いていない（期待値の誤りが無いため）。数字は `arms.ts --screen <state>/prereg/screen.json <root> --stage measure --builder <model> stock-tasks-library pay-ship-invoice shop-expense-rooms` の出力で、この報告を書く前に作る役ごとに打ち直して同じ数字を得た（モデルは呼ばない）。

| 依頼 | 部品 | シナリオ（自組 / 借りた組） | opus の Q（自組 / 借りた組 / Q） | sonnet の Q（自組 / 借りた組 / Q） | 揺れ（個） |
|---|---|---|---|---|---|
| stock-tasks-library | stock-backorder + task-deps + library-holds | 15 / 12 | 100.0 / 100.0 / **100.0** | 100.0 / 97.9 / **99.0** | 0 / 108 |
| pay-ship-invoice | ship-orders + pay-refunds + fx-invoice | 15 / 12 | 100.0 / 100.0 / **100.0** | 95.0 / 95.8 / **95.4** | 0 / 108 |
| shop-expense-rooms | cart-checkout + expense-wizard + room-slots | 14 / 13 | 100.0 / 92.3 / **96.2** | 100.0 / 92.3 / **96.2** | 0 / 108 |

- 規則の出力: opus・sonnet とも「under 80: (none)」「requests that go on: (none)」。
- 起動しなかった build は、opus・sonnet とも 0 本。
- シナリオの本数は 12〜15 本で、L1（11〜15 本）・L0（12〜15 本）とほぼ同じだった。段の数は 168〜246 段（1 組あたり）。依頼が約 3 倍になっても、下書き役はシナリオの本数を増やしていない。

build ごとの通ったシナリオの数:

| 組 | opus（build 1〜4） | sonnet（build 1〜4） |
|---|---|---|
| stock-tasks-library-cc-p / -cx-p | 15, 15, 15, 15 / 12, 12, 12, 12 | 15, 15, 15, 15 / 12, 11, 12, 12 |
| pay-ship-invoice-cc-p-r3 / -cx-p | 15, 15, 15, 15 / 12, 12, 12, 12 | 12, 15, 15, 15 / 10, 12, 12, 12 |
| shop-expense-rooms-cc-p / -cx-p | 14, 14, 14, 14 / 12, 12, 12, 12 | 14, 14, 14, 14 / 12, 12, 12, 12 |

sonnet の落ち（全員が落ちた 1 本を除く）:

- **pay-ship-invoice の build 1**: 5 本（自組 3、借りた組 2）が落ち、5 本とも `GET /reports/fx?...` の段で 404 だった（fx-invoice の部品の為替の報告）。他の 3 build と opus の 4 build は同じ段を通している。
- **stock-tasks-library の build 2**: 借りた組の `dependency-refusals-and-cascade-stock` 段 16（`GET /projects/{id}/tasks` の本文が期待の部分と合わない）の 1 本。

## 全員が落ちたシナリオ（shop-expense-rooms-cx-p / strict-validation-and-unknown-resources）

段 17 で、報告書の行から `note` を抜いて `POST /reports` を送り、400 と `error` を期待した。opus・sonnet の 8 build はすべて 201 を返した。同じシナリオの段 15・16（`month` の範囲外、`date` が月の外）は 8 build とも 400 で通っている。工場→期待値の誤り→作る役の落ちの順で読んだ。

1. **工場（判定）**: 段 17 は status と `jsonHas` だけの段で、build が返した 201 をそのまま比べている。判定の側に食い違いは無い。
2. **期待値の誤り**: 依頼文は行を `{"date", "category", "amount", "note", "order"?, "booking"?}` と書き、`?` を付けたのは `order`・`booking` だけである。Errors は「a missing or wrong-typed field ... is 400」。期待値は依頼文どおりで、期待値の誤りではない。ゲート `screen` の読みも、この段（E4）を依頼文が決めている点として挙げ、シナリオが正しいとしていた。
3. **作る役に渡った仕様**: 作る役が見るのは仕様（`spec.md`）だけで、Undecided の点は自由に選んでよいと指示される（工場の `src/roles.ts` の作る役への指示）。この依頼の仕様の Undecided に「Whether `note` is required or may be omitted.」がある。仕様の下書き役が、依頼文の決めている点を Undecided に入れていた。8 build はそれを読んで `note` を省略可にした形になる。
   - 工場には、この型（11 周目の #52）を見つける検出がある（`src/classify.ts` の `undecidedInRequest`）。承認の要約の「Undecided in the spec, but the request may decide it」に出す仕組みだが、今回は 0 件だった。検出は Undecided の項目が端点（`POST /reports` など）を名指していることを条件にしており、この項目は端点を書いていないので対象外になった（工場の da3de63 で読んだ）。
   - ゲートの読みはこの項目に触れていた（`screen-specs` の読みは「依頼文が決めているがシナリオが確かめていない Undecided」、`screen` の読みは E4 型として）。どちらも「承認してよい」とした。系列 O が測るのは下書き役のふるまいそのものなので、承認したことは規則に沿っている。

扱い:

- 期待値の誤りではないので、12 周目の errorsRule では Q から除かない。表の Q（96.2 %）はこのシナリオを含む。
- 参考に、このシナリオを `--errors` で除いた Q も出した（一時ファイルで渡し、状態ディレクトリには置いていない）。shop-expense-rooms の借りた組は opus・sonnet とも 100.0 %、Q も 100.0 % になる。どちらで読んでも天井で、系列 O を閉じる結論は変わらない。
- **L1 の同じ落ちも同じ形だった。** L1 の shop-expense（cx-p の `report-calendar-and-type-validation` 段 7、sonnet 4 build と opus 3 build が落ちた）の仕様にも、Undecided に「Whether `note` may be omitted, or must be present (possibly as an empty string).」がある（`.factory-cal80-o1` の `vault/shop-expense-cc-p/spec.md`。cx-p も同じ）。[l1-report.md](l1-report.md) はこれを作る役の落ちとして数えたが、作る役に渡った仕様が Undecided にしていた点として読み直すのが正しい。L1 の Q はこの読み直しでは変わらない（期待値の誤りではないので）。
- 検出の条件を広げるか（端点を名指さない項目も、依頼文の本文の形と照らす）は工場の変更で、起票するかは窓口が決める。

## L1 の shop-expense との違い

L1 で sonnet が 85.6 % だった shop-expense は、L2 の shop-expense-rooms では 96.2 % だった。事実として並べる（原因は断定しない）。

| | L1 shop-expense | L2 shop-expense-rooms |
|---|---|---|
| 依頼 | cart-checkout + expense-wizard（1,798 語） | 同じ 2 本 + room-slots（2,693 語） |
| シナリオ（自組 / 借りた組） | 15 / 12（画面のシナリオ 5 / 4） | 14 / 13（画面のシナリオ 4 / 4） |
| sonnet の Q（自組 / 借りた組 / Q） | 90.0 / 81.3 / 85.6 | 100.0 / 92.3 / 96.2 |
| sonnet の落ち | `note` の段のほか、build 2 の画面の段 9 本、build 4 の画面の段 2 本 | `note` の段だけ（4 build とも） |
| opus の Q | 96.9 | 96.2 |

- L2 の sonnet の 4 build は、画面のシナリオ 8 本をすべて通した。L1 で下げの多くを作った build 2 のような、画面がほぼ使えない build は出なかった。
- 依頼・仕様・シナリオがすべて違い、各 4 build なので、L1 の 85.6 % が 1 build の重み（[l1-report.md](l1-report.md)「sonnet の shop-expense の落ち」）だったのか、L2 の題材や仕様の違いなのかは、この結果では分けられない。

## ゲートの承認

- ゲート `screen-specs`（版 944cc53b…、20:35）と `screen`（版 ae307df7…、21:21）は、どちらも窓口が承認した（design.md の「ゲートの承認は窓口」）。
- 読みの結論は、6 組とも承認してよい、期待値の誤りは 0、どの build も通らない段は 0、L1 の X 型（配列でない所への `length`）は 0、待ちを抜いた画面の段は 0、というものだった。
- 読みが挙げた灰色の点（U 型・G 型・E4 など）のうち、実際に落ちが出たのは上の E4（`note`）だけだった。最も重いと読んだ shop-expense-rooms の G1（cc-p の `coupon-problems-rechecked` 段 2）・G-A・G-B（cx-p）では、8 build とも落ちなかった。

## オーナーに諮る項目（未決）

design.md「段の進め方」の 4 のとおり、次の 2 つは窓口からオーナーに諮る。どちらもオーナーの判断はまだ出ていない。

1. **L3（4 本を合わせる、約 3,300 語）を書くか。** design.md は「オーナーに諮るまで書かない」としている。L2 の opus の build は最も重くて $1.32 で、作る役の 1 呼び出しの上限（$5・20 分）までは余裕があった。一方、シナリオの本数が大きさで増えていないので、L3 にしても Q が下がりにくい形は残る。
2. **作る役を Haiku の世代にするか（K2、工場の変更 C）。** design.md は「2 系列のどちらも窓に届かなかったときに諮る」としている。系列 O は窓に届かずに閉じた。系列 S（段 S0〜S2）の結果はこの報告に入れていないので、K2 の条件がそろったかは、系列 S の結果と合わせて決まる。

## 計測: 費用（lap 台帳）

lap 台帳（`.factory-cal80-o2/lap-ledger.jsonl`、254 行）の終わりの行（`usd` の行）127 個を、役とモデルで数えた。段 S3 の sonnet の build も同じ台帳に入っている。

| 役 | モデル | 費用 | 回数 |
|---|---|---|---|
| 隔離の確認 | claude-opus-5-5 / claude-opus-4-8 | $0.55（$0.31 / $0.24） | 2（1 回目は落ちた） |
| 仕様の下書き役 | claude-opus-5-5 | $1.43 | 5（却下された 2 回を含む） |
| シナリオの下書き役 | claude-opus-5-5 | $6.18 | 10（同上） |
| シナリオの下書き役 | gpt-6-astra | （数えた呼び出し） | 5 |
| 分類 | claude-opus-5-5 | $11.45 | 81 |
| 作る役（系列 O の L2） | claude-opus-5-5 | $10.96 | 12 |
| 作る役（段 S3） | claude-sonnet-5-5 | $4.08 | 12 |
| **合計（Claude）** | | **$34.65** | |
| **合計（Codex）** | | | **5 回** |

- 系列 O の L2 は $30.57 で、design.md の見込み（約 $39、悪い場合 約 $69）の内側、止める線（$75）の下だった。段 S3 の L2 は $4.08 で、見込み（約 $5.4）の内側だった。
- 依頼ごと（下書き・分類 + opus 4 build）は stock-tasks-library $7.95、pay-ship-invoice $11.77（却下された 2 回の下書きを含む）、shop-expense-rooms $10.30。見込み（1 依頼 約 $13、悪い場合 約 $23）の内側である。
- opus の 1 build は $0.63〜$1.32（平均 $0.91）。L1（平均 $0.72）の約 1.3 倍、12 周目の L0（平均 $0.49）の約 1.9 倍で、design.md の見込み（L0 の 3 倍）より軽い。最も重いのは shop-expense-rooms の 4 build（$1.22〜$1.32）で、L2 の止める線（$5）には遠い。
- sonnet の 1 build は $0.24〜$0.52（平均 $0.34）で、同じ依頼の opus の約 37 % だった。見込み（$0.45）の内側である。
- 系列 O（L1 $24.84 + L2 $30.57）は $55.41、段 S3（L1 $3.01 + L2 $4.08）は $7.09。2 つの状態ディレクトリの合計は $62.50 で、2 系列の合計の止める線（$170）の下にある（系列 S の段 S0〜S2 の費用は入れていない）。
- 計上できなかったもの: 実行担当・窓口の費用、Codex の下書きの金額（課金は ChatGPT アカウント側）、ゲートの読みの費用。

## 何が言えないか（既知の限界）

- **3 依頼 × 4 build と少ない。** 統計的な検定はしていない。
- **シナリオの本数が増えていない。** 依頼が約 3 倍でも、シナリオは 12〜15 本で、L0・L1 とほぼ同じだった。規則あたりの確かめは L1 よりさらに薄く、Q が下がりにくい形になっている可能性がある。opus の天井は「この本数のシナリオで測った」天井である。
- **系列 O は、大きさと題材を同時に変えている。** L2 は部品の間の絡み（27〜29 組）も持つ。天井は「L2 の作り方で合わせた依頼」についての結果である。
- **全員が落ちた 1 本の読みは、仕様の文言の読みである。** 8 build のコードで `note` の扱いを確かめたわけではない（201 を返したことと、仕様の Undecided の項目から読んだ）。
- **依頼は作成担当（Claude）が書いた。** 部品の間の規則の選び方が Claude の作る役に有利だった可能性がある（10〜12 周目と同じ限界）。
- **前提 1 の問いには答えていない。** 較正は予備選別だけで、本番は流していない。
- 8〜12 周目から引き継いでいる限界（系統 = 1 モデルずつ、Codex の答えたモデルは確かめられない、Codex の費用は回数だけ、lap 台帳にロックが無い）。

## 同じディレクトリのファイル

- [design.md](design.md): 較正の設計（2 系列、目標の窓、落ちの質、費用の線）。
- [l1-report.md](l1-report.md): 系列 O の L1 と段 S3 の途中報告。
- [l2-requests.md](l2-requests.md)・[requests/](requests/)・[cal80-o2.json](cal80-o2.json): L2 の依頼文と lap の定義。
- [tools.md](tools.md)・[arms.ts](arms.ts)・[screen.json](screen.json): 較正の道具と選ぶ規則。
