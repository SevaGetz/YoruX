import { definePlugin } from '@core/api';
import { toast } from '@core/dom';
import { settings } from './settings';
import { t } from './i18n';
import { buildUrl, cleanHost, isCopyItem, refFromArticle, tweetPath } from './helpers';

let article = null;
let timer = 0;

const hostNow = () => {
  const s = settings.store;
  return s.service === 'custom' ? cleanHost(s.custom) : s.service;
};

function copy(text) {
  if (typeof GM_setClipboard === 'function') GM_setClipboard(text, 'text');
  else if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
}

function onClick(e) {
  const target = e.target;
  if (!target || !target.closest) return;
  const item = target.closest('[role="menuitem"]');
  if (item) {
    if (!isCopyItem(item)) return;

    const ref = refFromArticle(article && article.isConnected ? article : null, location.origin) || tweetPath(location.pathname);
    const host = hostNow();
    if (!ref || !host) return;

    clearTimeout(timer);
    timer = setTimeout(() => {
      copy(buildUrl(host, ref));
      if (settings.store.toast) toast(t('done', { host }));
    }, 150);
    return;
  }
  if (target.closest('[role="menu"]')) return;
  article = target.closest('article');
}

export default definePlugin({
  name: 'embedLink',
  title: () => t('title'),
  description: () => t('desc'),
  enabledByDefault: false,
  settings,
  start() { document.addEventListener('click', onClick, true); },
  stop() { document.removeEventListener('click', onClick, true); clearTimeout(timer); article = null; },
});
