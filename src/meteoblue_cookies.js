// ==UserScript==
// @name         Meteoblue - Auto Cookies
// @namespace    SebastienWae
// @version      2.2
// @description  Set cookies to disable adblock protection and define settings
// @author       https://github.com/SebastienWae/
// @match        https://meteoblue.com/*
// @match        https://*.meteoblue.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/meteoblue_cookies.js
// @downloadURL  https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/meteoblue_cookies.js
// ==/UserScript==

(() => {
  const DOMAIN = ".meteoblue.com";
  const PATH = "/";
  const EXPIRES = "Fri, 31 Dec 9999 23:59:59 GMT";
  const SECURE = location.protocol === "https:" ? "; Secure; SameSite=None" : "";

  const setCookie = (name, value) => {
    // biome-ignore lint/suspicious/noDocumentCookie: need to create cookies
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${EXPIRES}; domain=${DOMAIN}; path=${PATH}${SECURE}`;
  };

  setCookie("unblockTimeout", Date.parse(EXPIRES));
  setCookie("extendview", "true");
  setCookie("darkmode", "true");
})();
