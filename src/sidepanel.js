// --- 1. UI Rendering Functions ---
function renderTitle(title) {
  const titleEl = document.getElementById('paper_title');
  if (titleEl) {
    titleEl.textContent = title || 'Loading title...';
  }
}

function generateUsername(email) {
  // Create a simple hash of the email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to generate a username with an adjective and a noun
  const adjectives = ['Quick', 'Clever', 'Happy', 'Bright', 'Smart', 'Kind', 'Cool'];
  const nouns = ['Reader', 'Scholar', 'Thinker', 'Student', 'Researcher', 'Scientist'];
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 4) % nouns.length;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}`;
}

function renderComments(comments) {
  const commentsList = document.getElementById('comments_list');
  if (!commentsList) return;
  commentsList.innerHTML = '';
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<p>No comments yet.</p>';
    return;
  }
  for (const comment of comments) {
    const div = document.createElement('div');
    div.className = 'comment';
    // Generate consistent but anonymous username
    const username = comment.author ? generateUsername(comment.author) : 'Anonymous';
    const authorHTML = `<strong class="author">${escapeHTML(username)}</strong>`;
    div.innerHTML = `${authorHTML}<p>${escapeHTML(comment.text)}</p><span class="timestamp">${escapeHTML(comment.timestamp)}</span>`;
    commentsList.prepend(div);
  }
}

function renderAuth(auth) {
  const authEl = document.getElementById('user-status');
  const loginBtn = document.getElementById('login_button');
  const commentForm = document.getElementById('comment_form');

  if (authEl && loginBtn && commentForm) {
    if (auth) {
      authEl.textContent = `Logged in as: ${auth.email}`;
      loginBtn.style.display = 'none'; // Hide login button
      commentForm.style.display = 'flex'; // Show comment form
    } else {
      authEl.textContent = 'You must be logged in to comment.';
      loginBtn.style.display = 'block'; // Show login button
      commentForm.style.display = 'none'; // Hide comment form
    }
  }
}

function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str || ''));
    return p.innerHTML;
}

// --- 2. Main Update Function ---
function updateUI(state) {
  if (!state) return;
  renderTitle(state.paperTitle);
  renderComments(state.comments);
  renderAuth(state.auth);
}

// --- 3. Communication and Event Handlers ---
document.addEventListener('DOMContentLoaded', () => {
  // When the side panel opens, ask for the current state.
  chrome.runtime.sendMessage({ type: 'GET_INITIAL_STATE' }, (response) => {
    if (response && response.data) {
      console.log("Side Panel: Received initial state:", response.data);
      updateUI(response.data);
    }
  });

  // Listen for all future state pushes from the service worker.
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATE_UPDATE' && message.data) {
      console.log("Side Panel: Received state update:", message.data);
      updateUI(message.data);
    }
  });

  // Handle comment submission
  const commentForm = document.getElementById('comment_form');
  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const commentText = document.getElementById('comment_text');
      if (commentText && commentText.value.trim() !== '') {
        chrome.runtime.sendMessage({ type: 'ADD_COMMENT', text: commentText.value.trim() }, (response) => {
          if (response && response.success) {
            commentText.value = '';
          } else {
            alert(`Error posting comment: ${response ? response.error : 'No response'}`);
          }
        });
      }
    });
  }

  const loginButton = document.getElementById('login_button');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      loginButton.textContent = "Logging in...";
      loginButton.disabled = true;
      // This message triggers the authentication flow in the service worker
      chrome.runtime.sendMessage({ type: 'REQUEST_AUTH_STATE' }, (response) => {
        // The UI update is handled by the 'STATE_UPDATE' listener.
        // We only need to handle the failure case here.
        if (!response || !response.success) {
          alert(`Login failed: ${response ? response.error : 'Unknown error'}`);
          loginButton.textContent = "Login with Google";
          loginButton.disabled = false;
        }
      });
    });
  }
});