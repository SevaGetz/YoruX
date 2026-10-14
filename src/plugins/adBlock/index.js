import { definePlugin } from '@core/api';
import { addStyle, removeStyle, qAll, LOG } from '@core/dom';
import { t } from './i18n';

const ATTR = 'data-yx-ad';
const STYLE_ID = 'plugin:adBlock:rules';
const CSS = `[${ATTR}] { display: none !important; }`;

const LABELS = new Set([
  'ad', 'promoted', 'promoted by', 'реклама', 'промо', 'anzeige', 'gesponsert', 'anuncio', 'promocionado', 'publicidad',
  'sponsorisé', 'publicité', 'annuncio', 'sponsorizzato', 'anúncio', 'patrocinado', 'promovido', 'advertentie', 'gepromoot',
  'reklam', 'reklama', 'sponsorowane', 'iklan', 'ad·', '広告', 'プロモーション', '광고', '프로모션', '推广', '推廣', '广告', '廣告', 'إعلان', 'विज्ञापन',
]);

const SKIP = '[data-testid="tweetText"], [data-testid^="card."], [data-testid="User-Name"]';

function hasLabel(article) {
  for (const el of article.querySelectorAll('span')) {
    if (el.childElementCount) continue;
    const txt = (el.textContent || '').trim().toLowerCase();
    if (!txt || txt.length > 20 || !LABELS.has(txt)) continue;
    if (el.closest(SKIP)) continue;
    return true;
  }
  return false;
}

const hasTrackedLink = (article) => [...article.querySelectorAll('a[href*="twclid="]')].some((a) => !a.closest('[data-testid="tweetText"]'));

const hasOwnTime = (article) => !!article.querySelector('a[href*="/status/"] time');

export const isAd = (article) => hasTrackedLink(article) || (hasLabel(article) && !hasOwnTime(article));

const cellOf = (article) => article.closest('[data-testid="cellInnerDiv"]') || article;

function scan(roots) {
  qAll(roots, 'article[data-testid="tweet"]').forEach((article) => {
    const cell = cellOf(article);
    const ad = isAd(article);
    if (ad && !cell.hasAttribute(ATTR)) { cell.setAttribute(ATTR, ''); LOG('ad hidden'); }
    else if (!ad && cell.hasAttribute(ATTR)) cell.removeAttribute(ATTR);
  });
}

export default definePlugin({
  name: 'adBlock',
  title: () => t('title'),
  description: () => t('desc'),
  enabledByDefault: true,
  start() { addStyle(STYLE_ID, CSS); },
  stop() {
    removeStyle(STYLE_ID);
    document.querySelectorAll('[' + ATTR + ']').forEach((n) => n.removeAttribute(ATTR));
  },
  scan,
});
