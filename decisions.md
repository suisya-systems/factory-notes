# 決定の記録

新しい決定を下に足す。決定を覆すときは、元の項目を消さずに新しい項目で「何を置き換えるか」を書く。

## 2026-10-17

### 目標は L5「Dark Factory」とする

仕様を入れると動くソフトウェアが出てくる。人はコードを書かず、レビューも承認もしない。この状態を目標にする。

- 定義: Dan Shapiro の 5 段階の最上位（https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/ ）。
- 実例: StrongDM は「人がコードを書かない」「人がコードをレビューしない」を規則にして運用している（https://factory.strongdm.ai/ ）。

### L5 は claude-org の外に作る

claude-org は L3〜L4 の作業場のまま残し、そこで L5 を作る。claude-org は人の判断を前提に組まれており、それを L5 に作り変えるより、外に新しく作るほうが筋がよい。現状の距離は [research/l5-gap-audit-2026-10-17.md](research/l5-gap-audit-2026-10-17.md) を参照。

### Claude の動かし方: 個人運用は `claude -p`、組織運用で Agent SDK に替える

モデルを呼ぶ部分は「アダプタ」（差し替え用の部品）1 か所に閉じ込める。個人で回す間は、アダプタの中身を `claude -p`（Claude Code を画面なしで動かすモード）にする。組織として回すときに、アダプタの中身を Agent SDK（Claude Code をプログラムから呼ぶためのライブラリ）に替える。

理由:

- `-p` は「CLI から使う Agent SDK」と説明されている。中身は同じものなので、あとで替えても挙動の差が小さい（https://code.claude.com/docs/en/headless ）。
- Agent SDK は Claude Code の実行ファイルをライブラリとして動かす（https://code.claude.com/docs/en/agent-sdk/overview ）。
- 第三者が自分の製品の中で claude.ai のログインや利用枠を使わせることは、承認なしにはできない。製品にするなら API キーで動かすことになる（同じ URL）。
- `--bare` は契約者のログインを使わない。`--bare` は今後 `-p` の既定になる予定とされている（https://code.claude.com/docs/en/headless ）。

### rondo の実走予算は当面 $500 のまま

rondo は手元の開発スタックの一部で、人の依頼を受けてワーカーを回す役。その実走の予算は、全体で $500 のまま据え置く。L5 の費用の見立てを見てから、オーナーが増やすかどうかを決める。見立ては [research/l5-gap-audit-2026-10-17.md](research/l5-gap-audit-2026-10-17.md) の「(b) 費用」にある。

### 次の一手の提案（未承認）

小さな練習用アプリで、最小の L5 の流れを 1 周作る。

1. 仕様と、隠しておく確認用の筋書き（holdout シナリオ）を書く。
2. エージェントが作る。
3. エージェントには見せていない筋書きで判定する。
4. 合格したら出荷する。

1 周できたら、既存スタックの部品（continuo / rondo / cadenza）を差し込めるかを試す。まだ承認されていない。
