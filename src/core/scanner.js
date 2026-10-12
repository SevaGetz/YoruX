import { plugins, onPluginsChange } from './api';
import { getRoots, initObserver } from './dom';
import { injectMenu } from './ui/menu';

function scan() {
  const roots = getRoots();
  injectMenu(roots);
  plugins.forEach((p) => {
    if (!p.started || !p.scan) return;
    try { p.scan(roots); } catch (e) { console.error('[YoruX] scan error:', p.name, e); }
  });
}

let timer = 0;
export const schedule = () => {
  if (timer) return;
  timer = setTimeout(() => { timer = 0; scan(); }, 150);
};

export function initScanner() {
  initObserver(schedule);
  document.addEventListener('load', schedule, true);
  onPluginsChange(schedule);
  schedule();
}
