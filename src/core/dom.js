let debug = false;
export const setDebug = (v) => { debug = !!v; };
export const LOG = (...a) => { if (debug) console.log('[YoruX]', ...a); };

/* ---------- мини-конструктор DOM ---------- */
export function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k in e) e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...kids.flat().filter((x) => x != null && x !== false));
  return e;
}

export const el = (tag, cls) => h(tag, cls ? { class: cls } : null);

// X задаёт шрифт не на body, а на корневых контейнерах — берём оттуда, иначе получится Times
export function xFont() {
  const ref = document.querySelector('[data-testid="primaryColumn"]') || document.querySelector('#react-root') || document.body;
  const ff = getComputedStyle(ref).fontFamily;
  return ff && !/^\s*(Times|serif)/i.test(ff) ? ff :
    'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
}

export function toast(msg) {
  const t = h('div', { class: 'yx-toast', style: { fontFamily: xFont() } }, msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ---------- стили (document + все shadow-root'ы) ---------- */
const styles = new Map(); // id -> css
const styleEls = new WeakMap(); // root -> Map(id -> <style>)
let seenRoots = [];

const hostOf = (root) => (root === document ? document.head || document.documentElement : root);

function applyOne(root, id) {
  let m = styleEls.get(root);
  if (!m) { m = new Map(); styleEls.set(root, m); }
  let s = m.get(id);
  if (!s || !s.isConnected) {
    s = document.createElement('style');
    s.dataset.yx = id;
    hostOf(root).appendChild(s);
    m.set(id, s);
  }
  s.textContent = styles.get(id);
}

export function addStyle(id, css) {
  styles.set(id, css);
  [document, ...seenRoots].forEach((r) => applyOne(r, id));
}

export function removeStyle(id) {
  styles.delete(id);
  [document, ...seenRoots].forEach((r) => {
    const m = styleEls.get(r);
    const s = m && m.get(id);
    if (s) { s.remove(); m.delete(id); }
  });
}

/* ---------- обход shadow DOM ---------- */
const OBS = { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] };
const watched = new WeakSet();
let mo = null;

export function initObserver(cb) {
  mo = new MutationObserver(cb);
  mo.observe(document.documentElement, OBS);
}

function watchRoot(root) {
  if (watched.has(root)) return;
  watched.add(root);
  if (mo) mo.observe(root, OBS);
  styles.forEach((_, id) => applyOne(root, id));
}

export function getRoots() {
  const out = [document];
  const walk = (root) => {
    root.querySelectorAll('*').forEach((n) => {
      if (n.shadowRoot) {
        out.push(n.shadowRoot);
        watchRoot(n.shadowRoot);
        walk(n.shadowRoot);
      }
    });
  };
  walk(document);
  seenRoots = out.slice(1);
  return out;
}

export const getSeenRoots = () => seenRoots;
export const qAll = (roots, sel) => roots.flatMap((r) => [...r.querySelectorAll(sel)]);
