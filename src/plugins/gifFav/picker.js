import { LOG, el, getRoots, getSeenRoots, qAll } from '@core/dom';
import { has, isHttp, subscribe, toggle } from './store';
import { fillPanel } from './panel';
import { pick } from './send';
import { t } from './i18n';

const nodeOf = new WeakMap(); // star -> media node
const stateOf = new WeakMap(); // dialog -> picker state
const states = new Set();
const EVENTS = ['pointerdown', 'mousedown', 'mouseup', 'click'];
let unsub = null;

/* ---------- звёздочки ---------- */
// превью giphy ".../200_d.gif" -> оригинал ".../giphy.gif"
function giphyFull(src) {
  if (!/giphy\.com\/media\//.test(src)) return src;
  return src.replace(/\/[^\/?]+\.(gif|webp|mp4)(\?.*)?$/i, '/giphy.gif');
}

function getItem(n) {
  if (n.tagName === 'VIDEO') {
    const s = n.querySelector('source');
    return { url: n.currentSrc || n.src || (s && s.src), type: 'video', preview: n.poster || '' };
  }
  const src = n.currentSrc || n.src;
  return { url: giphyFull(src), type: 'img', preview: src };
}

function addStar(host, node) {
  const item = getItem(node);
  if (!isHttp(item.url)) return;
  let b = host.querySelector(':scope > .fav-star');
  if (!b) {
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.classList.add('fav-host');
    b = el('span', 'fav-star');
    b.textContent = '★';
    b.title = t('addFav');
    host.appendChild(b);
  }
  nodeOf.set(b, node);
  b.dataset.url = item.url;
  b.classList.toggle('active', has(item.url));
}

function refreshStars() {
  qAll(getRoots(), '.fav-star').forEach((b) => b.classList.toggle('active', has(b.dataset.url)));
}

// событие может прийти из shadow DOM (target ретаргетится) — смотрим composedPath;
// плюс запасной вариант по координатам (Firefox и дети <button>)
function starAt(e) {
  const path = e.composedPath ? e.composedPath() : [e.target];
  for (const n of path) {
    if (n && n.classList && n.classList.contains('fav-star')) return n;
  }
  if (!e.clientX && !e.clientY) return null;
  const roots = [document, ...getSeenRoots().filter((r) => r.host && r.host.isConnected)];
  for (const r of roots) {
    const hit = (r.elementsFromPoint ? r.elementsFromPoint(e.clientX, e.clientY) : [])
      .find((n) => n.classList && n.classList.contains('fav-star'));
    if (hit) return hit;
  }
  return null;
}

const handlers = EVENTS.map((ev) => (e) => {
  const b = starAt(e);
  if (!b) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  if (ev === 'click') {
    const n = nodeOf.get(b);
    if (n) toggle(getItem(n));
  }
});

/* ---------- пикер ---------- */
function findPickers(roots) {
  const out = new Set();
  qAll(roots, '#gif-search, input[placeholder*="GIF" i]').forEach((i) => {
    const d = i.closest('[role="dialog"]') || i.closest('[data-slot="xds-modal-surface"]') ||
      (i.parentElement && i.parentElement.parentElement && i.parentElement.parentElement.parentElement);
    if (d) out.add(d);
  });
  return out;
}

function findScroller(d) {
  let best = null, bestH = 0;
  d.querySelectorAll('*').forEach((n) => {
    if (n.closest('.fav-panel, .fav-bar')) return;
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.clientHeight > bestH) { best = n; bestH = n.clientHeight; }
  });
  return best;
}

function syncHidden(st) {
  const fav = st.mode === 'fav';
  st.bar.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', (i === 1) === fav));
  st.panel.hidden = !fav;
  let n = st.panel.nextElementSibling;
  while (n) { n.classList.toggle('fav-hidden', fav); n = n.nextElementSibling; }
}

const renderPanel = (st) => fillPanel(st.panel, (item) => pick(item, st.d));

function setupPicker(d) {
  let st = stateOf.get(d);
  if (st && d.contains(st.bar)) return st;

  const root = d.getRootNode();
  const input = d.querySelector('#gif-search, input[placeholder*="GIF" i]');
  // 1) надёжный якорь: корень с трендами/результатами (есть и в ЛС, и в окне создания поста)
  let sc = d.querySelector('[data-testid="gifSearchTrendingRoot"]') ||
    d.querySelector('[data-testid="gifSearchTimelineRoot"]');
  // 2) запасной вариант: старая эвристика
  if (!sc && input && input.parentElement && input.parentElement.parentElement) {
    sc = input.parentElement.parentElement.nextElementSibling;
  }
  if (!sc || sc.contains(input) || sc.classList.contains('fav-bar') || sc.classList.contains('fav-panel')) sc = findScroller(d);
  if (!sc || !sc.parentElement) return null;

  const bar = el('div', 'fav-bar');
  const bAll = el('button'); bAll.type = 'button'; bAll.textContent = t('all');
  const bFav = el('button'); bFav.type = 'button'; bFav.textContent = t('favTab');
  bar.append(bAll, bFav);
  const panel = el('div', 'fav-panel');
  panel.hidden = true;
  sc.before(bar, panel);
  // в ЛС у контейнера уже есть свои отступы, в окне поста — нет: меряем и добавляем только при необходимости
  const dr = d.getBoundingClientRect(), br = bar.getBoundingClientRect();
  if (br.width && br.left - dr.left < 10) { bar.classList.add('fav-pad'); panel.classList.add('fav-pad'); }

  st = { bar, panel, d, mode: 'all' };
  bAll.onclick = () => { st.mode = 'all'; syncHidden(st); };
  bFav.onclick = () => { st.mode = 'fav'; renderPanel(st); syncHidden(st); };
  if (input) input.addEventListener('input', () => { if (states.has(st)) { st.mode = 'all'; syncHidden(st); } });
  stateOf.set(d, st);
  states.add(st);
  syncHidden(st);
  LOG('picker ready (shadow: ' + (root !== document) + ')');
  return st;
}

/* ---------- жизненный цикл ---------- */
export function startPicker() {
  EVENTS.forEach((ev, i) => document.addEventListener(ev, handlers[i], true));
  unsub = subscribe(() => {
    refreshStars();
    states.forEach((st) => { if (st.mode === 'fav') renderPanel(st); });
  });
}

export function stopPicker() {
  EVENTS.forEach((ev, i) => document.removeEventListener(ev, handlers[i], true));
  if (unsub) { unsub(); unsub = null; }
  states.forEach((st) => {
    st.bar.remove(); st.panel.remove();
    let n = st.d.querySelectorAll('.fav-hidden');
    n.forEach((x) => x.classList.remove('fav-hidden'));
  });
  states.clear();
  qAll(getRoots(), '.fav-star').forEach((s) => {
    const host = s.parentElement;
    if (host) host.classList.remove('fav-host');
    s.remove();
  });
}

export function scanPicker(roots) {
  const pickers = findPickers(roots);

  // GIF в твитах
  qAll(roots, 'video').forEach((v) => {
    if (v.closest('.fav-panel')) return;
    const src = v.currentSrc || v.src || '';
    if (!/tweet_video/.test(src)) return;
    for (const d of pickers) if (d.contains(v)) return;
    const host = v.closest('[data-testid="videoPlayer"]') || v.parentElement;
    if (host) addStar(host, v);
  });

  // пикер
  pickers.forEach((d) => {
    const st = setupPicker(d);
    if (!st) return;
    if (st.mode === 'fav') syncHidden(st);
    d.querySelectorAll('button > img').forEach((img) => {
      if (img.closest('.fav-panel, .fav-bar')) return;
      const u = img.currentSrc || img.src;
      if (!isHttp(u)) return;
      addStar(img.parentElement, img);
    });
  });
}
