/******/ (() => { // webpackBootstrap
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
// src/content.js (Final Version - Replace Entire File)

// When the content script loads, it has access to the page's DOM.
// We send the title to the service worker to update the extension's state.
chrome.runtime.sendMessage({
  type: 'PAGE_TITLE',
  title: document.title
});

// The content script's job is done. The service worker will manage the state
// and the side panel will render it. No other code is needed here for the
// requested functionality.
/******/ })()
;
//# sourceMappingURL=content.js.map