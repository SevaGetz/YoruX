import { el } from '@core/dom';
import { load, toggle } from './store';
import { t } from './i18n';

export function fillPanel(panel, onPick) {
  panel.textContent = '';
  const favs = load();
  if (!favs.length) {
    const e = el('div', 'fav-empty');
    e.textContent = t('empty');
    panel.appendChild(e);
    return;
  }
  favs.forEach((item) => {
    const tile = el('div', 'fav-tile');
    let m;
    if (item.type === 'video') {
      m = el('video');
      m.muted = true; m.loop = true; m.playsInline = true; m.preload = 'none';
      const loadVideo = () => {
        if (!m.getAttribute('src')) { m.preload = 'metadata'; m.src = item.url; }
      };
      if (item.preview) m.poster = item.preview;
      else {
        const io = new IntersectionObserver((es) => {
          if (es.some((e) => e.isIntersecting)) { loadVideo(); io.disconnect(); }
        }, { root: panel });
        io.observe(tile);
      }
      tile.addEventListener('mouseenter', () => { loadVideo(); m.play().catch(() => {}); });
      tile.addEventListener('mouseleave', () => m.pause());
    } else {
      m = el('img');
      m.loading = 'lazy';
      m.src = item.preview || item.url;
    }
    const del = el('button', 'fav-del');
    del.type = 'button'; del.textContent = '★'; del.title = t('delFav');
    del.onclick = (e) => { e.stopPropagation(); toggle(item); };
    tile.append(m, del);
    if (onPick) tile.onclick = () => onPick(item);
    else tile.style.cursor = 'default';
    panel.appendChild(tile);
  });
}
