import { h, toast } from '../dom';
import { plugins, isEnabled, setEnabled, exportConfig, importConfig, resetConfig } from '../api';

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
      const gear = p.settings ? h('button', {
        type: 'button', class: 'yx-icon', title: 'Настройки плагина',
        onclick: () => { opts.hidden = !opts.hidden; },
      }, '⚙') : null;
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
    { id: 'plugins', icon: '🧩', title: 'Плагины', desc: on + ' из ' + plugins.length + ' включено', render: renderPlugins },
  ];
  plugins.filter((p) => p.started && p.tile).forEach((p) => pages.push({
    id: 'plugin:' + p.name,
    icon: p.tile.icon || '★',
    title: p.tile.title,
    desc: p.tile.desc ? p.tile.desc() : '',
    render: p.tile.render,
  }));
  pages.push({ id: 'backup', icon: '💾', title: 'Резервная копия', desc: 'Экспорт и импорт настроек', render: renderBackup });
  return pages;
}

/* ---------- окно ---------- */
export function openSettings(pageId) {
  if (document.querySelector('.yx-ov')) return;
  const cs = getComputedStyle(document.body);
  const ov = h('div', { class: 'yx-ov' });
  const box = h('div', { class: 'yx-modal' });
  box.style.background = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#000' : cs.backgroundColor;
  box.style.color = cs.color;

  const back = h('button', { type: 'button', class: 'yx-icon', title: 'Назад', hidden: true, onclick: () => show(null) }, '←');
  const title = h('h2', null, 'YoruX');
  const body = h('div', { class: 'yx-body' });
  box.append(
    h('div', { class: 'yx-head' }, back, title, h('span', { class: 'yx-ver' }, 'v' + __VERSION__),
      h('button', { type: 'button', class: 'yx-icon', title: 'Закрыть', onclick: () => close() }, '✕')),
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
      }, h('span', { class: 'yx-tile-ico' }, p.icon), h('span', { class: 'yx-tile-title' }, p.title), h('span', { class: 'yx-tile-desc' }, p.desc)))));
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
