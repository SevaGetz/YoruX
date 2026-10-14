import { h, xFont } from '../dom';
import { t, tr, onLangChange } from '../i18n';
import { read, write } from '../storage';
import { plugins, isEnabled, setEnabled } from '../api';
import { settings as general } from '../general';
import { ico, I, iconBtn } from './icons';
import { sw, optionRows } from './controls';

const KEY = 'yovarix:onboarded';

const STEPS = 3;

export function showOnboarding(openSettings) {
  if (document.querySelector('.yx-ov')) return;
  const cs = getComputedStyle(document.body);
  const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(0, 0, 0)' : cs.backgroundColor;
  const [r, g, b] = (bg.match(/\d+/g) || [0, 0, 0]).map(Number);
  const ov = h('div', { class: 'yx-ov' });
  const box = h('div', { class: 'yx-modal yx-onb', role: 'dialog' });
  box.dataset.theme = (r * 299 + g * 587 + b * 114) / 1000 > 128 ? 'light' : 'dark';
  box.style.background = bg;
  box.style.color = cs.color;
  box.style.fontFamily = xFont();
  box.style.setProperty('--yx-bg', bg);
  box.style.setProperty('--yx-fg', cs.color);

  const title = h('h2', null, 'YovariX');
  const counter = h('span', { class: 'yx-ver' });
  const closeBtn = iconBtn(t('close'), I.close, true, () => finish());
  const body = h('div', { class: 'yx-body' });
  const foot = h('div', { class: 'yx-foot' });
  box.append(h('div', { class: 'yx-head' }, title, counter, closeBtn), body, foot);
  ov.appendChild(box);
  document.body.appendChild(ov);

  let step = 0;
  let done = false;

  const renderLang = () => [
    h('h3', { class: 'yx-onb-h' }, t('onbWelcome')),
    h('p', { class: 'yx-onb-p' }, t('onbWelcomeText')),
    h('div', { class: 'yx-opts' }, optionRows(general, ['lang', 'autoUpdate'])),
  ];

  const renderPlugins = () => [
    h('h3', { class: 'yx-onb-h' }, t('onbPluginsTitle')),
    h('p', { class: 'yx-onb-p' }, t('onbPluginsText')),
    h('div', null, [...plugins].sort((a, c) => a.name.localeCompare(c.name)).map((p) => h('div', { class: 'yx-plugin' },
      h('div', { class: 'yx-prow' },
        h('div', { class: 'yx-pinfo' },
          h('div', { class: 'yx-pname' }, tr(p.title) || p.name),
          h('div', { class: 'yx-pdesc' }, tr(p.description))),
        sw(isEnabled(p), (v) => setEnabled(p, v)))))),
    h('div', { class: 'yx-hint', style: { paddingTop: '8px' } }, t('onbThemesHint')),
  ];

  const renderOpen = () => [
    h('h3', { class: 'yx-onb-h' }, t('onbOpenTitle')),
    h('p', { class: 'yx-onb-p' }, t('onbOpenText')),
    h('div', { class: 'yx-how' },
      h('span', { class: 'yx-how-n' }, '1'),
      h('div', null, t('onbHowMenu'),
        h('div', { class: 'yx-mock' }, ico(I.star, true), h('span', null, 'YovariX')))),
    h('div', { class: 'yx-how' },
      h('span', { class: 'yx-how-n' }, '2'),
      h('div', null, t('onbHowManager'))),
    h('div', { class: 'yx-opts' }, optionRows(general, ['menuItem'])),
  ];

  const pages = [renderLang, renderPlugins, renderOpen];

  function draw() {
    const last = step === STEPS - 1;
    counter.textContent = (step + 1) + '/' + STEPS;
    closeBtn.title = t('close');
    body.textContent = '';
    body.append(...pages[step]());
    body.scrollTop = 0;
    foot.textContent = '';
    foot.append(...[
      last ? null : h('button', { type: 'button', onclick: () => finish() }, t('onbSkip')),
      h('span', { class: 'yx-spacer' }),
      step > 0 ? h('button', { type: 'button', onclick: () => { step--; draw(); } }, t('back')) : null,
      last
        ? h('button', { type: 'button', onclick: () => finish(true) }, t('onbOpen'))
        : null,
      last
        ? h('button', { type: 'button', class: 'yx-primary', onclick: () => finish() }, t('onbDone'))
        : h('button', { type: 'button', class: 'yx-primary', onclick: () => { step++; draw(); } }, t('onbNext')),
    ].filter(Boolean));
  }

  const offLang = onLangChange(draw);
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); finish(); } };
  document.addEventListener('keydown', onKey, true);

  function finish(thenOpen) {
    if (done) return;
    done = true;
    write(KEY, true);
    offLang();
    document.removeEventListener('keydown', onKey, true);
    ov.remove();
    if (thenOpen) openSettings();
  }

  draw();
}

export function initOnboarding(openSettings) {
  if (read(KEY, false)) return;
  setTimeout(() => showOnboarding(openSettings), 1500);
}
