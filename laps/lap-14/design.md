# 14 周目の設計: 題材 A + B + C を 1 本の依頼にする

13 周目（[../lap-13/report.md](../lap-13/report.md)）は題材 A 単独の 495 語で、Q = 100 % は目的（依頼を大きくしても合格率が保たれるか）の測定にならなかった（[../../decisions.md](../../decisions.md) D13-7）。オーナー決定（2026-10-27）は、14 周目を **A + B + C を合わせた依頼**で組み、成功の線を Q ≥ 90 %（`run` の出荷も条件に残す）、費用の上限を仮に $150 とすること。題材は監査 [../../research/runtime-fit-audit-2026-10-27.md](../../research/runtime-fit-audit-2026-10-27.md) の A（pane id、runtime #240）、B（`spawn-prompt-step` の判定記録、#244 / #245）、C（attention の通知先に ntfy、open の #21）。

この書類は、準備担当が最初に出した推奨（A + B だけ、1,082 語）を、オーナー決定で置き換えた版である。最初の版との違いは末尾。

## base: 1 つの commit にできる（`003efef`）

A・B・C のどれも入っていない commit が 1 つある。

| 題材 | 修正の場所 | `003efef` にあるか | `719f865`（v0.1.51）にあるか |
|---|---|---|---|
| A | `b6ad40a`（#242）。親は `003efef` | **無い**（親そのもの） | ある |
| B | `410fd8a`（#245）。親の祖先が `003efef` | **無い**。B の差分は `003efef` に `patch --dry-run` で当たる（行のずれだけ。`runner.py` -9、`tests/test_dispatcher_runner.py` -22。2026-10-27、`git archive` した木で確認） | ある |
| C | どこにも無い（open の issue #21） | **無い**。`ntfy` を含む行は `003efef` にも `719f865` にも 0 件（`git grep -i ntfy`） | 無い |

- C の対象の `attention/` は `003efef` と `719f865` で**同じ**（`git diff 003efef 719f865 -- src/claude_org_runtime/attention tests/attention` が空。この間の変更は B の `docs/cli.md` の節 +66 行など、`attention/` の外）。したがって C は `003efef` に対しても、`719f865` に対しても同じ変更になる。
- `719f865` を base にすると A と B が入っていて、再現にならない。`003efef` を base にすれば、**3 つとも入っていない 1 つの base** になり、C の前提を依頼文に書き足す必要は無い。これを採る。
- 13 周目の出荷先の作り方（`003efef` だけを fetch した使い捨ての repository）をそのまま使える。`003efef` より後の object を持たないので、A・B の答えは出荷先の中に無い。

## 規模と中身

| | 13 周目 | 14 周目 | 較正 |
|---|---|---|---|
| 依頼文の語数（`wc -w`） | 495 | **1,658**（[requests/runtime-abc.md](requests/runtime-abc.md)） | L0 694〜901、**L1 1,614〜1,798**、L2 2,385〜2,693 |
| 部（変更）の数 | 1 | 4 部（A、B、A と B のつなぎ、C） | L1: 合わせた依頼 2〜3 部 |
| 見せる範囲 | 約 81,000 字 | 約 143,200 字（上限 200,000 の 72 %） | — |
| シナリオの本数（見込み） | 14 / 15 | 40〜50（外挿。13 周目は 495 語で 14 本、語数比 3.4 倍で 47 本。本数は事前に決まらない） | 11〜15 |
| 部の間のつなぎ | — | A と B は `decide_argv` の 1 点。C は独立（`attention` コマンド） | 部品の絡み 10〜12（L1） |

- 語数は較正の L1 の線の内側で、「依頼を大きくしても」の問いに近い大きさ。ただし L1 の合わせた依頼は部品の間に絡み（規則の依存）が 10 組以上あり、ここは**絡みが少ない**（A と B で 1 点、C は 0）。大きさは同じでも、絡みの数では L1 より易しい。この点は事前登録の `comparability` に書く。
- **推測が要る場面（unstated）が入る**: B は「古い record を消す」安全側の性質を原則 1 文と要点で与え、規則を 1 つずつ書き切らない。C は、issue #21 が決めていない点（認証、再送、種類別の絞り込み、他の通知先、tag）を依頼文の「Not decided here」に挙げ、builder に任せる。承認の要約でこれらが `Undecided` に回ることを期待し、シナリオは確かめない。
- **決定的に確かめられる**: A は標準出力・終了コード、B は標準入力・終了コード・record のファイル、C は設定ファイルと `pending_decisions.json` を入力にし（`state.db` の SQLite はシナリオから作れないので使わない）、偽の通知先が受け取った要求を `GET /requests` で見る。時計: B の `decided_at_ms` は形だけ、C の `received_at` は固定の古い日時（2020 年）にし、設定の `pending_decision_max` / `pending_decision_drop` を十分大きくして、年齢の段（urgent / demote / drop）を固定する。
- **依存**: 13 周目と同じ lock（`9d3778c3…7032`）。C は標準ライブラリ（`urllib`）で書ける。新しい依存は無い。
- **学習汚染**: A・B は公開済みの変更の再現（13 周目と同じ性質）。**C は前向き**（runtime のどの commit にも ntfy の実装が無い）。A・B と C の Q を分けて読める（承認の要約の classification と、シナリオの題材ごとの合格率）。ただし ntfy の HTTP の使い方は公開の知識で、C の汚染が 0 とは言えない。

## C の仕様: issue #21 と runtime のコードから決めたことと、決めていないこと

issue #21 の要件（本文）: 外部の通知先は opt-in、ローカル通知と共通の secret-safe な整形、本文はローカルのデスクトップ通知より短く（既定）、ネットワークの失敗が `attention watch` を落とさない、テストは網を mock にする。受け入れ条件: 設定で 1 つの外部の通知先を有効にでき、ローカルの動作は変わらない、失敗は記録して握りつぶす、任意の項目を既定で外へ送らない。

コードから決めた点（根拠は `003efef` の `attention/`）:

- 設定は 1 つの JSON（`config.py` の `load_config`）で、型の誤りは `ValueError` → CLI が exit 2（`cli.py` の `_load_cfg_or_exit`）。新しいキー `ntfy` もこの扱いにそろえた。
- ローカルの本文の長さの既定は `max_body_chars = 240`（`config.py:141`）。ntfy の既定は 120 とした（「より短く」の決め）。
- 送る単位は「ローカルで通知する event」（`cli.py` の `_scan_once` が、suppressed と dedup / cooldown を除いて `run_notify` を呼ぶ所）。`--dry-run` は OS 通知とベルを止める既存の動き（`notify.py`）にそろえて、ネットワークも止める。
- 本文・タイトルは `render_text`（テンプレートと切り詰め）の結果を使う（共通の整形）。制御文字は `_strip_control` と同じに取る。
- ntfy の公開 API（`POST <server>/<topic>`、本文がメッセージ、`Title` と `Priority` のヘッダ）。`Priority` は urgent を 5、normal を 3 とした。

**オーナーの確認を要する、準備担当が決めた点**（issue が決めていないので、依頼文に書かないと builder の出来が測れない。推測で決めたので、変えるなら依頼文・事前登録を直す）:

1. `ntfy` の設定のキー名と既定値: `enabled`（既定 false）、`server`（既定 `https://ntfy.sh`）、`topic`、`max_body_chars`（既定 120）。
2. `topic` の文字（英数と `_` `-`、1〜64 字）と、`ntfy` 内の未知のキーを設定の誤り（exit 2）にしたこと。既存のトップレベルは未知のキーを黙って無視する（`load_config`）ので、ここだけ厳しい。
3. `Priority` の対応（urgent 5、normal 3）。
4. 失敗の扱い: 5 秒の時間切れ、HTTP 400 以上、接続の失敗を stderr の 1 行（`warning: ntfy notification failed`）にして握りつぶし、dedup には「配信された」と記録する（失敗しても再送しない）。再送は Not decided（依頼文）としたが、dedup の記録は「ローカルと同じ」と決めた。
5. `--dry-run` で何も送らないこと。
6. 依頼文の「Not decided here」に回した点（builder に任せる）: 認証・token、他の通知先（Slack、Discord、Gotify、Pushover）、再送、種類別の絞り込み、tag・click。

## 案の比較（記録）

| | A + B + C（採用） | A + B（最初の推奨） | plan / part |
|---|---|---|---|
| 語数 | 1,658 | 1,082 | 部分ごとに短い |
| 工場の変更 | 4 本（transcript、費用、`jsonAbsent`、偽サービスと `run` の組） | 3 本（上の 3 本まで） | 上に加えて plan の Q |
| 前向きの題材 | C が前向き | 無い | 同じ |
| Q の比較 | 較正と同じ式 | 同じ | **出ない**（plan は run 経由で、`replicate` の Q が無い） |

plan / part は、`plan` が PR #67 以降は既存リポジトリの上にも積める（`factory:src/plan.ts:184`、`extending`）が、部分ごとに `run`（やり直し・LLM 判定・出荷）で進み、Q が出ないので、成功の線 Q ≥ 90 % と較正の比較が使えない。採らない。

## 見せる範囲（`--base-path`）

`003efef` で、`sed` と `wc -c` による実測。

| 題材 | 範囲 | 字数 |
|---|---|---|
| A | `runner.py:84-100, 499-528, 589-866, 2279-2349, 2610-3160, 3213-3266, 3385-3642`（13 周目の 7 範囲） | 58,845 |
| A・B | `runner.py:2549-2607`（`approve_spawn_prompts_step`） | 3,349 |
| B | `dispatcher/spawn_prompt.py`（全体） | 13,599 |
| B | `tests/test_spawn_prompt.py:1-200`（画面の例） | 7,003 |
| C | `attention/notify.py`（全体） | 13,021 |
| C | `attention/config.py`（全体） | 14,126 |
| C | `attention/cli.py`（全体） | 15,596 |
| C | `attention/classifier.py:75-345`（`AttentionEvent`、`classify_event`、`classify_pending`） | 10,259 |
| C | `attention/classifier.py:535-710`（`_severity_for`、`_ttl_ladder`、`_default_text`。event の既定の title / body と年齢の段） | 6,089 |
| C | `attention/classifier.py:777-816`（`_minutes_since`、`_parse_iso`、`_short_summary`） | 1,334 |
| 合計 | 16 範囲 | **約 143,200** |

13 周目にあって、この周で外した範囲: `docs/cli.md:1-160`（10,193 字。`delegate-plan` の文書）と `tests/test_dispatcher_runner.py` の 3 範囲（12,372 字）。13 周目は 81,000 字。分類の費用が字数とシナリオ数の積で増える（[factory-issues.md](factory-issues.md) の 2）ため、約 143,000 字で止めた。外した分は、drafter が `build_plan` のコードから読む。期待値の誤りが増えるおそれがある（[prereg.json](prereg.json) の `whereItFalls`）。費用が高ければ、さらに `classifier.py` の範囲と `tests/test_spawn_prompt.py` を削る（[runbook.md](runbook.md) 手順 5）。

## 最初の推奨（A + B）との違い

- 題材に C を足した。語数は 1,082 → 1,658、見せる字数は約 117,500 → 約 143,200、工場の変更は 3 → 4 本。
- 契約のコマンドは `python3 -m claude_org_runtime.cli`（`dispatcher` を付けない）。`attention scan` も呼ぶため。シナリオの argv の先頭が `dispatcher delegate-plan`、`dispatcher spawn-prompt-step`、`attention scan` のどれか。
- 費用の見積もりは、シナリオの本数が増える分、上がる（[prereg.json](prereg.json) の `cost`）。
