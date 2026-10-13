import { read, write } from './storage';
import { isNewer } from './version';
import { showReloadPrompt } from './ui/reload';

const KEY = 'yorux:running';

export function initUpdateWatch() {
  write(KEY, __VERSION__);
  if (typeof GM_addValueChangeListener !== 'function') return;
  GM_addValueChangeListener(KEY, (name, oldV, newV, remote) => {
    if (!remote) return;
    let v = newV;
    try { v = typeof newV === 'string' ? JSON.parse(newV) : newV; } catch (e) { /* строка как есть */ }
    if (typeof v === 'string' && isNewer(v, __VERSION__)) showReloadPrompt(v);
  });
}
