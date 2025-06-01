document.addEventListener('DOMContentLoaded', () => {
  // Get the current tab to send its ID to the service worker
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.warn("Content.js: Error querying for active tab:", chrome.runtime.lastError.message);
      return;
    }
    if (tabs && tabs.length > 0 && tabs[0].id) {
      const currentTabId = tabs[0].id;
      // Request the initial title from the service worker, sending the tabId
      chrome.runtime.sendMessage({ type: "REQUEST_INITIAL_TITLE", tabId: currentTabId }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Content.js: Error requesting initial title:", chrome.runtime.lastError.message);
          return;
        }
        if (response) {
          const paperTitleElement = document.getElementById('paper_title');
          if (paperTitleElement) {
            if (response.type === "PAPER_TITLE_UPDATED") {
              paperTitleElement.innerHTML = response.title;
              console.log("Content.js: Initial title set for tab", currentTabId, "to -", response.title);
            } else if (response.type === "PAPER_TITLE_NOT_FOUND") {
              paperTitleElement.innerHTML = ''; // Clear if not found
              console.log("Content.js: Initial title not found for tab", currentTabId, ", .paper_title cleared.");
            }
          } else {
            console.warn("Content.js: .paper_title element not found for initial title.");
          }
        }
      });
    } else {
      console.warn("Content.js: Could not get active tab ID to request initial title.");
    }
  });

  // Listener for subsequent updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id === chrome.runtime.id) {
      if (message.type === "PAPER_TITLE_UPDATED") {
        const paperTitleElement = document.getElementById('paper_title');
        
        if (paperTitleElement) {
          paperTitleElement.innerHTML = message.title;
          console.log("Content.js: Title updated to -", message.title);
        } else {
          console.warn("Content.js: .paper_title element not found.");
        }
        sendResponse({ success: true }); // Add response

      } else if (message.type === "PAPER_TITLE_NOT_FOUND") {
        const paperTitleElement = document.getElementById('paper_title');

        if (paperTitleElement) {
          paperTitleElement.innerHTML = '';
          console.log("Content.js: Title not found, .paper_title cleared.");
        } else {
          console.warn("Content.js: .paper_title element not found for clearing.");
        }
        sendResponse({ success: true }); // Add response
      }
      return true; // Indicate we will send a response asynchronously
    }
    return false; // Don't expect a response for other messages
  });
});