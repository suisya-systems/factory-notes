// factory#54 measurement: hand-written scenarios for the memo page (memo-app/), in the shape a drafter writes them.
// UI: browser steps (plus one HTTP check, as drafters mix them). HTTP: the same behaviour through the API only.
import type { Scenario, Step } from './src/scenario.ts'

const ui = (x: Record<string, unknown>) => x as unknown as Step
const sc = (id: string, kind: string, steps: Step[]): Scenario => ({ id, title: id, summary: `memo page: ${id.replace(/-/g, ' ')}`, inSpec: true, kind, steps })
// k: memos on the page after this add. The click waits until the page shows it (and the form is cleared): a fill
// right after a bare click would race the page clearing the form (see RACE).
const add = (title: string, body = '', k = 1): Step[] => [
  ui({ ui: 'fill', target: 'titleInput', text: title }),
  ...(body ? [ui({ ui: 'fill', target: 'bodyInput', text: body })] : []),
  ui({ ui: 'click', target: 'addButton', expect: { json: { memoCount: [`${k} memo${k === 1 ? '' : 's'}`], titleInput: [''] } } }),
]

export const UI: Scenario[] = [
  sc('empty-page', 'ui', [ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoCount: ['0 memos'] }, length: { memoItem: 0 } } })]),
  sc('add-shows-in-list', 'ui', [
    ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoCount: ['0 memos'] } } }),
    ...add('buy kiwis').slice(0, 1),
    ui({ ui: 'click', target: 'addButton', expect: { json: { memoItem: ['buy kiwis'], memoCount: ['1 memo'], titleInput: [''] }, length: { memoItem: 1 } } }),
    { method: 'GET', path: '/memos', expect: { status: 200, json: { items: [{ title: 'buy kiwis' }] } } },
  ]),
  sc('two-in-order', 'ui', [
    ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoCount: ['0 memos'] } } }),
    ...add('first'),
    ui({ ui: 'fill', target: 'titleInput', text: 'second' }),
    ui({ ui: 'click', target: 'addButton', expect: { json: { memoItem: ['first', 'second'], memoCount: ['2 memos'] } } }),
  ]),
  sc('empty-title-error', 'ui', [
    ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoCount: ['0 memos'] }, length: { errorMessage: 0 } } }),
    ui({ ui: 'fill', target: 'bodyInput', text: 'no title' }),
    ui({ ui: 'click', target: 'addButton', expect: { length: { errorMessage: 1, memoItem: 0 }, json: { memoCount: ['0 memos'] } } }),
    { method: 'GET', path: '/memos', expect: { status: 200, json: { items: [] }, length: { items: 0 } } },
  ]),
  sc('delete-removes', 'ui', [
    ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoCount: ['0 memos'] } } }),
    ...add('keep'),
    ...add('drop', '', 2),
    ui({ ui: 'click', target: 'deleteButton.1', expect: { json: { memoItem: ['keep'], memoCount: ['1 memo'] }, length: { memoItem: 1 } } }),
  ]),
  sc('search-and-reload', 'ui', [
    ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoCount: ['0 memos'] } } }),
    ...add('fruit', 'buy kiwis'),
    ...add('work', 'send report', 2),
    ui({ ui: 'fill', target: 'searchInput', text: 'kiwi' }),
    ui({ ui: 'click', target: 'searchButton', expect: { json: { memoItem: ['fruit'], memoCount: ['1 memo'] }, length: { memoItem: 1 } } }),
    ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoItem: ['fruit', 'work'], memoCount: ['2 memos'] } } }),
  ]),
]

// The same two-add flows written the way that races: the next fill follows a click whose effect is not waited for
// (its check passes on the page before the form is cleared). Run on the correct app to see how often the judge fails it.
export const RACE: Scenario[] = [
  sc('race-two-in-order', 'ui', [
    ui({ ui: 'goto', path: '/', expect: { status: 200, json: { memoCount: ['0 memos'] } } }),
    ui({ ui: 'fill', target: 'titleInput', text: 'first' }),
    ui({ ui: 'click', target: 'addButton' }),
    ui({ ui: 'fill', target: 'titleInput', text: 'second', expect: { json: { memoItem: ['first'] } } }),
    ui({ ui: 'click', target: 'addButton', expect: { json: { memoItem: ['first', 'second'], memoCount: ['2 memos'] } } }),
  ]),
]

const post = (title: string, body = '', status = 201, capture?: Record<string, string>): Step =>
  ({ method: 'POST', path: '/memos', body: { title, body }, expect: { status }, ...(capture ? { capture } : {}) })
const list = (titles: string[], q = ''): Step =>
  ({ method: 'GET', path: `/memos${q ? `?q=${q}` : ''}`, expect: { status: 200, json: { items: titles.map((title) => ({ title })) }, length: { items: titles.length } } })

export const HTTP: Scenario[] = [
  sc('empty-page', 'http', [list([])]),
  sc('add-shows-in-list', 'http', [post('buy kiwis'), list(['buy kiwis'])]),
  sc('two-in-order', 'http', [post('first'), post('second'), list(['first', 'second'])]),
  sc('empty-title-error', 'http', [post('', 'no title', 400), list([])]),
  sc('delete-removes', 'http', [post('keep'), post('drop', '', 201, { id: 'id' }), { method: 'DELETE', path: '/memos/{{id}}', expect: { status: 204 } }, list(['keep'])]),
  sc('search-and-reload', 'http', [post('fruit', 'buy kiwis'), post('work', 'send report'), list(['fruit'], 'kiwi'), list(['fruit', 'work'])]),
]
