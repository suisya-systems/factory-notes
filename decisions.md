# 決定の記録

新しい決定を下に足す。決定を覆すときは、元の項目を消さずに新しい項目で「何を置き換えるか」を書く。

## 2026-10-17

### 目標は L5「Dark Factory」とする

仕様を入れると動くソフトウェアが出てくる。人はコードを書かず、レビューも承認もしない。この状態を目標にする。

- 定義: Dan Shapiro の 5 段階の最上位（https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/ ）。
- 実例: StrongDM は「人がコードを書かない」「人がコードをレビューしない」を規則にして運用している（https://factory.strongdm.ai/ ）。

### L5 は claude-org の外に作る

[claude-org](glossary.md#人と仕組み) は、Shapiro の 5 段階（[research/software-factory-landscape.md](research/software-factory-landscape.md) の「世の中はどこまで来ているか」）でいう L3〜L4 の作業場のまま残し、そこで L5 を作る。claude-org は人の判断を前提に組まれており、それを L5 に作り変えるより、外に新しく作るほうが筋がよい。現状の距離は [research/l5-gap-audit-2026-10-17.md](research/l5-gap-audit-2026-10-17.md) を参照。

### Claude の動かし方: 個人運用は `claude -p`、組織運用で Agent SDK に替える

モデルを呼ぶ部分は「アダプタ」（差し替え用の部品）1 か所に閉じ込める。個人で回す間は、アダプタの中身を `claude -p`（Claude Code を画面なしで動かすモード）にする。組織として回すときに、アダプタの中身を Agent SDK（Claude Code をプログラムから呼ぶためのライブラリ）に替える。

理由:

- `-p` は「CLI から使う Agent SDK」と説明されている。中身は同じものなので、あとで替えても挙動の差が小さい（https://code.claude.com/docs/en/headless ）。
- Agent SDK は Claude Code の実行ファイルをライブラリとして動かす（https://code.claude.com/docs/en/agent-sdk/overview ）。
- 第三者が自分の製品の中で claude.ai のログインや利用枠を使わせることは、承認なしにはできない。製品にするなら API キーで動かすことになる（同じ URL）。
- `--bare` は契約者のログインを使わない。`--bare` は今後 `-p` の既定になる予定とされている（https://code.claude.com/docs/en/headless ）。

### rondo の実走予算は当面 $500 のまま

rondo は手元の開発スタックの一部で、人の依頼を受けてワーカーを回す役（[用語集](glossary.md#人と仕組み)）。$500 は、rondo の実走にかける全体の予算として、2026-09-28 にオーナーが承認した額。この予算を据え置く。L5 の費用の見立てを見てから、オーナーが増やすかどうかを決める。見立ては [research/l5-gap-audit-2026-10-17.md](research/l5-gap-audit-2026-10-17.md) の「(b) 費用」にある。

### 試作の判定は、決定的テスト + LLM 判定 1 回にする

隠しシナリオ（作る側のエージェントに見せず、判定にだけ使う確認用の筋書き。[用語集](glossary.md#工場の言葉)）を決定的なテストとして走らせ、LLM の判定を 1 回付ける。見立ては 1 変更 $7〜24 で、$500 なら 20〜70 変更（[research/l5-gap-audit-2026-10-17.md](research/l5-gap-audit-2026-10-17.md) の「(b) 費用」）。エージェントにユーザー役をさせる満足度判定は L5 の本来の姿に近いが、検証だけで 1 変更 $30〜120 かかるので、試作では採らない。詳細は [design/grand-design.md](design/grand-design.md) の決定 1。

### 本番シグナルから生まれた仕事も、入口で人の承認を通す

本番の様子から出た仕事も、下書き役が仕様とシナリオに変え、通常の入口として人が承認する。人の関わりを入口の承認に揃えるため。下書き役・作る役は工場の役割で、[design/grand-design.md](design/grand-design.md) の 2 章で定義している。輪は入口から本番を見て次の仕事へ戻る 1 周（同 1 章）。本番の情報がシナリオを経て作る役へ漏れる経路も、入口で一度切れる。代わりに、輪は人の承認を待ち、自動では閉じない。詳細は [design/grand-design.md](design/grand-design.md) の決定 2。

### 次の一手の提案（未承認）

小さな練習用アプリで、最小の L5 の流れを 1 周作る。

1. 仕様と、隠しておく確認用の筋書き（holdout シナリオ）を書く。
2. エージェントが作る。
3. エージェントには見せていない筋書きで判定する。
4. 合格したら出荷する。

1 周できたら、既存スタックの部品（continuo / rondo / cadenza。[用語集](glossary.md#人と仕組み)）を差し込めるかを試す。まだ承認されていない。

### シナリオの下書き役に渡すのは、依頼文・既存アプリの現コード・インタフェースだけにする

シナリオの下書き役に渡すのは依頼文・既存アプリの現コード（読むだけ）・[インタフェース](glossary.md#工場の言葉)（名前と形）だけにし、仕様の下書き役の仮定の文は渡さない（オーナー判断）。理由: 仮定の文に規則がほぼすべて入り、14 本すべてが仕様から読み取れた（2 周目の最初の下書き memo-tags-1。報告は [laps/lap-2-report.md](laps/lap-2-report.md)）。詳細は [design/grand-design.md](design/grand-design.md) の 2 章。
