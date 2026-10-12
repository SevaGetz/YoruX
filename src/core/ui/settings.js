import { h, toast } from '../dom';
import { plugins, isEnabled, setEnabled, exportConfig, importConfig, resetConfig } from '../api';

/* ---------- иконки (контурные, как в меню X) ---------- */
const ico = (inner, fill) => h('span', {
  innerHTML: '<svg viewBox="0 0 24 24" width="' + (fill ? 20 : 26) + '" height="' + (fill ? 20 : 26) + '" fill="' + (fill ? 'currentColor' : 'none') +
    '" stroke="' + (fill ? 'none' : 'currentColor') + '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>',
});
const I = {
  back: '<path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/>',
  close: '<path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/>',
  plugins: '<path d="M10 4.5a2 2 0 1 1 4 0V6h3.5A1.5 1.5 0 0 1 19 7.5V11h-1.5a2 2 0 1 0 0 4H19v3.5a1.5 1.5 0 0 1-1.5 1.5H14v-1.5a2 2 0 1 0-4 0V20H6.5A1.5 1.5 0 0 1 5 18.5V15h1.5a2 2 0 1 0 0-4H5V7.5A1.5 1.5 0 0 1 6.5 6H10z"/>',
  backup: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z"/>',
  tune: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
};
const iconBtn = (title, inner, fill, onclick) => h('button', { type: 'button', class: 'yx-icon', title, onclick }, ico(inner, fill));

/* ---------- элементы управления ---------- */
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
    const s = h('select', null, choices.map((c) => h('option', { value: String(c.value) }, c.label)));
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

/* ---------- страница «Плагины» ---------- */
function renderPlugins(box) {
  const search = h('input', { class: 'yx-search', type: 'text', placeholder: 'Поиск плагинов…' });
  const list = h('div');
  box.append(search, list);

  const draw = () => {
    const q = search.value.trim().toLowerCase();
    list.textContent = '';
    const shown = [...plugins]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((p) => !q || (p.name + ' ' + (p.title || '') + ' ' + (p.description || '')).toLowerCase().includes(q));
    if (!shown.length) list.append(h('div', { class: 'yx-empty' }, 'Ничего не найдено'));
    shown.forEach((p) => {
      const opts = h('div', { class: 'yx-opts', hidden: true });
      if (p.settings) {
        Object.entries(p.settings.def).forEach(([key, def]) => {
          opts.append(h('div', { class: 'yx-opt' }, h('label', null, def.title || key), control(p.settings.store, key, def)));
        });
      }
      const gear = p.settings ? iconBtn('Настройки плагина', I.tune, false, () => { opts.hidden = !opts.hidden; }) : null;
      list.append(h('div', { class: 'yx-plugin' },
        h('div', { class: 'yx-prow' },
          h('div', { class: 'yx-pinfo' },
            h('div', { class: 'yx-pname' }, p.title || p.name),
            h('div', { class: 'yx-pdesc' }, p.description || '')),
          gear,
          sw(isEnabled(p), (v) => setEnabled(p, v))),
        opts));
    });
  };
  search.addEventListener('input', draw);
  draw();
}

/* ---------- страница «Резервная копия» ---------- */
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
    r.onload = () => { try { cb(JSON.parse(r.result)); } catch (e) { toast('Не получилось прочитать файл: ' + e.message); } };
    r.readAsText(f);
  };
  inp.click();
}

function renderBackup(box) {
  box.append(h('div', { class: 'yx-btns', style: { paddingTop: 0 } },
    h('button', {
      type: 'button',
      onclick: () => downloadText('yorux-settings-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(exportConfig(), null, 2)),
    }, 'Экспорт настроек'),
    h('button', {
      type: 'button',
      onclick: () => pickJson((o) => { importConfig(o); toast('Настройки импортированы'); }),
    }, 'Импорт настроек'),
    h('button', {
      type: 'button', class: 'yx-danger',
      onclick: () => { if (confirm('Сбросить включённые плагины и их настройки? Данные плагинов (например, избранные GIF) не затрагиваются.')) { resetConfig(); toast('Настройки сброшены'); } },
    }, 'Сбросить')));
}

/* ---------- плитки ---------- */
function getPages() {
  const on = plugins.filter(isEnabled).length;
  const pages = [
    { id: 'plugins', icon: I.plugins, title: 'Плагины', desc: on + ' из ' + plugins.length + ' включено', render: renderPlugins },
  ];
  plugins.filter((p) => p.started && p.tile).forEach((p) => pages.push({
    id: 'plugin:' + p.name,
    icon: p.tile.icon || I.star,
    title: p.tile.title,
    desc: p.tile.desc ? p.tile.desc() : '',
    render: p.tile.render,
  }));
  pages.push({ id: 'backup', icon: I.backup, title: 'Резервная копия', desc: 'Экспорт и импорт настроек', render: renderBackup });
  return pages;
}

/* ---------- окно ---------- */
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

  const back = iconBtn('Назад', I.back, true, () => show(null));
  back.hidden = true;
  const title = h('h2', null, 'YoruX');
  const body = h('div', { class: 'yx-body' });
  box.append(
    h('div', { class: 'yx-head' }, back, title, h('span', { class: 'yx-ver' }, 'v' + __VERSION__),
      iconBtn('Закрыть', I.close, true, () => close())),
    body);
  ov.appendChild(box);
  document.body.appendChild(ov);

  let cleanup = null;
  function show(id) {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    body.textContent = '';
    const page = getPages().find((p) => p.id === id);
    if (!page) {
      title.textContent = 'YoruX';
      back.hidden = true;
      body.append(h('div', { class: 'yx-tiles' }, getPages().map((p) => h('button', {
        type: 'button', class: 'yx-tile', onclick: () => show(p.id),
      }, h('span', { class: 'yx-tile-ico' }, ico(p.icon)), h('span', { class: 'yx-tile-title' }, p.title), h('span', { class: 'yx-tile-desc' }, p.desc)))));
      return;
    }
    title.textContent = page.title;
    back.hidden = false;
    cleanup = page.render(body) || null;
  }

  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  function close() {
    if (cleanup) { try { cleanup(); } catch (e) {} }
    ov.remove();
    document.removeEventListener('keydown', onKey, true);
  }
  document.addEventListener('keydown', onKey, true);
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
  show(pageId || null);
}
