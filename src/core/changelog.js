import entries from '../releases';
import { read, write } from './storage';
import { isNewer } from './version';
import { h } from './dom';
import { lang, t } from './i18n';
import { showPop } from './ui/pop';

const KEY = 'yorux:changelogSeen';

const keyOf = (v) => String(v).split('.').slice(0, 2).join('.');
const current = keyOf(__VERSION__);

export const releases = () => entries.filter((e) => !isNewer(e.v, current)).sort((a, b) => (isNewer(a.v, b.v) ? -1 : 1));

export const renderEntries = (list) => h('div', { class: 'yx-news' }, list.flatMap((e) => [
  h('h3', null, 'v' + e.v, e.date ? h('span', null, e.date) : null),
  h('ul', null, (e[lang()] || e.en || []).map((s) => h('li', null, s))),
]));

export function initChangelog(openSettings) {
  const seen = read(KEY, null);
  if (seen === null) { write(KEY, current); return; }
  const fresh = releases().filter((e) => isNewer(e.v, seen)).slice(0, 3);
  if (isNewer(current, seen)) write(KEY, current);
  if (!fresh.length) return;
  setTimeout(() => showPop('news', {
    title: t('newsTitle', { v: __VERSION__ }),
    body: renderEntries(fresh),
    buttons: [
      { label: t('allChanges'), onclick: (box) => { box.remove(); openSettings('changelog'); } },
      { label: t('close'), primary: true, onclick: (box) => box.remove() },
    ],
  }), 1500);
}
