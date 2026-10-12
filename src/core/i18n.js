import dict from './locales';

// язык берётся из общих настроек (general.js подключает источник), «auto» — по языку браузера
let source = () => 'auto';
export const setLangSource = (fn) => { source = fn; };

export const lang = () => {
  const p = source();
  if (p === 'ru' || p === 'en') return p;
  return (navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
};

const subs = new Set();
export const onLangChange = (cb) => { subs.add(cb); return () => subs.delete(cb); };
export const emitLang = () => subs.forEach((f) => { try { f(); } catch (e) { console.error(e); } });

// createT({ ru: {key: '...'}, en: {...} }) -> t('key', { n: 1 }); подстановка {n}
export const createT = (d) => (key, vars) => {
  let s = (d[lang()] && d[lang()][key]) || (d.en && d.en[key]) || key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
};

// строка | { ru, en } | функция -> строка на текущем языке
export const tr = (v) => {
  if (typeof v === 'function') return v();
  if (v && typeof v === 'object') return v[lang()] || v.en || '';
  return v == null ? '' : v;
};

export const t = createT(dict);
