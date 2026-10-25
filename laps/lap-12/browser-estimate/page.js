// factory#54 measurement: a page over the practice memo API (written by hand, standing in for a builder's page).
// DELAY_MS > 0 (the "slow" copy) delays every re-render by a random 0..DELAY_MS, as a slow page would.
module.exports = (DELAY_MS) => `<!doctype html><html><head><meta charset="utf-8"><title>Memos</title>
<style>body{font-family:sans-serif} .err{color:#b00} li{margin:2px 0}</style></head><body>
<h1>Memos</h1>
<form id="add"><input data-testid="titleInput" placeholder="title"> <input data-testid="bodyInput" placeholder="body">
<button data-testid="addButton" type="submit">Add</button></form>
<p class="err" data-testid="errorMessage" hidden></p>
<form id="search"><input data-testid="searchInput" placeholder="search"> <button data-testid="searchButton" type="submit">Search</button></form>
<p data-testid="memoCount"></p>
<ul id="list"></ul>
<script>
const $ = (id) => document.querySelector('[data-testid=' + id + ']')
const list = document.getElementById('list'), err = $('errorMessage')
const wait = () => new Promise((r) => setTimeout(r, Math.random() * ${DELAY_MS}))
let q = ''
async function show() {
  const items = (await (await fetch('/memos?limit=100' + (q ? '&q=' + encodeURIComponent(q) : ''))).json()).items
  await wait()
  list.replaceChildren(...items.map((m) => {
    const li = document.createElement('li')
    const t = document.createElement('span'); t.dataset.testid = 'memoItem'; t.textContent = m.title
    const d = document.createElement('button'); d.dataset.testid = 'deleteButton'; d.textContent = 'Delete'
    d.onclick = async () => { await fetch('/memos/' + m.id, { method: 'DELETE' }); show() }
    li.append(t, ' ', d); return li
  }))
  $('memoCount').textContent = items.length + (items.length === 1 ? ' memo' : ' memos')
}
document.getElementById('add').onsubmit = async (e) => {
  e.preventDefault()
  const r = await fetch('/memos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: $('titleInput').value, body: $('bodyInput').value }) })
  await wait()
  if (!r.ok) { err.textContent = (await r.json()).error; err.hidden = false; return }
  err.hidden = true; $('titleInput').value = ''; $('bodyInput').value = ''; show()
}
document.getElementById('search').onsubmit = (e) => { e.preventDefault(); q = $('searchInput').value.trim(); show() }
show()
</script></body></html>`
