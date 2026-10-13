export function openInstaller() {
  const a = document.createElement('a');
  a.href = __RAW__;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
