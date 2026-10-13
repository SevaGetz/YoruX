import { read, write } from './storage';
import { LOG, addStyle, removeStyle } from './dom';
import { t } from './i18n';

const ENABLED_KEY = 'yorux:enabled';
const optsKey = (n) => 'yorux:opts:' + n;

export const plugins = [];
const listeners = new Set();
export const onPluginsChange = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
export const notify = () => emit();
const emit = () => listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });

/* ---------- plugin settings ---------- */
const optCache = new Map();
const getOpts = (name) => {
  if (!optCache.has(name)) optCache.set(name, read(optsKey(name), {}) || {});
  return optCache.get(name);
};

// definePluginSettings({ key: { type: 'boolean'|'select'|'number'|'string', title, default, choices?, min?, max? } })
export function definePluginSettings(def) {
  const owner = { name: null };
  const store = new Proxy({}, {
    get(_, key) {
      if (!(key in def)) return undefined;
      const saved = getOpts(owner.name);
      return key in saved ? saved[key] : def[key].default;
    },
    set(_, key, value) {
      const saved = { ...getOpts(owner.name), [key]: value };
      optCache.set(owner.name, saved);
      write(optsKey(owner.name), saved);
      if (def[key] && def[key].onChange) def[key].onChange(value);
      return true;
    },
  });
  return { def, store, owner };
}

const extras = [];
export const registerCoreSettings = (name, settings) => { settings.owner.name = name; extras.push({ name, settings }); };
const withSettings = () => [...extras, ...plugins].filter((p) => p.settings);

/* ---------- plugins ---------- */
// definePlugin({ name, title, description, enabledByDefault, settings, styles, tile, start, stop, scan })
export function definePlugin(p) {
  if (!p.name) throw new Error('plugin without name');
  if (p.settings) p.settings.owner.name = p.name;
  return p;
}

const enabledMap = () => read(ENABLED_KEY, {}) || {};
export const isEnabled = (p) => {
  const m = enabledMap();
  return p.name in m ? !!m[p.name] : p.enabledByDefault !== false;
};

function startPlugin(p) {
  if (p.started) return;
  try {
    if (p.styles) addStyle('plugin:' + p.name, p.styles);
    p.start && p.start();
    p.started = true;
    LOG('plugin on:', p.name);
  } catch (e) { console.error('[YoruX] start failed:', p.name, e); }
}

function stopPlugin(p) {
  if (!p.started) return;
  try { p.stop && p.stop(); } catch (e) { console.error('[YoruX] stop failed:', p.name, e); }
  removeStyle('plugin:' + p.name);
  p.started = false;
  LOG('plugin off:', p.name);
}

export function syncPlugins() {
  plugins.forEach((p) => (isEnabled(p) ? startPlugin(p) : stopPlugin(p)));
  emit();
}

export function setEnabled(p, on) {
  write(ENABLED_KEY, { ...enabledMap(), [p.name]: !!on });
  syncPlugins();
}

export function registerPlugins(list) {
  plugins.push(...list);
  syncPlugins();
}

/* ---------- резервная копия настроек ---------- */
const backups = []; // { key, get, set } — данные вне настроек плагинов (например, темы)
export const registerBackup = (key, get, set) => backups.push({ key, get, set });

export const exportConfig = () => ({
  yorux: 1,
  extra: Object.fromEntries(backups.map((b) => [b.key, b.get()])),
  enabled: enabledMap(),
  options: Object.fromEntries(withSettings().map((p) => [p.name, { ...getOpts(p.name) }])),
});

export function importConfig(obj) {
  if (!obj || obj.yorux !== 1) throw new Error(t('notYorux'));
  write(ENABLED_KEY, obj.enabled || {});
  withSettings().forEach((p) => {
    const o = (obj.options && obj.options[p.name]) || {};
    optCache.set(p.name, o);
    write(optsKey(p.name), o);
  });
  backups.forEach((b) => { if (obj.extra && b.key in obj.extra) b.set(obj.extra[b.key]); });
  syncPlugins();
}

export function resetConfig() {
  write(ENABLED_KEY, {});
  withSettings().forEach((p) => {
    optCache.set(p.name, {});
    write(optsKey(p.name), {});
  });
  syncPlugins();
}
