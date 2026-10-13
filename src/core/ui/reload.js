import { h } from '../dom';
import { t } from '../i18n';
import { openInstaller } from '../install';
import { showPop } from './pop';

export function showReloadPrompt(version, mode = 'installed') {
  const avail = mode === 'available';
  const text = { installed: 'reloadText', pending: 'reloadPending', available: 'reloadAvail' }[mode] || 'reloadText';
  showPop('reload', {
    title: t(avail ? 'availTitle' : 'reloadTitle', { v: version }),
    body: h('p', null, t(text, { v: version })),
    buttons: [
      { label: t('later'), onclick: (box) => box.remove() },
      avail
        ? { label: t('install'), primary: true, onclick: () => { openInstaller(); showReloadPrompt(version, 'pending'); } }
        : { label: t('reloadBtn'), primary: true, onclick: () => location.reload() },
    ],
  });
}
