import { definePlugin, definePluginSettings, notify } from '@core/api';
import { addStyle, removeStyle, qAll, getRoots, LOG } from '@core/dom';
import { t } from './i18n';

const ATTR = 'data-yx-ad';

const settings = definePluginSettings({
  premiumPromo: { type: 'boolean', title: () => t('optPremium'), hint: () => t('optPremiumHint'), default: true, onChange: notify },
});
const STYLE_ID = 'plugin:adBlock:rules';
const CSS = `[${ATTR}] { display: none !important; }`;

// Метка «Реклама» в шапке поста зависит от языка интерфейса X — берём известные переводы.
// Дополнительно ловим рекламу по ссылкам с twclid (параметр рекламного трекинга), он от языка не зависит.
const LABELS = new Set([
  'ad', 'promoted', 'promoted by', 'реклама', 'промо', 'anzeige', 'gesponsert', 'anuncio', 'promocionado', 'publicidad',
  'sponsorisé', 'publicité', 'annuncio', 'sponsorizzato', 'anúncio', 'patrocinado', 'promovido', 'advertentie', 'gepromoot',
  'reklam', 'reklama', 'sponsorowane', 'iklan', 'ad·', '広告', 'プロモーション', '광고', '프로모션', '推广', '推廣', '广告', '廣告', 'إعلان', 'विज्ञापन',
]);

// Что внутри поста точно не метка: текст самого поста и карточка ссылки
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

// У обычного поста в шапке есть <time> (ссылка на сам пост), у рекламного — нет
const hasOwnTime = (article) => !!article.querySelector('a[href*="/status/"] time');

export const isAd = (article) => hasTrackedLink(article) || (hasLabel(article) && !hasOwnTime(article));

const cellOf = (article) => article.closest('[data-testid="cellInnerDiv"]') || article;

// Карточка «Подпишитесь на Premium» в правой колонке. Заголовок зависит от языка, а ссылка — нет
const isPremiumPromo = (aside) => !!aside.querySelector('a[href^="/i/premium_sign_up"]');

function scanPromos(roots) {
  qAll(roots, 'aside[role="complementary"]').forEach((aside) => {
    const hide = settings.store.premiumPromo && isPremiumPromo(aside);
    if (hide && !aside.hasAttribute(ATTR)) { aside.setAttribute(ATTR, ''); LOG('premium promo hidden'); }
    else if (!hide && aside.hasAttribute(ATTR)) aside.removeAttribute(ATTR);
  });
}

function scan(roots) {
  scanPromos(roots);
  qAll(roots, 'article[data-testid="tweet"]').forEach((article) => {
    const cell = cellOf(article);
    const ad = isAd(article);
    if (ad && !cell.hasAttribute(ATTR)) { cell.setAttribute(ATTR, ''); LOG('ad hidden'); }
    // X переиспользует ячейки при прокрутке — если там уже не реклама, возвращаем
    else if (!ad && cell.hasAttribute(ATTR)) cell.removeAttribute(ATTR);
  });
}

export default definePlugin({
  name: 'adBlock',
  title: () => t('title'),
  description: () => t('desc'),
  enabledByDefault: false,
  settings,
  start() { addStyle(STYLE_ID, CSS); },
  stop() {
    removeStyle(STYLE_ID);
    qAll(getRoots(), '[' + ATTR + ']').forEach((n) => n.removeAttribute(ATTR));
  },
  scan,
});
