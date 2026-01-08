// ==UserScript==
// @name         System Font Override
// @namespace    SebastienWae
// @version      1.0
// @description  Force system font on any website (per-domain toggle)
// @author       https://github.com/SebastienWae/
// @match        *://*/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// @updateURL    https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/system_font.js
// @downloadURL  https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/system_font.js
// ==/UserScript==

(() => {
  const STYLE_ID = "system-font-override";
  const STORAGE_KEY = `systemfont-${location.hostname}`;

  const FONT_CSS = `
    * {
      font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
                   "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
    }
  `;

  function isEnabled() {
    return GM_getValue(STORAGE_KEY, false);
  }

  function setEnabled(value) {
    GM_setValue(STORAGE_KEY, value);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = FONT_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyle() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      background: "#333",
      color: "#fff",
      borderRadius: "8px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: "2147483647",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    });
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  function toggle() {
    const newState = !isEnabled();
    setEnabled(newState);

    if (newState) {
      injectStyle();
      showNotification("System Font: ON");
    } else {
      removeStyle();
      showNotification("System Font: OFF");
    }
  }

  // Apply on load if enabled
  if (isEnabled()) {
    injectStyle();
  }

  // Register menu command
  const menuLabel = isEnabled() ? "Disable System Font" : "Enable System Font";
  GM_registerMenuCommand(menuLabel, toggle);
})();
