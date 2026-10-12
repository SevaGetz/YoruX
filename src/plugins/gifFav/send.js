import { LOG, getRoots, qAll, toast } from '@core/dom';
import { mp4ToGif } from './encoder';
import { settings } from './settings';

function findFileInput(d) {
  const all = qAll(getRoots(), 'input[type="file"]');
  LOG('file inputs found:', all.map((i) => (i.accept || '?') + ' @' + (i.getRootNode() === document ? 'document' : 'shadow')));
  if (!all.length) return null;
  const media = all.filter((i) => !i.accept || /image|video|gif/i.test(i.accept));
  const pool = media.length ? media : all;
  const sameRoot = pool.filter((i) => i.getRootNode() === d.getRootNode());
  const list = sameRoot.length ? sameRoot : pool;
  return list[list.length - 1];
}

// поле ввода сообщения/поста (вне окна выбора GIF)
function findComposer(d) {
  const roots = getRoots();
  const dm = qAll(roots, '[data-testid="dm-composer-textarea"]').filter((n) => n.getClientRects().length);
  if (dm.length) { LOG('composer: dm-composer-textarea'); return dm[dm.length - 1]; }
  const cands = qAll(roots, 'textarea, [contenteditable="true"], [role="textbox"]')
    .filter((n) => !d.contains(n) && n.id !== 'gif-search' && n.getClientRects().length);
  LOG('composer candidates:', cands.length);
  if (!cands.length) return null;
  const same = cands.filter((n) => n.getRootNode() === d.getRootNode());
  const list = same.length ? same : cands;
  return list[list.length - 1];
}

function attachFile(file, d) {
  const input = findFileInput(d);
  if (input) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    LOG('attached via file input');
    return true;
  }
  const composer = findComposer(d);
  if (composer) {
    const dt = new DataTransfer();
    dt.items.add(file);
    composer.focus();
    composer.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true, composed: true }));
    LOG('attached via paste');
    return true;
  }
  return false;
}

function closeDialog(d) {
  const c = d.querySelector('button[aria-label="Закрыть"], button[aria-label="Close"]');
  if (c) c.click();
  else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
}

export function pick(item, d) {
  toast('Загружаю GIF…');
  GM_xmlhttpRequest({
    method: 'GET',
    url: item.url,
    responseType: 'blob',
    onload: (r) => {
      const blob = r.response;
      if (!blob || !blob.size) { toast('Не удалось скачать GIF'); return; }
      const finish = (file) => {
        if (!attachFile(file, d)) {
          toast('Не нашёл ни поле загрузки, ни поле ввода. Подробности в консоли (F12).');
          return;
        }
        if (settings.store.closeAfter) setTimeout(() => closeDialog(d), 300);
      };
      const type = blob.type || (item.type === 'video' ? 'video/mp4' : 'image/gif');
      if (/^video\//.test(type) && settings.store.convert) {
        // GIF из твита лежит как mp4 — X принял бы его как видео, поэтому делаем настоящий .gif
        toast('Конвертирую в GIF…');
        mp4ToGif(blob, settings.store.maxW)
          .then((bytes) => finish(new File([bytes], 'favorite.gif', { type: 'image/gif' })))
          .catch((e) => {
            LOG('конвертация в GIF не удалась, отправляю как видео:', e);
            toast('Не получилось конвертировать, отправляю как видео');
            finish(new File([blob], 'favorite.mp4', { type }));
          });
        return;
      }
      const ext = { 'video/mp4': 'mp4', 'image/gif': 'gif', 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[type] || 'gif';
      finish(new File([blob], 'favorite.' + ext, { type }));
    },
    onerror: () => toast('Ошибка сети при скачивании GIF'),
  });
}
