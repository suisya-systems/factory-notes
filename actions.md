# 行動と状態

状態が変わったら行を書き換え、変わった日を「更新日」に書く。

| 行動 | 中身 | 状態 | 更新日 |
|---|---|---|---|
| [continuo#275](https://github.com/suisya-systems/continuo/issues/275) | 起動の指定を、特定のモデルに依存しない形にする | Issue は open | 2026-10-17 |
| [rondo#714](https://github.com/suisya-systems/rondo/issues/714) | 下書き役とレビュー役を、アダプタ経由で起動する | Issue は open | 2026-10-17 |
| [rondo#715](https://github.com/suisya-systems/rondo/issues/715) | 実行記録の読み取りを continuo 経由にする | Issue は open | 2026-10-17 |
| [claude-org-ja PR #1166](https://github.com/suisya-systems/claude-org-ja/pull/1166) | Codex レビューの回数上限をワーカーの外で守らせる。ワーカーの既定モデルを Sonnet にする。claude-org 側の変更で、L5 そのものとは別 | `modernize/prompts-2026-10`（claude-org-ja の指示書・スキル近代化の統合ブランチ）にマージ済み（2026-10-17）。統合ブランチごと [PR #1174](https://github.com/suisya-systems/claude-org-ja/pull/1174) で main に入った（2026-10-18） | 2026-10-18 |
| [claude-org-ja Issue #1167](https://github.com/suisya-systems/claude-org-ja/issues/1167) | claude-org を L4（仕様を渡し、テストで完了を確かめる）にする | 第 1 段（`tools/acceptance_gate.py`）を [PR #1176](https://github.com/suisya-systems/claude-org-ja/pull/1176) でマージ。残りはマージ前フック・指示書・スキル文面 | 2026-10-18 |
| [claude-org-ja Issue #1168](https://github.com/suisya-systems/claude-org-ja/issues/1168) | ディスパッチャーの監視ループが止まったまま運転が続いても気づけない問題を、窓口のフックで外から検出する | [PR #1173](https://github.com/suisya-systems/claude-org-ja/pull/1173) で直し、[PR #1174](https://github.com/suisya-systems/claude-org-ja/pull/1174) で main に入って close（2026-10-18） | 2026-10-18 |
| [claude-org-ja Issue #1175](https://github.com/suisya-systems/claude-org-ja/issues/1175) | 窓口とディスパッチャーの文脈が閾値を超えたら、自動で引き継ぎ・復帰する | Issue は open | 2026-10-18 |
| 最小の L5 の試作（周回） | 小さな練習用アプリで、仕様と隠しシナリオ → 作る → 隠しシナリオで判定 → 出荷、を回す。記録は [laps/README.md](laps/README.md) | 1〜7 周目は実行・報告済み。工場の変更は周ごとの PR（[#1](https://github.com/suisya-systems/factory/pull/1)、[#2](https://github.com/suisya-systems/factory/pull/2)、[#3](https://github.com/suisya-systems/factory/pull/3)、[#5](https://github.com/suisya-systems/factory/pull/5)、[#8](https://github.com/suisya-systems/factory/pull/8)、[#10](https://github.com/suisya-systems/factory/pull/10)、[#14](https://github.com/suisya-systems/factory/pull/14)）で、すべてマージ済み。7 周目は完了・報告は [laps/lap-7/report.md](laps/lap-7/report.md)（要約あり 4 run すべて出荷、要約なし 4 run すべて上限で停止）。7 周目の工場の変更（PR #14）は、要約を返さない対照の run（`run --feedback bare`）と、少数派の選び方を下書き役に指示する `draft --minority-brief` | 2026-10-18 |
| [suisya-systems/factory PR #6](https://github.com/suisya-systems/factory/pull/6) | 工場の CI を足す（push と PR で `npm test` を走らせる） | マージ済み（2026-10-17） | 2026-10-17 |
| [suisya-systems/factory PR #9](https://github.com/suisya-systems/factory/pull/9) | 作ったアプリを loopback だけのネットワークで動かし、外への通信を止める（[Issue #7](https://github.com/suisya-systems/factory/issues/7) を close） | マージ済み（2026-10-18） | 2026-10-18 |
| [suisya-systems/factory PR #11](https://github.com/suisya-systems/factory/pull/11) | 1 周をコマンド 1 つで回す（`factory lap <定義>`） | マージ済み（2026-10-18） | 2026-10-18 |
| [suisya-systems/factory PR #12](https://github.com/suisya-systems/factory/pull/12) | 周の記録を factory-notes の laps/ に移し、工場には英語の周の定義の例だけを残す | マージ済み（2026-10-18） | 2026-10-18 |
| [suisya-systems/factory Issue #13](https://github.com/suisya-systems/factory/issues/13) | 1 周の中の独立した run を並列に流す（先に費用の記録を追記式にする） | 着手 | 2026-10-18 |
| 部品の組み込み | 部品の組み込みは現状行わない。決定は [decisions.md](decisions.md)（factory-notes PR #13） | 決定済み | 2026-10-18 |
| [article-outline.md](article-outline.md) | オーナーの記事の骨組み | factory-notes の PR #14 / #15 で追加・修正済み | 2026-10-18 |
| [suisya-systems/factory Issue #4](https://github.com/suisya-systems/factory/issues/4) | 判定役で画面（ブラウザ）の E2E シナリオを扱う。道具は Playwright のライブラリを直接使う方向（[research/headless-browsers-for-judge.md](research/headless-browsers-for-judge.md)） | Issue は open、実装は未着手 | 2026-10-18 |
| [design/grand-design.md](design/grand-design.md) | L5 工場の骨組みだけの全体設計を書く。要判断 2 件（判定の形、本番シグナルが人の承認を通るか） | 要判断 2 件はオーナーが決定済み（[decisions.md](decisions.md)）。7 章（置き場所と仕様リポジトリ、振る舞いを変える変更）を、オーナーと合意した方向として追記 | 2026-10-18 |
| 公開の準備 | 関連リポジトリを公開する前に、全履歴で秘密情報を点検する。公開の切替はオーナーの最終確認後（[decisions.md](decisions.md)） | 4 リポジトリの全履歴点検を実施し、手元の絶対パスと勤務先メールを全履歴から書き換えて強制 push 済み。オーナーが 4 リポジトリ（factory / factory-notes / factory-practice-memo / factory-practice-split）を公開に切り替えた（gh で PUBLIC を確認済み）。完了 | 2026-10-18 |
| オーナーの記事 | オーナーが記事を書く | 2026-10-25 の予定 | 2026-10-18 |

背景: continuo#275 / rondo#714 / rondo#715 の 3 件は、Claude の呼び出しを Agent SDK に差し替える前に直すもの（[research/adapter-boundary-audit-2026-10-17.md](research/adapter-boundary-audit-2026-10-17.md)）。
