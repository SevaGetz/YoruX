import { qAll } from '../dom';
import { openSettings } from './settings';
import { settings as general } from '../general';

const STAR_PATH = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

export function injectMenu(roots) {
  if (!general.store.menuItem) {
    qAll(roots, '.yx-menu-item').forEach((n) => n.remove());
    return;
  }
  qAll(roots, '[role="menu"]').forEach((menu) => {
    if (menu.querySelector('.yx-menu-item')) return;
    const link = menu.querySelector('a[data-testid="settings"], a[href="/settings"]');
    const row = link && link.parentElement;
    if (!row) return;
    const item = row.cloneNode(true);
    item.classList.add('yx-menu-item');
    const a = item.querySelector('a');
    if (a) { a.removeAttribute('href'); a.removeAttribute('data-testid'); a.setAttribute('role', 'menuitem'); a.tabIndex = 0; }
    const path = item.querySelector('svg path');
    if (path) path.setAttribute('d', STAR_PATH);
    const span = item.querySelector('span');
    if (span) span.textContent = 'YoruX';
    item.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      setTimeout(() => openSettings(), 0);
    });
    row.after(item);
  });
}

export function watchMenu() {
  new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches('[role="menu"]') || n.querySelector('[role="menu"]') || n.closest('[role="menu"]')) {
          injectMenu([document]);
          return;
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}
