import { definePluginSettings } from '@core/api';
import { t } from './i18n';

export const settings = definePluginSettings({
  convert: { type: 'boolean', title: () => t('optConvert'), default: true },
  maxW: { type: 'select', title: () => t('optMaxW'), default: 400, choices: [
    { value: 220, label: '220 px' }, { value: 300, label: '300 px' },
    { value: 400, label: '400 px' }, { value: 480, label: '480 px' },
  ] },
  closeAfter: { type: 'boolean', title: () => t('optClose'), default: true },
});
