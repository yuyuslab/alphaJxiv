"use strict";
(self["webpackChunkalphajxiv"] = self["webpackChunkalphajxiv"] || []).push([["src_firebase-config_mjs"],{

/***/ "./src/firebase-config.mjs":
/*!*********************************!*\
  !*** ./src/firebase-config.mjs ***!
  \*********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   auth: () => (/* binding */ auth),
/* harmony export */   db: () => (/* binding */ db),
/* harmony export */   provider: () => (/* binding */ provider),
/* harmony export */   signInWithPopup: () => (/* reexport safe */ firebase_auth__WEBPACK_IMPORTED_MODULE_1__.signInWithPopup)
/* harmony export */ });
/* harmony import */ var firebase_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase/app */ "./node_modules/firebase/app/dist/esm/index.esm.js");
/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase/auth */ "./node_modules/firebase/auth/dist/esm/index.esm.js");
/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/firestore */ "./node_modules/firebase/firestore/dist/esm/index.esm.js");



var firebaseConfig = {
  apiKey: "AIzaSyD6SVNfNmtVfhq4vAsGpZoh6pbiwrnaW94",
  authDomain: "alphajxivextended.firebaseapp.com",
  projectId: "alphajxivextended",
  storageBucket: "alphajxivextended.firebasestorage.app",
  messagingSenderId: "233920038624",
  appId: "1:233920038624:web:4bc040668184356115b285"
};

// Initialize Firebase
var app = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(firebaseConfig);
var auth = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(app);
var db = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(app);
var provider = new firebase_auth__WEBPACK_IMPORTED_MODULE_1__.GoogleAuthProvider();


/***/ })

}]);
//# sourceMappingURL=src_firebase-config_mjs.js.map