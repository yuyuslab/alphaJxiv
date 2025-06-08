// src/content.js (Final Corrected Version)

// Send the title when the script first loads
chrome.runtime.sendMessage({
  type: 'PAGE_TITLE',
  title: document.title
});

// Also, listen for requests from the service worker to send the title again
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_TITLE') {
        sendResponse({ title: document.title });
    }
    // Return false to not keep the message channel open unnecessarily
    return false;
});