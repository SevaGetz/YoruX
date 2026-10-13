import allPlugins from '~plugins';
import { LOG, addStyle } from '@core/dom';
import '@core/general';
import { registerPlugins } from '@core/api';
import { initScanner } from '@core/scanner';
import { initThemes } from '@core/themes';
import { initUpdateWatch } from '@core/updater';
import { initChangelog } from '@core/changelog';
import { watchMenu } from '@core/ui/menu';
import { openSettings } from '@core/ui/settings';
import { CORE_CSS } from '@core/ui/styles';

LOG('loaded v' + __VERSION__, location.href);
addStyle('core', CORE_CSS);
registerPlugins(allPlugins);
initThemes();
watchMenu();
initScanner();
initUpdateWatch();
initChangelog(openSettings);

if (typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand('YoruX', () => openSettings());
