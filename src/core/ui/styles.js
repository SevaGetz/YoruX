export const CORE_CSS = `
  .yx-ov{position:fixed;inset:0;z-index:2147483646;background:rgba(91,112,131,.4);display:flex;align-items:center;justify-content:center}
  .yx-modal{--yx-sub:#71767b;--yx-line:#2f3336;--yx-ctl:#536471;--yx-hover:rgba(231,233,234,.1);--yx-pbg:#eff3f4;--yx-pfg:#0f1419;
    width:min(600px,94vw);height:min(640px,90vh);display:flex;flex-direction:column;border-radius:16px;box-sizing:border-box;
    font-size:15px;-webkit-font-smoothing:antialiased;overflow:hidden;box-shadow:0 0 15px rgba(255,255,255,.2),0 0 3px rgba(255,255,255,.15),0 0 8px rgba(255,255,255,.15)}
  .yx-modal[data-theme=light]{--yx-sub:#536471;--yx-line:#eff3f4;--yx-ctl:#cfd9de;--yx-hover:rgba(15,20,25,.1);--yx-pbg:#0f1419;--yx-pfg:#fff;
    box-shadow:0 0 15px rgba(101,119,134,.2),0 0 3px rgba(101,119,134,.15),0 0 8px rgba(101,119,134,.15)}
  .yx-modal [hidden]{display:none !important}
  .yx-modal svg{display:block}
  .yx-modal button,.yx-modal input,.yx-modal select{font-family:inherit}
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
  .yx-modal input[type=text].yx-search{width:100%;box-sizing:border-box;background:transparent;color:inherit;border:1px solid var(--yx-line);
    border-radius:999px;height:42px;padding:0 16px;font:inherit;margin:8px 0}
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
  .yx-add{display:flex;gap:8px;align-items:center;margin:8px 0 4px}
  .yx-modal .yx-add input[type=text].yx-search{flex:1;margin:0}
  .yx-code{width:100%;box-sizing:border-box;min-height:160px;resize:vertical;background:transparent;color:inherit;
    border:1px solid var(--yx-ctl);border-radius:8px;padding:10px;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  .yx-code:focus{outline:0;border-color:#1d9bf0}
  .yx-sect{margin-top:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:700;font-size:17px;padding-bottom:8px}
  .yx-err{color:#f4212e}
  .yx-empty{color:var(--yx-sub);text-align:center;padding:32px 0}
  .yx-menu-item{cursor:pointer}
  .yx-modal.yx-small{width:min(380px,94vw);height:auto}
  .yx-pops{position:fixed;right:20px;bottom:20px;z-index:2147483646;display:flex;flex-direction:column;gap:12px;align-items:flex-end;pointer-events:none}
  .yx-pops .yx-pop{pointer-events:auto}
  .yx-news h3{margin:14px 0 4px;font-size:15px;line-height:20px;font-weight:700}
  .yx-news h3:first-child{margin-top:0}
  .yx-news h3 span{color:var(--yx-sub);font-weight:400;font-size:13px;margin-left:8px}
  .yx-news ul{margin:0;padding-left:18px;font-size:14px;line-height:19px}
  .yx-news li{margin:3px 0}
  .yx-pop .yx-news{max-height:40vh;overflow:auto}
  .yx-dlg{padding:20px}
  .yx-dlg h2{margin:0 0 8px;font-size:20px;line-height:24px;font-weight:800}
  .yx-dlg p{margin:0;color:var(--yx-sub);font-size:15px;line-height:20px}
  .yx-dlg .yx-btns{justify-content:flex-end;padding-top:16px}
  .yx-modal.yx-onb{width:min(520px,94vw);height:auto;max-height:90vh}
  .yx-onb-h{margin:8px 0 6px;font-size:20px;line-height:24px;font-weight:800}
  .yx-onb-p{margin:0 0 12px;color:var(--yx-sub);font-size:15px;line-height:20px}
  .yx-foot{display:flex;align-items:center;gap:8px;padding:12px 16px;border-top:1px solid var(--yx-line);flex:none}
  .yx-foot .yx-spacer{flex:1}
  .yx-how{display:flex;gap:12px;margin:0 0 14px;font-size:15px;line-height:20px}
  .yx-how-n{flex:none;width:24px;height:24px;border-radius:50%;background:var(--yx-pbg);color:var(--yx-pfg);
    font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
  .yx-mock{display:flex;align-items:center;gap:12px;width:fit-content;margin-top:8px;padding:10px 20px 10px 16px;
    border:1px solid var(--yx-line);border-radius:12px;font-weight:700}
  .yx-toast{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:2147483647;background:#1d9bf0;color:#fff;
    padding:12px 16px;border-radius:4px;font-size:15px;max-width:80vw}
`;
