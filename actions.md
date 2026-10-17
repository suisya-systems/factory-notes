# 行動と状態

状態が変わったら行を書き換え、変わった日を「更新日」に書く。

| 行動 | 中身 | 状態 | 更新日 |
|---|---|---|---|
| [continuo#275](https://github.com/suisya-systems/continuo/issues/275) | 起動の指定を、特定のモデルに依存しない形にする | Issue は open | 2026-10-17 |
| [rondo#714](https://github.com/suisya-systems/rondo/issues/714) | 下書き役とレビュー役を、アダプタ経由で起動する | Issue は open | 2026-10-17 |
| [rondo#715](https://github.com/suisya-systems/rondo/issues/715) | 実行記録の読み取りを continuo 経由にする | Issue は open | 2026-10-17 |
| [claude-org-ja PR #1166](https://github.com/suisya-systems/claude-org-ja/pull/1166) | Codex レビューの回数上限をワーカーの外で守らせる。ワーカーの既定モデルを Sonnet にする。claude-org 側の変更で、L5 そのものとは別。マージ先は `modernize/prompts-2026-10`（claude-org-ja の指示書・スキル近代化の統合ブランチ） | マージ済み（2026-10-17） | 2026-10-17 |
| 最小の L5 の試作 | 小さな練習用アプリで、仕様と隠しシナリオ → 作る → 隠しシナリオで判定 → 出荷、を 1 周回す | 1 周目を実行し合格・出荷（suisya-systems/factory PR #1 マージ、報告は factory の docs/lap-1-report.md） | 2026-10-17 |
| [suisya-systems/factory PR #2](https://github.com/suisya-systems/factory/pull/2) | 2 周目: 下書き役を 2 つに分け、仕様から読み取れるかを独立に判定 | PR は open、マージ判断待ち。練習用アプリ（suisya-systems/factory-practice-memo）の main には 2 周目の出荷が入っている（commit b36ad38） | 2026-10-17 |
| [design/grand-design.md](design/grand-design.md) | L5 工場の骨組みだけの全体設計を書く。要判断 2 件（判定の形、本番シグナルが人の承認を通るか） | 要判断 2 件はオーナーが決定済み（[decisions.md](decisions.md)） | 2026-10-17 |

背景: continuo#275 / rondo#714 / rondo#715 の 3 件は、Claude の呼び出しを Agent SDK に差し替える前に直すもの（[research/adapter-boundary-audit-2026-10-17.md](research/adapter-boundary-audit-2026-10-17.md)）。
