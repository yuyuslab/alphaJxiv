// const JxivOrigin = 'https://jxiv.jst.go.jp';
let tabTitles = {}; // To store titles by tabId

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

const preprintPattern = /^https:\/\/jxiv\.jst\.go\.jp\/index\.php\/jxiv\/preprint\/view\/\d+\/\d+$/;

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);

  // Use the tabId from the onUpdated event directly
  const currentTabId = tabId;

  if (preprintPattern.test(tab.url)) {
    // Ensure side panel is set for the correct tab
    await chrome.sidePanel.setOptions({
      tabId: currentTabId, // Use currentTabId
      path: 'sidepanel.html',
      enabled: true
    }).catch(e => console.error("Error setting side panel options:", e));

    const paperTitle = await getPaperTitle(url);
    tabTitles[currentTabId] = paperTitle; // Store the title

    if (paperTitle) {
      // Send to content.js
      chrome.runtime.sendMessage({
        type: "PAPER_TITLE_UPDATED",
        title: paperTitle
      }).catch(e => {
        if (e.message !== "Could not establish connection. Receiving end does not exist.") {
          console.warn("Failed to send PAPER_TITLE_UPDATED to content script", e.message);
        }
      });
      
    } else {
      // Inform content.js if title not found
      chrome.runtime.sendMessage({
        type: "PAPER_TITLE_NOT_FOUND"
      }).catch(e => {
         if (e.message !== "Could not establish connection. Receiving end does not exist.") {
           console.warn("Failed to send PAPER_TITLE_NOT_FOUND to content script", e.message);
         }
      });
    }
  } else {
    delete tabTitles[currentTabId]; // Clear title for non-Jxiv sites
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId: currentTabId, // Use currentTabId
      enabled: false
    }).catch(e => console.error("Error disabling side panel:", e));
  }
}); // End of chrome.tabs.onUpdated listener

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REQUEST_INITIAL_TITLE") {
    // The tabId is now expected in message.tabId
    console.log("REQUEST_INITIAL_TITLE received. Message:", JSON.stringify(message), "Sender:", JSON.stringify(sender));
    if (message.tabId) {
      const title = tabTitles[message.tabId];
      if (title) {
        sendResponse({ type: "PAPER_TITLE_UPDATED", title: title });
        console.log("Sent initial title for tabId:", message.tabId);
      } else {
        sendResponse({ type: "PAPER_TITLE_NOT_FOUND" });
        console.log("Initial title not found for tabId:", message.tabId);
      }
    } else {
      console.warn("REQUEST_INITIAL_TITLE received without message.tabId. Message:", message, "Sender:", sender);
      sendResponse({ type: "PAPER_TITLE_NOT_FOUND" });
    }
    return true; 
  }
  // Potentially other message handlers here like the ones for live updates from service worker to side panel
});

// getPaperTitle now only fetches and returns the title or null
async function getPaperTitle(url) {
  try {
    const response = await fetch(url.href);
    if (!response.ok) {
      console.error(`Failed to fetch ${url.href}: ${response.statusText}`);
      return null;
    }
    const html = await response.text();
    const match = html.match(/<meta name="citation_title" content="(.*?)"(?: ?\/)?>/i);
    if (match && match[1]) {
      return match[1]; // Return the title
    } else {
      console.log('Meta tag for citation_title not found or content is empty for:', url.href);
      return null;
    }
  } catch (error) {
    console.error(`Error in getPaperTitle for ${url.href}:`, error);
    return null;
  }
}

