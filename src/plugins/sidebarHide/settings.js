import { definePluginSettings } from '@core/api';
import { ITEMS, keyOf } from './items';
import { t } from './i18n';

export const hooks = { apply: () => {} };

export const settings = definePluginSettings(Object.fromEntries(ITEMS.map((it) => [keyOf(it.id), {
  type: 'boolean',
  title: () => t('hide', { name: t(it.id) }),
  hint: it.hint ? () => t('moreHint') : undefined,
  default: false,
  onChange: () => hooks.apply(),
}])));
