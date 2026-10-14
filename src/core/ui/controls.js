import { h } from '../dom';
import { tr } from '../i18n';

export const sw = (checked, onChange) => {
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

export const optionRows = (settings, keys) => Object.entries(settings.def)
  .filter(([key]) => !keys || keys.includes(key))
  .map(([key, def]) => h('div', { class: 'yx-opt' },
    h('label', null, tr(def.title) || key, def.hint ? h('span', { class: 'yx-hint' }, tr(def.hint)) : null),
    control(settings.store, key, def)));
