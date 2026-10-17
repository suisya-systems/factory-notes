# 判定役の画面 E2E に使うヘッドレスブラウザ（2026-10-17）

## 結論

- 判定役のブラウザ実行には **Playwright のライブラリ（Chromium のヘッドレス版）を直接使う**のを推す。手順を「役割（role）と名前で要素を探す → 操作する → 見え方を確かめる」の JSON で書き、判定役が自前のランナーでモデルを呼ばずに再生する。
- 理由は 3 つ。役割と名前で要素を探す API（`getByRole` など）があり、シナリオの下書き役が実装を見ずに名前と形だけで手順を書ける。手元で動き、クラウドが要らない。Node と TypeScript のライブラリで、工場のコードから直接呼べる。
- browser-use は自然文の指示をモデルが操作に変える作りで、判定役の「決定的テスト + LLM 判定 1 回」には合わない。Stagehand は固定の操作（Action）をモデルなしで実行できるが、要素は XPath や CSS のセレクタで指すので、役割と名前で手順を書く工場には `getByRole` を直接使える Playwright の方が合う。Playwright MCP、Chrome DevTools MCP、agent-browser はモデルなしでも呼べるが、工場からは MCP クライアントや別プロセスの CLI を挟むことになり、Playwright を直接呼ぶより遠回りになる。
- Browserbase、Cloudflare Browser Run はクラウドで動くので除外。Lightpanda は軽いが、描画をしないエンジンで Chrome と同じ挙動の保証がないので、判定には使わない。

## 比較表

「再生に LLM」は、前もって書いた固定の手順を再生するときにモデルが必須かどうか。

| 道具 | 種類 | 再生に LLM | 手元だけで動くか | 役割と名前で手順を書けるか | ライセンス | 言語 |
|---|---|---|---|---|---|---|
| Playwright（ライブラリ） | ブラウザ操作ライブラリ | 要らない | 動く | 書ける（`getByRole`、aria snapshot） | Apache-2.0 | TypeScript |
| Playwright MCP | MCP サーバー | 要らない（ツールを直接呼べば。MCP クライアントを挟む） | 動く | 書ける（アクセシビリティツリー） | Apache-2.0 | TypeScript |
| Playwright Test Agents | テストを生成・修理するエージェント | 生成済みテストの実行には要らない。計画・生成・修理には要る | 動く | 生成されたテストは Playwright のテスト | Playwright に含まれる（`npx playwright init-agents`） | TypeScript |
| Chrome DevTools MCP | MCP サーバー（デバッグ・性能向け） | 要らないが、操作先の uid は snapshot ごとに取り直す | 動くが、既定で利用統計を送る | 手順ではなく、a11y ツリーの uid で操作 | Apache-2.0 | TypeScript |
| Vercel agent-browser | エージェント向け CLI | 要らない（`find role` などを直接呼べる） | 動く | 書ける（`find role` / `find label`） | Apache-2.0 | Rust |
| browser-use | エージェント | 要る | ブラウザは手元可、モデルは要る | 自然文の指示 | MIT | Python 中心 |
| Stagehand | エージェント向けライブラリ | 自然文の `act` は要る。Action（セレクタ指定）の実行は要らない | 動く（Chrome が必要） | 自然文の指示 | MIT | TypeScript ほか |
| Steel Browser | セッション管理つきブラウザ API | 要らない（中は Chrome） | Docker で動く | 中で使う Playwright 等による | Apache-2.0 | TypeScript |
| Lightpanda | 独自エンジン（描画なし） | 要らない | 動く | AX ツリーは取れる | AGPL-3.0 | Zig |
| Browserbase | クラウドのブラウザ | — | 動かない（クラウドのみ） | — | 有料サービス | — |
| Cloudflare Browser Run | クラウドのブラウザ | — | 動かない（Cloudflare 上） | — | 有料サービス | — |

## 道具ごとのメモ

### Playwright（ライブラリ）

- ライセンスは Apache-2.0、主言語は TypeScript（https://github.com/microsoft/playwright ）。2026-10-14 に v1.64.1 が出ている（https://github.com/microsoft/playwright/releases ）。
- 要素の探し方は「利用者に見える属性と明示的な約束、たとえば `page.getByRole()`」を優先するよう勧めている。CSS や XPath は DOM の構造や実装に結びつくとしている（https://playwright.dev/docs/locators ）。`getByRole` は ARIA の役割・属性・アクセシブルネームで要素を探す（https://playwright.dev/docs/api/class-locator ）。
- aria snapshot は、ページのアクセシビリティツリーを YAML で表したもの。期待値は「制約」で、全部を書かなくてよい。名前は正規表現でも書ける（https://playwright.dev/docs/aria-snapshots ）。`toMatchAriaSnapshot()` は v1.49 で入った（https://playwright.dev/docs/release-notes ）。ライブラリ側の `locator.ariaSnapshot()` も v1.49 からで、文字列を返す（https://playwright.dev/docs/api/class-locator ）。
- `toMatchAriaSnapshot()` などの確かめは Playwright Test の `expect` の機能。判定役は自前のランナーなので、確かめは `factory:src/scenario.ts` の `checkStep` と同じく自前で書く（要素の数・本文・状態をライブラリで読み、期待値と比べる）。画面は操作のあと非同期に変わるので、1 回読んで比べるだけでは合否がタイミングで揺れる。期待どおりになるまで期限付きで読み直し、期限を過ぎたら不通過にする。Playwright も、件数を確かめるなら不安定さを避けるため `toHaveCount` を使うよう勧めている（https://playwright.dev/docs/api/class-locator#locator-count ）。
- ブラウザは `PLAYWRIGHT_BROWSERS_PATH` で置き場所を指定して入れられる。ヘッドレスだけなら `--only-shell` で headless shell だけを入れられる。Linux の依存は `npx playwright install-deps` で入れる（https://playwright.dev/docs/browsers ）。先に入れておけば、判定のときにネットワークは要らない（推測。試作で確かめる）。
- `chromiumSandbox` は既定で `false`（https://playwright.dev/docs/api/class-browsertype ）。bwrap の中で Chromium を動かすなら、Chromium 自身の囲いではなく bwrap が境界になる。

### Playwright MCP

- アクセシビリティツリーで操作し、画像を読むモデルは要らない。`--headless`、`--isolated`（プロファイルをメモリにだけ置く）、`--allowed-origins` がある。ただし README は「Playwright MCP is not a security boundary」と書き、`--allowed-origins` も境界にならないとしている。`--caps=testing` で `browser_verify_*` の確かめ用ツール、`--codegen` で操作を TypeScript のコードとして出す機能がある（https://github.com/microsoft/playwright-mcp ）。
- ツールは呼ぶ側が選ぶので、固定の手順を流すこともできる。ただし工場の Node からは MCP クライアントを挟むことになり、中の Playwright を直接呼ぶより遠回り。

### Playwright Test Agents

- planner（テスト計画を Markdown で書く）、generator（計画を Playwright のテストファイルに変える）、healer（落ちたテストを直す）の 3 つ（https://playwright.dev/docs/test-agents ）。v1.56 で入った（https://playwright.dev/docs/release-notes ）。
- planner は動くアプリを探索して計画を作る。工場では、シナリオの下書き役が成果物を見られないので、そのままは使えない。healer はテストを書き換えるので、承認後にバージョンを固定するシナリオ（grand-design 3 章）とは相いれない。

### Chrome DevTools MCP

- Apache-2.0。性能のトレース、ネットワーク、コンソールの確認が中心（https://github.com/ChromeDevTools/chrome-devtools-mcp ）。
- `take_snapshot` は a11y ツリーをもとに、要素ごとに uid を付けた文字の snapshot を返す。操作はその uid で指す（https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md ）。「Always use the latest snapshot」とあるとおり uid は直前に取った snapshot に結びつくので、前もって書く手順には向かない。
- 利用統計を既定で送り、npm への更新確認もする。`--no-usage-statistics` や環境変数で止められる。性能ツールはトレースの URL を Google の CrUX API へ送ることがある（同 README）。判定役で使うなら、これらを止める設定が要る。

### Vercel agent-browser

- Rust の CLI で、デーモンに Playwright や Node は要らない。Apache-2.0。`snapshot` がアクセシビリティツリーと参照（`@e2` など）を返し、参照で操作する。`find role button click --name "Submit"` のように役割と名前でも操作できる。`is visible` などの状態確認、snapshot の差分、`batch` での一括実行がある。クラウドのブラウザは選べるが必須ではない（https://github.com/vercel-labs/agent-browser ）。
- 2026-10-13 に v0.39.1、2026-10-01 から 2026-10-13 の間に 3 版出ている（https://github.com/vercel-labs/agent-browser/releases ）。
- CLI はモデルなしで呼べ、`batch` で複数の操作を一度に流せるので判定にも使える。ただ工場からは別プロセスとの入出力とエラー処理が要る。Node から Playwright を直接呼ぶ方が素直。

### browser-use

- MIT。Python 3.11 以上。手元のブラウザでもクラウドのブラウザでも動く（https://github.com/browser-use/browser-use ）。
- エージェントに LLM を渡して動かす作り。決定的に再生する機能は README に無い。工場の言語（Node）とも違う。

### Stagehand

- MIT。TypeScript・Python・Go。`act`・`observe`・`extract` を自然文で指示する。手元の Chrome で動き、Browserbase は任意（https://github.com/browserbase/stagehand 、2026-10-17 に見た README。Go の導入例は v4.0.0）。
- v3 の文書では、`cacheDir` を指定すると、操作の結果をファイルに保存し、次回から LLM を呼ばずに再生する（https://docs.stagehand.dev/v3/best-practices/caching ）。ただし、どの場合にキャッシュが外れるかは手元キャッシュについては書かれていない（同ページ）。外れると LLM が呼ばれるので、判定の決定性は保証されない。
- v3 の `act` には Action を渡す形があり、文書は「Deterministic (no LLM)」としている。Action は `selector`・`description`・`method`・`arguments` を持ち、`selector` は「XPath, CSS selector, etc.」で要素を指す（https://docs.stagehand.dev/v3/references/act ）。役割と名前から手順を書くなら、`getByRole` を直接使える Playwright の方が近い。

### Steel Browser

- Apache-2.0。Docker で自前で立てられる。中身は Puppeteer と CDP で Chrome を動かすもので、Puppeteer・Playwright・Selenium から接続できる。README は「public beta」としている（https://github.com/steel-dev/steel-browser ）。2026-10-17 時点のリリースは v0.5.4-beta（https://github.com/steel-dev/steel-browser/releases ）。
- 価値はセッション管理やプロキシで、工場の判定には要らない。Playwright が Chromium を直接起動すれば足りる。

### Lightpanda

- Zig で一から書いたエンジンで、描画エンジンを持たない。CDP サーバーと MCP サーバーがある。ライセンスは AGPL-3.0（https://github.com/lightpanda-io/browser ）。2026-10-02 に 1.0.0、2026-10-15 に 1.0.1（https://github.com/lightpanda-io/browser/releases ）。
- CDP の `Accessibility.getFullAXTree` で AX ツリーを取れる。ただし Chrome との差は列挙されていない（https://lightpanda.io/docs/guides/markdown-axtree ）。
- 判定は「利用者のブラウザで見えるとおり」を確かめたいので、Chrome と挙動が違いうるエンジンを使う理由が薄い。軽さが効くのはシナリオ数が増えてからで、そのとき改めて比べる。

### Browserbase / Cloudflare Browser Run

- Browserbase はクラウド前提で、オンプレミスでの提供はしないと書いている。無料枠は 1 ブラウザ時間（https://www.browserbase.com/pricing ）。
- Cloudflare Browser Run は Cloudflare のネットワーク上でブラウザを動かす（https://developers.cloudflare.com/changelog/post/2026-04-15-br-rename/ ）。
- どちらも 127.0.0.1 の成果物に届かず、隠しシナリオを外へ出すことにもなるので除外。

## 工場に入れるときの形（案）

- 手順の形は HTTP の手順（`factory:src/scenario.ts` の `Step`）に並べて、ブラウザ用の手順を足す。例: `{ "goto": "/" }`、`{ "fill": { "role": "textbox", "name": "タイトル" }, "value": "..." }`、`{ "click": { "role": "button", "name": "追加" } }`、`{ "expect": { "within": { "role": "list", "name": "メモ" }, "role": "listitem", "hasText": "...", "count": 1 } }`。
- 要素は役割・名前・本文と、親の範囲でだけ指す。CSS セレクタや XPath は手順に入れない。アクセシブルネームと表示される本文は別物で、一覧の項目は本文で絞り込むことが多い（Playwright の例は `getByRole('listitem').filter({ hasText: ... })`、https://playwright.dev/docs/locators#filter-by-text ）。同じ名前のボタンが並ぶときは親の範囲で絞る。
- 仕様の下書き役からシナリオの下書き役へ渡すインタフェース（grand-design 2 章）に、画面の役割・名前と、見分けに要る構造（どの一覧の中か）を足す。HTTP の名前と同じく、食い違いを避けるため。
- 判定役は Playwright で手順を再生し、合否を出す。LLM の判定 1 回は HTTP のシナリオと同じ（`factory:src/roles.ts` の judge）。
- 囲い: アプリは HTTP のシナリオと同じく bwrap で動かす（`factory:src/sandbox.ts`）。ブラウザは作る役が書いたページの JavaScript を実行するので、ブラウザ自身も保管場所の見えない bwrap に入れる。隠しシナリオは判定役のプロセスにだけ置き、ブラウザへは 1 手ずつ操作として渡す。

## 試作で確かめること

- Chromium（headless shell）が、`factory:src/sandbox.ts` の bwrap の設定（`$HOME` を空の tmpfs、`/tmp` を新規、pid 名前空間を分ける）の中で起動するか。起動しないなら、何を足せば動くか（`/dev/shm`、ブラウザ置き場の読み取り専用マウントなど）。
- 先にブラウザを入れておけば、判定のときにネットワークなしで動くか。
- 外向きの通信をどう切るか。`factory:src/sandbox.ts` はアプリにホストのネットワークをそのまま使わせており、アプリ自身の外向き通信も止めていない。ブラウザだけ絞ってもアプリ経由の送信は残るので、アプリとブラウザを同じ隔離ネットワーク（loopback だけ）に入れ、判定役からブラウザを操作する経路をどう通すかを試す。Playwright の `page.route` は Service Worker が扱う要求とポップアップの最初の要求を捕まえない（https://playwright.dev/docs/api/class-page#page-route ）ので、補助にとどめる。
- シナリオの下書き役が、役割と名前だけで、通る手順を書けるか。HTTP のときの名前の食い違い（`?tag` と `?tags`）と同じことが、ボタンの文言で起きないか。
- 不通過の理由の要約（`feedbackFor`）に、画面の文言が漏れないか。値の漏れ検査（`factory:src/scenario.ts` の `validateScenarios`）を画面の名前と本文にも広げる必要がある。
- 確かめの読み直しの期限をいくつにするか。短いと遅い成果物が落ち、長いと不通過のたびに待つ。
- 1 シナリオあたりの時間。ブラウザの起動をシナリオごとにするか、使い回すか。
