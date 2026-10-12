// ==UserScript==
// @name         YoruX
// @namespace    SevaGetz.x.mod
// @version      0.8.1
// @description  YoruX: модульный мод для X/Twitter с плагинами
// @match        https://x.com/*
// @match        https://*.x.com/*
// @match        https://twitter.com/*
// @match        https://*.twitter.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      giphy.com
// @connect      twimg.com
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/SevaGetz/YoruX/main/dist/YoruX.user.js
// @downloadURL  https://raw.githubusercontent.com/SevaGetz/YoruX/main/dist/YoruX.user.js
// ==/UserScript==

(() => {
  // src/core/storage.js
  var read = (key, def) => {
    try {
      const raw = GM_getValue(key, null);
      if (raw === null || raw === void 0) return def;
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      return def;
    }
  };
  var write = (key, value) => GM_setValue(key, JSON.stringify(value));

  // src/core/dom.js
  var LOG = (...a) => console.log("[YoruX]", ...a);
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else if (k in e) e[k] = v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    e.append(...kids.flat().filter((x) => x != null && x !== false));
    return e;
  }
  var el = (tag, cls) => h(tag, cls ? { class: cls } : null);
  function toast(msg) {
    const t = h("div", { class: "yx-toast" }, msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
  var styles = /* @__PURE__ */ new Map();
  var styleEls = /* @__PURE__ */ new WeakMap();
  var seenRoots = [];
  var hostOf = (root) => root === document ? document.head || document.documentElement : root;
  function applyOne(root, id) {
    let m = styleEls.get(root);
    if (!m) {
      m = /* @__PURE__ */ new Map();
      styleEls.set(root, m);
    }
    let s = m.get(id);
    if (!s || !s.isConnected) {
      s = document.createElement("style");
      s.dataset.yx = id;
      hostOf(root).appendChild(s);
      m.set(id, s);
    }
    s.textContent = styles.get(id);
  }
  function addStyle(id, css) {
    styles.set(id, css);
    [document, ...seenRoots].forEach((r) => applyOne(r, id));
  }
  function removeStyle(id) {
    styles.delete(id);
    [document, ...seenRoots].forEach((r) => {
      const m = styleEls.get(r);
      const s = m && m.get(id);
      if (s) {
        s.remove();
        m.delete(id);
      }
    });
  }
  var OBS = { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] };
  var watched = /* @__PURE__ */ new WeakSet();
  var mo = null;
  function initObserver(cb) {
    mo = new MutationObserver(cb);
    mo.observe(document.documentElement, OBS);
  }
  function watchRoot(root) {
    if (watched.has(root)) return;
    watched.add(root);
    if (mo) mo.observe(root, OBS);
    styles.forEach((_, id) => applyOne(root, id));
  }
  function getRoots() {
    const out = [document];
    const walk = (root) => {
      root.querySelectorAll("*").forEach((n) => {
        if (n.shadowRoot) {
          out.push(n.shadowRoot);
          watchRoot(n.shadowRoot);
          walk(n.shadowRoot);
        }
      });
    };
    walk(document);
    seenRoots = out.slice(1);
    return out;
  }
  var getSeenRoots = () => seenRoots;
  var qAll = (roots, sel) => roots.flatMap((r) => [...r.querySelectorAll(sel)]);

  // src/core/api.js
  var ENABLED_KEY = "yorux:enabled";
  var optsKey = (n) => "yorux:opts:" + n;
  var plugins = [];
  var listeners = /* @__PURE__ */ new Set();
  var onPluginsChange = (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  var emit = () => listeners.forEach((f) => {
    try {
      f();
    } catch (e) {
      console.error(e);
    }
  });
  var optCache = /* @__PURE__ */ new Map();
  var getOpts = (name) => {
    if (!optCache.has(name)) optCache.set(name, read(optsKey(name), {}) || {});
    return optCache.get(name);
  };
  function definePluginSettings(def) {
    const owner = { name: null };
    const store = new Proxy({}, {
      get(_, key) {
        if (!(key in def)) return void 0;
        const saved = getOpts(owner.name);
        return key in saved ? saved[key] : def[key].default;
      },
      set(_, key, value) {
        const saved = { ...getOpts(owner.name), [key]: value };
        optCache.set(owner.name, saved);
        write(optsKey(owner.name), saved);
        return true;
      }
    });
    return { def, store, owner };
  }
  function definePlugin(p) {
    if (!p.name) throw new Error("plugin without name");
    if (p.settings) p.settings.owner.name = p.name;
    return p;
  }
  var enabledMap = () => read(ENABLED_KEY, {}) || {};
  var isEnabled = (p) => {
    const m = enabledMap();
    return p.name in m ? !!m[p.name] : p.enabledByDefault !== false;
  };
  function startPlugin(p) {
    if (p.started) return;
    try {
      if (p.styles) addStyle("plugin:" + p.name, p.styles);
      p.start && p.start();
      p.started = true;
      LOG("plugin on:", p.name);
    } catch (e) {
      console.error("[YoruX] start failed:", p.name, e);
    }
  }
  function stopPlugin(p) {
    if (!p.started) return;
    try {
      p.stop && p.stop();
    } catch (e) {
      console.error("[YoruX] stop failed:", p.name, e);
    }
    removeStyle("plugin:" + p.name);
    p.started = false;
    LOG("plugin off:", p.name);
  }
  function syncPlugins() {
    plugins.forEach((p) => isEnabled(p) ? startPlugin(p) : stopPlugin(p));
    emit();
  }
  function setEnabled(p, on) {
    write(ENABLED_KEY, { ...enabledMap(), [p.name]: !!on });
    syncPlugins();
  }
  function registerPlugins(list) {
    plugins.push(...list);
    syncPlugins();
  }
  var exportConfig = () => ({
    yorux: 1,
    enabled: enabledMap(),
    options: Object.fromEntries(plugins.filter((p) => p.settings).map((p) => [p.name, { ...getOpts(p.name) }]))
  });
  function importConfig(obj) {
    if (!obj || obj.yorux !== 1) throw new Error("это не файл настроек YoruX");
    write(ENABLED_KEY, obj.enabled || {});
    plugins.forEach((p) => {
      if (!p.settings) return;
      const o = obj.options && obj.options[p.name] || {};
      optCache.set(p.name, o);
      write(optsKey(p.name), o);
    });
    syncPlugins();
  }
  function resetConfig() {
    write(ENABLED_KEY, {});
    plugins.forEach((p) => {
      if (!p.settings) return;
      optCache.set(p.name, {});
      write(optsKey(p.name), {});
    });
    syncPlugins();
  }

  // src/core/ui/settings.js
  var sw = (checked, onChange) => {
    const i = h("input", { type: "checkbox", checked: !!checked });
    i.addEventListener("change", () => onChange(i.checked));
    return h("label", { class: "yx-sw" }, i, h("span"));
  };
  function control(store, key, def) {
    const cur = store[key];
    if (def.type === "boolean") return sw(cur, (v) => {
      store[key] = v;
    });
    if (def.type === "select") {
      const choices = def.choices.map((c) => typeof c === "object" ? c : { value: c, label: String(c) });
      const s = h("select", null, choices.map((c) => h("option", { value: String(c.value) }, c.label)));
      s.value = String(cur);
      s.addEventListener("change", () => {
        store[key] = choices.find((c) => String(c.value) === s.value).value;
      });
      return s;
    }
    if (def.type === "number") {
      const i2 = h("input", { type: "number", min: def.min, max: def.max, value: cur, style: { width: "90px" } });
      i2.addEventListener("change", () => {
        const n = parseFloat(i2.value);
        if (!isNaN(n)) store[key] = n;
      });
      return i2;
    }
    const i = h("input", { type: "text", value: cur == null ? "" : cur });
    i.addEventListener("change", () => {
      store[key] = i.value;
    });
    return i;
  }
  function renderPlugins(box) {
    const search = h("input", { class: "yx-search", type: "text", placeholder: "Поиск плагинов…" });
    const list = h("div");
    box.append(search, list);
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      list.textContent = "";
      const shown = [...plugins].sort((a, b) => a.name.localeCompare(b.name)).filter((p) => !q || (p.name + " " + (p.title || "") + " " + (p.description || "")).toLowerCase().includes(q));
      if (!shown.length) list.append(h("div", { class: "yx-empty" }, "Ничего не найдено"));
      shown.forEach((p) => {
        const opts = h("div", { class: "yx-opts", hidden: true });
        if (p.settings) {
          Object.entries(p.settings.def).forEach(([key, def]) => {
            opts.append(h("div", { class: "yx-opt" }, h("label", null, def.title || key), control(p.settings.store, key, def)));
          });
        }
        const gear = p.settings ? h("button", {
          type: "button",
          class: "yx-icon",
          title: "Настройки плагина",
          onclick: () => {
            opts.hidden = !opts.hidden;
          }
        }, "⚙") : null;
        list.append(h(
          "div",
          { class: "yx-plugin" },
          h(
            "div",
            { class: "yx-prow" },
            h(
              "div",
              { class: "yx-pinfo" },
              h("div", { class: "yx-pname" }, p.title || p.name),
              h("div", { class: "yx-pdesc" }, p.description || "")
            ),
            gear,
            sw(isEnabled(p), (v) => setEnabled(p, v))
          ),
          opts
        ));
      });
    };
    search.addEventListener("input", draw);
    draw();
  }
  function downloadText(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = h("a", { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2e3);
  }
  function pickJson(cb) {
    const inp = h("input", { type: "file", accept: "application/json,.json" });
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          cb(JSON.parse(r.result));
        } catch (e) {
          toast("Не получилось прочитать файл: " + e.message);
        }
      };
      r.readAsText(f);
    };
    inp.click();
  }
  function renderBackup(box) {
    box.append(h(
      "div",
      { class: "yx-btns", style: { paddingTop: 0 } },
      h("button", {
        type: "button",
        onclick: () => downloadText("yorux-settings-" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json", JSON.stringify(exportConfig(), null, 2))
      }, "Экспорт настроек"),
      h("button", {
        type: "button",
        onclick: () => pickJson((o) => {
          importConfig(o);
          toast("Настройки импортированы");
        })
      }, "Импорт настроек"),
      h("button", {
        type: "button",
        class: "yx-danger",
        onclick: () => {
          if (confirm("Сбросить включённые плагины и их настройки? Данные плагинов (например, избранные GIF) не затрагиваются.")) {
            resetConfig();
            toast("Настройки сброшены");
          }
        }
      }, "Сбросить")
    ));
  }
  function getPages() {
    const on = plugins.filter(isEnabled).length;
    const pages = [
      { id: "plugins", icon: "🧩", title: "Плагины", desc: on + " из " + plugins.length + " включено", render: renderPlugins }
    ];
    plugins.filter((p) => p.started && p.tile).forEach((p) => pages.push({
      id: "plugin:" + p.name,
      icon: p.tile.icon || "★",
      title: p.tile.title,
      desc: p.tile.desc ? p.tile.desc() : "",
      render: p.tile.render
    }));
    pages.push({ id: "backup", icon: "💾", title: "Резервная копия", desc: "Экспорт и импорт настроек", render: renderBackup });
    return pages;
  }
  function openSettings(pageId) {
    if (document.querySelector(".yx-ov")) return;
    const cs = getComputedStyle(document.body);
    const ov = h("div", { class: "yx-ov" });
    const box = h("div", { class: "yx-modal" });
    box.style.background = cs.backgroundColor === "rgba(0, 0, 0, 0)" ? "#000" : cs.backgroundColor;
    box.style.color = cs.color;
    const back = h("button", { type: "button", class: "yx-icon", title: "Назад", hidden: true, onclick: () => show(null) }, "←");
    const title = h("h2", null, "YoruX");
    const body = h("div", { class: "yx-body" });
    box.append(
      h(
        "div",
        { class: "yx-head" },
        back,
        title,
        h("span", { class: "yx-ver" }, "v0.8.1"),
        h("button", { type: "button", class: "yx-icon", title: "Закрыть", onclick: () => close() }, "✕")
      ),
      body
    );
    ov.appendChild(box);
    document.body.appendChild(ov);
    let cleanup = null;
    function show(id) {
      if (cleanup) {
        try {
          cleanup();
        } catch (e) {
        }
        cleanup = null;
      }
      body.textContent = "";
      const page = getPages().find((p) => p.id === id);
      if (!page) {
        title.textContent = "YoruX";
        back.hidden = true;
        body.append(h("div", { class: "yx-tiles" }, getPages().map((p) => h("button", {
          type: "button",
          class: "yx-tile",
          onclick: () => show(p.id)
        }, h("span", { class: "yx-tile-ico" }, p.icon), h("span", { class: "yx-tile-title" }, p.title), h("span", { class: "yx-tile-desc" }, p.desc)))));
        return;
      }
      title.textContent = page.title;
      back.hidden = false;
      cleanup = page.render(body) || null;
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    function close() {
      if (cleanup) {
        try {
          cleanup();
        } catch (e) {
        }
      }
      ov.remove();
      document.removeEventListener("keydown", onKey, true);
    }
    document.addEventListener("keydown", onKey, true);
    ov.addEventListener("mousedown", (e) => {
      if (e.target === ov) close();
    });
    show(pageId || null);
  }

  // src/plugins/gifFav/settings.js
  var settings = definePluginSettings({
    convert: { type: "boolean", title: "Конвертировать GIF из твитов (mp4) в настоящий .gif при отправке", default: true },
    maxW: { type: "select", title: "Макс. ширина GIF при конвертации", default: 400, choices: [
      { value: 220, label: "220 px" },
      { value: 300, label: "300 px" },
      { value: 400, label: "400 px" },
      { value: 480, label: "480 px" }
    ] },
    closeAfter: { type: "boolean", title: "Закрывать окно выбора GIF после выбора", default: true }
  });

  // src/plugins/gifFav/styles.js
  var CSS = `
  .fav-star{position:absolute;top:6px;right:6px;z-index:50;width:30px;height:30px;border-radius:50%;
    background:rgba(0,0,0,.65);color:#fff;font-size:18px;line-height:1;display:flex;align-items:center;
    justify-content:center;text-align:center;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .15s;user-select:none}
  .fav-host:hover > .fav-star,.fav-star.active{opacity:1;pointer-events:auto}
  .fav-star.active{color:#ffd400}
  .fav-bar{display:flex;gap:8px;box-sizing:border-box}
  .fav-bar.fav-pad{padding:8px 12px 12px}
  .fav-bar button{border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;border-radius:999px;
    padding:6px 14px;cursor:pointer;font:inherit;font-size:14px}
  .fav-bar button.on{background:#1d9bf0;border-color:#1d9bf0;color:#fff}
  .fav-panel{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;overflow-y:auto;
    max-height:min(60svh,468px);align-content:start;box-sizing:border-box}
  .fav-panel.fav-pad{padding:0 12px 12px}
  .fav-panel[hidden]{display:none}
  .fav-tile{position:relative;height:0;padding-bottom:100%;overflow:hidden;border-radius:6px;cursor:pointer;background:rgba(128,128,128,.2)}
  .fav-tile img,.fav-tile video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block}
  .fav-tile .fav-del{position:absolute;top:6px;right:6px;width:28px;height:28px;border:0;border-radius:50%;
    background:rgba(0,0,0,.65);color:#ffd400;font-size:16px;line-height:1;cursor:pointer;padding:0;margin:0;
    box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif}
  .fav-empty{grid-column:1/-1;padding:24px 8px;text-align:center;opacity:.7;font-size:14px}
  .fav-hidden{display:none !important}
  .yx-modal .fav-panel{max-height:min(46vh,380px);padding:0 0 8px}
`;

  // src/plugins/gifFav/store.js
  var KEY = "gifFavs";
  var subs = /* @__PURE__ */ new Set();
  var isHttp = (u) => typeof u === "string" && /^https?:/.test(u);
  var load = () => {
    const a = read(KEY, []);
    return Array.isArray(a) ? a : [];
  };
  var has = (u) => load().some((f) => f.url === u);
  var subscribe = (cb) => {
    subs.add(cb);
    return () => subs.delete(cb);
  };
  function save(a) {
    write(KEY, a);
    subs.forEach((f) => f());
  }
  function toggle(item) {
    if (!item || !item.url) return;
    const a = load();
    const i = a.findIndex((f) => f.url === item.url);
    if (i >= 0) a.splice(i, 1);
    else a.unshift({ url: item.url, type: item.type, preview: item.preview || "", t: Date.now() });
    save(a);
  }
  function importItems(arr) {
    if (!Array.isArray(arr)) throw new Error("не массив");
    const cur = load();
    let added = 0;
    arr.forEach((it) => {
      if (it && isHttp(it.url) && !cur.some((c) => c.url === it.url)) {
        cur.push({ url: it.url, type: it.type === "video" ? "video" : "img", preview: it.preview || "", t: it.t || Date.now() });
        added++;
      }
    });
    save(cur);
    return added;
  }

  // src/plugins/gifFav/panel.js
  function fillPanel(panel, onPick) {
    panel.textContent = "";
    const favs = load();
    if (!favs.length) {
      const e = el("div", "fav-empty");
      e.textContent = "Пока пусто. Наведи на GIF (в пикере или в твите) и нажми ★";
      panel.appendChild(e);
      return;
    }
    favs.forEach((item) => {
      const t = el("div", "fav-tile");
      let m;
      if (item.type === "video") {
        m = el("video");
        m.muted = true;
        m.loop = true;
        m.playsInline = true;
        m.preload = "none";
        const loadVideo = () => {
          if (!m.getAttribute("src")) {
            m.preload = "metadata";
            m.src = item.url;
          }
        };
        if (item.preview) m.poster = item.preview;
        else {
          const io = new IntersectionObserver((es) => {
            if (es.some((e) => e.isIntersecting)) {
              loadVideo();
              io.disconnect();
            }
          }, { root: panel });
          io.observe(t);
        }
        t.addEventListener("mouseenter", () => {
          loadVideo();
          m.play().catch(() => {
          });
        });
        t.addEventListener("mouseleave", () => m.pause());
      } else {
        m = el("img");
        m.loading = "lazy";
        m.src = item.preview || item.url;
      }
      const del = el("button", "fav-del");
      del.type = "button";
      del.textContent = "★";
      del.title = "Убрать из избранного";
      del.onclick = (e) => {
        e.stopPropagation();
        toggle(item);
      };
      t.append(m, del);
      if (onPick) t.onclick = () => onPick(item);
      else t.style.cursor = "default";
      panel.appendChild(t);
    });
  }

  // src/plugins/gifFav/encoder.js
  function gifQuantize(frames) {
    const hist = new Uint32Array(32768);
    for (const d of frames) {
      for (let p = 0; p < d.length; p += 16) hist[d[p] >> 3 << 10 | d[p + 1] >> 3 << 5 | d[p + 2] >> 3]++;
    }
    const list = [];
    for (let i = 0; i < 32768; i++) if (hist[i]) list.push(i);
    let boxes = [list];
    while (boxes.length < 256) {
      let bi = -1, bl = 1;
      for (let i = 0; i < boxes.length; i++) if (boxes[i].length > bl) {
        bl = boxes[i].length;
        bi = i;
      }
      if (bi < 0) break;
      const box = boxes[bi];
      let rmin = 31, rmax = 0, gmin = 31, gmax = 0, bmin = 31, bmax = 0;
      for (const c of box) {
        const r = c >> 10, g = c >> 5 & 31, b = c & 31;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
        if (g < gmin) gmin = g;
        if (g > gmax) gmax = g;
        if (b < bmin) bmin = b;
        if (b > bmax) bmax = b;
      }
      const dr = rmax - rmin, dg = gmax - gmin, db = bmax - bmin;
      const ch = dr >= dg && dr >= db ? 10 : dg >= db ? 5 : 0;
      box.sort((a, b) => (a >> ch & 31) - (b >> ch & 31));
      let total = 0;
      for (const c of box) total += hist[c];
      let acc = 0, cut = 0;
      for (let i = 0; i < box.length; i++) {
        acc += hist[box[i]];
        if (acc >= total / 2) {
          cut = i;
          break;
        }
      }
      if (cut > box.length - 2) cut = box.length - 2;
      boxes.splice(bi, 1, box.slice(0, cut + 1), box.slice(cut + 1));
    }
    const pal = new Uint8Array(768);
    boxes.forEach((box, bi) => {
      let n = 0, r = 0, g = 0, b = 0;
      for (const c of box) {
        const w = hist[c];
        n += w;
        r += (c >> 10) * w;
        g += (c >> 5 & 31) * w;
        b += (c & 31) * w;
      }
      if (!n) n = 1;
      pal[bi * 3] = Math.round(r / n * 255 / 31);
      pal[bi * 3 + 1] = Math.round(g / n * 255 / 31);
      pal[bi * 3 + 2] = Math.round(b / n * 255 / 31);
    });
    const cnt = boxes.length;
    const cache = new Int16Array(32768).fill(-1);
    const nearest = (key) => {
      const r = (key >> 10 & 31) * 255 / 31, g = (key >> 5 & 31) * 255 / 31, b = (key & 31) * 255 / 31;
      let best = 0, bd = 1e9;
      for (let i = 0; i < cnt; i++) {
        const dr = pal[i * 3] - r, dg = pal[i * 3 + 1] - g, db = pal[i * 3 + 2] - b;
        const dd = dr * dr + dg * dg + db * db;
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      }
      return best;
    };
    const idx = frames.map((d) => {
      const out = new Uint8Array(d.length >> 2);
      for (let p = 0, q = 0; p < d.length; p += 4, q++) {
        const key = d[p] >> 3 << 10 | d[p + 1] >> 3 << 5 | d[p + 2] >> 3;
        let v = cache[key];
        if (v < 0) {
          v = nearest(key);
          cache[key] = v;
        }
        out[q] = v;
      }
      return out;
    });
    return { pal, idx };
  }
  function gifLzw(indices, minCode) {
    const clear = 1 << minCode, eoi = clear + 1;
    let codeSize = minCode + 1, next = eoi + 1;
    const out = [];
    let cur = 0, bits = 0;
    const emit2 = (c) => {
      cur |= c << bits;
      bits += codeSize;
      while (bits >= 8) {
        out.push(cur & 255);
        cur >>>= 8;
        bits -= 8;
      }
    };
    let dict = /* @__PURE__ */ new Map();
    emit2(clear);
    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i], key = prefix << 8 | k;
      const v = dict.get(key);
      if (v !== void 0) {
        prefix = v;
        continue;
      }
      emit2(prefix);
      if (next > (1 << codeSize) - 1 && codeSize < 12) codeSize++;
      if (next < 4096) dict.set(key, next++);
      else {
        emit2(clear);
        dict = /* @__PURE__ */ new Map();
        next = eoi + 1;
        codeSize = minCode + 1;
      }
      prefix = k;
    }
    emit2(prefix);
    if (next > (1 << codeSize) - 1 && codeSize < 12) codeSize++;
    emit2(eoi);
    if (bits > 0) out.push(cur & 255);
    return out;
  }
  function gifWrite(w, h2, pal, idxFrames, delayCs) {
    const parts = [];
    const u16 = (n) => [n & 255, n >> 8 & 255];
    parts.push(Uint8Array.from([71, 73, 70, 56, 57, 97, ...u16(w), ...u16(h2), 247, 0, 0]));
    parts.push(pal);
    parts.push(Uint8Array.from([33, 255, 11, ..."NETSCAPE2.0".split("").map((c) => c.charCodeAt(0)), 3, 1, 0, 0, 0]));
    for (const idx of idxFrames) {
      parts.push(Uint8Array.from([33, 249, 4, 0, ...u16(delayCs), 0, 0]));
      parts.push(Uint8Array.from([44, 0, 0, 0, 0, ...u16(w), ...u16(h2), 0, 8]));
      const data = gifLzw(idx, 8);
      const blocks = [];
      for (let i = 0; i < data.length; i += 255) {
        const chunk = data.slice(i, i + 255);
        blocks.push(chunk.length, ...chunk);
      }
      blocks.push(0);
      parts.push(Uint8Array.from(blocks));
    }
    parts.push(Uint8Array.from([59]));
    let total = 0;
    for (const p of parts) total += p.length;
    const res = new Uint8Array(total);
    let o = 0;
    for (const p of parts) {
      res.set(p, o);
      o += p.length;
    }
    return res;
  }
  var GIF_MAX_BYTES = 14 * 1024 * 1024;
  function videoBlobToGif(blob, maxW) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      let finished = false;
      const done = (fn, arg) => {
        if (finished) return;
        finished = true;
        clearTimeout(loadTimer);
        v.onerror = null;
        v.onloadeddata = null;
        URL.revokeObjectURL(url);
        v.removeAttribute("src");
        fn(arg);
      };
      const loadTimer = setTimeout(() => done(reject, new Error("таймаут загрузки видео")), 15e3);
      v.onerror = () => done(reject, new Error("не удалось декодировать видео"));
      v.onloadeddata = async () => {
        try {
          const dur = Math.min(v.duration || 0, 10);
          if (!dur || !v.videoWidth) throw new Error("пустое видео");
          const scale = Math.min(1, maxW / v.videoWidth);
          const w = Math.max(2, Math.round(v.videoWidth * scale));
          const h2 = Math.max(2, Math.round(v.videoHeight * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h2;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          const delayCs = 8, step = delayCs / 100;
          const n = Math.max(1, Math.min(120, Math.floor(dur / step)));
          const frames = [];
          for (let i = 0; i < n; i++) {
            const t = Math.min(i * step, Math.max(0, dur - 0.05));
            if (Math.abs(v.currentTime - t) > 1e-3) {
              await new Promise((res) => {
                v.onseeked = res;
                setTimeout(res, 3e3);
                v.currentTime = t;
              });
            }
            ctx.drawImage(v, 0, 0, w, h2);
            frames.push(ctx.getImageData(0, 0, w, h2).data);
          }
          const { pal, idx } = gifQuantize(frames);
          done(resolve, gifWrite(w, h2, pal, idx, delayCs));
        } catch (e) {
          done(reject, e);
        }
      };
      v.src = url;
    });
  }
  async function mp4ToGif(blob, cfgW) {
    let out = null;
    for (const w of [cfgW, 300, 220, 160].filter((x, i, arr) => x <= cfgW && arr.indexOf(x) === i)) {
      out = await videoBlobToGif(blob, w);
      LOG("gif " + w + "px, " + Math.round(out.length / 1024) + " KB");
      if (out.length <= GIF_MAX_BYTES) break;
    }
    return out;
  }

  // src/plugins/gifFav/send.js
  function findFileInput(d) {
    const all = qAll(getRoots(), 'input[type="file"]');
    LOG("file inputs found:", all.map((i) => (i.accept || "?") + " @" + (i.getRootNode() === document ? "document" : "shadow")));
    if (!all.length) return null;
    const media = all.filter((i) => !i.accept || /image|video|gif/i.test(i.accept));
    const pool = media.length ? media : all;
    const sameRoot = pool.filter((i) => i.getRootNode() === d.getRootNode());
    const list = sameRoot.length ? sameRoot : pool;
    return list[list.length - 1];
  }
  function findComposer(d) {
    const roots = getRoots();
    const dm = qAll(roots, '[data-testid="dm-composer-textarea"]').filter((n) => n.getClientRects().length);
    if (dm.length) {
      LOG("composer: dm-composer-textarea");
      return dm[dm.length - 1];
    }
    const cands = qAll(roots, 'textarea, [contenteditable="true"], [role="textbox"]').filter((n) => !d.contains(n) && n.id !== "gif-search" && n.getClientRects().length);
    LOG("composer candidates:", cands.length);
    if (!cands.length) return null;
    const same = cands.filter((n) => n.getRootNode() === d.getRootNode());
    const list = same.length ? same : cands;
    return list[list.length - 1];
  }
  function attachFile(file, d) {
    const input = findFileInput(d);
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      LOG("attached via file input");
      return true;
    }
    const composer = findComposer(d);
    if (composer) {
      const dt = new DataTransfer();
      dt.items.add(file);
      composer.focus();
      composer.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true, composed: true }));
      LOG("attached via paste");
      return true;
    }
    return false;
  }
  function closeDialog(d) {
    const c = d.querySelector('button[aria-label="Закрыть"], button[aria-label="Close"]');
    if (c) c.click();
    else document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true }));
  }
  function pick(item, d) {
    toast("Загружаю GIF…");
    GM_xmlhttpRequest({
      method: "GET",
      url: item.url,
      responseType: "blob",
      onload: (r) => {
        const blob = r.response;
        if (!blob || !blob.size) {
          toast("Не удалось скачать GIF");
          return;
        }
        const finish = (file) => {
          if (!attachFile(file, d)) {
            toast("Не нашёл ни поле загрузки, ни поле ввода. Подробности в консоли (F12).");
            return;
          }
          if (settings.store.closeAfter) setTimeout(() => closeDialog(d), 300);
        };
        const type = blob.type || (item.type === "video" ? "video/mp4" : "image/gif");
        if (/^video\//.test(type) && settings.store.convert) {
          toast("Конвертирую в GIF…");
          mp4ToGif(blob, settings.store.maxW).then((bytes) => finish(new File([bytes], "favorite.gif", { type: "image/gif" }))).catch((e) => {
            LOG("конвертация в GIF не удалась, отправляю как видео:", e);
            toast("Не получилось конвертировать, отправляю как видео");
            finish(new File([blob], "favorite.mp4", { type }));
          });
          return;
        }
        const ext = { "video/mp4": "mp4", "image/gif": "gif", "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" }[type] || "gif";
        finish(new File([blob], "favorite." + ext, { type }));
      },
      onerror: () => toast("Ошибка сети при скачивании GIF")
    });
  }

  // src/plugins/gifFav/picker.js
  var nodeOf = /* @__PURE__ */ new WeakMap();
  var stateOf = /* @__PURE__ */ new WeakMap();
  var states = /* @__PURE__ */ new Set();
  var EVENTS = ["pointerdown", "mousedown", "mouseup", "click"];
  var unsub = null;
  function giphyFull(src) {
    if (!/giphy\.com\/media\//.test(src)) return src;
    return src.replace(/\/[^\/?]+\.(gif|webp|mp4)(\?.*)?$/i, "/giphy.gif");
  }
  function getItem(n) {
    if (n.tagName === "VIDEO") {
      const s = n.querySelector("source");
      return { url: n.currentSrc || n.src || s && s.src, type: "video", preview: n.poster || "" };
    }
    const src = n.currentSrc || n.src;
    return { url: giphyFull(src), type: "img", preview: src };
  }
  function addStar(host, node) {
    const item = getItem(node);
    if (!isHttp(item.url)) return;
    let b = host.querySelector(":scope > .fav-star");
    if (!b) {
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      host.classList.add("fav-host");
      b = el("span", "fav-star");
      b.textContent = "★";
      b.title = "В избранное";
      host.appendChild(b);
    }
    nodeOf.set(b, node);
    b.dataset.url = item.url;
    b.classList.toggle("active", has(item.url));
  }
  function refreshStars() {
    qAll(getRoots(), ".fav-star").forEach((b) => b.classList.toggle("active", has(b.dataset.url)));
  }
  function starAt(e) {
    const path = e.composedPath ? e.composedPath() : [e.target];
    for (const n of path) {
      if (n && n.classList && n.classList.contains("fav-star")) return n;
    }
    if (!e.clientX && !e.clientY) return null;
    const roots = [document, ...getSeenRoots().filter((r) => r.host && r.host.isConnected)];
    for (const r of roots) {
      const hit = (r.elementsFromPoint ? r.elementsFromPoint(e.clientX, e.clientY) : []).find((n) => n.classList && n.classList.contains("fav-star"));
      if (hit) return hit;
    }
    return null;
  }
  var handlers = EVENTS.map((ev) => (e) => {
    const b = starAt(e);
    if (!b) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (ev === "click") {
      const n = nodeOf.get(b);
      if (n) toggle(getItem(n));
    }
  });
  function findPickers(roots) {
    const out = /* @__PURE__ */ new Set();
    qAll(roots, '#gif-search, input[placeholder*="GIF" i]').forEach((i) => {
      const d = i.closest('[role="dialog"]') || i.closest('[data-slot="xds-modal-surface"]') || i.parentElement && i.parentElement.parentElement && i.parentElement.parentElement.parentElement;
      if (d) out.add(d);
    });
    return out;
  }
  function findScroller(d) {
    let best = null, bestH = 0;
    d.querySelectorAll("*").forEach((n) => {
      if (n.closest(".fav-panel, .fav-bar")) return;
      const oy = getComputedStyle(n).overflowY;
      if ((oy === "auto" || oy === "scroll") && n.clientHeight > bestH) {
        best = n;
        bestH = n.clientHeight;
      }
    });
    return best;
  }
  function syncHidden(st) {
    const fav = st.mode === "fav";
    st.bar.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === 1 === fav));
    st.panel.hidden = !fav;
    let n = st.panel.nextElementSibling;
    while (n) {
      n.classList.toggle("fav-hidden", fav);
      n = n.nextElementSibling;
    }
  }
  var renderPanel = (st) => fillPanel(st.panel, (item) => pick(item, st.d));
  function setupPicker(d) {
    let st = stateOf.get(d);
    if (st && d.contains(st.bar)) return st;
    const root = d.getRootNode();
    const input = d.querySelector('#gif-search, input[placeholder*="GIF" i]');
    let sc = d.querySelector('[data-testid="gifSearchTrendingRoot"]') || d.querySelector('[data-testid="gifSearchTimelineRoot"]');
    if (!sc && input && input.parentElement && input.parentElement.parentElement) {
      sc = input.parentElement.parentElement.nextElementSibling;
    }
    if (!sc || sc.contains(input) || sc.classList.contains("fav-bar") || sc.classList.contains("fav-panel")) sc = findScroller(d);
    if (!sc || !sc.parentElement) return null;
    const bar = el("div", "fav-bar");
    const bAll = el("button");
    bAll.type = "button";
    bAll.textContent = "Все";
    const bFav = el("button");
    bFav.type = "button";
    bFav.textContent = "★ Избранное";
    bar.append(bAll, bFav);
    const panel = el("div", "fav-panel");
    panel.hidden = true;
    sc.before(bar, panel);
    const dr = d.getBoundingClientRect(), br = bar.getBoundingClientRect();
    if (br.width && br.left - dr.left < 10) {
      bar.classList.add("fav-pad");
      panel.classList.add("fav-pad");
    }
    st = { bar, panel, d, mode: "all" };
    bAll.onclick = () => {
      st.mode = "all";
      syncHidden(st);
    };
    bFav.onclick = () => {
      st.mode = "fav";
      renderPanel(st);
      syncHidden(st);
    };
    if (input) input.addEventListener("input", () => {
      if (states.has(st)) {
        st.mode = "all";
        syncHidden(st);
      }
    });
    stateOf.set(d, st);
    states.add(st);
    syncHidden(st);
    LOG("picker ready (shadow: " + (root !== document) + ")");
    return st;
  }
  function startPicker() {
    EVENTS.forEach((ev, i) => document.addEventListener(ev, handlers[i], true));
    unsub = subscribe(() => {
      refreshStars();
      states.forEach((st) => {
        if (st.mode === "fav") renderPanel(st);
      });
    });
  }
  function stopPicker() {
    EVENTS.forEach((ev, i) => document.removeEventListener(ev, handlers[i], true));
    if (unsub) {
      unsub();
      unsub = null;
    }
    states.forEach((st) => {
      st.bar.remove();
      st.panel.remove();
      let n = st.d.querySelectorAll(".fav-hidden");
      n.forEach((x) => x.classList.remove("fav-hidden"));
    });
    states.clear();
    qAll(getRoots(), ".fav-star").forEach((s) => {
      const host = s.parentElement;
      if (host) host.classList.remove("fav-host");
      s.remove();
    });
  }
  function scanPicker(roots) {
    const pickers = findPickers(roots);
    qAll(roots, "video").forEach((v) => {
      if (v.closest(".fav-panel")) return;
      const src = v.currentSrc || v.src || "";
      if (!/tweet_video/.test(src)) return;
      for (const d of pickers) if (d.contains(v)) return;
      const host = v.closest('[data-testid="videoPlayer"]') || v.parentElement;
      if (host) addStar(host, v);
    });
    pickers.forEach((d) => {
      const st = setupPicker(d);
      if (!st) return;
      if (st.mode === "fav") syncHidden(st);
      d.querySelectorAll("button > img").forEach((img) => {
        if (img.closest(".fav-panel, .fav-bar")) return;
        const u = img.currentSrc || img.src;
        if (!isHttp(u)) return;
        addStar(img.parentElement, img);
      });
    });
  }

  // src/plugins/gifFav/index.js
  function migrate() {
    if (read("yorux:migrated:gifFav", false)) return;
    const old = read("gifFavSettings", null);
    if (old) ["convert", "maxW", "closeAfter"].forEach((k) => {
      if (k in old) settings.store[k] = old[k];
    });
    write("yorux:migrated:gifFav", true);
  }
  function renderManager(box) {
    const grid = h("div", { class: "fav-panel" });
    const count = h("span");
    const refresh = () => {
      count.textContent = "Всего: " + load().length;
      fillPanel(grid, null);
    };
    refresh();
    const unsub2 = subscribe(refresh);
    box.append(
      h("div", { style: { opacity: ".65", fontSize: "13px", marginBottom: "8px" } }, count),
      grid,
      h(
        "div",
        { class: "yx-btns" },
        h("button", {
          type: "button",
          onclick: () => downloadText("yorux-gifs-" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json", JSON.stringify(load(), null, 2))
        }, "Экспорт"),
        h("button", {
          type: "button",
          onclick: () => pickJson((arr) => {
            toast("Импортировано: " + importItems(arr));
          })
        }, "Импорт"),
        h("button", {
          type: "button",
          class: "yx-danger",
          onclick: () => {
            if (load().length && confirm("Удалить все GIF из избранного? Это нельзя отменить.")) save([]);
          }
        }, "Очистить всё")
      )
    );
    return unsub2;
  }
  var gifFav_default = definePlugin({
    name: "gifFav",
    title: "Избранные GIF",
    description: "Вкладка «Избранное» в пикере GIF, звёздочки на GIF в пикере и в твитах, конвертация mp4 → GIF при отправке",
    enabledByDefault: true,
    settings,
    styles: CSS,
    tile: {
      icon: "★",
      title: "Избранные GIF",
      desc: () => load().length + " шт.",
      render: renderManager
    },
    start() {
      migrate();
      startPicker();
    },
    stop() {
      stopPicker();
    },
    scan: scanPicker
  });

  // yx-plugins:plugins
  var plugins_default = [gifFav_default];

  // src/core/ui/menu.js
  var STAR_PATH = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
  function injectMenu(roots) {
    qAll(roots, '[role="menu"]').forEach((menu) => {
      if (menu.querySelector(".yx-menu-item")) return;
      const link = menu.querySelector('a[data-testid="settings"], a[href="/settings"]');
      const row = link && link.parentElement;
      if (!row) return;
      const item = row.cloneNode(true);
      item.classList.add("yx-menu-item");
      const a = item.querySelector("a");
      if (a) {
        a.removeAttribute("href");
        a.removeAttribute("data-testid");
        a.setAttribute("role", "menuitem");
        a.tabIndex = 0;
      }
      const path = item.querySelector("svg path");
      if (path) path.setAttribute("d", STAR_PATH);
      const span = item.querySelector("span");
      if (span) span.textContent = "YoruX";
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true }));
        setTimeout(() => openSettings(), 0);
      });
      row.after(item);
    });
  }
  function watchMenu() {
    new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.matches('[role="menu"]') || n.querySelector('[role="menu"]') || n.closest('[role="menu"]')) {
            injectMenu([document]);
            return;
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // src/core/scanner.js
  function scan() {
    const roots = getRoots();
    injectMenu(roots);
    plugins.forEach((p) => {
      if (!p.started || !p.scan) return;
      try {
        p.scan(roots);
      } catch (e) {
        console.error("[YoruX] scan error:", p.name, e);
      }
    });
  }
  var timer = 0;
  var schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = 0;
      scan();
    }, 150);
  };
  function initScanner() {
    initObserver(schedule);
    document.addEventListener("load", schedule, true);
    onPluginsChange(schedule);
    schedule();
  }

  // src/core/ui/styles.js
  var CORE_CSS = `
  .yx-ov{position:fixed;inset:0;z-index:2147483646;background:rgba(91,112,131,.4);display:flex;align-items:center;justify-content:center}
  .yx-modal{width:min(640px,94vw);height:min(560px,90vh);display:flex;flex-direction:column;border-radius:16px;box-sizing:border-box;
    border:1px solid rgba(128,128,128,.35);font-family:inherit;font-size:15px;overflow:hidden}
  .yx-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(128,128,128,.25)}
  .yx-head h2{margin:0;font-size:20px;font-weight:700;flex:1}
  .yx-ver{opacity:.55;font-size:13px}
  .yx-modal button{border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;border-radius:999px;
    padding:7px 14px;cursor:pointer;font:inherit;font-size:14px}
  .yx-modal button:hover{background:rgba(128,128,128,.15)}
  .yx-modal button.yx-primary{background:#1d9bf0;border-color:#1d9bf0;color:#fff}
  .yx-modal button.yx-danger{color:#f4212e;border-color:rgba(244,33,46,.5)}
  .yx-modal button.yx-icon{width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1}
  .yx-modal [hidden]{display:none !important}
  .yx-body{flex:1;overflow:auto;padding:16px}
  .yx-btns{display:flex;flex-wrap:wrap;gap:8px;padding-top:12px}
  .yx-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
  .yx-modal button.yx-tile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;border-radius:14px;padding:16px;min-height:104px}
  .yx-tile-ico{font-size:26px;line-height:1}
  .yx-tile-title{font-weight:700;font-size:16px}
  .yx-tile-desc{opacity:.65;font-size:13px}
  .yx-search{width:100%;box-sizing:border-box;background:transparent;color:inherit;border:1px solid rgba(128,128,128,.5);
    border-radius:10px;padding:9px 12px;font:inherit;margin-bottom:8px}
  .yx-plugin{border-top:1px solid rgba(128,128,128,.25);padding:12px 0}
  .yx-plugin:first-of-type{border-top:0}
  .yx-prow{display:flex;align-items:center;gap:12px}
  .yx-pinfo{flex:1;min-width:0}
  .yx-pname{font-weight:700}
  .yx-pdesc{opacity:.65;font-size:13px;margin-top:2px}
  .yx-opts{margin:10px 0 0 12px;padding-left:12px;border-left:2px solid rgba(128,128,128,.3)}
  .yx-opt{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 0}
  .yx-opt label{flex:1}
  .yx-modal select,.yx-modal input[type=number],.yx-modal input[type=text]{background:transparent;color:inherit;
    border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:6px 8px;font:inherit}
  .yx-modal select option{color:#000}
  .yx-sw{position:relative;display:inline-block;width:40px;height:22px;flex:none;cursor:pointer}
  .yx-sw input{opacity:0;width:0;height:0;position:absolute}
  .yx-sw span{position:absolute;inset:0;border-radius:999px;background:rgba(128,128,128,.5);transition:background .15s}
  .yx-sw span::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
  .yx-sw input:checked + span{background:#1d9bf0}
  .yx-sw input:checked + span::after{transform:translateX(18px)}
  .yx-empty{opacity:.65;text-align:center;padding:24px 0}
  .yx-menu-item{cursor:pointer}
  .yx-toast{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:2147483647;background:#1d9bf0;color:#fff;
    padding:10px 16px;border-radius:8px;font-size:14px;max-width:80vw}
`;

  // src/index.js
  LOG("loaded v0.8.1", location.href);
  addStyle("core", CORE_CSS);
  registerPlugins(plugins_default);
  watchMenu();
  initScanner();
})();
