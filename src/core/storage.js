export const read = (key, def) => {
  try {
    const raw = GM_getValue(key, null);
    if (raw === null || raw === undefined) return def;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) { return def; }
};

export const write = (key, value) => GM_setValue(key, JSON.stringify(value));
