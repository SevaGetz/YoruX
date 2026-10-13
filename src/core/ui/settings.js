import { h, toast, xFont } from '../dom';
import { plugins, isEnabled, setEnabled, exportConfig, importConfig, resetConfig } from '../api';
import { t, tr, onLangChange } from '../i18n';
import { settings as general } from '../general';
import { ico, I, iconBtn } from './icons';
import { renderThemes } from './themes';
import { getThemes } from '../themes';
import { isNewer } from '../version';
import { showReloadPrompt } from './reload';
import { fetchLatest } from '../updater';
import { openInstaller } from '../install';

const sw = (checked, onChange) => {
  const i = h('input', { type: 'checkbox', checked: !!checked });
  i.addEventListener('change', () => onChange(i.checked));
  return h('label', { class: 'yx-sw' }, i, h('span'));
};

function control(store, key, def) {
  const cur = store[key];
  if (def.type === 'boolean') return sw(cur, (v) => { store[key] = v; });
  if (def.type === 'select') {
    const choices = def.choices.map((c) => (typeof c === 'object' ? c : { value: c, label: String(c) }));
    const s = h('select', null, choices.map((c) => h('option', { value: String(c.value) }, tr(c.label))));
    s.value = String(cur);
    s.addEventListener('change', () => { store[key] = choices.find((c) => String(c.value) === s.value).value; });
    return s;
  }
  if (def.type === 'number') {
    const i = h('input', { type: 'number', min: def.min, max: def.max, value: cur, style: { width: '90px' } });
    i.addEventListener('change', () => { const n = parseFloat(i.value); if (!isNaN(n)) store[key] = n; });
    return i;
  }
  const i = h('input', { type: 'text', value: cur == null ? '' : cur });
  i.addEventListener('change', () => { store[key] = i.value; });
  return i;
}

const optionRows = (settings) => Object.entries(settings.def).map(([key, def]) => h('div', { class: 'yx-opt' },
  h('label', null, tr(def.title) || key, def.hint ? h('span', { class: 'yx-hint' }, tr(def.hint)) : null),
  control(settings.store, key, def)));

/* ---------- page "Plugins" ---------- */
function renderPlugins(box) {
  const search = h('input', { class: 'yx-search', type: 'text', placeholder: t('search') });
  const list = h('div');
  box.append(search, list);

  const draw = () => {
    const q = search.value.trim().toLowerCase();
    list.textContent = '';
    const shown = [...plugins]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((p) => !q || (p.name + ' ' + tr(p.title) + ' ' + tr(p.description)).toLowerCase().includes(q));
    if (!shown.length) list.append(h('div', { class: 'yx-empty' }, t('nothing')));
    shown.forEach((p) => {
      const opts = h('div', { class: 'yx-opts', hidden: true }, p.settings ? optionRows(p.settings) : null);
      const gear = p.settings ? iconBtn(t('pluginSettings'), I.tune, false, () => { opts.hidden = !opts.hidden; }) : null;
      list.append(h('div', { class: 'yx-plugin' },
        h('div', { class: 'yx-prow' },
          h('div', { class: 'yx-pinfo' },
            h('div', { class: 'yx-pname' }, tr(p.title) || p.name),
            h('div', { class: 'yx-pdesc' }, tr(p.description))),
          gear,
          sw(isEnabled(p), (v) => setEnabled(p, v))),
        opts));
    });
  };
  search.addEventListener('input', draw);
  draw();
}

/* ---------- page "Backup" ---------- */
export function downloadText(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function pickJson(cb) {
  const inp = h('input', { type: 'file', accept: 'application/json,.json' });
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { cb(JSON.parse(r.result)); } catch (e) { toast(t('readErr') + e.message); } };
    r.readAsText(f);
  };
  inp.click();
}

function renderBackup(box) {
  box.append(h('div', { class: 'yx-btns', style: { paddingTop: 0 } },
    h('button', {
      type: 'button',
      onclick: () => downloadText('yorux-settings-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(exportConfig(), null, 2)),
    }, t('export')),
    h('button', {
      type: 'button',
      onclick: () => pickJson((o) => { importConfig(o); toast(t('imported')); }),
    }, t('import')),
    h('button', {
      type: 'button', class: 'yx-danger',
      onclick: () => { if (confirm(t('confirmReset'))) { resetConfig(); toast(t('resetDone')); } },
    }, t('reset'))));
}

/* ---------- page "General" ---------- */
const openUrl = (url) => (typeof GM_openInTab === 'function' ? GM_openInTab(url, { active: true }) : window.open(url, '_blank'));

function checkUpdate() {
  fetchLatest().then((v) => {
    if (isNewer(v, __VERSION__)) { openInstaller(); showReloadPrompt(v, 'pending'); } else toast(t('upToDate', { v: __VERSION__ }));
  }).catch(() => toast(t('updateErr')));
}

function renderGeneral(box) {
  box.append(
    h('div', { class: 'yx-opts' }, optionRows(general)),
    h('div', { class: 'yx-btns' },
      h('button', { type: 'button', onclick: () => openUrl('https://github.com/' + __REPO__) }, t('repo')),
      h('button', { type: 'button', onclick: checkUpdate }, t('update'))),
    h('div', { class: 'yx-hint', style: { paddingTop: '12px' } }, t('version') + ': v' + __VERSION__));
}

/* ---------- plates ---------- */
function getPages() {
  const on = plugins.filter(isEnabled).length;
  const pages = [
    { id: 'general', icon: I.tune, title: t('general'), desc: t('generalDesc'), render: renderGeneral },
    { id: 'plugins', icon: I.plugins, title: t('plugins'), desc: t('pluginsDesc', { n: on, m: plugins.length }), render: renderPlugins },
    { id: 'themes', icon: I.themes, title: t('themes'), desc: t('themesDesc', { n: getThemes().links.filter((l) => l.enabled).length }), render: renderThemes },
  ];
  plugins.filter((p) => p.started && p.tile).forEach((p) => pages.push({
    id: 'plugin:' + p.name,
    icon: p.tile.icon || I.star,
    title: tr(p.tile.title),
    desc: tr(p.tile.desc),
    render: p.tile.render,
  }));
  pages.push({ id: 'backup', icon: I.backup, title: t('backup'), desc: t('backupDesc'), render: renderBackup });
  return pages;
}

/* ---------- window ---------- */
export function openSettings(pageId) {
  if (document.querySelector('.yx-ov')) return;
  const cs = getComputedStyle(document.body);
  const ov = h('div', { class: 'yx-ov' });
  const box = h('div', { class: 'yx-modal' });
  const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(0, 0, 0)' : cs.backgroundColor;
  const [r, g, b] = (bg.match(/\d+/g) || [0, 0, 0]).map(Number);
  box.dataset.theme = (r * 299 + g * 587 + b * 114) / 1000 > 128 ? 'light' : 'dark';
  box.style.background = bg;
  box.style.color = cs.color;
  box.style.fontFamily = xFont();
  box.style.setProperty('--yx-bg', bg);
  box.style.setProperty('--yx-fg', cs.color);

  const back = iconBtn(t('back'), I.back, true, () => show(null));
  back.hidden = true;
  const title = h('h2', null, 'YoruX');
  const body = h('div', { class: 'yx-body' });
  box.append(
    h('div', { class: 'yx-head' }, back, title, h('span', { class: 'yx-ver' }, 'v' + __VERSION__),
      iconBtn(t('close'), I.close, true, () => close())),
    body);
  ov.appendChild(box);
  document.body.appendChild(ov);

  let cleanup = null;
  let current = null;
  function show(id) {
    current = id;
    back.title = t('back');
    const xb = box.querySelector('.yx-head .yx-icon:last-child');
    if (xb) xb.title = t('close');
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    body.textContent = '';
    const page = getPages().find((p) => p.id === id);
    if (!page) {
      title.textContent = 'YoruX';
      back.hidden = true;
      body.append(h('div', { class: 'yx-tiles' }, getPages().map((p) => h('button', {
        type: 'button', class: 'yx-tile', onclick: () => show(p.id),
      }, h('span', { class: 'yx-tile-ico' }, ico(p.icon)), h('span', { class: 'yx-tile-txt' }, h('span', { class: 'yx-tile-title' }, p.title), h('span', { class: 'yx-tile-desc' }, p.desc)), h('span', { class: 'yx-tile-chev' }, ico(I.chev))))));
      return;
    }
    title.textContent = page.title;
    back.hidden = false;
    cleanup = page.render(body) || null;
  }

  const offLang = onLangChange(() => show(current));
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  function close() {
    if (cleanup) { try { cleanup(); } catch (e) {} }
    ov.remove();
    offLang();
    document.removeEventListener('keydown', onKey, true);
  }
  document.addEventListener('keydown', onKey, true);
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
  show(pageId || null);
}
