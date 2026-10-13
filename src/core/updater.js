import { read, write } from './storage';
import { isNewer } from './version';
import { showReloadPrompt } from './ui/reload';
import { settings as general } from './general';

const RUNNING = 'yorux:running';
const LAST_CHECK = 'yorux:lastCheck';
const EVERY = 2 * 60 * 60 * 1000;

export const fetchLatest = () => new Promise((res, rej) => GM_xmlhttpRequest({
  method: 'GET', url: __RAW__ + '?t=' + Date.now(), responseType: 'text', timeout: 15000,
  onload: (r) => {
    const m = r.status >= 200 && r.status < 300 && /@version\s+(\S+)/.exec(r.responseText || '');
    if (m) res(m[1]); else rej(new Error('bad response'));
  },
  onerror: () => rej(new Error('network')),
  ontimeout: () => rej(new Error('timeout')),
}));

function autoCheck() {
  if (!general.store.autoUpdate) return;
  if (Date.now() - read(LAST_CHECK, 0) < EVERY) return;
  write(LAST_CHECK, Date.now());
  fetchLatest()
    .then((v) => { if (isNewer(v, __VERSION__)) showReloadPrompt(v, 'available'); })
    .catch(() => {});
}


export function initUpdateWatch() {
  write(RUNNING, __VERSION__);
  setTimeout(autoCheck, 3000);
  if (typeof GM_addValueChangeListener !== 'function') return;
  GM_addValueChangeListener(RUNNING, (name, oldV, newV, remote) => {
    if (!remote) return;
    let v = newV;
    try { v = typeof newV === 'string' ? JSON.parse(newV) : newV; } catch (e) { /* строка как есть */ }
    if (typeof v === 'string' && isNewer(v, __VERSION__)) showReloadPrompt(v);
  });
}
