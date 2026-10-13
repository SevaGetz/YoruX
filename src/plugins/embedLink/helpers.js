const COPY_ICON = 'M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0';
const COPY_TEXT = /^(copy link|копировать ссылку)/i;

export const cleanHost = (s) => String(s || '').trim().replace(/^[a-z]+:\/\//i, '').split(/[/?#\s]/)[0].toLowerCase();

export function isCopyItem(item) {
  const p = item.querySelector('svg path');
  if (p && (p.getAttribute('d') || '').startsWith(COPY_ICON)) return true;
  return COPY_TEXT.test((item.textContent || '').trim());
}

export function tweetPath(pathname) {
  const m = /^\/([^/]+)\/status\/(\d+)/.exec(pathname || '');
  return m ? { user: m[1], id: m[2] } : null;
}

export function refFromArticle(article, origin) {
  if (!article) return null;
  const a = [...article.querySelectorAll('a[href*="/status/"]')].find((x) => x.querySelector('time'));
  return a ? tweetPath(new URL(a.getAttribute('href'), origin).pathname) : null;
}

export const buildUrl = (host, ref) => `https://${host}/${ref.user}/status/${ref.id}`;
