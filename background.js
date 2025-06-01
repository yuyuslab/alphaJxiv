// Wrong way:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  setTimeout(() => {
    sendResponse({result: 'done'}); // May fail if channel closes
  }, 1000);
  return true; // Indicates async response
});

// Correct way:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Promise.resolve().then(() => {
    sendResponse({result: 'done'});
  });
  return true;
});

// Alternative using async/await:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const result = await someAsyncOperation();
    sendResponse({result});
  })();
  return true;
});
