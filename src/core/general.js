import { definePluginSettings, registerCoreSettings, onPluginsChange, notify } from './api';
import { setLangSource, emitLang, t } from './i18n';
import { setDebug } from './dom';

export const settings = definePluginSettings({
  lang: {
    type: 'select', title: () => t('lang'), default: 'auto', onChange: emitLang,
    choices: [{ value: 'auto', label: () => t('langAuto') }, { value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }],
  },
  menuItem: { type: 'boolean', title: () => t('menuItem'), hint: () => t('menuItemHint'), default: true, onChange: notify },
  autoUpdate: { type: 'boolean', title: () => t('autoUpdate'), hint: () => t('autoUpdateHint'), default: true },
  debug: { type: 'boolean', title: () => t('debug'), default: false, onChange: setDebug },
});

registerCoreSettings('core', settings);
setLangSource(() => settings.store.lang);

const apply = () => setDebug(settings.store.debug);
apply();
onPluginsChange(apply);
