// ==UserScript==
// @name         Copy Article as Markdown
// @namespace    SebastienWae
// @version      1.2
// @description  Copy article content to clipboard as markdown using Turndown
// @author       https://github.com/SebastienWae/
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @require      https://unpkg.com/turndown/dist/turndown.js
// @updateURL    https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/copy_as_md.js
// @downloadURL  https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/copy_as_md.js
// ==/UserScript==

(() => {
  if (typeof TurndownService === "undefined") {
    console.error("[copy_as_md] TurndownService not loaded");
    return;
  }

  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // Keep some elements that are often useful
  turndownService.keep(["iframe", "video"]);

  // Remove unwanted elements
  turndownService.remove(["script", "style", "nav", "footer", "aside", "noscript"]);

  function safeAbsoluteUrl(url, base) {
    try {
      return new URL(url, base).href;
    } catch {
      return url;
    }
  }

  function getArticleContent() {
    const selectors = [
      "article",
      '[role="article"]',
      '[itemprop="articleBody"]',
      "main",
      ".post-content",
      ".post-body",
      ".article-content",
      ".article-body",
      ".entry-content",
      ".content",
      "#content",
      "#article-body",
      ".post",
      ".article",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 200) {
        return el;
      }
    }

    return document.body;
  }

  function makeLinksAbsolute(element) {
    const base = window.location.href;

    // Convert href attributes (links)
    for (const el of element.querySelectorAll("[href]")) {
      const href = el.getAttribute("href");
      if (href && !href.startsWith("data:") && !href.startsWith("javascript:")) {
        el.setAttribute("href", safeAbsoluteUrl(href, base));
      }
    }

    // Convert src attributes (images, videos, iframes, etc.)
    for (const el of element.querySelectorAll("[src]")) {
      const src = el.getAttribute("src");
      if (src && !src.startsWith("data:")) {
        el.setAttribute("src", safeAbsoluteUrl(src, base));
      }
    }

    // Convert srcset attributes (responsive images)
    for (const el of element.querySelectorAll("[srcset]")) {
      const srcset = el.getAttribute("srcset");
      if (srcset) {
        const newSrcset = srcset
          .split(",")
          .map((entry) => {
            const [url, descriptor] = entry.trim().split(/\s+/);
            const absoluteUrl = safeAbsoluteUrl(url, base);
            return descriptor ? `${absoluteUrl} ${descriptor}` : absoluteUrl;
          })
          .join(", ");
        el.setAttribute("srcset", newSrcset);
      }
    }

    // Convert poster attributes (video posters)
    for (const el of element.querySelectorAll("[poster]")) {
      const poster = el.getAttribute("poster");
      if (poster && !poster.startsWith("data:")) {
        el.setAttribute("poster", safeAbsoluteUrl(poster, base));
      }
    }

    // Convert data-src attributes (lazy-loaded images)
    for (const el of element.querySelectorAll("[data-src]")) {
      const dataSrc = el.getAttribute("data-src");
      if (dataSrc && !dataSrc.startsWith("data:")) {
        el.setAttribute("data-src", safeAbsoluteUrl(dataSrc, base));
        // Also set src for turndown to pick it up
        if (!el.getAttribute("src") || el.getAttribute("src").includes("placeholder")) {
          el.setAttribute("src", safeAbsoluteUrl(dataSrc, base));
        }
      }
    }

    return element;
  }

  function getContentToConvert() {
    // Check if user has selected text
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const container = document.createElement("div");
      container.appendChild(range.cloneContents());
      return { element: container, isSelection: true };
    }

    // Otherwise get the article content
    const article = getArticleContent();
    const clone = article.cloneNode(true);

    // Remove common non-content elements from clone
    const removeSelectors = [
      "nav",
      "footer",
      "aside",
      ".sidebar",
      ".comments",
      ".advertisement",
      ".ads",
      ".social-share",
      ".related-posts",
    ];
    for (const sel of removeSelectors) {
      for (const el of clone.querySelectorAll(sel)) {
        el.remove();
      }
    }

    return { element: clone, isSelection: false };
  }

  function copyArticleAsMarkdown() {
    const { element, isSelection } = getContentToConvert();

    // Make all links absolute
    makeLinksAbsolute(element);

    // Get page title
    const title = document.querySelector("h1")?.innerText || document.title || "Untitled";

    // Convert to markdown
    const content = turndownService.turndown(element);
    const markdown = isSelection
      ? `Source: ${window.location.href}\n\n---\n\n${content}`
      : `# ${title}\n\nSource: ${window.location.href}\n\n---\n\n${content}`;

    // Copy to clipboard and show notification
    copyToClipboard(markdown);
  }

  function showNotification(message, isError = false) {
    const notification = document.createElement("div");
    notification.textContent = message;
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      background: isError ? "#ef4444" : "#22c55e",
      color: "white",
      borderRadius: "8px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: "999999",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    });
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  function copyToClipboard(text) {
    if (typeof GM_setClipboard !== "undefined") {
      GM_setClipboard(text, "text");
      showNotification("Article copied as Markdown!");
    } else {
      navigator.clipboard.writeText(text).then(
        () => showNotification("Article copied as Markdown!"),
        (err) => {
          console.error("[copy_as_md] Failed to copy:", err);
          showNotification("Failed to copy to clipboard", true);
        },
      );
    }
  }

  // Register menu command
  if (typeof GM_registerMenuCommand !== "undefined") {
    GM_registerMenuCommand("📋 Copy Article as Markdown", copyArticleAsMarkdown);
  }

  // Keyboard shortcut: Alt + M
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "m") {
      e.preventDefault();
      copyArticleAsMarkdown();
    }
  });
})();
