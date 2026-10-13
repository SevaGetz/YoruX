export const openInstaller = () => (typeof GM_openInTab === 'function' ? GM_openInTab(__RAW__, { active: true }) : window.open(__RAW__, '_blank'));
