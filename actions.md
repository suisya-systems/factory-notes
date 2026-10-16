# 行動と状態

状態が変わったら行を書き換え、変わった日を「更新日」に書く。

| 行動 | 中身 | 状態 | 更新日 |
|---|---|---|---|
| [continuo#275](https://github.com/suisya-systems/continuo/issues/275) | 起動の指定を、特定のモデルに依存しない形にする | Issue は open | 2026-10-17 |
| [rondo#714](https://github.com/suisya-systems/rondo/issues/714) | 下書き役とレビュー役を、アダプタ経由で起動する | Issue は open | 2026-10-17 |
| [rondo#715](https://github.com/suisya-systems/rondo/issues/715) | 実行記録の読み取りを continuo 経由にする | Issue は open | 2026-10-17 |
| [claude-org-ja PR #1166](https://github.com/suisya-systems/claude-org-ja/pull/1166) | Codex レビューの回数上限をワーカーの外で守らせる。ワーカーの既定モデルを Sonnet にする。マージ先は近代化の作業ブランチ | PR は open、CI 成功、マージ判断待ち | 2026-10-17 |
| 最小の L5 の試作 | 小さな練習用アプリで、仕様と隠しシナリオ → 作る → 隠しシナリオで判定 → 出荷、を 1 周回す | 提案のみ、未着手（[decisions.md](decisions.md)） | 2026-10-17 |

背景: 上の 3 件は、Claude の呼び出しを Agent SDK に差し替える前に直すもの（[research/adapter-boundary-audit-2026-10-17.md](research/adapter-boundary-audit-2026-10-17.md)）。
