# factory-notes

ソフトウェア工場の「L5」を作るための調査と行動の記録を置くリポジトリ。非公開。

## 何を目指しているか

L5 は、仕様を入れると動くソフトウェアが出てくる状態を指す。途中で人はコードを書かず、レビューも承認もしない。Dan Shapiro が 5 段階の自動化レベルの最上位として名付けた（https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/ ）。

この L5 は claude-org の外に作る。claude-org は、Claude Code のワーカーを並べて開発を進める既存の組織の仕組みで、人が仕事を投入し判断をする前提で動いている。claude-org は L5 そのものにはならず、L5 を作る作業場として使う。理由と経緯は [decisions.md](decisions.md) にある。

## ファイルの置き方

- `README.md`: このファイル。全体の説明と目次。
- `decisions.md`: 決めたことを日付順に並べた記録。何を決めたか、なぜか、まだ決めていないことは何か。
- `actions.md`: 起こした行動（Issue や PR）と、その状態の一覧。
- `glossary.md`: 用語集。各文書の言葉と、手元の開発スタックの言葉の意味。
- `design/`: 工場の設計。
- `research/`: 調べた結果。1 回の調査で 1 ファイル。ファイル名の末尾に調査日を付ける。

事実には出典を同じ箇所に書く。出典は URL か、`repo:path:line` の形のコード位置。

## 目次

- [decisions.md](decisions.md): 決定の記録
- [actions.md](actions.md): 行動と状態の一覧
- [glossary.md](glossary.md): 用語集（オーナー、claude-org、rondo / continuo / cadenza、D-xxxx の番号、lap など）
- [research/software-factory-landscape.md](research/software-factory-landscape.md): 「ソフトウェア工場」という言葉の使われ方と、世の中の到達点
- [research/l5-gap-audit-2026-10-17.md](research/l5-gap-audit-2026-10-17.md): 手元の開発スタックが L5 からどれだけ遠いか
- [research/adapter-boundary-audit-2026-10-17.md](research/adapter-boundary-audit-2026-10-17.md): `claude -p` 固有の作りが、差し替え用の部品の外に漏れていないか
- [design/grand-design.md](design/grand-design.md): L5 工場の全体設計（骨組みだけ。後から変えにくい線と要判断）
