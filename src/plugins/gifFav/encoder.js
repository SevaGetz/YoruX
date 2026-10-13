import { LOG } from '@core/dom';

/* ---------- GIF-encoder (for convert mp4 -> gif) ---------- */
function gifQuantize(frames) {
  const hist = new Uint32Array(32768);
  for (const d of frames) {
    for (let p = 0; p < d.length; p += 16) hist[((d[p] >> 3) << 10) | ((d[p + 1] >> 3) << 5) | (d[p + 2] >> 3)]++;
  }
  const list = [];
  for (let i = 0; i < 32768; i++) if (hist[i]) list.push(i);
  let boxes = [list];
  while (boxes.length < 256) {
    let bi = -1, bl = 1;
    for (let i = 0; i < boxes.length; i++) if (boxes[i].length > bl) { bl = boxes[i].length; bi = i; }
    if (bi < 0) break;
    const box = boxes[bi];
    let rmin = 31, rmax = 0, gmin = 31, gmax = 0, bmin = 31, bmax = 0;
    for (const c of box) {
      const r = c >> 10, g = (c >> 5) & 31, b = c & 31;
      if (r < rmin) rmin = r; if (r > rmax) rmax = r;
      if (g < gmin) gmin = g; if (g > gmax) gmax = g;
      if (b < bmin) bmin = b; if (b > bmax) bmax = b;
    }
    const dr = rmax - rmin, dg = gmax - gmin, db = bmax - bmin;
    const ch = dr >= dg && dr >= db ? 10 : dg >= db ? 5 : 0;
    box.sort((a, b) => ((a >> ch) & 31) - ((b >> ch) & 31));
    let total = 0;
    for (const c of box) total += hist[c];
    let acc = 0, cut = 0;
    for (let i = 0; i < box.length; i++) { acc += hist[box[i]]; if (acc >= total / 2) { cut = i; break; } }
    if (cut > box.length - 2) cut = box.length - 2;
    boxes.splice(bi, 1, box.slice(0, cut + 1), box.slice(cut + 1));
  }
  const pal = new Uint8Array(768);
  boxes.forEach((box, bi) => {
    let n = 0, r = 0, g = 0, b = 0;
    for (const c of box) { const w = hist[c]; n += w; r += (c >> 10) * w; g += ((c >> 5) & 31) * w; b += (c & 31) * w; }
    if (!n) n = 1;
    pal[bi * 3] = Math.round((r / n) * 255 / 31);
    pal[bi * 3 + 1] = Math.round((g / n) * 255 / 31);
    pal[bi * 3 + 2] = Math.round((b / n) * 255 / 31);
  });
  const cnt = boxes.length;
  const cache = new Int16Array(32768).fill(-1);
  const nearest = (key) => {
    const r = ((key >> 10) & 31) * 255 / 31, g = ((key >> 5) & 31) * 255 / 31, b = (key & 31) * 255 / 31;
    let best = 0, bd = 1e9;
    for (let i = 0; i < cnt; i++) {
      const dr = pal[i * 3] - r, dg = pal[i * 3 + 1] - g, db = pal[i * 3 + 2] - b;
      const dd = dr * dr + dg * dg + db * db;
      if (dd < bd) { bd = dd; best = i; }
    }
    return best;
  };
  const idx = frames.map((d) => {
    const out = new Uint8Array(d.length >> 2);
    for (let p = 0, q = 0; p < d.length; p += 4, q++) {
      const key = ((d[p] >> 3) << 10) | ((d[p + 1] >> 3) << 5) | (d[p + 2] >> 3);
      let v = cache[key];
      if (v < 0) { v = nearest(key); cache[key] = v; }
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
  const emit = (c) => {
    cur |= c << bits; bits += codeSize;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  };
  let dict = new Map();
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = (prefix << 8) | k;
    const v = dict.get(key);
    if (v !== undefined) { prefix = v; continue; }
    emit(prefix);
    if (next > (1 << codeSize) - 1 && codeSize < 12) codeSize++;
    if (next < 4096) dict.set(key, next++);
    else { emit(clear); dict = new Map(); next = eoi + 1; codeSize = minCode + 1; }
    prefix = k;
  }
  emit(prefix);
  if (next > (1 << codeSize) - 1 && codeSize < 12) codeSize++;
  emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function gifWrite(w, h, pal, idxFrames, delayCs) {
  const parts = [];
  const u16 = (n) => [n & 255, (n >> 8) & 255];
  parts.push(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, ...u16(w), ...u16(h), 0xF7, 0, 0]));
  parts.push(pal);
  parts.push(Uint8Array.from([0x21, 0xFF, 0x0B, ...'NETSCAPE2.0'.split('').map((c) => c.charCodeAt(0)), 3, 1, 0, 0, 0]));
  for (const idx of idxFrames) {
    parts.push(Uint8Array.from([0x21, 0xF9, 4, 0, ...u16(delayCs), 0, 0]));
    parts.push(Uint8Array.from([0x2C, 0, 0, 0, 0, ...u16(w), ...u16(h), 0, 8]));
    const data = gifLzw(idx, 8);
    const blocks = [];
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255);
      blocks.push(chunk.length, ...chunk);
    }
    blocks.push(0);
    parts.push(Uint8Array.from(blocks));
  }
  parts.push(Uint8Array.from([0x3B]));
  let total = 0;
  for (const p of parts) total += p.length;
  const res = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { res.set(p, o); o += p.length; }
  return res;
}

/* ---------- mp4 -> gif ---------- */
const GIF_MAX_BYTES = 14 * 1024 * 1024;

function videoBlobToGif(blob, maxW) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    let finished = false;
    const done = (fn, arg) => {
      if (finished) return;
      finished = true;
      clearTimeout(loadTimer);
      v.onerror = null; v.onloadeddata = null;
      URL.revokeObjectURL(url);
      v.removeAttribute('src');
      fn(arg);
    };
    const loadTimer = setTimeout(() => done(reject, new Error('таймаут загрузки видео')), 15000);
    v.onerror = () => done(reject, new Error('не удалось декодировать видео'));
    v.onloadeddata = async () => {
      try {
        const dur = Math.min(v.duration || 0, 10);
        if (!dur || !v.videoWidth) throw new Error('пустое видео');
        const scale = Math.min(1, maxW / v.videoWidth);
        const w = Math.max(2, Math.round(v.videoWidth * scale));
        const h = Math.max(2, Math.round(v.videoHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const delayCs = 8, step = delayCs / 100; // ~12.5 к/с
        const n = Math.max(1, Math.min(120, Math.floor(dur / step)));
        const frames = [];
        for (let i = 0; i < n; i++) {
          const t = Math.min(i * step, Math.max(0, dur - 0.05));
          if (Math.abs(v.currentTime - t) > 0.001) {
            await new Promise((res) => { v.onseeked = res; setTimeout(res, 3000); v.currentTime = t; });
          }
          ctx.drawImage(v, 0, 0, w, h);
          frames.push(ctx.getImageData(0, 0, w, h).data);
        }
        const { pal, idx } = gifQuantize(frames);
        done(resolve, gifWrite(w, h, pal, idx, delayCs));
      } catch (e) { done(reject, e); }
    };
    v.src = url;
  });
}

export async function mp4ToGif(blob, cfgW) {
  let out = null;
  for (const w of [cfgW, 300, 220, 160].filter((x, i, arr) => x <= cfgW && arr.indexOf(x) === i)) {
    out = await videoBlobToGif(blob, w);
    LOG('gif ' + w + 'px, ' + Math.round(out.length / 1024) + ' KB');
    if (out.length <= GIF_MAX_BYTES) break;
  }
  return out;
}
