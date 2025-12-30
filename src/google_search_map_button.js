// ==UserScript==
// @name         Google Search - Maps Button
// @namespace    SebastienWae
// @version      1.1
// @description  Adds a Maps button to Google Search results and makes map images clickable
// @author       https://github.com/SebastienWae/
// @match        https://www.google.com/search*
// @match        https://www.google.*/search*
// @run-at       document-idle
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/google_search_map_button.js
// @downloadURL  https://raw.githubusercontent.com/SebastienWae/userscripts/main/src/google_search_map_button.js
// ==/UserScript==

(() => {
  const DEBUG = false;
  const IMAGES_TRANSLATIONS = [
    "Images",
    "Bilder",
    "Imagenes",
    "Immagini",
    "Afbeeldingen",
    "Imagens",
    "Obrazy",
    "Resimler",
    "Hình ảnh",
    "Gambar",
    "Mga larawan",
  ];

  let mapsUrl = "";
  let lastUrl = window.location.href;

  function log(...args) {
    if (DEBUG) {
      console.log("[MapsButton]", ...args);
    }
  }

  function getSearchQuery() {
    return new URLSearchParams(window.location.search).get("q");
  }

  function updateMapsUrl() {
    const searchQuery = getSearchQuery();
    if (searchQuery) {
      mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}`;
    }
  }

  function insertMapsButton() {
    if (!mapsUrl) return;

    try {
      const existingMapsButton = Array.from(document.querySelectorAll("a")).find(
        (a) => a.textContent.trim() === "Maps",
      );
      if (existingMapsButton && !existingMapsButton.closest("g-popup")) {
        existingMapsButton.href = mapsUrl;
        log("Maps button URL updated and no new button added.");
        return;
      }

      let referenceAnchor;

      // Try new Google HTML structure first - look for the Images button
      const newStructureContainer = document.querySelector("div.rQTE8b div.beZ0tf.O1uzAe");
      if (newStructureContainer) {
        const r1qwufElements = newStructureContainer.querySelectorAll(".R1QWuf");
        if (r1qwufElements.length >= 2) {
          const imagesSpan = r1qwufElements[1];
          const imagesListItem = imagesSpan.closest('div[role="listitem"]');
          if (imagesListItem) {
            referenceAnchor = imagesListItem;
          }
        }
      }

      // Fallback to old structure if new structure not found
      if (!referenceAnchor) {
        const matchingDivs = Array.from(document.querySelectorAll('div[jsname="bVqjv"]')).filter((div) =>
          div.closest("a"),
        );
        const jsnameBvqjv = matchingDivs[1];

        if (jsnameBvqjv) {
          const closestDiv = jsnameBvqjv.closest("a").closest("div");
          referenceAnchor = closestDiv.querySelector("h1") ? jsnameBvqjv.closest("a") : closestDiv;
        }
      }

      if (!referenceAnchor) {
        referenceAnchor = document.querySelector("div[role='navigation'] div[jsslot] a");
      }

      if (!referenceAnchor) {
        const imagesButton = Array.from(document.querySelectorAll("a")).find((link) =>
          IMAGES_TRANSLATIONS.some((text) => link.textContent.includes(text)),
        );
        if (imagesButton) {
          referenceAnchor = imagesButton;
        } else {
          log("Images text not found. Unable to insert Maps button.");
          return;
        }
      }

      const mapsAnchorWrapper = referenceAnchor.cloneNode(true);
      const mapsAnchor =
        mapsAnchorWrapper.tagName.toLowerCase() === "a" ? mapsAnchorWrapper : mapsAnchorWrapper.querySelector("a");
      if (mapsAnchor) mapsAnchor.href = mapsUrl;

      mapsAnchorWrapper.querySelector("div.YmvwI[selected]")?.removeAttribute("selected");
      mapsAnchorWrapper.querySelector("div[selected]")?.removeAttribute("selected");

      const spanOrDiv = mapsAnchorWrapper.querySelector("span") || mapsAnchorWrapper.querySelector("div");
      if (spanOrDiv) {
        spanOrDiv.textContent = "Maps";
      }

      referenceAnchor.parentNode.insertBefore(mapsAnchorWrapper, referenceAnchor.nextSibling);
    } catch (error) {
      log("Error inserting Maps button:", error);
    }
  }

  function setMapImageLink() {
    if (!mapsUrl) return;

    try {
      const luMapElement = document.querySelector("#lu_map");
      if (luMapElement) {
        const parentAnchor = luMapElement.parentNode.tagName.toLowerCase() === "a" ? luMapElement.parentNode : null;
        if (parentAnchor) {
          if (!parentAnchor.href || parentAnchor.href.trim() === "") {
            parentAnchor.href = mapsUrl;
          }
        } else {
          const newAnchor = document.createElement("a");
          newAnchor.href = mapsUrl;
          luMapElement.parentNode.insertBefore(newAnchor, luMapElement);
          newAnchor.appendChild(luMapElement);
        }
      } else {
        const fallbackDiv = document.querySelector("div.V1GY4c");
        if (fallbackDiv) {
          const imgElement = fallbackDiv.querySelector("img");
          if (imgElement && !imgElement.closest('a[href]:not([href=""]):not([href=" "])')) {
            const newAnchor = document.createElement("a");
            newAnchor.href = mapsUrl;
            fallbackDiv.insertBefore(newAnchor, imgElement);
            newAnchor.appendChild(imgElement);
          }
        }
      }
    } catch (error) {
      log("Error setting map image link:", error);
    }
  }

  function addMapsShortcut() {
    if (!mapsUrl) return;

    try {
      const sodP3bElement = document.querySelector(".SodP3b");
      if (sodP3bElement && !sodP3bElement.querySelector(".maps-shortcut-btn")) {
        const anchor = document.createElement("a");
        anchor.className = "maps-shortcut-btn";
        anchor.style.cssText =
          "position:absolute;top:5px;left:5px;color:#333;background:#d5d5d5;padding:10px;z-index:10;border-radius:20px;text-decoration:none;";
        anchor.textContent = "Open in Maps";
        anchor.href = mapsUrl;
        sodP3bElement.append(anchor);
      }
    } catch (error) {
      log("Error adding Maps shortcut:", error);
    }
  }

  function setupMapsButton() {
    updateMapsUrl();
    insertMapsButton();
    setMapImageLink();
    addMapsShortcut();
  }

  function handleUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      log("URL changed, re-running setup");
      setTimeout(setupMapsButton, 500);
    }
  }

  function init() {
    setupMapsButton();

    // Handle SPA navigation via MutationObserver
    const observer = new MutationObserver((mutations) => {
      handleUrlChange();

      // Also check if navigation elements were added/changed
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          const hasNavChanges = Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node.matches?.('[role="navigation"]') || node.querySelector?.('[role="navigation"]')),
          );
          if (hasNavChanges) {
            log("Navigation elements changed, re-running setup");
            setupMapsButton();
            break;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Handle browser back/forward navigation
    window.addEventListener("popstate", () => {
      log("Popstate event, re-running setup");
      setTimeout(setupMapsButton, 500);
    });
  }

  if (document.readyState === "interactive" || document.readyState === "complete") {
    init();
  } else {
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "interactive") {
        init();
      }
    });
  }
})();
