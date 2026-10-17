# 既存スタックの部品を工場に組み込むか（2026-10-18）

## 要約

- 推奨は 1 つ。次の周からも、工場本体は continuo / cadenza / rondo への依存を 0 のまま保つ（組み込まない）。部品ごとの再検討の条件は末尾に置いた。
- 「組み込まない」は今決められる。取り消しが効き、7 周分の実走を何も変えない。「どの部品をどの形で組み込むか」は今は決められない。
- 組み込まない側の支柱は 3 本。原本で直接確かめた強い支柱は 1 本（`lap perform` の終わりが必ず人向けの関門になること）で、残る 2 本は条件付きか推論。
- 反対側の最も強い論点は、並列実行に要る追記式の記録を工場が自作することになる点。continuo は書き手を決めた SQLite の制御面を持つ。
- ただし continuo の「計測」は、工場が欲しい費用の全量計上にはならない。この点は組み込む側の利点に数えていない。

## 何を比べるか

「組み込む」は、工場が部品を依存として呼ぶこと（subprocess、または固定した tarball）。コードを写す形は、二重保守の項で別に扱う。依存か写しかは 2 周目に入る時点で決めると設計に書いてあり（factory-notes:design/grand-design.md:150）、決定記録の「差し込めるかを試す」は未承認のまま（factory-notes:decisions.md:50）。この文書はその判断材料である。

読んだ版:

- factory は 78e49a5（PR #14 のマージ）。ローカルの `main` は初期コミットのままだったので、`factory-prepublish-audit` の worktree を読んだ。gh が使えず、GitHub 上の現在の状態は読み直していない。
- continuo は e74526e、cadenza は 9b498a7、rondo は 0dbda6c（[用語集](../glossary.md) の読んだコミットに合わせた）。
- 行動の状態（continuo#275 など）は factory-notes:actions.md:7-9 の 2026-10-17 時点のまま。

## 部品ごとの比較

### 1. continuo の制御面（run admit / lap perform / gate、SQLite の記録、lease）

組み込む利点:

- 並列に耐える記録を借りられる。工場の lap 台帳は lock を取らずに読んで書き戻しており、並列に耐えない（factory:src/limits.ts:47-48、factory-notes:design/grand-design.md:168）。並列の run を流す factory#13 は、先に費用の記録を追記式にする必要がある（factory-notes:actions.md:19）。continuo は lease の書き手を「取得した側」1 つに決めている（continuo:docs/lease-fencing.md:28-30）。

組み込む欠点:

- `lap perform` は終わりに人向けの関門を開く。空でもエラーでもない最終報告は、常にエスカレーションとして扱う（continuo:src/control_plane/report_ingress.ts:35-39、continuo:README.md:31）。設計が「持っていかない」と書いた人へ戻る経路そのもの（factory-notes:design/grand-design.md:141）。使うなら `lap perform` を呼ばず、下の部品だけを取り出すことになる。取り出せるかは確かめていない。
- 使う前に `db create` と `run admit` が要る（continuo:README.md:29-30）。工場の 1 周は定義ファイル 1 つで回る（factory:README.md:6）ので、手順が増える。
- 未公開で、ネイティブ依存を持つ。`package.json` は `private: true`、レジストリには無い（continuo:README.md:15-17）。`better-sqlite3` の prebuilt binary に依存し、Node は奇数の主版を除く範囲に限られる（continuo:README.md:82,91-96）。工場は依存ゼロで、Node は 22.17 以上（factory:package.json:5-8）。

組み込まない利点:

- 依存ゼロのまま 7 周を実走した（factory-notes:actions.md:14）。
- 周の記録と機能を分けて工場を配れるようにした方針（factory-notes:decisions.md:75）と食い違わない。

組み込まない欠点:

- 追記式の費用記録を自作する。作るべきものは、1 呼び出し 1 行の追記だけと設計に書いてある（factory-notes:design/grand-design.md:168）。

### 2. continuo の計測（measure report）

組み込む利点:

- 数字が自分を良く見せないようにする作法がある。単位を分け、判定を出さない（continuo:src/measurement/ac9.ts:1-30）。工場が通過率を「仕様に書いてある / 書いていない」に分ける考え方（factory-notes:design/grand-design.md:195）と同じ向き。ただし、これは考え方の一致で、コードを使う理由にはならない。

組み込む欠点:

- 工場が欲しいものと測る対象が違う。`measure report` は制御面に対する読み取り専用の報告（continuo:README.md:38）で、AC-9 は AI の応答数と呼び出し数の単位を扱う（continuo:src/measurement/ac9.ts:15-30）。工場の通過率や 1 変更の費用は測らない。
- 費用の全量計上には届かない。`ai_invocation` は読み取る側しか無く、書き込む側が無い（continuo:src/measurement/ac9.ts:101、factory-notes:research/l5-gap-audit-2026-10-17.md:252）。計上の穴があると上限は守れない（factory-notes:design/grand-design.md:100）。

組み込まない利点:

- 工場は役割 × モデル別の費用を自前の台帳に持っている（factory:src/limits.ts:19-30）。

組み込まない欠点:

- 台帳の数字は「クライアント側の推定」で、費用が報告されなかった呼び出しは許された上限の満額を計上する（factory:src/limits.ts:81,98-100）。外から検算できる別の数字は無い。continuo を入れてもこの穴は埋まらない（上記）。

### 3. continuo の役割ごとの囲い込み（fencing）

組み込む利点:

- 壊れた囲いでは起動しない。囲いを描いた後、その囲い自身の侵害試験がすべての規則を deny しないと spawn を拒む（continuo:src/fencing/spawn.ts:9-25）。`sandbox doctor` で、sandbox が起動できるかを事前に確かめられる（continuo:README.md:37）。工場は canary を vault に置いて漏れを後から調べる形で（factory:README.md:27）、起動前に拒む形ではない。

組み込む欠点:

- 守り方の向きが違う。continuo の worker の役割文書は、読めない・書けない場所を列挙する形（continuo:src/fencing/roles.json:51-57）。工場は `$HOME` を空の tmpfs にして vault をその下に置く、既定で隠す形（factory:src/sandbox.ts:3-4,53）。隠しシナリオの保証はこちらに立っている（factory-notes:design/grand-design.md:53）。列挙の形を足すと、保証が強くなるのでなく、強さの違う層が 2 つになる。列挙漏れが漏洩になる点は推論である。
- 役割が違う。continuo の役割は worker / curator / dispatcher / secretary で、claude-org の役割がもとになっている（continuo:src/fencing/roles.json:23,82,117,152。もとの文書は claude-org-runtime のもの、同 :2）。工場の 4 役は下書き・作る・判定・出荷（factory-notes:design/grand-design.md:42-50）。roles.json の先頭には、形と試験は残すが中身は使い捨て、とある（continuo:src/fencing/roles.json:2）。
- 起動の指定が Claude の引数の形のまま保存される問題が残る（continuo#275。factory-notes:research/adapter-boundary-audit-2026-10-17.md:178-181、factory-notes:actions.md:7）。
- 隔離の強さは未確認と設計に書いてある（factory-notes:design/grand-design.md:135）。

組み込まない利点:

- 隔離の試験を工場が自前で持つ（factory:test/isolation.test.ts、factory:src/adapter.ts:33）。
- 入口の設計と同じく、隠しの保証は「届かない場所」で取る方針を 1 か所のコードが担う（factory-notes:design/grand-design.md:53）。

組み込まない欠点:

- sandbox を自前で保守する（factory:src/sandbox.ts は 256 行）。しかも `$HOME` の外にあるディレクトリは保護できず、起動を拒む（factory:src/sandbox.ts:22-29）。この制約は仕様リポジトリの置き場に響く（factory-notes:design/grand-design.md:171）。

### 4. continuo の費用上限（`lap perform --max-budget-usd`）

組み込む利点・欠点:

- 利点はほぼ無い。この上限は Claude CLI の `--max-budget-usd` を渡すだけで、CLI が呼び出しの間に確かめるので 1 呼び出し分は超えうる。Codex の lap には渡せず拒否される（continuo:src/lap/cli.ts:191-197）。工場の adapter も同じフラグを渡している（factory:src/adapter.ts:70）。組み込んでも、足りない全量計上と lap 全体の上限（factory:src/limits.ts:9）は増えない。

組み込まない利点・欠点:

- 同じフラグを工場が直接渡しているので、失うものがほぼ無い。

### 5. cadenza のプロジェクト登録簿（G1）

組み込む利点:

- 台帳が持つ「アプリの一覧、対応」（factory-notes:design/grand-design.md:163）と内容が重なる。cadenza は、打った名前から不変の `project_id` を引き、clone 元と base ブランチを返す（cadenza:README.md:7-9）。別名どうしの衝突を拒み、共有の層が他人の手元パスを許可しないよう、局所の層を分けている（cadenza:README.md:198-210）。工場を配るときに要る性質で、一から設計せずに済む。
- 実行時の依存は `smol-toml` だけ（cadenza:README.md:125）。

組み込む欠点:

- 単位が合うか未確認。cadenza の project は clone 元を 1 つ持つ（cadenza:README.md:7-9）。工場のアプリは仕様リポジトリとアプリリポジトリの組で、予算・費用・各回の記録も台帳が持つ（factory-notes:design/grand-design.md:163）。登録簿が覆うのは一部だけになる。
- 台帳の形は「方向（決定ではない）」で止まっている（factory-notes:design/grand-design.md:154）。決まる前に外の形へ寄せると、決める自由を先に失う（推論）。
- 未公開。使うなら tarball を固定して置く経路になる（cadenza:README.md:151-156）。

組み込まない利点:

- 台帳の形を、工場の 4 つの置き場所に合わせて決められる。

組み込まない欠点:

- 別名の衝突、不変の id、局所層といった規則を、必要になった時点で自分で作り直す。

### 6. cadenza の委任の取り決め（G2）

組み込む利点:

- 能力の語彙（7 キー、版 2 で 12）と、allowed / needs-approval / refused の 3 値の分類、置き換えの仕組みがある（cadenza:README.md:74-90）。契約は digest を持つので、「承認した組は工場の役割から書き換えられない」（factory-notes:design/grand-design.md:81）と相性がよい（推論）。

組み込む欠点:

- 前提が人の権限。契約は「誰の権限で」を答える（cadenza:README.md:10-11）。人が途中で承認しない L5 とぶつかると、ギャップ調査が書いている（factory-notes:research/l5-gap-audit-2026-10-17.md:259）。工場は人へ戻る経路を作らない（factory-notes:design/grand-design.md:83）ので、needs-approval を拒否と同じに扱うことになる（推論）。
- 強制はしない。分類を返すだけで、守らせるのは呼ぶ側（cadenza:README.md:101-104）。保存の形も未定（cadenza:README.md:106）。つまり囲いの実体は結局 continuo か工場に残る。
- 関門を扱う API は無い（cadenza:README.md:142）。

組み込まない利点:

- 規則は上限の定数 1 か所（factory:src/limits.ts:6-9）と、役割ごとの access 3 値（factory:src/adapter.ts:8）で足りている。

組み込まない欠点:

- 役割や許可が増えたとき、語彙と版管理を自作する。今の 4 役では起きていない。

### 7. rondo（関連）

rondo は人が話しかける常駐の本体で、cadenza を library として使い、continuo を subprocess として動かす（rondo:README.md:3）。工場が呼ぶ部品はほぼ無く、設計も「考え方を持っていく」に留めている（自動投入の考え方と scope 予算の 3 軸。factory-notes:design/grand-design.md:137）。

組み込む利点:

- 3 軸（期限・lap 数・費用）の予算の考え方を写せる（factory-notes:research/l5-gap-audit-2026-10-17.md:250）。写すのはコードでなく考え方。

組み込む欠点:

- 自動投入は approver 必須で、issue 由来だけ、1 本ずつ（factory-notes:research/l5-gap-audit-2026-10-17.md:245）。人向けのページと質問の経路が本体の大半を占める（rondo:README.md:44-55）。
- continuo を動かし続ける重さを引き受ける。rondo は continuo の build を commit で固定し、固定する先を繰り返し動かしている（rondo:continuo.pin.json:2）。

組み込まない利点:

- rondo#714 / #715 は rondo の内側の問題で（factory-notes:research/adapter-boundary-audit-2026-10-17.md:185-187）、組み込まなければ工場の差し替えを止めない。

組み込まない欠点:

- 自動投入と予算の考え方を、工場が自分の言葉で作り直す。

## 横断の観点

### 工場を他の人に配れるか

台帳を独立のリポジトリにした理由は、状態を工場に抱き込むと配れなくなるからだった（factory-notes:decisions.md:81）。同じ見方を依存に当てると、3 つのリポジトリはいずれも `private: true`、`0.0.0` で、レジストリに無い（continuo:README.md:15-17、cadenza:README.md:151-153、rondo:README.md:142-145）。rondo が取っている経路は、continuo は commit を固定した checkout を subprocess で動かし、cadenza は固定した tarball を `vendor/` に置く形（rondo:README.md:153-158,172-176）。工場の利用者は、これを自分でそろえる必要がある。逆に、組み込まなければ工場は `node` と `bwrap` と Claude Code だけで配れる（factory:package.json:5-8、factory:src/sandbox.ts:70）。

組み込む側の反論: continuo は公開を決めている（continuo:README.md:15-17、D-0045）。公開されれば、この欠点は消える。

### Agent SDK 差し替えの準備との依存

- 組み込まない場合: 工場の差し替えは factory:src/adapter.ts の 1 か所で済み（factory:src/adapter.ts:1-2）、continuo#275 / rondo#714 / rondo#715 の解決を待たない。この 3 件はスタック自身を差し替えるための直し（factory-notes:research/adapter-boundary-audit-2026-10-17.md:196-202）。
- 組み込む場合: builder を continuo 経由で起動すると、起動口が工場の adapter と continuo の provider（continuo:src/session/claude_cli_provider.ts:249 の `-p`）の 2 つになり、「役割ごとに別のアダプタを作らない」（factory-notes:design/grand-design.md:119）に反する（推論）。差し替えは #275 の解決を待つ。drafter・classifier・judge は lap ではないので continuo を通らず、工場の adapter が残る（推論）。
- どちらでも残る問題: 起動前にセッション ID を決められるか、SIGTERM の後に結果を読めるか、許可リストと同じ意味の制限をかけられるかは、Agent SDK 側で未確認（factory-notes:research/adapter-boundary-audit-2026-10-17.md:188-194）。ただし工場の adapter は `--no-session-persistence` を渡し、セッション ID を決めない（factory:src/adapter.ts:70）ので、1 点目は工場には当たらない。

### 公開方針

公開の対象は factory、factory-notes、練習用アプリ 2 つ、rondo、continuo、cadenza。rondo、continuo、cadenza は公開済み、残りは非公開で、公開前に全履歴で秘密情報を点検する（factory-notes:decisions.md:105-109）。「リポジトリが公開」と「npm に公開」は別である。スタックは前者だけで、後者は未実施（continuo:README.md:15-17）。組み込む場合、工場を公開するとき、依存の固定経路（tarball や commit）の中身もそろえて見せることになる。組み込まない場合、公開の点検は工場 1 つで閉じる。2026-10-25 のオーナーの記事（factory-notes:actions.md:23）が読者に動かしてもらう対象を決める点でも、依存が少ないほうが書き手の負担は小さい（推論）。

### 二重保守のコスト

両側に効く。この観点は支柱に数えない。

- 組み込む場合の保守: 固定した build を動かし続ける。rondo は continuo の固定先を繰り返し動かしている（rondo:continuo.pin.json:2）。
- 組み込まない場合の保守: 工場が sandbox（256 行）、台帳と上限（117 行）、adapter を自前で持つ（factory:src/sandbox.ts、factory:src/limits.ts、factory:src/adapter.ts）。
- 写す形は、両方の欠点を持つ。continuo の fencing の中身は使い捨てと書かれている（continuo:src/fencing/roles.json:2）ので、写した元が動く。

### lap を実走できる状態への近さ

工場は 1〜7 周を依存ゼロで実走・報告済み（factory-notes:actions.md:14）。1 周はコマンド 1 つで回り、人の関門で止まる（factory:README.md:6）。組み込むと、この実走できる状態から遠ざかる。`lap perform` の末尾の関門（continuo:src/control_plane/report_ingress.ts:35-39）と、事前の `db create` / `run admit`（continuo:README.md:29-30）が経路に入るため。一方、組み込んで近づく部分は、並列の記録だけ（部品 1）である。

## 反対側の最も強い論点

組み込まない場合、工場は並列実行に耐える記録を自作することになる。factory#13 は run の並列を求め、先に費用の記録を追記式にすることを前提にしている（factory-notes:actions.md:19）。今の台帳は lock なしの読み書き戻しで、1 コマンドずつしか流せない前提を置いている（factory:src/limits.ts:47）。さらに、予算の上限が機械で守られる前提（factory-notes:research/l5-gap-audit-2026-10-17.md:288）には、同時書き込みで数字が壊れないことが要る。continuo は書き手を決めた SQLite の制御面と lease を持ち（continuo:docs/lease-fencing.md:28-30）、そこにはすでに多くの試験がある（continuo:README.md:9-17 の移植の記述）。ここを自作して、同じ種類の欠陥（書き手の競合）をもう一度作る危険は小さくない。

この論点への答え: 追記式 1 行 1 呼び出しの記録は、競合を避けるために作る側が小さく保てる（factory-notes:design/grand-design.md:168）ので、制御面ごと取り込む理由には届かない、と見る。ただし、追記式が実際に並列で壊れないことは、まだ試していない。

## 結論

推奨: 次の周からも組み込まない。工場本体は依存ゼロを保つ。

決定の可否:

- 今決められること: 「次の周（8 周目以降）では、既存スタックの部品を差し込まない」。取り消しが効き、実走できている工場を変えない。
- 今は決められないこと: 恒久の可否と、部品ごとの形（依存か写しか）。理由は 3 つ。continuo#275 が open（factory-notes:actions.md:7）。npm 公開が未実施（continuo:README.md:15-17）。囲いの強度と、factory#13 の追記式記録がどれだけ持つかが未確認（factory-notes:design/grand-design.md:135）。

支柱の本数: 推奨を支える独立した論点は 3 本。

1. `lap perform` の終わりが必ず人向けの関門になる（continuo:src/control_plane/report_ingress.ts:35-39）。原本で確かめた。ただし `lap perform` にしか当たらず、囲いや予算の部品には当たらない。
2. 配れなくなる。スタックはレジストリに無い（部品 1 の欠点、「配れるか」の項）。npm 公開が実施されれば弱まる条件付きの支柱。
3. 起動口が 2 つになり、差し替えが #275 を待つ（推論）。builder を continuo 経由にした場合に限る。

二重保守、計測、登録簿、委任は支柱に数えない。二重保守は両側に効き、計測は組み込んでも足りないものが足りないままで、登録簿と委任は台帳の形が決まる前では比べられない。支柱の本数は確からしさの量ではなく、3 本とも「今は」の理由である。「今後も使わない」を支える論点は 1 本も無い。

再検討の条件（どれかが起きたら、その部品だけを比べ直す）:

- factory#13 に着手するとき: 部品 1 の追記式記録を、自作と continuo の比較で決める。
- 台帳の形を決めるとき: 部品 5 の登録簿と、単位が合うかを確かめる。
- continuo#275 が閉じ、npm 公開が実施されたとき: 部品 3 と、配布の支柱 2 を見直す。
