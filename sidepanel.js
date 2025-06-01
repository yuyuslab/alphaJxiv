console.log('sidepanel.js loaded');

let currentCommentsListener = null; // To store the active Firestore listener
let currentLoadedPageUrl = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  const commentForm = document.getElementById('comment_form');
  const commentText = document.getElementById('comment_text');
  const commentsList = document.getElementById('comments_list');

  if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
    console.error('Firebase or Firestore is not initialized. Check firebase-config.js and SDK local files.');
    if (commentsList) commentsList.innerHTML = '<p>Error: Firebase not loaded.</p>';
    return;
  }
  const db = firebase.firestore();
  console.log('Firestore instance created');

  function getCurrentTabUrl(callback) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0 && tabs[0].url) {
          // Normalize URL to remove hash, as it might not be relevant for page-specific comments
          const url = new URL(tabs[0].url);
          const normalizedUrl = `${url.protocol}//${url.hostname}${url.pathname}${url.search}`;
          callback(normalizedUrl);
        } else {
          console.warn('Could not get current tab URL. Is it a chrome:// page or no active tab?');
          callback(null); // No valid URL
        }
      });
    } else {
      console.warn('chrome.tabs API not available. Running outside extension context?');
      callback(null);
    }
  }

  function renderComment(doc) {
    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');
    commentDiv.setAttribute('data-id', doc.id);
    const commentTextP = document.createElement('p');
    commentTextP.textContent = doc.data().text;
    const commentTimestampSpan = document.createElement('span');
    commentTimestampSpan.classList.add('timestamp');
    if (doc.data().timestamp && doc.data().timestamp.toDate) {
      commentTimestampSpan.textContent = doc.data().timestamp.toDate().toLocaleString();
    } else {
      commentTimestampSpan.textContent = 'Pending timestamp';
    }
    commentDiv.appendChild(commentTextP);
    commentDiv.appendChild(commentTimestampSpan);
    if (commentsList.firstChild) {
      commentsList.insertBefore(commentDiv, commentsList.firstChild);
    } else {
      commentsList.appendChild(commentDiv);
    }
  }

  function clearComments() {
    if (commentsList) {
      while (commentsList.firstChild) {
        commentsList.removeChild(commentsList.firstChild);
      }
    }
  }

  function loadAndDisplayComments(pageUrl) {
    if (!commentsList) {
      console.error('Comments list element not found.');
      return;
    }
    clearComments();
    currentLoadedPageUrl = pageUrl;

    if (!pageUrl) {
      commentsList.innerHTML = '<p>Cannot load comments without a valid page URL.</p>';
      return;
    }
    
    commentsList.innerHTML = '<p>Loading comments for this page...</p>';

    // Detach previous listener if it exists
    if (currentCommentsListener) {
      currentCommentsListener(); // This unsubscribes the listener
      currentCommentsListener = null;
    }

    currentCommentsListener = db.collection("comments")
      .where("pageUrl", "==", pageUrl)
      .orderBy("timestamp", "desc")
      .onSnapshot(function(querySnapshot) {
        console.log(`Received comments snapshot for ${pageUrl}`);
        clearComments(); // Clear before rendering new snapshot
        if (querySnapshot.empty) {
          commentsList.innerHTML = '<p>No comments yet for this page. Be the first!</p>';
        } else {
          querySnapshot.forEach(function(doc) {
            renderComment(doc);
          });
        }
      }, function(error) {
        console.error(`Error fetching comments for ${pageUrl}: `, error);
        commentsList.innerHTML = '<p>Error loading comments for this page.</p>';
      });
  }

  // Initial load
  getCurrentTabUrl(function(url) {
    loadAndDisplayComments(url);
  });

  // Handle comment submission
  if (commentForm && commentText) {
    commentForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const commentValue = commentText.value.trim();
      if (commentValue === "") {
        console.log("Comment is empty, not submitting.");
        return;
      }

      getCurrentTabUrl(function(urlToSubmit) {
        if (!urlToSubmit) {
          console.error("Cannot submit comment without a valid page URL.");
          // Optionally, inform the user via UI
          alert("Could not determine the page URL. Cannot submit comment.");
          return;
        }
        console.log(`Attempting to add comment to Firestore for URL ${urlToSubmit}:`, commentValue);
        db.collection("comments").add({
          text: commentValue,
          pageUrl: urlToSubmit,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then((docRef) => {
          console.log("Comment successfully added to Firestore with ID: ", docRef.id);
          commentText.value = '';
        })
        .catch((error) => {
          console.error("Error adding comment to Firestore: ", error);
          alert("Error saving comment. Please try again.");
        });
      });
    });
  } else {
    if (!commentForm) console.error('Comment form (comment_form) not found');
    if (!commentText) console.error('Comment textarea (comment_text) not found');
  }

  // Listen for tab updates to refresh comments if URL changes
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (changeInfo.url && tab.active) {
        // Normalize the new URL like we do elsewhere
        const newUrl = new URL(changeInfo.url);
        const normalizedNewUrl = `${newUrl.protocol}//${newUrl.hostname}${newUrl.pathname}${newUrl.search}`;
        if (normalizedNewUrl !== currentLoadedPageUrl) {
          console.log(`Active tab URL changed to: ${normalizedNewUrl}. Reloading comments.`);
          loadAndDisplayComments(normalizedNewUrl);
        }
      }
    });
  }
  
  // Also consider active tab switches
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(function(activeInfo) {
      chrome.tabs.get(activeInfo.tabId, function(tab) {
        if (tab && tab.url) {
          const newUrl = new URL(tab.url);
          const normalizedNewUrl = `${newUrl.protocol}//${newUrl.hostname}${newUrl.pathname}${newUrl.search}`;
          if (normalizedNewUrl !== currentLoadedPageUrl) {
            console.log(`Switched to tab with URL: ${normalizedNewUrl}. Reloading comments.`);
            loadAndDisplayComments(normalizedNewUrl);
          }
        }
      });
    });
  }
}); 