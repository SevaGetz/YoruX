import { createT } from '@core/i18n';

export const t = createT({
  ru: {
    title: 'Ссылки с эмбедом',
    desc: 'Кнопка «Поделиться → Копировать ссылку» копирует ссылку через эмбед-фиксер (fixupx.com и др.), чтобы в Discord/Telegram сразу был превью',
    optService: 'Сервис эмбедов',
    optCustom: 'Свой домен',
    optCustomHint: 'Работает, если выше выбран «Свой домен». Например: fx.example.com',
    optToast: 'Показывать уведомление при замене ссылки',
    custom: 'Свой домен…',
    done: 'Ссылка скопирована: {host}',
  },
  en: {
    title: 'Embed links',
    desc: 'Share → Copy link copies the link through an embed fixer (fixupx.com etc.) so Discord/Telegram shows a preview right away',
    optService: 'Embed service',
    optCustom: 'Custom domain',
    optCustomHint: 'Used when "Custom domain…" is selected above. Example: fx.example.com',
    optToast: 'Show a notification when the link is replaced',
    custom: 'Custom domain…',
    done: 'Link copied: {host}',
  },
});
