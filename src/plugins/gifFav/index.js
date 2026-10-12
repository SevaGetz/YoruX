import { definePlugin } from '@core/api';
import { read, write } from '@core/storage';
import { h, toast } from '@core/dom';
import { downloadText, pickJson } from '@core/ui/settings';
import { settings } from './settings';
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
  const refresh = () => { count.textContent = 'Всего: ' + load().length; fillPanel(grid, null); };
  refresh();
  const unsub = subscribe(refresh);

  box.append(
    h('div', { style: { opacity: '.65', fontSize: '13px', marginBottom: '8px' } }, count),
    grid,
    h('div', { class: 'yx-btns' },
      h('button', {
        type: 'button',
        onclick: () => downloadText('yorux-gifs-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(load(), null, 2)),
      }, 'Экспорт'),
      h('button', {
        type: 'button',
        onclick: () => pickJson((arr) => { toast('Импортировано: ' + importItems(arr)); }),
      }, 'Импорт'),
      h('button', {
        type: 'button', class: 'yx-danger',
        onclick: () => { if (load().length && confirm('Удалить все GIF из избранного? Это нельзя отменить.')) save([]); },
      }, 'Очистить всё')));
  return unsub;
}

export default definePlugin({
  name: 'gifFav',
  title: 'Избранные GIF',
  description: 'Вкладка «Избранное» в пикере GIF, звёздочки на GIF в пикере и в твитах, конвертация mp4 → GIF при отправке',
  enabledByDefault: true,
  settings,
  styles: CSS,
  tile: {
    icon: '★',
    title: 'Избранные GIF',
    desc: () => load().length + ' шт.',
    render: renderManager,
  },
  start() { migrate(); startPicker(); },
  stop() { stopPicker(); },
  scan: scanPicker,
});
