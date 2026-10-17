# 用語集

このリポジトリの文書に出てくる言葉と、手元の開発スタックの言葉をまとめる。各文書は初出でここへリンクする。

出典の書き方: `repo:path:line` はそのリポジトリの既定ブランチ上の位置。`rondo:DECISIONS.md` などは各リポジトリの決定記録。読んだコミットは rondo 0dbda6c / continuo e74526e / cadenza 9b498a7。

## 人と仕組み

- オーナー: このリポジトリの持ち主で、最終判断をする人。予算や方針を決める。
- claude-org: オーナーが使っている既存の開発組織。Claude Code のワーカーを並べて開発を進める。人が仕事を投入し判断する前提で動く。L5 を作る作業場として使う（[decisions.md](decisions.md)）。
- 後継スタック / 既存スタック / 手元の開発スタック: claude-org の後を継ぐ形で作っている 3 つのリポジトリ（rondo / continuo / cadenza）の組。文書によって呼び方が違うが同じものを指す。
  - rondo: 人が話しかける常駐の本体。1 行の依頼を実行に変え、関門ごとに人へ可否を戻す。cadenza をライブラリとして使い、continuo を子プロセスとして動かす（rondo:README.md:3）。人はページ（画面）から操作する（rondo:DECISIONS.md の D-0041）。
  - continuo: エージェント組織の実行基盤。TypeScript で書かれた interlock（前身の基盤）の移植で、耐久性のある制御面、計測の仕組み、役割ごとの囲い込み（fencing）を持つ（continuo:README.md:3-4）。lap を 1 本走らせるのは `lap perform`（continuo:README.md:31）。
  - cadenza: interlock の上に乗る業務の層。プロジェクトの登録簿（打った名前がどのプロジェクトか、実行に要る事実は何か）と、委任の取り決め（実行が何をしてよいか、誰の権限か）を持つ（cadenza:README.md:3-11）。

## 段階

- L0〜L5: Dan Shapiro が名付けたソフトウェア開発の自動化の 5 段階（L0 から数えて最上位が L5）。各段の中身は [research/software-factory-landscape.md](research/software-factory-landscape.md) の「世の中はどこまで来ているか」にある。
- L5（Dark Factory）: 仕様を入れると動くソフトウェアが出てくる状態。途中で人はコードを書かず、レビューも承認もしない。

## 決定記録

- D-0173 などの番号: 各リポジトリの DECISIONS.md（決定記録）の項目番号。リポジトリごとに別の連番なので、`rondo:D-0173` のようにリポジトリ名を付けて読む。
- r3.4 など: 同じ決定の中の項番号（rule 3.4）。例えば「D-0064 r3.4」は rondo の D-0064 の第 3.4 項。「決定5」も同じく決定の中の第 5 項。
- supersede: 新しい決定で古い決定を置き換えること。

## 流れの言葉（主に rondo と continuo）

- lap: 依頼 1 件に対してエージェントを 1 回走らせる単位。continuo の `lap perform` が 1 本を実行し、終わりに人向けの関門を開く（continuo:README.md:31）。
- goal: オーナーが書く目標。条項の並びで、各条項は「人の言葉での条項」（said）と「何が起きていたら未達か」（unmetIf）の組（rondo:src/store/records.ts:2140-2147）。
- goal scope: goal から rondo が自動で投入する依頼を、まとめて任せる範囲（rondo:DECISIONS.md の D-0128）。
- scope: 人が 1 回承認し、その中は組織に任せる範囲。期限・lap 数・費用の予算を持つ（rondo:DECISIONS.md の D-0064、rondo:src/access/scope.ts:504-534）。
- approver: rondo で関門に答える人として指名された人。ページから書き込めるのは approver だけ（rondo:DECISIONS.md の D-0041）。誰も指名せずに起動したときは、ページから 1 回だけ指名できる（同 D-0196）。
- triage: rondo が次に頼むべき依頼の候補を goal の条項に照らして並べ、推奨を 1 件出すこと。提案だけで、自分では始めない（rondo:DECISIONS.md の D-0097、rondo:src/advisory/triage.ts:1-21）。
- shape reading: rondo の決定的な読み取り。コミットの件名とファイルごとの行数だけを見て、「コミットがあるか、ファイルが変わったか」という形だけを判定する。中身の正しさは見ない（rondo:src/access/review.ts:22-29）。
- stall: lap の次の動きが、その lap が宣言した待ち時間を過ぎても来ないこと（rondo:DECISIONS.md:16015、D-0068）。
- widening: 任された範囲を広げること。
- lane ledger: rondo で、並行して走る作業の線ごとにファイルの範囲を割り当てる台帳。範囲が重ならない線だけを同時に走らせる（rondo:DECISIONS.md の D-0073）。

## 工場の言葉

- holdout / 隠しシナリオ: 作る側のエージェントに見せず、判定にだけ使う確認用の筋書き。
- twin: 外部サービスを模した偽物。その上で試すために立てる。
- 下書き役・作る役・判定役・出荷役: 工場の 4 つの役割。[design/grand-design.md](design/grand-design.md) の 2 章で定義している。
- 輪: 入口 → 作る → 確かめる → 出す → 本番を見る → 次の仕事、の 1 周。[design/grand-design.md](design/grand-design.md) の 1 章。
- インタフェース: 仕様の下書き役がシナリオの下書き役へ渡す、名前と形だけのブロック。エンドポイント、パラメータ名、フィールド名などを含み、振る舞いの規則は含まない。[design/grand-design.md](design/grand-design.md) の 2 章。
- 独立した分類: シナリオが仕様から読み取れるかを判定する手続き。仕様と既存コードだけを見た別セッションが各要求への応答を予測し、シナリオの期待値と機械的に照合する。[design/grand-design.md](design/grand-design.md) の 2 章。
- 食い違い一覧: 入口の要約に載せる、仕様とシナリオが食い違うものの一覧。仕様と食い違うものと、仕様が決めていないことを求めるものの 2 部に分ける。[design/grand-design.md](design/grand-design.md) の 2 章。
- 変更 id（memo-tags-1 など）: 試作で 1 回分の下書き（仕様とシナリオの組）に付ける名前。memo-tags-1 は 2 周目の最初の下書き（仮定の文を渡した形）、memo-tags-2 は仮定の文を渡さない形で出し直した下書き。結果は suisya-systems/factory の docs/lap-2-report.md にある。
