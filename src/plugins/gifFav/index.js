import { definePlugin } from '@core/api';
import { read, write } from '@core/storage';
import { h, toast } from '@core/dom';
import { downloadText, pickJson } from '@core/ui/settings';
import { settings } from './settings';
import { t } from './i18n';
import { CSS } from './styles';
import { fillPanel } from './panel';
import { importItems, load, save, subscribe } from './store';
import { scanPicker, startPicker, stopPicker } from './picker';

// перенос настроек из старого userscript (ключ gifFavSettings)
function migrate() {
  if (read('yorux:migrated:gifFav', false)) return;
  const old = read('gifFavSettings', null);
  if (old) ['convert', 'maxW', 'closeAfter'].forEach((k) => { if (k in old) settings.store[k] = old[k]; });
  write('yorux:migrated:gifFav', true);
}

function renderManager(box) {
  const grid = h('div', { class: 'fav-panel' });
  const count = h('span');
  const refresh = () => { count.textContent = t('total', { n: load().length }); fillPanel(grid, null); };
  refresh();
  const unsub = subscribe(refresh);

  box.append(
    h('div', { style: { opacity: '.65', fontSize: '13px', marginBottom: '8px' } }, count),
    grid,
    h('div', { class: 'yx-btns' },
      h('button', {
        type: 'button',
        onclick: () => downloadText('yorux-gifs-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(load(), null, 2)),
      }, t('export')),
      h('button', {
        type: 'button',
        onclick: () => pickJson((arr) => { toast(t('imported', { n: importItems(arr) })); }),
      }, t('import')),
      h('button', {
        type: 'button', class: 'yx-danger',
        onclick: () => { if (load().length && confirm(t('confirmClear'))) save([]); },
      }, t('clear'))));
  return unsub;
}

export default definePlugin({
  name: 'gifFav',
  title: () => t('title'),
  description: () => t('desc'),
  enabledByDefault: true,
  settings,
  styles: CSS,
  tile: {
    icon: '<path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z"/>',
    title: () => t('title'),
    desc: () => t('count', { n: load().length }),
    render: renderManager,
  },
  start() { migrate(); startPicker(); },
  stop() { stopPicker(); },
  scan: scanPicker,
});
