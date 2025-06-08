/******/ (() => { // webpackBootstrap
/*!**************************!*\
  !*** ./src/sidepanel.js ***!
  \**************************/
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// src/sidepanel.js (Final Version - Replace Entire File)

// --- 1. UI Rendering Functions ---
function renderTitle(title) {
  var titleEl = document.getElementById('paper_title');
  if (titleEl) {
    titleEl.textContent = title || 'Loading title...';
  }
}
function renderComments(comments) {
  var commentsList = document.getElementById('comments_list');
  if (!commentsList) return;
  commentsList.innerHTML = '';
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<p>No comments yet.</p>';
    return;
  }
  var _iterator = _createForOfIteratorHelper(comments),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var comment = _step.value;
      var div = document.createElement('div');
      div.className = 'comment';
      // Display the author's email along with the comment
      var authorHTML = comment.author ? "<strong class=\"author\">".concat(escapeHTML(comment.author), "</strong>") : '';
      div.innerHTML = "".concat(authorHTML, "<p>").concat(escapeHTML(comment.text), "</p><span class=\"timestamp\">").concat(escapeHTML(comment.timestamp), "</span>");
      commentsList.prepend(div);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
}

// **MODIFIED**: This function now controls the login button's visibility
function renderAuth(auth) {
  var authEl = document.getElementById('user-status');
  var loginBtn = document.getElementById('login_button');
  var commentForm = document.getElementById('comment_form');
  if (authEl && loginBtn && commentForm) {
    if (auth) {
      authEl.textContent = "Logged in as: ".concat(auth.email);
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
  var p = document.createElement('p');
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
document.addEventListener('DOMContentLoaded', function () {
  // When the side panel opens, ask for the current state.
  chrome.runtime.sendMessage({
    type: 'GET_INITIAL_STATE'
  }, function (response) {
    if (response && response.data) {
      console.log("Side Panel: Received initial state:", response.data);
      updateUI(response.data);
    }
  });

  // Listen for all future state pushes from the service worker.
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === 'STATE_UPDATE' && message.data) {
      console.log("Side Panel: Received state update:", message.data);
      updateUI(message.data);
    }
  });

  // Handle comment submission
  var commentForm = document.getElementById('comment_form');
  if (commentForm) {
    commentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var commentText = document.getElementById('comment_text');
      if (commentText && commentText.value.trim() !== '') {
        chrome.runtime.sendMessage({
          type: 'ADD_COMMENT',
          text: commentText.value.trim()
        }, function (response) {
          if (response && response.success) {
            commentText.value = '';
          } else {
            alert("Error posting comment: ".concat(response ? response.error : 'No response'));
          }
        });
      }
    });
  }
  var loginButton = document.getElementById('login_button');
  if (loginButton) {
    loginButton.addEventListener('click', function () {
      loginButton.textContent = "Logging in...";
      loginButton.disabled = true;
      // This message triggers the authentication flow in the service worker
      chrome.runtime.sendMessage({
        type: 'REQUEST_AUTH_STATE'
      }, function (response) {
        // The UI update is handled by the 'STATE_UPDATE' listener.
        // We only need to handle the failure case here.
        if (!response || !response.success) {
          alert("Login failed: ".concat(response ? response.error : 'Unknown error'));
          loginButton.textContent = "Login with Google";
          loginButton.disabled = false;
        }
      });
    });
  }
});
/******/ })()
;
//# sourceMappingURL=sidepanel.js.map