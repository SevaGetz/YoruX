import { definePluginSettings } from '@core/api';

export const settings = definePluginSettings({
  convert: { type: 'boolean', title: 'Конвертировать GIF из твитов (mp4) в настоящий .gif при отправке', default: true },
  maxW: { type: 'select', title: 'Макс. ширина GIF при конвертации', default: 400, choices: [
    { value: 220, label: '220 px' }, { value: 300, label: '300 px' },
    { value: 400, label: '400 px' }, { value: 480, label: '480 px' },
  ] },
  closeAfter: { type: 'boolean', title: 'Закрывать окно выбора GIF после выбора', default: true },
});
