import { h, xFont } from '../dom';

export function showPop(key, { title, body, buttons }) {
  const old = document.querySelector('.yx-pop[data-key="' + key + '"]');
  if (old) old.remove();
  let host = document.querySelector('.yx-pops');
  if (!host) { host = h('div', { class: 'yx-pops' }); document.body.appendChild(host); }

  const cs = getComputedStyle(document.body);
  const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(0, 0, 0)' : cs.backgroundColor;
  const [r, g, b] = (bg.match(/\d+/g) || [0, 0, 0]).map(Number);
  const box = h('div', { class: 'yx-modal yx-small yx-pop', role: 'alertdialog' });
  box.dataset.key = key;
  box.dataset.theme = (r * 299 + g * 587 + b * 114) / 1000 > 128 ? 'light' : 'dark';
  box.style.background = bg;
  box.style.color = cs.color;
  box.style.fontFamily = xFont();
  box.style.setProperty('--yx-bg', bg);
  box.style.setProperty('--yx-fg', cs.color);

  box.append(h('div', { class: 'yx-dlg' },
    h('h2', null, title),
    body,
    h('div', { class: 'yx-btns' }, buttons.map((b2) => h('button', {
      type: 'button', class: b2.primary ? 'yx-primary' : null, onclick: () => b2.onclick(box),
    }, b2.label)))));
  host.appendChild(box);
  return box;
}
