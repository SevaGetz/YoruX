import allPlugins from '~plugins';
import { LOG, addStyle } from '@core/dom';
import { registerPlugins } from '@core/api';
import { initScanner } from '@core/scanner';
import { watchMenu } from '@core/ui/menu';
import { CORE_CSS } from '@core/ui/styles';

LOG('loaded v' + __VERSION__, location.href);
addStyle('core', CORE_CSS);
registerPlugins(allPlugins);
watchMenu();
initScanner();
