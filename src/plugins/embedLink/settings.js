import { definePluginSettings } from '@core/api';
import { t } from './i18n';

export const SERVICES = ['fixupx.com', 'fxtwitter.com', 'vxtwitter.com', 'fixvx.com'];

export const settings = definePluginSettings({
  service: {
    type: 'select', title: () => t('optService'), default: 'fixupx.com',
    choices: [...SERVICES.map((h) => ({ value: h, label: h })), { value: 'custom', label: () => t('custom') }],
  },
  custom: { type: 'text', title: () => t('optCustom'), hint: () => t('optCustomHint'), default: '' },
  toast: { type: 'boolean', title: () => t('optToast'), default: false },
});
