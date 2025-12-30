// ==UserScript==
// @name         X/Twitter - Enable Timeline Ranking
// @namespace    SebastienWae
// @version      5.0
// @description  Rewrites HomeTimeline (GET) and HomeLatestTimeline (POST) to enable ranking
// @author       https://github.com/SebastienWae/
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/x_popular_timeline.js
// @downloadURL  https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/x_popular_timeline.js
// ==/UserScript==

(() => {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    this._method = method;
    this._url = url;

    let modifiedUrl = url;

    try {
      const urlObj = new URL(url, location.origin);

      // GET request for HomeTimeline - modify URL params
      if (method.toUpperCase() === "GET" && urlObj.pathname.includes("/HomeTimeline")) {
        console.log("[Userscript] Intercepted GET HomeTimeline");

        const variablesParam = urlObj.searchParams.get("variables");

        if (variablesParam) {
          const variables = JSON.parse(variablesParam);
          const oldValue = variables.enableRanking;
          variables.enableRanking = true;

          console.log(`[Userscript] GET enableRanking: ${oldValue} → true`);

          urlObj.searchParams.set("variables", JSON.stringify(variables));
          modifiedUrl = urlObj.toString();
        }
      }
    } catch (e) {
      console.error("[Userscript] Error in open:", e);
    }

    return originalOpen.call(this, method, modifiedUrl, ...args);
  };

  XMLHttpRequest.prototype.send = function (body) {
    let modifiedBody = body;

    try {
      const urlObj = new URL(this._url, location.origin);

      // POST request for HomeLatestTimeline - modify body
      if (this._method.toUpperCase() === "POST" && urlObj.pathname.includes("/HomeLatestTimeline")) {
        console.log("[Userscript] Intercepted POST HomeLatestTimeline");

        if (body) {
          const parsed = JSON.parse(body);

          if (parsed.variables) {
            const oldValue = parsed.variables.enableRanking;
            parsed.variables.enableRanking = true;

            console.log(`[Userscript] POST enableRanking: ${oldValue} → true`);

            modifiedBody = JSON.stringify(parsed);
          }
        }
      }
    } catch (e) {
      console.error("[Userscript] Error in send:", e);
    }

    return originalSend.call(this, modifiedBody);
  };

  console.log("[Userscript] Twitter ranking modifier v5 (GET+POST) loaded");
})();
