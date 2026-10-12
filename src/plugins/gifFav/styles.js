export const CSS = `
  .fav-star{position:absolute;top:6px;right:6px;z-index:50;width:30px;height:30px;border-radius:50%;
    background:rgba(0,0,0,.65);color:#fff;font-size:18px;line-height:1;display:flex;align-items:center;
    justify-content:center;text-align:center;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .15s;user-select:none}
  .fav-host:hover > .fav-star,.fav-star.active{opacity:1;pointer-events:auto}
  .fav-star.active{color:#ffd400}
  .fav-bar{display:flex;gap:8px;box-sizing:border-box}
  .fav-bar.fav-pad{padding:8px 12px 12px}
  .fav-bar button{border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;border-radius:999px;
    padding:6px 14px;cursor:pointer;font:inherit;font-size:14px}
  .fav-bar button.on{background:#1d9bf0;border-color:#1d9bf0;color:#fff}
  .fav-panel{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;overflow-y:auto;
    max-height:min(60svh,468px);align-content:start;box-sizing:border-box}
  .fav-panel.fav-pad{padding:0 12px 12px}
  .fav-panel[hidden]{display:none}
  .fav-tile{position:relative;height:0;padding-bottom:100%;overflow:hidden;border-radius:6px;cursor:pointer;background:rgba(128,128,128,.2)}
  .fav-tile img,.fav-tile video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block}
  .fav-tile .fav-del{position:absolute;top:6px;right:6px;width:28px;height:28px;border:0;border-radius:50%;
    background:rgba(0,0,0,.65);color:#ffd400;font-size:16px;line-height:1;cursor:pointer;padding:0;margin:0;
    box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif}
  .fav-empty{grid-column:1/-1;padding:24px 8px;text-align:center;opacity:.7;font-size:14px}
  .fav-hidden{display:none !important}
  .yx-modal .fav-panel{max-height:min(46vh,380px);padding:0 0 8px}
`;
