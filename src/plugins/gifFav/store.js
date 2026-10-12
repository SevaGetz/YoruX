import { read, write } from '@core/storage';

const KEY = 'gifFavs'; // тот же ключ, что в старом скрипте — избранное сохраняется
const subs = new Set();

export const isHttp = (u) => typeof u === 'string' && /^https?:/.test(u);
export const load = () => { const a = read(KEY, []); return Array.isArray(a) ? a : []; };
export const has = (u) => load().some((f) => f.url === u);
export const subscribe = (cb) => { subs.add(cb); return () => subs.delete(cb); };

export function save(a) {
  write(KEY, a);
  subs.forEach((f) => f());
}

export function toggle(item) {
  if (!item || !item.url) return;
  const a = load();
  const i = a.findIndex((f) => f.url === item.url);
  if (i >= 0) a.splice(i, 1);
  else a.unshift({ url: item.url, type: item.type, preview: item.preview || '', t: Date.now() });
  save(a);
}

export function importItems(arr) {
  if (!Array.isArray(arr)) throw new Error('не массив');
  const cur = load();
  let added = 0;
  arr.forEach((it) => {
    if (it && isHttp(it.url) && !cur.some((c) => c.url === it.url)) {
      cur.push({ url: it.url, type: it.type === 'video' ? 'video' : 'img', preview: it.preview || '', t: it.t || Date.now() });
      added++;
    }
  });
  save(cur);
  return added;
}
