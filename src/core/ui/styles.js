// палитра и пропорции взяты из настроек X: тёмная/светлая тема, белая «пилюля» как главная кнопка, синий акцент у переключателей
export const CORE_CSS = `
  .yx-ov{position:fixed;inset:0;z-index:2147483646;background:rgba(91,112,131,.4);display:flex;align-items:center;justify-content:center}
  .yx-modal{--yx-sub:#71767b;--yx-line:#2f3336;--yx-ctl:#536471;--yx-hover:rgba(231,233,234,.1);--yx-pbg:#eff3f4;--yx-pfg:#0f1419;
    width:min(600px,94vw);height:min(640px,90vh);display:flex;flex-direction:column;border-radius:16px;box-sizing:border-box;
    font-family:inherit;font-size:15px;overflow:hidden;box-shadow:0 0 15px rgba(255,255,255,.2),0 0 3px rgba(255,255,255,.15),0 0 8px rgba(255,255,255,.15)}
  .yx-modal[data-theme=light]{--yx-sub:#536471;--yx-line:#eff3f4;--yx-ctl:#cfd9de;--yx-hover:rgba(15,20,25,.1);--yx-pbg:#0f1419;--yx-pfg:#fff;
    box-shadow:0 0 15px rgba(101,119,134,.2),0 0 3px rgba(101,119,134,.15),0 0 8px rgba(101,119,134,.15)}
  .yx-modal [hidden]{display:none !important}
  .yx-modal svg{display:block}
  .yx-head{display:flex;align-items:center;gap:20px;height:53px;padding:0 16px;flex:none}
  .yx-head h2{margin:0;font-size:20px;line-height:24px;font-weight:800;flex:1}
  .yx-ver{color:var(--yx-sub);font-size:13px}
  .yx-body{flex:1;overflow:auto;padding:4px 16px 16px}
  .yx-modal button{border:1px solid var(--yx-ctl);background:transparent;color:inherit;border-radius:999px;
    min-height:36px;padding:0 16px;cursor:pointer;font:inherit;font-size:15px;font-weight:700;transition:background .15s}
  .yx-modal button:hover{background:var(--yx-hover)}
  .yx-modal button.yx-primary{background:var(--yx-pbg);border-color:transparent;color:var(--yx-pfg)}
  .yx-modal button.yx-danger{color:#f4212e;border-color:rgba(244,33,46,.5)}
  .yx-modal button.yx-danger:hover{background:rgba(244,33,46,.1)}
  .yx-modal button.yx-icon{width:34px;height:34px;min-height:0;padding:0;border:0;display:flex;align-items:center;justify-content:center}
  .yx-btns{display:flex;flex-wrap:wrap;gap:8px;padding-top:16px}
  .yx-tiles{display:flex;flex-direction:column;padding-top:4px}
  .yx-modal button.yx-tile{display:flex;align-items:center;gap:16px;text-align:left;width:100%;border:0;border-radius:0;
    padding:14px 16px;margin:0 -16px;width:calc(100% + 32px);min-height:0;font-weight:400}
  .yx-tile-ico{flex:none;display:flex}
  .yx-tile-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .yx-tile-title{font-weight:700;font-size:17px;line-height:20px}
  .yx-tile-desc{color:var(--yx-sub);font-size:13px;line-height:16px}
  .yx-tile-chev{flex:none;color:var(--yx-sub);display:flex}
  .yx-search:focus,.yx-modal select:focus,.yx-modal input[type=number]:focus,.yx-modal input[type=text]:focus{outline:0;border-color:#1d9bf0}
  .yx-plugin{border-top:1px solid var(--yx-line);padding:14px 0}
  .yx-plugin:first-of-type{border-top:0}
  .yx-prow{display:flex;align-items:center;gap:12px}
  .yx-pinfo{flex:1;min-width:0}
  .yx-pname{font-weight:700;font-size:15px;line-height:20px}
  .yx-pdesc{color:var(--yx-sub);font-size:13px;line-height:16px;margin-top:2px}
  .yx-opts{margin-top:10px;padding:4px 14px;border:1px solid var(--yx-line);border-radius:12px}
  .yx-opt{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--yx-line)}
  .yx-opt:first-child{border-top:0}
  .yx-opt > label:first-child{flex:1;font-size:15px}
  .yx-modal select,.yx-modal input[type=number],.yx-modal input[type=text]{background:transparent;color:inherit;
    border:1px solid var(--yx-ctl);border-radius:4px;height:36px;padding:0 8px;font:inherit}
  .yx-modal[data-theme=dark]{color-scheme:dark}
  .yx-modal[data-theme=light]{color-scheme:light}
  .yx-modal select option{background-color:var(--yx-bg);color:var(--yx-fg)}
  .yx-sw{position:relative;display:inline-block;width:38px;height:22px;flex:none;cursor:pointer}
  .yx-sw input{opacity:0;width:0;height:0;position:absolute}
  .yx-sw span{position:absolute;inset:0;border-radius:999px;background:var(--yx-ctl);transition:background .15s}
  .yx-sw span::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}
  .yx-sw input:checked + span{background:#1d9bf0}
  .yx-sw input:checked + span::after{transform:translateX(16px)}
  .yx-hint{display:block;color:var(--yx-sub);font-size:13px;line-height:16px;margin-top:2px}
  .yx-empty{color:var(--yx-sub);text-align:center;padding:32px 0}
  .yx-menu-item{cursor:pointer}
  .yx-toast{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:2147483647;background:#1d9bf0;color:#fff;
    padding:12px 16px;border-radius:4px;font-size:15px;max-width:80vw}
`;
