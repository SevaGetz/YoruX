import { h, xFont } from '../dom';
import { t } from '../i18n';
import { openInstaller } from '../install';

export function showReloadPrompt(version, mode = 'installed') {
  const old = document.querySelector('.yx-pop');
  if (old) old.remove();

  const cs = getComputedStyle(document.body);
  const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(0, 0, 0)' : cs.backgroundColor;
  const [r, g, b] = (bg.match(/\d+/g) || [0, 0, 0]).map(Number);
  const box = h('div', { class: 'yx-modal yx-small yx-pop', role: 'alertdialog' });
  box.dataset.theme = (r * 299 + g * 587 + b * 114) / 1000 > 128 ? 'light' : 'dark';
  box.style.background = bg;
  box.style.color = cs.color;
  box.style.fontFamily = xFont();
  box.style.setProperty('--yx-bg', bg);
  box.style.setProperty('--yx-fg', cs.color);

  const avail = mode === 'available';
  const text = { installed: 'reloadText', pending: 'reloadPending', available: 'reloadAvail' }[mode] || 'reloadText';
  const main = avail
    ? h('button', { type: 'button', class: 'yx-primary', onclick: () => { openInstaller(); showReloadPrompt(version, 'pending'); } }, t('install'))
    : h('button', { type: 'button', class: 'yx-primary', onclick: () => location.reload() }, t('reloadBtn'));
  box.append(h('div', { class: 'yx-dlg' },
    h('h2', null, t(avail ? 'availTitle' : 'reloadTitle', { v: version })),
    h('p', null, t(text, { v: version })),
    h('div', { class: 'yx-btns' },
      h('button', { type: 'button', onclick: () => box.remove() }, t('later')),
      main)));
  document.body.appendChild(box);
}
