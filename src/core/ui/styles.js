export const CORE_CSS = `
  .yx-ov{position:fixed;inset:0;z-index:2147483646;background:rgba(91,112,131,.4);display:flex;align-items:center;justify-content:center}
  .yx-modal{width:min(640px,94vw);height:min(560px,90vh);display:flex;flex-direction:column;border-radius:16px;box-sizing:border-box;
    border:1px solid rgba(128,128,128,.35);font-family:inherit;font-size:15px;overflow:hidden}
  .yx-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(128,128,128,.25)}
  .yx-head h2{margin:0;font-size:20px;font-weight:700;flex:1}
  .yx-ver{opacity:.55;font-size:13px}
  .yx-modal button{border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;border-radius:999px;
    padding:7px 14px;cursor:pointer;font:inherit;font-size:14px}
  .yx-modal button:hover{background:rgba(128,128,128,.15)}
  .yx-modal button.yx-primary{background:#1d9bf0;border-color:#1d9bf0;color:#fff}
  .yx-modal button.yx-danger{color:#f4212e;border-color:rgba(244,33,46,.5)}
  .yx-modal button.yx-icon{width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1}
  .yx-modal [hidden]{display:none !important}
  .yx-body{flex:1;overflow:auto;padding:16px}
  .yx-btns{display:flex;flex-wrap:wrap;gap:8px;padding-top:12px}
  .yx-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
  .yx-modal button.yx-tile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;border-radius:14px;padding:16px;min-height:104px}
  .yx-tile-ico{font-size:26px;line-height:1}
  .yx-tile-title{font-weight:700;font-size:16px}
  .yx-tile-desc{opacity:.65;font-size:13px}
  .yx-search{width:100%;box-sizing:border-box;background:transparent;color:inherit;border:1px solid rgba(128,128,128,.5);
    border-radius:10px;padding:9px 12px;font:inherit;margin-bottom:8px}
  .yx-plugin{border-top:1px solid rgba(128,128,128,.25);padding:12px 0}
  .yx-plugin:first-of-type{border-top:0}
  .yx-prow{display:flex;align-items:center;gap:12px}
  .yx-pinfo{flex:1;min-width:0}
  .yx-pname{font-weight:700}
  .yx-pdesc{opacity:.65;font-size:13px;margin-top:2px}
  .yx-opts{margin:10px 0 0 12px;padding-left:12px;border-left:2px solid rgba(128,128,128,.3)}
  .yx-opt{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 0}
  .yx-opt label{flex:1}
  .yx-modal select,.yx-modal input[type=number],.yx-modal input[type=text]{background:transparent;color:inherit;
    border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:6px 8px;font:inherit}
  .yx-modal select option{color:#000}
  .yx-sw{position:relative;display:inline-block;width:40px;height:22px;flex:none;cursor:pointer}
  .yx-sw input{opacity:0;width:0;height:0;position:absolute}
  .yx-sw span{position:absolute;inset:0;border-radius:999px;background:rgba(128,128,128,.5);transition:background .15s}
  .yx-sw span::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
  .yx-sw input:checked + span{background:#1d9bf0}
  .yx-sw input:checked + span::after{transform:translateX(18px)}
  .yx-empty{opacity:.65;text-align:center;padding:24px 0}
  .yx-menu-item{cursor:pointer}
  .yx-toast{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:2147483647;background:#1d9bf0;color:#fff;
    padding:10px 16px;border-radius:8px;font-size:14px;max-width:80vw}
`;
