import { definePlugin } from '@core/api';
import { addStyle, removeStyle } from '@core/dom';
import { ITEMS, keyOf } from './items';
import { settings, hooks } from './settings';
import { t } from './i18n';

const STYLE_ID = 'plugin:sidebarHide:rules';
const NAV = 'header[role="banner"]';

const hiddenItems = () => ITEMS.filter((it) => settings.store[keyOf(it.id)]);

function apply() {
  const list = hiddenItems();
  if (!list.length) { removeStyle(STYLE_ID); return; }
  addStyle(STYLE_ID, list.map((it) => `${NAV} ${it.sel}`).join(',\n') + ' { display: none !important; }');
}

export default definePlugin({
  name: 'sidebarHide',
  title: () => t('title'),
  description: () => t('desc'),
  enabledByDefault: false,
  settings,
  start() { hooks.apply = apply; apply(); },
  stop() { hooks.apply = () => {}; removeStyle(STYLE_ID); },
});
