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
      try {
        await chrome.tabs.sendMessage(currentTabId, {
          type: "PAPER_TITLE_UPDATED",
          title: paperTitle
        });
      } catch (e) {
        if (e.message !== "Could not establish connection. Receiving end does not exist.") {
          console.warn("Failed to send PAPER_TITLE_UPDATED to content script", e.message);
        }
      }
    } else {
      // Inform content.js if title not found
      try {
        await chrome.tabs.sendMessage(currentTabId, {
          type: "PAPER_TITLE_NOT_FOUND"
        });
      } catch (e) {
        if (e.message !== "Could not establish connection. Receiving end does not exist.") {
          console.warn("Failed to send PAPER_TITLE_NOT_FOUND to content script", e.message);
        }
      }
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
    // Extract the <title> tag content from <head>
    const match = html.match(/<head[^>]*>[\s\S]*?<title>(.*?)<\/title>/i);
    if (match && match[1]) {
      return match[1].trim();
    } else {
      console.log('Title tag not found or content is empty for:', url.href);
      return null;
    }
  } catch (error) {
    console.error(`Error in getPaperTitle for ${url.href}:`, error);
    return null;
  }
}

    const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

    // A global promise to avoid concurrency issues
    let creatingOffscreenDocument;

    // Chrome only allows for a single offscreenDocument. This is a helper function
    // that returns a boolean indicating if a document is already active.
    async function hasDocument() {
      // Check all windows controlled by the service worker to see if one
      // of them is the offscreen document with the given path
      const matchedClients = await clients.matchAll();
      return matchedClients.some(
        (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
      );
    }

    async function setupOffscreenDocument(path) {
      // If we do not have a document, we are already setup and can skip
      if (!(await hasDocument())) {
        // create offscreen document
        if (creatingOffscreenDocument) {
          await creatingOffscreenDocument;
        } else {
          creatingOffscreenDocument = chrome.offscreen.createDocument({
            url: path,
            reasons: [
                chrome.offscreen.Reason.DOM_SCRAPING
            ],
            justification: 'authentication'
          });
          await creatingOffscreenDocument;
          creatingOffscreenDocument = null;
        }
      }
    }

    async function closeOffscreenDocument() {
      if (!(await hasDocument())) {
        return;
      }
      await chrome.offscreen.closeDocument();
    }

    function getAuth() {
      return new Promise(async (resolve, reject) => {
        const auth = await chrome.runtime.sendMessage({
          type: 'firebase-auth',
          target: 'offscreen'
        });
        auth?.name !== 'FirebaseError' ? resolve(auth) : reject(auth);
      })
    }

    async function firebaseAuth() {
      await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

      const auth = await getAuth()
        .then((auth) => {
          console.log('User Authenticated', auth);
          return auth;
        })
        .catch(err => {
          if (err.code === 'auth/operation-not-allowed') {
            console.error('You must enable an OAuth provider in the Firebase' +
                          ' console in order to use signInWithPopup. This sample' +
                          ' uses Google by default.');
          } else {
            console.error(err);
            return err;
          }
        })
        .finally(closeOffscreenDocument)

      return auth;
    }

firebaseAuth();