// ==UserScript==
// @name         Hacker News - Dark Mode
// @namespace    SebastienWae
// @version      2.1
// @description  Dark theme for HN without white flash (works with BFCache)
// @author       https://github.com/SebastienWae/
// @match        https://news.ycombinator.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/hn_dark.js
// @downloadURL  https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/hn_dark.js
// ==/UserScript==

(() => {
  // Theme colors
  const colors = {
    bgPrimary: "#121212",
    bgSecondary: "#1e1e1e",
    bgInput: "#2a2a2a",
    textPrimary: "#e0e0e0",
    textSecondary: "#d0d0d0",
    textComment: "#f5f5f5",
    link: "#80cbc4",
    linkHover: "#fff",
    border: "#444",
  };

  const root = document.documentElement;

  // Helper to apply root styles without accumulation
  const applyRootStyles = () => {
    root.style.setProperty("background", colors.bgPrimary, "important");
    root.style.setProperty("color", colors.textPrimary, "important");
    root.style.setProperty("color-scheme", "dark", "important");
  };

  // 0) First paint is dark: inline on <html> beats legacy bgcolor + BFCache
  applyRootStyles();

  // Pages that need cloaking to avoid flash
  const cloakPaths = ["/", "/news", "/newest", "/front", "/ask", "/show", "/jobs"];
  const needCloak = cloakPaths.includes(location.pathname);
  if (needCloak) root.style.visibility = "hidden";

  // 1) Ensure <body> is dark as soon as it exists (overrides <body bgcolor>)
  const paintBody = () => {
    if (!document.body) return false;
    document.body.style.setProperty("background", colors.bgPrimary, "important");
    document.body.style.setProperty("color", colors.textPrimary, "important");
    return true;
  };

  if (!paintBody()) {
    new MutationObserver((_, obs) => {
      if (paintBody()) obs.disconnect();
    }).observe(document, { childList: true, subtree: true });
  }

  // 2) CSS: critical first, then full theme
  const criticalCSS = `
    :root{color-scheme:dark}
    html,body{background:${colors.bgPrimary}!important;color:${colors.textPrimary}!important}
    a:link,a:visited{color:${colors.link}!important}
    a:hover{color:${colors.linkHover}!important}
    [bgcolor]{background-color:${colors.bgPrimary}!important}
  `;
  const fullCSS = `
    table,.fatitem,.athing{background:${colors.bgPrimary}!important;color:${colors.textPrimary}!important}
    .title,.pagetop,.subtext,.comhead,.hnname{background:${colors.bgSecondary}!important;color:${colors.textSecondary}!important}
    td{background:transparent!important}
    input,textarea{background:${colors.bgInput}!important;color:${colors.linkHover}!important;border:1px solid ${colors.border}!important}
    .votearrow{filter:invert(1)!important}
    .yclinks a{color:#ccc!important}
    .commtext,.commtext.c00,.comment font{color:${colors.textComment}!important}
    body>center>table{max-width:800px!important;margin:auto!important;width:100%!important}
    body{margin:0!important;padding:0 10px!important}
  `;

  const addEarly = (css, id) => {
    if (document.getElementById(id)) return;
    const s = Object.assign(document.createElement("style"), { id, textContent: css });
    const first = root.firstChild;
    first ? root.insertBefore(s, first) : root.appendChild(s);
  };

  const addLate = (css, id) => {
    if (document.getElementById(id)) return;
    const s = Object.assign(document.createElement("style"), { id, textContent: css });
    (document.head || root).appendChild(s);
  };

  addEarly(criticalCSS, "hn-dark-critical");
  addLate(fullCSS, "hn-dark-full");

  // Reveal page after styles are applied (double-rAF = after next paint)
  if (needCloak) {
    const unhide = () => {
      root.style.visibility = "";
    };
    requestAnimationFrame(() => requestAnimationFrame(unhide));
    setTimeout(unhide, 300); // safety net
  }

  // 3) BFCache restores: re-assert inline + ensure styles exist
  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    applyRootStyles();
    paintBody();
    addEarly(criticalCSS, "hn-dark-critical");
    addLate(fullCSS, "hn-dark-full");
    if (needCloak) {
      root.style.visibility = "hidden";
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          root.style.visibility = "";
        }),
      );
    }
  });
})();
