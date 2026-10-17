# `claude -p` の作りがアダプタの外に漏れていないか（2026-10-17）

## 何を調べたか

[decisions.md](../decisions.md) で、Claude を呼ぶ部分は「アダプタ」1 か所に閉じ込め、あとで `claude -p` から Agent SDK に差し替えると決めた。`claude -p` は Claude Code を画面なしで動かすモード、Agent SDK は同じものをプログラムから呼ぶライブラリ。

差し替えが 1 か所で済むには、`claude -p` 固有の作り（コマンドの引数、出力の形、セッションファイルの置き場所）がアダプタの外で使われていてはいけない。それを手元の開発スタックの 3 つのリポジトリ（rondo / continuo / cadenza。[用語集](../glossary.md#人と仕組み)）で調べた。

読んだコミット: continuo e74526e / rondo 0dbda6c / cadenza 9b498a7。

## 結論

- cadenza: 漏れは無い。
- continuo: 起動と出力の読み取りはアダプタの中にある。ただし起動の指定そのものが Claude の引数の形で、外に広がっている。
- rondo: アダプタを通さず `claude -p` を直接起動している箇所と、continuo のセッションファイルを直接読む箇所がある。

## continuo

- 起動と出力の読み取りは `src/session/` の中にある（continuo:src/session/claude_cli_provider.ts）。ここは問題ない。
- 起動の指定 `cli_args` が Claude のコマンド引数の並びになっている（continuo:src/workspace/materializer.ts:1515-1521, continuo:src/fencing/spawn.ts:550-562）。
- `cli_args` は Claude の引数の書き方のまま保存され、許可リストで照合される（continuo:src/control_plane/lap_run_intent.ts:197-203, continuo:src/fencing/cli_args_allow.ts）。
- Codex 用のアダプタは、この Claude 形式の `cli_args` から自分の形に読み替えている（continuo:src/session/codex_cli_provider.ts:663-683）。つまり Claude 形式が共通の形として扱われている。
- 漏れを見張るテスト（continuo:test/gate_item11/no-provider-detail-leaks.test.ts）は import 文だけを見ている。引数の形が外に出ていても検出できない。

## rondo

- 下書き役（drafter）とレビュー役（reviewer）が `claude -p` を直接起動している（rondo:src/access/forge.ts:2678-2750）。結果の読み取りも同じファイルにある（rondo:src/access/forge.ts:2753-2797）。
- 実行記録（transcript）の読み取りが、continuo のセッションファイルを直接読んでいる（rondo:src/continuo/transcript.ts）。continuo を通していない。

## わかっていないこと

Agent SDK が次の 3 つに対応しているかは確かめていない。どれも見立てで、SDK のソースとは突き合わせていない。

- 起動の前にセッション ID を決めておけること。
- SIGTERM（終了の合図）で止めたあとに、結果を読めること。
- 引数の許可リストと同じ意味の制限をかけられること。

## 差し替えの前に直すこと

次の 3 件。状態は [actions.md](../actions.md) にある。

1. continuo の起動の指定を、特定のモデルに依存しない形にする（https://github.com/suisya-systems/continuo/issues/275 ）。
2. rondo の drafter と reviewer をアダプタ経由で起動する（https://github.com/suisya-systems/rondo/issues/714 ）。
3. rondo の transcript の読み取りを continuo 経由にする（https://github.com/suisya-systems/rondo/issues/715 ）。
