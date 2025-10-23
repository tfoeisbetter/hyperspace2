(() => { // webpackBootstrap
var __webpack_modules__ = ({
"./node_modules/.pnpm/set-cookie-parser@2.7.1/node_modules/set-cookie-parser/lib/set-cookie.js": 
/*!*****************************************************************************************************!*\
  !*** ./node_modules/.pnpm/set-cookie-parser@2.7.1/node_modules/set-cookie-parser/lib/set-cookie.js ***!
  \*****************************************************************************************************/
(function (module) {


var defaultParseOptions = {
  decodeValues: true,
  map: false,
  silent: false,
};

function isNonEmptyString(str) {
  return typeof str === "string" && !!str.trim();
}

function parseString(setCookieValue, options) {
  var parts = setCookieValue.split(";").filter(isNonEmptyString);

  var nameValuePairStr = parts.shift();
  var parsed = parseNameValuePair(nameValuePairStr);
  var name = parsed.name;
  var value = parsed.value;

  options = options
    ? Object.assign({}, defaultParseOptions, options)
    : defaultParseOptions;

  try {
    value = options.decodeValues ? decodeURIComponent(value) : value; // decode cookie value
  } catch (e) {
    console.error(
      "set-cookie-parser encountered an error while decoding a cookie with value '" +
        value +
        "'. Set options.decodeValues to false to disable this feature.",
      e
    );
  }

  var cookie = {
    name: name,
    value: value,
  };

  parts.forEach(function (part) {
    var sides = part.split("=");
    var key = sides.shift().trimLeft().toLowerCase();
    var value = sides.join("=");
    if (key === "expires") {
      cookie.expires = new Date(value);
    } else if (key === "max-age") {
      cookie.maxAge = parseInt(value, 10);
    } else if (key === "secure") {
      cookie.secure = true;
    } else if (key === "httponly") {
      cookie.httpOnly = true;
    } else if (key === "samesite") {
      cookie.sameSite = value;
    } else if (key === "partitioned") {
      cookie.partitioned = true;
    } else {
      cookie[key] = value;
    }
  });

  return cookie;
}

function parseNameValuePair(nameValuePairStr) {
  // Parses name-value-pair according to rfc6265bis draft

  var name = "";
  var value = "";
  var nameValueArr = nameValuePairStr.split("=");
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift();
    value = nameValueArr.join("="); // everything after the first =, joined by a "=" if there was more than one part
  } else {
    value = nameValuePairStr;
  }

  return { name: name, value: value };
}

function parse(input, options) {
  options = options
    ? Object.assign({}, defaultParseOptions, options)
    : defaultParseOptions;

  if (!input) {
    if (!options.map) {
      return [];
    } else {
      return {};
    }
  }

  if (input.headers) {
    if (typeof input.headers.getSetCookie === "function") {
      // for fetch responses - they combine headers of the same type in the headers array,
      // but getSetCookie returns an uncombined array
      input = input.headers.getSetCookie();
    } else if (input.headers["set-cookie"]) {
      // fast-path for node.js (which automatically normalizes header names to lower-case
      input = input.headers["set-cookie"];
    } else {
      // slow-path for other environments - see #25
      var sch =
        input.headers[
          Object.keys(input.headers).find(function (key) {
            return key.toLowerCase() === "set-cookie";
          })
        ];
      // warn if called on a request-like object with a cookie header rather than a set-cookie header - see #34, 36
      if (!sch && input.headers.cookie && !options.silent) {
        console.warn(
          "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning."
        );
      }
      input = sch;
    }
  }
  if (!Array.isArray(input)) {
    input = [input];
  }

  if (!options.map) {
    return input.filter(isNonEmptyString).map(function (str) {
      return parseString(str, options);
    });
  } else {
    var cookies = {};
    return input.filter(isNonEmptyString).reduce(function (cookies, str) {
      var cookie = parseString(str, options);
      cookies[cookie.name] = cookie;
      return cookies;
    }, cookies);
  }
}

/*
  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
  that are within a single set-cookie field-value, such as in the Expires portion.

  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
  React Native's fetch does this for *every* header, including set-cookie.

  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
*/
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString;
  }
  if (typeof cookiesString !== "string") {
    return [];
  }

  var cookiesStrings = [];
  var pos = 0;
  var start;
  var ch;
  var lastComma;
  var nextStart;
  var cookiesSeparatorFound;

  function skipWhitespace() {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  }

  function notSpecialChar() {
    ch = cookiesString.charAt(pos);

    return ch !== "=" && ch !== ";" && ch !== ",";
  }

  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;

    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        // ',' is a cookie separator if we have later first '=', not ';' or ','
        lastComma = pos;
        pos += 1;

        skipWhitespace();
        nextStart = pos;

        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }

        // currently special character
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          // we found cookies separator
          cookiesSeparatorFound = true;
          // pos is inside the next cookie, so back up and return it.
          pos = nextStart;
          cookiesStrings.push(cookiesString.substring(start, lastComma));
          start = pos;
        } else {
          // in param ',' or param separator ';',
          // we continue from that comma
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }

    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
    }
  }

  return cookiesStrings;
}

module.exports = parse;
module.exports.parse = parse;
module.exports.parseString = parseString;
module.exports.splitCookiesString = splitCookiesString;


}),
"./src/client sync recursive ^\\.\\/.*$": 
/*!*************************************************************************************!*\
  !*** C:\Users\tfoe mustardddddd\Downloads\scramjet-main\src\client|sync|/^\.\/.*$/ ***!
  \*************************************************************************************/
(function (module, __unused_webpack_exports, __webpack_require__) {
var map = {
  "./": "./src/client/index.ts",
  "./client": "./src/client/client.ts",
  "./client.ts": "./src/client/client.ts",
  "./dom/attr": "./src/client/dom/attr.ts",
  "./dom/attr.ts": "./src/client/dom/attr.ts",
  "./dom/beacon": "./src/client/dom/beacon.ts",
  "./dom/beacon.ts": "./src/client/dom/beacon.ts",
  "./dom/cookie": "./src/client/dom/cookie.ts",
  "./dom/cookie.ts": "./src/client/dom/cookie.ts",
  "./dom/css": "./src/client/dom/css.ts",
  "./dom/css.ts": "./src/client/dom/css.ts",
  "./dom/document": "./src/client/dom/document.ts",
  "./dom/document.ts": "./src/client/dom/document.ts",
  "./dom/element": "./src/client/dom/element.ts",
  "./dom/element.ts": "./src/client/dom/element.ts",
  "./dom/fontface": "./src/client/dom/fontface.ts",
  "./dom/fontface.ts": "./src/client/dom/fontface.ts",
  "./dom/fragments": "./src/client/dom/fragments.ts",
  "./dom/fragments.ts": "./src/client/dom/fragments.ts",
  "./dom/history": "./src/client/dom/history.ts",
  "./dom/history.ts": "./src/client/dom/history.ts",
  "./dom/open": "./src/client/dom/open.ts",
  "./dom/open.ts": "./src/client/dom/open.ts",
  "./dom/origin": "./src/client/dom/origin.ts",
  "./dom/origin.ts": "./src/client/dom/origin.ts",
  "./dom/performance": "./src/client/dom/performance.ts",
  "./dom/performance.ts": "./src/client/dom/performance.ts",
  "./dom/protocol": "./src/client/dom/protocol.ts",
  "./dom/protocol.ts": "./src/client/dom/protocol.ts",
  "./dom/serviceworker": "./src/client/dom/serviceworker.ts",
  "./dom/serviceworker.ts": "./src/client/dom/serviceworker.ts",
  "./dom/storage": "./src/client/dom/storage.ts",
  "./dom/storage.ts": "./src/client/dom/storage.ts",
  "./entry": "./src/client/entry.ts",
  "./entry.ts": "./src/client/entry.ts",
  "./events": "./src/client/events.ts",
  "./events.ts": "./src/client/events.ts",
  "./helpers": "./src/client/helpers.ts",
  "./helpers.ts": "./src/client/helpers.ts",
  "./index": "./src/client/index.ts",
  "./index.ts": "./src/client/index.ts",
  "./location": "./src/client/location.ts",
  "./location.ts": "./src/client/location.ts",
  "./shared/antiantidebugger": "./src/client/shared/antiantidebugger.ts",
  "./shared/antiantidebugger.ts": "./src/client/shared/antiantidebugger.ts",
  "./shared/blob": "./src/client/shared/blob.ts",
  "./shared/blob.ts": "./src/client/shared/blob.ts",
  "./shared/caches": "./src/client/shared/caches.ts",
  "./shared/caches.ts": "./src/client/shared/caches.ts",
  "./shared/chrome": "./src/client/shared/chrome.ts",
  "./shared/chrome.ts": "./src/client/shared/chrome.ts",
  "./shared/err": "./src/client/shared/err.ts",
  "./shared/err.ts": "./src/client/shared/err.ts",
  "./shared/error": "./src/client/shared/error.ts",
  "./shared/error.ts": "./src/client/shared/error.ts",
  "./shared/eval": "./src/client/shared/eval.ts",
  "./shared/eval.ts": "./src/client/shared/eval.ts",
  "./shared/event": "./src/client/shared/event.ts",
  "./shared/event.ts": "./src/client/shared/event.ts",
  "./shared/function": "./src/client/shared/function.ts",
  "./shared/function.ts": "./src/client/shared/function.ts",
  "./shared/import": "./src/client/shared/import.ts",
  "./shared/import.ts": "./src/client/shared/import.ts",
  "./shared/indexeddb": "./src/client/shared/indexeddb.ts",
  "./shared/indexeddb.ts": "./src/client/shared/indexeddb.ts",
  "./shared/opfs": "./src/client/shared/opfs.ts",
  "./shared/opfs.ts": "./src/client/shared/opfs.ts",
  "./shared/postmessage": "./src/client/shared/postmessage.ts",
  "./shared/postmessage.ts": "./src/client/shared/postmessage.ts",
  "./shared/realm": "./src/client/shared/realm.ts",
  "./shared/realm.ts": "./src/client/shared/realm.ts",
  "./shared/requests/eventsource": "./src/client/shared/requests/eventsource.ts",
  "./shared/requests/eventsource.ts": "./src/client/shared/requests/eventsource.ts",
  "./shared/requests/fetch": "./src/client/shared/requests/fetch.ts",
  "./shared/requests/fetch.ts": "./src/client/shared/requests/fetch.ts",
  "./shared/requests/websocket": "./src/client/shared/requests/websocket.ts",
  "./shared/requests/websocket.ts": "./src/client/shared/requests/websocket.ts",
  "./shared/requests/xmlhttprequest": "./src/client/shared/requests/xmlhttprequest.ts",
  "./shared/requests/xmlhttprequest.ts": "./src/client/shared/requests/xmlhttprequest.ts",
  "./shared/settimeout": "./src/client/shared/settimeout.ts",
  "./shared/settimeout.ts": "./src/client/shared/settimeout.ts",
  "./shared/sourcemaps": "./src/client/shared/sourcemaps.ts",
  "./shared/sourcemaps.ts": "./src/client/shared/sourcemaps.ts",
  "./shared/worker": "./src/client/shared/worker.ts",
  "./shared/worker.ts": "./src/client/shared/worker.ts",
  "./shared/wrap": "./src/client/shared/wrap.ts",
  "./shared/wrap.ts": "./src/client/shared/wrap.ts",
  "./singletonbox": "./src/client/singletonbox.ts",
  "./singletonbox.ts": "./src/client/singletonbox.ts",
  "./swruntime": "./src/client/swruntime.ts",
  "./swruntime.ts": "./src/client/swruntime.ts",
  "./worker/importScripts": "./src/client/worker/importScripts.ts",
  "./worker/importScripts.ts": "./src/client/worker/importScripts.ts"
};


function webpackContext(req) {
  var id = webpackContextResolve(req);
  return __webpack_require__(id);
}
function webpackContextResolve(req) {
  if(!__webpack_require__.o(map, req)) {
    var e = new Error("Cannot find module '" + req + "'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  }
  return map[req];
}
webpackContext.keys = function webpackContextKeys() {
  return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./src/client sync recursive ^\\.\\/.*$";


}),
"./src sync recursive": 
/*!*******************************************************************!*\
  !*** C:\Users\tfoe mustardddddd\Downloads\scramjet-main\src|sync ***!
  \*******************************************************************/
(function (module) {
function webpackEmptyContext(req) {
  var e = new Error("Cannot find module '" + req + "'");
  e.code = 'MODULE_NOT_FOUND';
  throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "./src sync recursive";
module.exports = webpackEmptyContext;


}),
"./src/client/client.ts": 
/*!******************************!*\
  !*** ./src/client/client.ts ***!
  \******************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ScramjetClient: () => (ScramjetClient)
});
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");
/* ESM import */var _client_helpers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @client/helpers */ "./src/client/helpers.ts");
/* ESM import */var _client_location__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @client/location */ "./src/client/location.ts");
/* ESM import */var _client_shared_wrap__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @client/shared/wrap */ "./src/client/shared/wrap.ts");
/* ESM import */var _client_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @client/events */ "./src/client/events.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _shared_cookie__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/shared/cookie */ "./src/shared/cookie.ts");
/* ESM import */var _entry__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./entry */ "./src/client/entry.ts");
/* ESM import */var _singletonbox__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./singletonbox */ "./src/client/singletonbox.ts");
/* ESM import */var _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @mercuryworkshop/bare-mux */ "./node_modules/.pnpm/@mercuryworkshop+bare-mux@2.1.7/node_modules/@mercuryworkshop/bare-mux/dist/index.mjs");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];











class ScramjetClient {
    global;
    locationProxy;
    serviceWorker;
    // epoxy: EpoxyClient;
    bare;
    natives;
    descriptors;
    wrapfn;
    cookieStore = new _shared_cookie__WEBPACK_IMPORTED_MODULE_7__.CookieStore();
    eventcallbacks = new Map();
    meta;
    box;
    constructor(global){
        this.global = global;
        if (_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT in global) {
            console.error("attempted to initialize a scramjet client, but one is already loaded - this is very bad");
            throw new Error();
        }
        if (_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) {
            try {
                if (_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT in global.parent) {
                    this.box = global.parent[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT].box;
                }
            } catch  {}
            try {
                if (_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT in global.top) {
                    this.box = global.top[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT].box;
                }
            } catch  {}
            try {
                if (global.opener && _symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT in global.opener) {
                    this.box = global.opener[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT].box;
                }
            } catch  {}
            if (!this.box) {
                dbg.warn("Creating SingletonBox");
                this.box = new _singletonbox__WEBPACK_IMPORTED_MODULE_9__.SingletonBox(this);
            }
        } else {
            this.box = new _singletonbox__WEBPACK_IMPORTED_MODULE_9__.SingletonBox(this);
        }
        this.box.registerClient(this, global);
        /*
		initEpoxy().then(() => {
			let options = new EpoxyClientOptions();
			options.user_agent = navigator.userAgent;
			this.epoxy = new EpoxyClient(config.wisp, options);
		});
		*/ if (_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) {
            // this.bare = new EpoxyClient();
            this.bare = new _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_10__["default"]();
        } else {
            this.bare = new _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_10__["default"](new Promise((resolve)=>{
                addEventListener("message", ({ data })=>{
                    if (typeof data !== "object") return;
                    if ("$scramjet$type" in data && data.$scramjet$type === "baremuxinit") {
                        resolve(data.port);
                    }
                });
            }));
        }
        this.serviceWorker = this.global.navigator.serviceWorker;
        if (_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) {
            global.document[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT] = this;
        }
        this.wrapfn = (0,_client_shared_wrap__WEBPACK_IMPORTED_MODULE_3__.createWrapFn)(this, global);
        this.natives = {
            store: new Proxy({}, {
                get: (target, prop)=>{
                    if (prop in target) {
                        return target[prop];
                    }
                    const split = prop.split(".");
                    const realProp = split.pop();
                    const realTarget = split.reduce((a, b)=>a?.[b], this.global);
                    if (!realTarget) return;
                    const original = Reflect.get(realTarget, realProp);
                    target[prop] = original;
                    return target[prop];
                }
            }),
            construct (target, ...args) {
                const original = this.store[target];
                if (!original) return null;
                return new original(...args);
            },
            call (target, that, ...args) {
                const original = this.store[target];
                if (!original) return null;
                return original.call(that, ...args);
            }
        };
        this.descriptors = {
            store: new Proxy({}, {
                get: (target, prop)=>{
                    if (prop in target) {
                        return target[prop];
                    }
                    const split = prop.split(".");
                    const realProp = split.pop();
                    const realTarget = split.reduce((a, b)=>a?.[b], this.global);
                    if (!realTarget) return;
                    const original = client.natives.call("Object.getOwnPropertyDescriptor", null, realTarget, realProp);
                    target[prop] = original;
                    return target[prop];
                }
            }),
            get (target, that) {
                const original = this.store[target];
                if (!original) return null;
                return original.get.call(that);
            },
            set (target, that, value) {
                const original = this.store[target];
                if (!original) return null;
                original.set.call(that, value);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const client = this;
        this.meta = {
            get origin () {
                return client.url;
            },
            get base () {
                if (_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) {
                    const base = client.natives.call("Document.prototype.querySelector", client.global.document, "base");
                    if (base) {
                        let url = base.getAttribute("href");
                        if (!url) return client.url;
                        const frag = url.indexOf("#");
                        url = url.substring(0, frag === -1 ? undefined : frag);
                        if (!url) return client.url;
                        return new URL(url, client.url.origin);
                    }
                }
                return client.url;
            },
            get topFrameName () {
                if (!_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) throw new Error("topFrameName was called from a worker?");
                let currentWin = client.global;
                if (currentWin.parent.window == currentWin.window) {
                    // we're top level & we don't have a frame name
                    return null;
                }
                // find the topmost frame that's controlled by scramjet, stopping before the real top frame
                while(currentWin.parent.window !== currentWin.window){
                    if (!currentWin.parent.window[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT]) break;
                    currentWin = currentWin.parent.window;
                }
                const curclient = currentWin[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT];
                const frame = curclient.descriptors.get("window.frameElement", currentWin);
                if (!frame) {
                    // we're inside an iframe, but the top frame is scramjet-controlled and top level, so we can't get a top frame name
                    return null;
                }
                if (!frame.name) {
                    // the top frame is scramjet-controlled, but it has no name. this is user error
                    console.error("YOU NEED TO USE `new ScramjetFrame()`! DIRECT IFRAMES WILL NOT WORK");
                    return null;
                }
                return frame.name;
            },
            get parentFrameName () {
                if (!_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) throw new Error("parentFrameName was called from a worker?");
                if (client.global.parent.window == client.global.window) {
                    // we're top level & we don't have a frame name
                    return null;
                }
                let parentWin = client.global.parent.window;
                if (parentWin[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT]) {
                    // we're inside an iframe, and the parent is scramjet-controlled
                    const parentClient = parentWin[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT];
                    const frame = parentClient.descriptors.get("window.frameElement", parentWin);
                    if (!frame) {
                        // parent is scramjet controlled and top-level. there is no parent frame name
                        return null;
                    }
                    if (!frame.name) {
                        // the parent frame is scramjet-controlled, but it has no name. this is user error
                        console.error("YOU NEED TO USE `new ScramjetFrame()`! DIRECT IFRAMES WILL NOT WORK");
                        return null;
                    }
                    return frame.name;
                } else {
                    // we're inside an iframe, and the parent is not scramjet-controlled
                    // return our own frame name
                    const frame = client.descriptors.get("window.frameElement", client.global);
                    if (!frame.name) {
                        // the parent frame is not scramjet-controlled, so we can't get a parent frame name
                        console.error("YOU NEED TO USE `new ScramjetFrame()`! DIRECT IFRAMES WILL NOT WORK");
                        return null;
                    }
                    return frame.name;
                }
            }
        };
        this.locationProxy = (0,_client_location__WEBPACK_IMPORTED_MODULE_2__.createLocationProxy)(this, global);
        global[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT] = this;
    }
    get frame() {
        if (!_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) return null;
        const frame = this.descriptors.get("window.frameElement", this.global);
        if (!frame) return null; // we're top level
        const sframe = frame[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETFRAME];
        if (!sframe) {
            // we're in a subframe, recurse upward until we find one
            let currentwin = this.global.window;
            while(currentwin.parent !== currentwin){
                let currentclient = currentwin[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT];
                let currentFrame = currentclient.descriptors.get("window.frameElement", currentwin);
                if (!currentFrame) return null; // ??
                if (currentFrame && currentFrame[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETFRAME]) {
                    return currentFrame[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETFRAME];
                }
                currentwin = currentwin.parent.window;
            }
        }
        return sframe;
    }
    get isSubframe() {
        if (!_entry__WEBPACK_IMPORTED_MODULE_8__.iswindow) return false;
        const frame = this.descriptors.get("window.frameElement", this.global);
        if (!frame) return false; // we're top level
        const sframe = frame[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETFRAME];
        if (!sframe) return true;
        return false;
    }
    loadcookies(cookiestr) {
        this.cookieStore.load(cookiestr);
    }
    hook() {
        const context = __webpack_require__(/*! . */ "./src/client sync recursive ^\\.\\/.*$");
        const modules = [];
        for (const key of context.keys()){
            const module = context(key);
            if (!key.endsWith(".ts")) continue;
            if (key.startsWith("./dom/") && "window" in this.global || key.startsWith("./worker/") && "WorkerGlobalScope" in this.global || key.startsWith("./shared/")) {
                modules.push(module);
            }
        }
        modules.sort((a, b)=>{
            const aorder = a.order || 0;
            const border = b.order || 0;
            return aorder - border;
        });
        for (const module of modules){
            if (!module.enabled || module.enabled(this)) module.default(this, this.global);
            else if (module.disabled) module.disabled(this, this.global);
        }
    }
    get url() {
        return new URL((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_5__.unrewriteUrl)(this.global.location.href));
    }
    set url(url) {
        if (url instanceof URL) url = url.toString();
        const ev = new _client_events__WEBPACK_IMPORTED_MODULE_4__.NavigateEvent(url);
        if (this.frame) {
            this.frame.dispatchEvent(ev);
        }
        if (ev.defaultPrevented) return;
        this.global.location.href = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_5__.rewriteUrl)(ev.url, this.meta);
    }
    // below are the utilities for proxying and trapping dom APIs
    // you don't have to understand this it just makes the rest easier
    // i'll document it eventually
    Proxy(name, handler) {
        if (Array.isArray(name)) {
            for (const n of name){
                this.Proxy(n, handler);
            }
            return;
        }
        const split = name.split(".");
        const prop = split.pop();
        const target = split.reduce((a, b)=>a?.[b], this.global);
        if (!target) return;
        if (!(name in this.natives.store)) {
            const original = Reflect.get(target, prop);
            this.natives.store[name] = original;
        }
        this.RawProxy(target, prop, handler);
    }
    RawProxy(target, prop, handler) {
        if (!target) return;
        if (!prop) return;
        if (!Reflect.has(target, prop)) return;
        const value = Reflect.get(target, prop);
        delete target[prop];
        const h = {};
        if (handler.construct) {
            h.construct = function(constructor, args, newTarget) {
                let returnValue = undefined;
                let earlyreturn = false;
                const ctx = {
                    fn: constructor,
                    this: null,
                    args,
                    newTarget: newTarget,
                    return: (r)=>{
                        earlyreturn = true;
                        returnValue = r;
                    },
                    call: ()=>{
                        earlyreturn = true;
                        returnValue = Reflect.construct(ctx.fn, ctx.args, ctx.newTarget);
                        return returnValue;
                    }
                };
                handler.construct(ctx);
                if (earlyreturn) {
                    return returnValue;
                }
                return Reflect.construct(ctx.fn, ctx.args, ctx.newTarget);
            };
        }
        if (handler.apply) {
            h.apply = (fn, that, args)=>{
                let returnValue = undefined;
                let earlyreturn = false;
                const ctx = {
                    fn,
                    this: that,
                    args,
                    newTarget: null,
                    return: (r)=>{
                        earlyreturn = true;
                        returnValue = r;
                    },
                    call: ()=>{
                        earlyreturn = true;
                        returnValue = Reflect.apply(ctx.fn, ctx.this, ctx.args);
                        return returnValue;
                    }
                };
                const pst = Error.prepareStackTrace;
                Error.prepareStackTrace = function(err, s) {
                    if (s[0].getFileName() && !s[0].getFileName().startsWith(location.origin + _shared__WEBPACK_IMPORTED_MODULE_6__.config.prefix)) {
                        return {
                            stack: err.stack
                        };
                    }
                };
                try {
                    handler.apply(ctx);
                } catch (err) {
                    if (err instanceof Error) {
                        if (err.stack instanceof Object) {
                            //@ts-expect-error i'm not going to explain this
                            err.stack = err.stack.stack;
                            console.error("ERROR FROM SCRAMJET INTERNALS", err);
                            if (!(0,_shared__WEBPACK_IMPORTED_MODULE_6__.flagEnabled)("allowFailedIntercepts", this.url)) {
                                throw err;
                            }
                        } else {
                            throw err;
                        }
                    } else {
                        throw err;
                    }
                }
                Error.prepareStackTrace = pst;
                if (earlyreturn) {
                    return returnValue;
                }
                return Reflect.apply(ctx.fn, ctx.this, ctx.args);
            };
        }
        h.getOwnPropertyDescriptor = _client_helpers__WEBPACK_IMPORTED_MODULE_1__.getOwnPropertyDescriptorHandler;
        target[prop] = new Proxy(value, h);
    }
    Trap(name, descriptor) {
        if (Array.isArray(name)) {
            for (const n of name){
                this.Trap(n, descriptor);
            }
            return;
        }
        const split = name.split(".");
        const prop = split.pop();
        const target = split.reduce((a, b)=>a?.[b], this.global);
        if (!target) return;
        const original = this.natives.call("Object.getOwnPropertyDescriptor", null, target, prop);
        this.descriptors.store[name] = original;
        return this.RawTrap(target, prop, descriptor);
    }
    RawTrap(target, prop, descriptor) {
        if (!target) return;
        if (!prop) return;
        if (!Reflect.has(target, prop)) return;
        const oldDescriptor = this.natives.call("Object.getOwnPropertyDescriptor", null, target, prop);
        const ctx = {
            this: null,
            get: function() {
                return oldDescriptor && oldDescriptor.get.call(this.this);
            },
            set: function(v) {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                oldDescriptor && oldDescriptor.set.call(this.this, v);
            }
        };
        delete target[prop];
        const desc = {};
        if (descriptor.get) {
            desc.get = function() {
                ctx.this = this;
                return descriptor.get(ctx);
            };
        } else if (oldDescriptor?.get) {
            desc.get = oldDescriptor.get;
        }
        if (descriptor.set) {
            desc.set = function(v) {
                ctx.this = this;
                descriptor.set(ctx, v);
            };
        } else if (oldDescriptor?.set) {
            desc.set = oldDescriptor.set;
        }
        if (descriptor.enumerable) desc.enumerable = descriptor.enumerable;
        else if (oldDescriptor?.enumerable) desc.enumerable = oldDescriptor.enumerable;
        if (descriptor.configurable) desc.configurable = descriptor.configurable;
        else if (oldDescriptor?.configurable) desc.configurable = oldDescriptor.configurable;
        Object.defineProperty(target, prop, desc);
        return oldDescriptor;
    }
}


}),
"./src/client/dom/attr.ts": 
/*!********************************!*\
  !*** ./src/client/dom/attr.ts ***!
  \********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Trap("Element.prototype.attributes", {
        get (ctx) {
            const map = ctx.get();
            const proxy = new Proxy(map, {
                get (target, prop, _receiver) {
                    const value = Reflect.get(target, prop);
                    if (prop === "length") {
                        return Object.keys(proxy).length;
                    }
                    if (prop === "getNamedItem") {
                        return (name)=>proxy[name];
                    }
                    if (prop === "getNamedItemNS") {
                        return (namespace, name)=>proxy[`${namespace}:${name}`];
                    }
                    if (prop in NamedNodeMap.prototype && typeof value === "function") {
                        return new Proxy(value, {
                            apply (target, that, args) {
                                if (that === proxy) {
                                    return Reflect.apply(target, map, args);
                                }
                                return Reflect.apply(target, that, args);
                            }
                        });
                    }
                    if ((typeof prop === "string" || typeof prop === "number") && !isNaN(Number(prop))) {
                        const position = Object.keys(proxy)[prop];
                        return map[position];
                    }
                    if (!this.has(target, prop)) return undefined;
                    return value;
                },
                ownKeys (target) {
                    const keys = Reflect.ownKeys(target);
                    return keys.filter((key)=>this.has(target, key));
                },
                has (target, prop) {
                    if (typeof prop === "symbol") return Reflect.has(target, prop);
                    if (prop.startsWith("scramjet-attr-")) return false;
                    if (map[prop]?.name?.startsWith("scramjet-attr-")) return false;
                    return Reflect.has(target, prop);
                }
            });
            return proxy;
        }
    });
    client.Trap([
        "Attr.prototype.value",
        "Attr.prototype.nodeValue"
    ], {
        get (ctx) {
            if (ctx.this?.ownerElement) {
                return ctx.this.ownerElement.getAttribute(ctx.this.name);
            }
            return ctx.get();
        },
        set (ctx, value) {
            if (ctx.this?.ownerElement) {
                return ctx.this.ownerElement.setAttribute(ctx.this.name, value);
            }
            return ctx.set(value);
        }
    });
}


}),
"./src/client/dom/beacon.ts": 
/*!**********************************!*\
  !*** ./src/client/dom/beacon.ts ***!
  \**********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Proxy("Navigator.prototype.sendBeacon", {
        apply (ctx) {
            ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
        }
    });
}


}),
"./src/client/dom/cookie.ts": 
/*!**********************************!*\
  !*** ./src/client/dom/cookie.ts ***!
  \**********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    client.serviceWorker.addEventListener("message", ({ data })=>{
        if (!("scramjet$type" in data)) return;
        if (data.scramjet$type === "cookie") {
            client.cookieStore.setCookies([
                data.cookie
            ], new URL(data.url));
            const msg = {
                scramjet$token: data.scramjet$token,
                scramjet$type: "cookie"
            };
            client.serviceWorker.controller.postMessage(msg);
        }
    });
    client.Trap("Document.prototype.cookie", {
        get () {
            return client.cookieStore.getCookies(client.url, true);
        },
        set (ctx, value) {
            client.cookieStore.setCookies([
                value
            ], client.url);
            const controller = client.descriptors.get("ServiceWorkerContainer.prototype.controller", client.serviceWorker);
            if (controller) {
                client.natives.call("ServiceWorker.prototype.postMessage", controller, {
                    scramjet$type: "cookie",
                    cookie: value,
                    url: client.url.href
                });
            }
        }
    });
    // @ts-ignore
    delete self.cookieStore;
}


}),
"./src/client/dom/css.ts": 
/*!*******************************!*\
  !*** ./src/client/dom/css.ts ***!
  \*******************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/css */ "./src/shared/rewriters/css.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("CSSStyleDeclaration.prototype.setProperty", {
        apply (ctx) {
            if (!ctx.args[1]) return;
            ctx.args[1] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(ctx.args[1], client.meta);
        }
    });
    client.Proxy("CSSStyleDeclaration.prototype.getPropertyValue", {
        apply (ctx) {
            const v = ctx.call();
            if (!v) return v;
            ctx.return((0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.unrewriteCss)(v));
        }
    });
    client.Trap("CSSStyleDeclaration.prototype.cssText", {
        set (ctx, value) {
            ctx.set((0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(value, client.meta));
        },
        get (ctx) {
            return (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.unrewriteCss)(ctx.get());
        }
    });
    client.Proxy("CSSStyleSheet.prototype.insertRule", {
        apply (ctx) {
            ctx.args[0] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(ctx.args[0], client.meta);
        }
    });
    client.Proxy("CSSStyleSheet.prototype.replace", {
        apply (ctx) {
            ctx.args[0] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(ctx.args[0], client.meta);
        }
    });
    client.Proxy("CSSStyleSheet.prototype.replaceSync", {
        apply (ctx) {
            ctx.args[0] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(ctx.args[0], client.meta);
        }
    });
    client.Trap("CSSRule.prototype.cssText", {
        set (ctx, value) {
            ctx.set((0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(value, client.meta));
        },
        get (ctx) {
            return (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.unrewriteCss)(ctx.get());
        }
    });
    client.Proxy("CSSStyleValue.parse", {
        apply (ctx) {
            if (!ctx.args[1]) return;
            ctx.args[1] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(ctx.args[1], client.meta);
        }
    });
    client.Trap("HTMLElement.prototype.style", {
        get (ctx) {
            // unfortunate and dumb hack. we have to trap every property of this
            // since the prototype chain is fucked
            const style = ctx.get();
            return new Proxy(style, {
                get (target, prop) {
                    const value = Reflect.get(target, prop);
                    if (typeof value === "function") {
                        return new Proxy(value, {
                            apply (target, that, args) {
                                return Reflect.apply(target, style, args);
                            }
                        });
                    }
                    if (prop in CSSStyleDeclaration.prototype) return value;
                    if (!value) return value;
                    return (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.unrewriteCss)(value);
                },
                set (target, prop, value) {
                    if (prop == "cssText" || value == "" || typeof value !== "string") {
                        return Reflect.set(target, prop, value);
                    }
                    return Reflect.set(target, prop, (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(value, client.meta));
                }
            });
        },
        set (ctx, value) {
            // this will actually run the trap for cssText. don't rewrite it here
            ctx.set(value);
        }
    });
}


}),
"./src/client/dom/document.ts": 
/*!************************************!*\
  !*** ./src/client/dom/document.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/html */ "./src/shared/rewriters/html.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    const tostring = String;
    client.Proxy([
        "Document.prototype.querySelector",
        "Document.prototype.querySelectorAll"
    ], {
        apply (ctx) {
            ctx.args[0] = tostring(ctx.args[0]).replace(/((?:^|\s)\b\w+\[(?:src|href|data-href))[\^]?(=['"]?(?:https?[:])?\/\/)/, "$1*$2");
        }
    });
    client.Proxy("Document.prototype.write", {
        apply (ctx) {
            if (ctx.args[0]) try {
                ctx.args[0] = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_0__.rewriteHtml)(ctx.args[0], client.cookieStore, client.meta, false);
            } catch  {}
        }
    });
    client.Trap("Document.prototype.referrer", {
        get () {
            return client.url.toString();
        }
    });
    client.Proxy("Document.prototype.writeln", {
        apply (ctx) {
            if (ctx.args[0]) try {
                ctx.args[0] = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_0__.rewriteHtml)(ctx.args[0], client.cookieStore, client.meta, false);
            } catch  {}
        }
    });
    client.Proxy("Document.prototype.parseHTMLUnsafe", {
        apply (ctx) {
            if (ctx.args[0]) try {
                ctx.args[0] = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_0__.rewriteHtml)(ctx.args[0], client.cookieStore, client.meta, false);
            } catch  {}
        }
    });
}


}),
"./src/client/dom/element.ts": 
/*!***********************************!*\
  !*** ./src/client/dom/element.ts ***!
  \***********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _shared_htmlRules__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared/htmlRules */ "./src/shared/htmlRules.ts");
/* ESM import */var _rewriters_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/css */ "./src/shared/rewriters/css.ts");
/* ESM import */var _rewriters_html__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @rewriters/html */ "./src/shared/rewriters/html.ts");
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");
/* ESM import */var _client_index__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @client/index */ "./src/client/index.ts");







const encoder = new TextEncoder();
function bytesToBase64(bytes) {
    const binString = Array.from(bytes, (byte)=>String.fromCodePoint(byte)).join("");
    return btoa(binString);
}
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    const attrObject = {
        nonce: [
            self.HTMLElement
        ],
        integrity: [
            self.HTMLScriptElement,
            self.HTMLLinkElement
        ],
        csp: [
            self.HTMLIFrameElement
        ],
        credentialless: [
            self.HTMLIFrameElement
        ],
        src: [
            self.HTMLImageElement,
            self.HTMLMediaElement,
            self.HTMLIFrameElement,
            self.HTMLFrameElement,
            self.HTMLEmbedElement,
            self.HTMLScriptElement,
            self.HTMLSourceElement
        ],
        href: [
            self.HTMLAnchorElement,
            self.HTMLLinkElement
        ],
        data: [
            self.HTMLObjectElement
        ],
        action: [
            self.HTMLFormElement
        ],
        formaction: [
            self.HTMLButtonElement,
            self.HTMLInputElement
        ],
        srcdoc: [
            self.HTMLIFrameElement
        ],
        poster: [
            self.HTMLVideoElement
        ],
        imagesrcset: [
            self.HTMLLinkElement
        ]
    };
    const urlinterfaces = [
        self.HTMLAnchorElement.prototype,
        self.HTMLAreaElement.prototype
    ];
    const originalhrefs = [
        client.natives.call("Object.getOwnPropertyDescriptor", null, self.HTMLAnchorElement.prototype, "href"),
        client.natives.call("Object.getOwnPropertyDescriptor", null, self.HTMLAreaElement.prototype, "href")
    ];
    const attrs = Object.keys(attrObject);
    for (const attr of attrs){
        for (const element of attrObject[attr]){
            const descriptor = client.natives.call("Object.getOwnPropertyDescriptor", null, element.prototype, attr);
            Object.defineProperty(element.prototype, attr, {
                get () {
                    if ([
                        "src",
                        "data",
                        "href",
                        "action",
                        "formaction"
                    ].includes(attr)) {
                        return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_4__.unrewriteUrl)(descriptor.get.call(this));
                    }
                    return descriptor.get.call(this);
                },
                set (value) {
                    return this.setAttribute(attr, value);
                }
            });
        }
    }
    // note that href is not here
    const urlprops = [
        "protocol",
        "hash",
        "host",
        "hostname",
        "origin",
        "pathname",
        "port",
        "search"
    ];
    for (const prop of urlprops){
        for(const i in urlinterfaces){
            const target = urlinterfaces[i];
            const desc = originalhrefs[i];
            client.RawTrap(target, prop, {
                get (ctx) {
                    const href = desc.get.call(ctx.this);
                    if (!href) return href;
                    const url = new URL((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_4__.unrewriteUrl)(href));
                    return url[prop];
                }
            });
        }
    }
    client.Trap("Node.prototype.baseURI", {
        get (ctx) {
            const node = ctx.this;
            let base = node.ownerDocument?.querySelector("base");
            if (node instanceof Document) base = node.querySelector("base");
            if (base) {
                return new URL(base.href, client.url.origin).href;
            }
            return client.url.origin;
        },
        set (ctx, v) {
            return false;
        }
    });
    client.Proxy("Element.prototype.getAttribute", {
        apply (ctx) {
            const [name] = ctx.args;
            if (name.startsWith("scramjet-attr")) {
                return ctx.return(null);
            }
            if (client.natives.call("Element.prototype.hasAttribute", ctx.this, `scramjet-attr-${name}`)) {
                const attrib = ctx.fn.call(ctx.this, `scramjet-attr-${name}`);
                if (attrib === null) return ctx.return("");
                return ctx.return(attrib);
            }
        }
    });
    client.Proxy("Element.prototype.getAttributeNames", {
        apply (ctx) {
            const attrNames = ctx.call();
            const cleaned = attrNames.filter((attr)=>!attr.startsWith("scramjet-attr"));
            ctx.return(cleaned);
        }
    });
    client.Proxy("Element.prototype.getAttributeNode", {
        apply (ctx) {
            if (ctx.args[0].startsWith("scramjet-attr")) return ctx.return(null);
        }
    });
    client.Proxy("Element.prototype.hasAttribute", {
        apply (ctx) {
            if (ctx.args[0].startsWith("scramjet-attr")) return ctx.return(false);
        }
    });
    client.Proxy("Element.prototype.setAttribute", {
        apply (ctx) {
            const [name, value] = ctx.args;
            const ruleList = _shared_htmlRules__WEBPACK_IMPORTED_MODULE_0__.htmlRules.find((rule)=>{
                const r = rule[name.toLowerCase()];
                if (!r) return false;
                if (r === "*") return true;
                if (typeof r === "function") return false; // this can't happen but ts
                return r.includes(ctx.this.tagName.toLowerCase());
            });
            if (ruleList) {
                const ret = ruleList.fn(value, client.meta, client.cookieStore);
                if (ret == null) {
                    client.natives.call("Element.prototype.removeAttribute", ctx.this, name);
                    ctx.return(undefined);
                    return;
                }
                ctx.args[1] = ret;
                ctx.fn.call(ctx.this, `scramjet-attr-${ctx.args[0]}`, value);
            }
        }
    });
    // i actually need to do something with this
    client.Proxy("Element.prototype.setAttributeNode", {
        apply (_ctx) {}
    });
    client.Proxy("Element.prototype.setAttributeNS", {
        apply (ctx) {
            const [_namespace, name, value] = ctx.args;
            const ruleList = _shared_htmlRules__WEBPACK_IMPORTED_MODULE_0__.htmlRules.find((rule)=>{
                const r = rule[name.toLowerCase()];
                if (!r) return false;
                if (r === "*") return true;
                if (typeof r === "function") return false; // this can't happen but ts
                return r.includes(ctx.this.tagName.toLowerCase());
            });
            if (ruleList) {
                ctx.args[2] = ruleList.fn(value, client.meta, client.cookieStore);
                client.natives.call("Element.prototype.setAttribute", ctx.this, `scramjet-attr-${ctx.args[1]}`, value);
            }
        }
    });
    // this is separate from the regular href handlers because it returns an SVGAnimatedString
    client.Trap("SVGAnimatedString.prototype.baseVal", {
        get (ctx) {
            const href = ctx.get();
            if (!href) return href;
            return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_4__.unrewriteUrl)(href);
        },
        set (ctx, val) {
            ctx.set((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_4__.rewriteUrl)(val, client.meta));
        }
    });
    client.Trap("SVGAnimatedString.prototype.animVal", {
        get (ctx) {
            const href = ctx.get();
            if (!href) return href;
            return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_4__.unrewriteUrl)(href);
        }
    });
    client.Proxy("Element.prototype.removeAttribute", {
        apply (ctx) {
            if (ctx.args[0].startsWith("scramjet-attr")) return ctx.return(undefined);
            if (client.natives.call("Element.prototype.hasAttribute", ctx.this, ctx.args[0])) {
                ctx.fn.call(ctx.this, `scramjet-attr-${ctx.args[0]}`);
            }
        }
    });
    client.Proxy("Element.prototype.toggleAttribute", {
        apply (ctx) {
            if (ctx.args[0].startsWith("scramjet-attr")) return ctx.return(false);
            if (client.natives.call("Element.prototype.hasAttribute", ctx.this, ctx.args[0])) {
                ctx.fn.call(ctx.this, `scramjet-attr-${ctx.args[0]}`);
            }
        }
    });
    client.Trap("Element.prototype.innerHTML", {
        set (ctx, value) {
            let newval;
            if (ctx.this instanceof self.HTMLScriptElement) {
                newval = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_3__.rewriteJs)(value, "(anonymous script element)", client.meta);
                client.natives.call("Element.prototype.setAttribute", ctx.this, "scramjet-attr-script-source-src", bytesToBase64(encoder.encode(newval)));
            } else if (ctx.this instanceof self.HTMLStyleElement) {
                newval = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.rewriteCss)(value, client.meta);
            } else {
                try {
                    newval = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.rewriteHtml)(value, client.cookieStore, client.meta);
                } catch  {
                    newval = value;
                }
            }
            ctx.set(newval);
        },
        get (ctx) {
            if (ctx.this instanceof self.HTMLScriptElement) {
                const scriptSource = client.natives.call("Element.prototype.getAttribute", ctx.this, "scramjet-attr-script-source-src");
                if (scriptSource) {
                    return atob(scriptSource);
                }
                return ctx.get();
            }
            if (ctx.this instanceof self.HTMLStyleElement) {
                return ctx.get();
            }
            return (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.unrewriteHtml)(ctx.get());
        }
    });
    client.Trap("Node.prototype.textContent", {
        set (ctx, value) {
            // TODO: box the instanceofs
            if (ctx.this instanceof self.HTMLScriptElement) {
                const newval = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_3__.rewriteJs)(value, "(anonymous script element)", client.meta);
                client.natives.call("Element.prototype.setAttribute", ctx.this, "scramjet-attr-script-source-src", bytesToBase64(encoder.encode(newval)));
                return ctx.set(newval);
            } else if (ctx.this instanceof self.HTMLStyleElement) {
                return ctx.set((0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.rewriteCss)(value, client.meta));
            } else {
                return ctx.set(value);
            }
        },
        get (ctx) {
            if (ctx.this instanceof self.HTMLScriptElement) {
                const scriptSource = client.natives.call("Element.prototype.getAttribute", ctx.this, "scramjet-attr-script-source-src");
                if (scriptSource) {
                    return atob(scriptSource);
                }
                return ctx.get();
            }
            if (ctx.this instanceof self.HTMLStyleElement) {
                return (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.unrewriteCss)(ctx.get());
            }
            return ctx.get();
        }
    });
    client.Trap("Element.prototype.outerHTML", {
        set (ctx, value) {
            ctx.set((0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.rewriteHtml)(value, client.cookieStore, client.meta));
        },
        get (ctx) {
            return (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.unrewriteHtml)(ctx.get());
        }
    });
    client.Proxy("Element.prototype.setHTMLUnsafe", {
        apply (ctx) {
            try {
                ctx.args[0] = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.rewriteHtml)(ctx.args[0], client.cookieStore, client.meta, false);
            } catch  {}
        }
    });
    client.Proxy("Element.prototype.getHTML", {
        apply (ctx) {
            ctx.return((0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.unrewriteHtml)(ctx.call()));
        }
    });
    client.Proxy("Element.prototype.insertAdjacentHTML", {
        apply (ctx) {
            if (ctx.args[1]) try {
                ctx.args[1] = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.rewriteHtml)(ctx.args[1], client.cookieStore, client.meta, false);
            } catch  {}
        }
    });
    client.Proxy("Audio", {
        construct (ctx) {
            if (ctx.args[0]) ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_4__.rewriteUrl)(ctx.args[0], client.meta);
        }
    });
    client.Proxy("Text.prototype.appendData", {
        apply (ctx) {
            if (ctx.this.parentElement?.tagName === "STYLE") {
                ctx.args[0] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.rewriteCss)(ctx.args[0], client.meta);
            }
        }
    });
    client.Proxy("Text.prototype.insertData", {
        apply (ctx) {
            if (ctx.this.parentElement?.tagName === "STYLE") {
                ctx.args[1] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.rewriteCss)(ctx.args[1], client.meta);
            }
        }
    });
    client.Proxy("Text.prototype.replaceData", {
        apply (ctx) {
            if (ctx.this.parentElement?.tagName === "STYLE") {
                ctx.args[2] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.rewriteCss)(ctx.args[2], client.meta);
            }
        }
    });
    client.Trap("Text.prototype.wholeText", {
        get (ctx) {
            if (ctx.this.parentElement?.tagName === "STYLE") {
                return (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.unrewriteCss)(ctx.get());
            }
            return ctx.get();
        },
        set (ctx, v) {
            if (ctx.this.parentElement?.tagName === "STYLE") {
                return ctx.set((0,_rewriters_css__WEBPACK_IMPORTED_MODULE_1__.rewriteCss)(v, client.meta));
            }
            return ctx.set(v);
        }
    });
    client.Trap([
        "HTMLIFrameElement.prototype.contentWindow",
        "HTMLFrameElement.prototype.contentWindow",
        "HTMLObjectElement.prototype.contentWindow",
        "HTMLEmbedElement.prototype.contentWindow"
    ], {
        get (ctx) {
            const realwin = ctx.get();
            if (!realwin) return realwin;
            if (!(_symbols__WEBPACK_IMPORTED_MODULE_5__.SCRAMJETCLIENT in realwin)) {
                // hook the iframe before the client can start to steal globals out of it
                const newclient = new _client_index__WEBPACK_IMPORTED_MODULE_6__.ScramjetClient(realwin);
                newclient.hook();
            }
            return realwin;
        }
    });
    client.Trap([
        "HTMLIFrameElement.prototype.contentDocument",
        "HTMLFrameElement.prototype.contentDocument",
        "HTMLObjectElement.prototype.contentDocument",
        "HTMLEmbedElement.prototype.contentDocument"
    ], {
        get (ctx) {
            const realwin = client.descriptors.get(`${ctx.this.constructor.name}.prototype.contentWindow`, ctx.this);
            if (!realwin) return realwin;
            if (!(_symbols__WEBPACK_IMPORTED_MODULE_5__.SCRAMJETCLIENT in realwin)) {
                const newclient = new _client_index__WEBPACK_IMPORTED_MODULE_6__.ScramjetClient(realwin);
                newclient.hook();
            }
            return realwin.document;
        }
    });
    client.Proxy([
        "HTMLIFrameElement.prototype.getSVGDocument",
        "HTMLObjectElement.prototype.getSVGDocument",
        "HTMLEmbedElement.prototype.getSVGDocument"
    ], {
        apply (ctx) {
            const doc = ctx.call();
            if (doc) {
                // we trap the contentDocument, this is really the scramjet version
                return ctx.return(ctx.this.contentDocument);
            }
        }
    });
    client.Proxy("DOMParser.prototype.parseFromString", {
        apply (ctx) {
            if (ctx.args[1] === "text/html") {
                try {
                    ctx.args[0] = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_2__.rewriteHtml)(ctx.args[0], client.cookieStore, client.meta, false);
                } catch  {}
            }
        }
    });
}


}),
"./src/client/dom/fontface.ts": 
/*!************************************!*\
  !*** ./src/client/dom/fontface.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/css */ "./src/shared/rewriters/css.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Proxy("FontFace", {
        construct (ctx) {
            ctx.args[1] = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(ctx.args[1], client.meta);
        }
    });
}


}),
"./src/client/dom/fragments.ts": 
/*!*************************************!*\
  !*** ./src/client/dom/fragments.ts ***!
  \*************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/html */ "./src/shared/rewriters/html.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Proxy("Range.prototype.createContextualFragment", {
        apply (ctx) {
            ctx.args[0] = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_0__.rewriteHtml)(ctx.args[0], client.cookieStore, client.meta);
        }
    });
}


}),
"./src/client/dom/history.ts": 
/*!***********************************!*\
  !*** ./src/client/dom/history.ts ***!
  \***********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _client_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @client/events */ "./src/client/events.ts");
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");



/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Proxy([
        "History.prototype.pushState",
        "History.prototype.replaceState"
    ], {
        apply (ctx) {
            if (ctx.args[2] || ctx.args[2] === "") ctx.args[2] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[2], client.meta);
            ctx.call();
            const { constructor: { constructor: Function } } = ctx.this;
            const callerGlobalThisProxied = Function("return globalThis")();
            const callerClient = callerGlobalThisProxied[_symbols__WEBPACK_IMPORTED_MODULE_2__.SCRAMJETCLIENT];
            if (callerGlobalThisProxied.name === client.meta.topFrameName) {
                const ev = new _client_events__WEBPACK_IMPORTED_MODULE_1__.UrlChangeEvent(callerClient.url.href);
                client.frame?.dispatchEvent(ev);
            }
        }
    });
}


}),
"./src/client/dom/open.ts": 
/*!********************************!*\
  !*** ./src/client/dom/open.ts ***!
  \********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _client_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @client/index */ "./src/client/index.ts");
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");



/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("window.open", {
        apply (ctx) {
            if (ctx.args[0]) ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_2__.rewriteUrl)(ctx.args[0], client.meta);
            if (ctx.args[1] === "_top" || ctx.args[1] === "_unfencedTop") ctx.args[1] = client.meta.topFrameName;
            if (ctx.args[1] === "_parent") ctx.args[1] = client.meta.parentFrameName;
            const realwin = ctx.call();
            if (!realwin) return ctx.return(realwin);
            if (_symbols__WEBPACK_IMPORTED_MODULE_1__.SCRAMJETCLIENT in realwin) {
                return ctx.return(realwin[_symbols__WEBPACK_IMPORTED_MODULE_1__.SCRAMJETCLIENT].global);
            } else {
                const newclient = new _client_index__WEBPACK_IMPORTED_MODULE_0__.ScramjetClient(realwin);
                // hook the opened window
                newclient.hook();
                return ctx.return(newclient.global);
            }
        }
    });
    client.Trap("window.frameElement", {
        get (ctx) {
            const f = ctx.get();
            if (!f) return f;
            const win = f.ownerDocument.defaultView;
            if (win[_symbols__WEBPACK_IMPORTED_MODULE_1__.SCRAMJETCLIENT]) {
                // then this is a subframe in a scramjet context, and it's safe to pass back the real iframe
                return f;
            } else {
                // no, the top frame is outside the sandbox
                return null;
            }
        }
    });
}


}),
"./src/client/dom/origin.ts": 
/*!**********************************!*\
  !*** ./src/client/dom/origin.ts ***!
  \**********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Trap("origin", {
        get () {
            // this isn't right!!
            return client.url.origin;
        },
        set () {
            return false;
        }
    });
    client.Trap("Document.prototype.URL", {
        get () {
            return client.url.href;
        },
        set () {
            return false;
        }
    });
    client.Trap("Document.prototype.documentURI", {
        get () {
            return client.url.href;
        },
        set () {
            return false;
        }
    });
    client.Trap("Document.prototype.domain", {
        get () {
            return client.url.hostname;
        },
        set () {
            return false;
        }
    });
}


}),
"./src/client/dom/performance.ts": 
/*!***************************************!*\
  !*** ./src/client/dom/performance.ts ***!
  \***************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");


/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Trap("PerformanceEntry.prototype.name", {
        get (ctx) {
            // name is going to be a url typically
            const name = ctx.get();
            if (name && name.startsWith(location.origin + _shared__WEBPACK_IMPORTED_MODULE_1__.config.prefix)) {
                return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.unrewriteUrl)(name);
            }
            return name;
        }
    });
    const filterEntries = (entries)=>{
        return entries.filter((entry)=>{
            for (const file of Object.values(_shared__WEBPACK_IMPORTED_MODULE_1__.config.files)){
                if (entry.name.startsWith(location.origin + file)) {
                    return false;
                }
            }
            return true;
        });
    };
    client.Proxy([
        "Performance.prototype.getEntries",
        "Performance.prototype.getEntriesByType",
        "Performance.prototype.getEntriesByName",
        "PerformanceObserverEntryList.prototype.getEntries",
        "PerformanceObserverEntryList.prototype.getEntriesByType",
        "PerformanceObserverEntryList.prototype.getEntriesByName"
    ], {
        apply (ctx) {
            const entries = ctx.call();
            return ctx.return(filterEntries(entries));
        }
    });
}


}),
"./src/client/dom/protocol.ts": 
/*!************************************!*\
  !*** ./src/client/dom/protocol.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    client.Proxy("Navigator.prototype.registerProtocolHandler", {
        apply (ctx) {
            ctx.args[1] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[1], client.meta);
        }
    });
    client.Proxy("Navigator.prototype.unregisterProtocolHandler", {
        apply (ctx) {
            ctx.args[1] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[1], client.meta);
        }
    });
}


}),
"./src/client/dom/serviceworker.ts": 
/*!*****************************************!*\
  !*** ./src/client/dom/serviceworker.ts ***!
  \*****************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
  disabled: () => (disabled),
  enabled: () => (enabled),
  order: () => (order)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");


// we need a late order because we're mangling with addEventListener at a higher level
const order = 2;
const enabled = (client)=>(0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("serviceworkers", client.url);
function disabled(_client, _self) {
    Reflect.deleteProperty(Navigator.prototype, "serviceWorker");
}
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    const registrationmap = new WeakMap();
    client.Proxy("EventTarget.prototype.addEventListener", {
        apply (ctx) {
            if (registrationmap.get(ctx.this)) {
                // do nothing
                ctx.return(undefined);
            }
        }
    });
    client.Proxy("EventTarget.prototype.removeEventListener", {
        apply (ctx) {
            if (registrationmap.get(ctx.this)) {
                // do nothing
                ctx.return(undefined);
            }
        }
    });
    client.Proxy("ServiceWorkerContainer.prototype.getRegistration", {
        apply (ctx) {
            ctx.return(new Promise((resolve)=>resolve(registration)));
        }
    });
    client.Proxy("ServiceWorkerContainer.prototype.getRegistrations", {
        apply (ctx) {
            ctx.return(new Promise((resolve)=>resolve([
                    registration
                ])));
        }
    });
    client.Trap("ServiceWorkerContainer.prototype.ready", {
        get (_ctx) {
            return new Promise((resolve)=>resolve(registration));
        }
    });
    client.Trap("ServiceWorkerContainer.prototype.controller", {
        get (ctx) {
            return registration?.active;
        }
    });
    client.Proxy("ServiceWorkerContainer.prototype.register", {
        apply (ctx) {
            const fakeRegistration = new EventTarget();
            Object.setPrototypeOf(fakeRegistration, self.ServiceWorkerRegistration.prototype);
            fakeRegistration.constructor = ctx.fn;
            let url = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(ctx.args[0], client.meta) + "?dest=serviceworker";
            if (ctx.args[1] && ctx.args[1].type === "module") {
                url += "&type=module";
            }
            const worker = client.natives.construct("SharedWorker", url);
            const handle = worker.port;
            const state = {
                scope: ctx.args[0],
                active: handle
            };
            const controller = client.descriptors.get("ServiceWorkerContainer.prototype.controller", client.serviceWorker);
            client.natives.call("ServiceWorker.prototype.postMessage", controller, {
                scramjet$type: "registerServiceWorker",
                port: handle,
                origin: client.url.origin
            }, [
                handle
            ]);
            registrationmap.set(fakeRegistration, state);
            ctx.return(new Promise((resolve)=>resolve(fakeRegistration)));
        }
    });
}


}),
"./src/client/dom/storage.ts": 
/*!***********************************!*\
  !*** ./src/client/dom/storage.ts ***!
  \***********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    const handler = {
        get (target, prop) {
            switch(prop){
                case "getItem":
                    return (key)=>{
                        return target.getItem(client.url.host + "@" + key);
                    };
                case "setItem":
                    return (key, value)=>{
                        return target.setItem(client.url.host + "@" + key, value);
                    };
                case "removeItem":
                    return (key)=>{
                        return target.removeItem(client.url.host + "@" + key);
                    };
                case "clear":
                    return ()=>{
                        for(const key in Object.keys(target)){
                            if (key.startsWith(client.url.host)) {
                                target.removeItem(key);
                            }
                        }
                    };
                case "key":
                    return (index)=>{
                        const keys = Object.keys(target).filter((key)=>key.startsWith(client.url.host));
                        return target.getItem(keys[index]);
                    };
                case "length":
                    return Object.keys(target).filter((key)=>key.startsWith(client.url.host)).length;
                default:
                    if (prop in Object.prototype || typeof prop === "symbol") {
                        return Reflect.get(target, prop);
                    }
                    return target.getItem(client.url.host + "@" + prop);
            }
        },
        set (target, prop, value) {
            target.setItem(client.url.host + "@" + prop, value);
            return true;
        },
        ownKeys (target) {
            return Reflect.ownKeys(target).filter((f)=>typeof f === "string" && f.startsWith(client.url.host)).map((f)=>typeof f === "string" ? f.substring(client.url.host.length + 1) : f);
        },
        getOwnPropertyDescriptor (target, property) {
            return {
                value: target.getItem(client.url.host + "@" + property),
                enumerable: true,
                configurable: true,
                writable: true
            };
        },
        defineProperty (target, property, attributes) {
            target.setItem(client.url.host + "@" + property, attributes.value);
            return true;
        }
    };
    const realLocalStorage = self.localStorage;
    const localStorageProxy = new Proxy(self.localStorage, handler);
    const sessionStorageProxy = new Proxy(self.sessionStorage, handler);
    delete self.localStorage;
    delete self.sessionStorage;
    self.localStorage = localStorageProxy;
    self.sessionStorage = sessionStorageProxy;
}


}),
"./src/client/entry.ts": 
/*!*****************************!*\
  !*** ./src/client/entry.ts ***!
  \*****************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  isdedicated: () => (isdedicated),
  isemulatedsw: () => (isemulatedsw),
  isshared: () => (isshared),
  issw: () => (issw),
  iswindow: () => (iswindow),
  isworker: () => (isworker),
  loadAndHook: () => (loadAndHook)
});
/* ESM import */var _shared_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared/index */ "./src/shared/index.ts");
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");
/* ESM import */var _client_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @client/index */ "./src/client/index.ts");
/* ESM import */var _client_events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @client/events */ "./src/client/events.ts");
/* ESM import */var _client_swruntime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @client/swruntime */ "./src/client/swruntime.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];
// entrypoint for scramjet.client.js





const iswindow = "window" in globalThis && window instanceof Window;
const isworker = "WorkerGlobalScope" in globalThis;
const issw = "ServiceWorkerGlobalScope" in globalThis;
const isdedicated = "DedicatedWorkerGlobalScope" in globalThis;
const isshared = "SharedWorkerGlobalScope" in globalThis;
const isemulatedsw = "location" in globalThis && new URL(globalThis.location.href).searchParams.get("dest") === "serviceworker";
function createFrameId() {
    return `${Array(8).fill(0).map(()=>Math.floor(Math.random() * 36).toString(36)).join("")}`;
}
function loadAndHook(config) {
    (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.setConfig)(config);
    dbg.log("initializing scramjet client");
    // if it already exists, that means the handlers have probably already been setup by the parent document
    if (!(_symbols__WEBPACK_IMPORTED_MODULE_1__.SCRAMJETCLIENT in globalThis)) {
        (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.loadCodecs)();
        const client = new _client_index__WEBPACK_IMPORTED_MODULE_2__.ScramjetClient(globalThis);
        const frame = globalThis.frameElement;
        if (frame && !frame.name) {
            // all frames need to be named for our logic to work
            frame.name = createFrameId();
        }
        if (globalThis.COOKIE) client.loadcookies(globalThis.COOKIE);
        client.hook();
        if (isemulatedsw) {
            const runtime = new _client_swruntime__WEBPACK_IMPORTED_MODULE_4__.ScramjetServiceWorkerRuntime(client);
            runtime.hook();
        }
        const contextev = new _client_events__WEBPACK_IMPORTED_MODULE_3__.ScramjetContextEvent(client.global.window, client);
        client.frame?.dispatchEvent(contextev);
        const urlchangeev = new _client_events__WEBPACK_IMPORTED_MODULE_3__.UrlChangeEvent(client.url.href);
        if (!client.isSubframe) client.frame?.dispatchEvent(urlchangeev);
    }
    Reflect.deleteProperty(globalThis, "WASM");
    Reflect.deleteProperty(globalThis, "COOKIE");
}


}),
"./src/client/events.ts": 
/*!******************************!*\
  !*** ./src/client/events.ts ***!
  \******************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  NavigateEvent: () => (NavigateEvent),
  ScramjetContextEvent: () => (ScramjetContextEvent),
  ScramjetGlobalDownloadEvent: () => (ScramjetGlobalDownloadEvent),
  UrlChangeEvent: () => (UrlChangeEvent)
});
/**
 * Event class for proxified download interception.
 */ class ScramjetGlobalDownloadEvent extends Event {
    download;
    type = "download";
    constructor(download){
        super("download"), this.download = download;
    }
}
/**
 * Navigation event class fired when Scramjet frame navigates to a new proxified URL.
 */ class NavigateEvent extends Event {
    url;
    type = "navigate";
    constructor(url){
        super("navigate"), this.url = url;
    }
}
/**
 * URL change event class fired when the proxified URL changes in a Scramjet frame.
 */ class UrlChangeEvent extends Event {
    url;
    type = "urlchange";
    constructor(url){
        super("urlchange"), this.url = url;
    }
}
/**
 * Event class fired when Scramjet initializes in a frame.
 */ class ScramjetContextEvent extends Event {
    window;
    client;
    type = "contextInit";
    constructor(window, client){
        super("contextInit"), this.window = window, this.client = client;
    }
}


}),
"./src/client/helpers.ts": 
/*!*******************************!*\
  !*** ./src/client/helpers.ts ***!
  \*******************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  getOwnPropertyDescriptorHandler: () => (getOwnPropertyDescriptorHandler)
});
function getOwnPropertyDescriptorHandler(target, prop) {
    const realDescriptor = Reflect.getOwnPropertyDescriptor(target, prop);
    return realDescriptor;
}


}),
"./src/client/index.ts": 
/*!*****************************!*\
  !*** ./src/client/index.ts ***!
  \*****************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  NavigateEvent: () => (/* reexport safe */ _events__WEBPACK_IMPORTED_MODULE_2__.NavigateEvent),
  ScramjetClient: () => (/* reexport safe */ _client__WEBPACK_IMPORTED_MODULE_0__.ScramjetClient),
  ScramjetContextEvent: () => (/* reexport safe */ _events__WEBPACK_IMPORTED_MODULE_2__.ScramjetContextEvent),
  ScramjetGlobalDownloadEvent: () => (/* reexport safe */ _events__WEBPACK_IMPORTED_MODULE_2__.ScramjetGlobalDownloadEvent),
  ScramjetServiceWorkerRuntime: () => (/* reexport safe */ _swruntime__WEBPACK_IMPORTED_MODULE_5__.ScramjetServiceWorkerRuntime),
  UrlChangeEvent: () => (/* reexport safe */ _events__WEBPACK_IMPORTED_MODULE_2__.UrlChangeEvent),
  createLocationProxy: () => (/* reexport safe */ _location__WEBPACK_IMPORTED_MODULE_4__.createLocationProxy),
  getOwnPropertyDescriptorHandler: () => (/* reexport safe */ _helpers__WEBPACK_IMPORTED_MODULE_3__.getOwnPropertyDescriptorHandler),
  isdedicated: () => (/* reexport safe */ _entry__WEBPACK_IMPORTED_MODULE_1__.isdedicated),
  isemulatedsw: () => (/* reexport safe */ _entry__WEBPACK_IMPORTED_MODULE_1__.isemulatedsw),
  isshared: () => (/* reexport safe */ _entry__WEBPACK_IMPORTED_MODULE_1__.isshared),
  issw: () => (/* reexport safe */ _entry__WEBPACK_IMPORTED_MODULE_1__.issw),
  iswindow: () => (/* reexport safe */ _entry__WEBPACK_IMPORTED_MODULE_1__.iswindow),
  isworker: () => (/* reexport safe */ _entry__WEBPACK_IMPORTED_MODULE_1__.isworker),
  loadAndHook: () => (/* reexport safe */ _entry__WEBPACK_IMPORTED_MODULE_1__.loadAndHook)
});
/* ESM import */var _client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./client */ "./src/client/client.ts");
/* ESM import */var _entry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./entry */ "./src/client/entry.ts");
/* ESM import */var _events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./events */ "./src/client/events.ts");
/* ESM import */var _helpers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./helpers */ "./src/client/helpers.ts");
/* ESM import */var _location__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./location */ "./src/client/location.ts");
/* ESM import */var _swruntime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./swruntime */ "./src/client/swruntime.ts");
/* ESM import */var _index__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./index */ "./src/client/index.ts");










}),
"./src/client/location.ts": 
/*!********************************!*\
  !*** ./src/client/location.ts ***!
  \********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  createLocationProxy: () => (createLocationProxy)
});
/* ESM import */var _client_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @client/events */ "./src/client/events.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _client_entry__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @client/entry */ "./src/client/entry.ts");



function createLocationProxy(client, self) {
    const Location = _client_entry__WEBPACK_IMPORTED_MODULE_2__.iswindow ? self.Location : self.WorkerLocation;
    // location cannot be Proxy()d
    const fakeLocation = {};
    Object.setPrototypeOf(fakeLocation, Location.prototype);
    fakeLocation.constructor = Location;
    // for some reason it's on the object for Location and on the prototype for WorkerLocation??
    const descriptorSource = _client_entry__WEBPACK_IMPORTED_MODULE_2__.iswindow ? self.location : Location.prototype;
    const urlprops = [
        "protocol",
        "hash",
        "host",
        "hostname",
        "href",
        "origin",
        "pathname",
        "port",
        "search"
    ];
    for (const prop of urlprops){
        const native = client.natives.call("Object.getOwnPropertyDescriptor", null, descriptorSource, prop);
        if (!native) continue;
        const desc = {
            configurable: false,
            enumerable: true
        };
        if (native.get) {
            desc.get = new Proxy(native.get, {
                apply () {
                    return client.url[prop];
                }
            });
        }
        if (native.set) {
            desc.set = new Proxy(native.set, {
                apply (target, that, args) {
                    if (prop === "href") {
                        // special case
                        client.url = args[0];
                        return;
                    }
                    if (prop === "hash") {
                        self.location.hash = args[0];
                        const ev = new _client_events__WEBPACK_IMPORTED_MODULE_0__.UrlChangeEvent(client.url.href);
                        if (!client.isSubframe) client.frame?.dispatchEvent(ev);
                        return;
                    }
                    const url = new URL(client.url.href);
                    url[prop] = args[0];
                    client.url = url;
                }
            });
        }
        Object.defineProperty(fakeLocation, prop, desc);
    }
    // functions
    fakeLocation.toString = new Proxy(self.location.toString, {
        apply () {
            return client.url.href;
        }
    });
    if (self.location.valueOf) fakeLocation.valueOf = new Proxy(self.location.valueOf, {
        apply () {
            return client.url.href;
        }
    });
    if (self.location.assign) fakeLocation.assign = new Proxy(self.location.assign, {
        apply (target, that, args) {
            args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(args[0], client.meta);
            Reflect.apply(target, self.location, args);
            const urlchangeev = new _client_events__WEBPACK_IMPORTED_MODULE_0__.UrlChangeEvent(client.url.href);
            if (!client.isSubframe) client.frame?.dispatchEvent(urlchangeev);
        }
    });
    if (self.location.reload) fakeLocation.reload = new Proxy(self.location.reload, {
        apply (target, that, args) {
            Reflect.apply(target, self.location, args);
        }
    });
    if (self.location.replace) fakeLocation.replace = new Proxy(self.location.replace, {
        apply (target, that, args) {
            args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(args[0], client.meta);
            Reflect.apply(target, self.location, args);
            const urlchangeev = new _client_events__WEBPACK_IMPORTED_MODULE_0__.UrlChangeEvent(client.url.href);
            if (!client.isSubframe) client.frame?.dispatchEvent(urlchangeev);
        }
    });
    return fakeLocation;
}


}),
"./src/client/shared/antiantidebugger.ts": 
/*!***********************************************!*\
  !*** ./src/client/shared/antiantidebugger.ts ***!
  \***********************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("console.clear", {
        apply (ctx) {
            // fuck you
            ctx.return(undefined);
        }
    });
    const log = console.log;
    client.Trap("console.log", {
        set (_ctx, _v) {
        // is there a legitimate reason to let sites do this?
        },
        get (_ctx) {
            return log;
        }
    });
}


}),
"./src/client/shared/blob.ts": 
/*!***********************************!*\
  !*** ./src/client/shared/blob.ts ***!
  \***********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    // hide the origin from object urls from the page
    client.Proxy("URL.createObjectURL", {
        apply (ctx) {
            const url = ctx.call();
            if (url.startsWith("blob:")) {
                ctx.return((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteBlob)(url, client.meta));
            } else {
                ctx.return(url);
            }
        }
    });
    client.Proxy("URL.revokeObjectURL", {
        apply (ctx) {
            ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.unrewriteBlob)(ctx.args[0]);
        }
    });
}


}),
"./src/client/shared/caches.ts": 
/*!*************************************!*\
  !*** ./src/client/shared/caches.ts ***!
  \*************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Proxy("CacheStorage.prototype.open", {
        apply (ctx) {
            ctx.args[0] = `${client.url.origin}@${ctx.args[0]}`;
        }
    });
    client.Proxy("CacheStorage.prototype.has", {
        apply (ctx) {
            ctx.args[0] = `${client.url.origin}@${ctx.args[0]}`;
        }
    });
    client.Proxy("CacheStorage.prototype.match", {
        apply (ctx) {
            if (typeof ctx.args[0] === "string" || ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
            }
        }
    });
    client.Proxy("CacheStorage.prototype.delete", {
        apply (ctx) {
            ctx.args[0] = `${client.url.origin}@${ctx.args[0]}`;
        }
    });
    client.Proxy("Cache.prototype.add", {
        apply (ctx) {
            if (typeof ctx.args[0] === "string" || ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
            }
        }
    });
    client.Proxy("Cache.prototype.addAll", {
        apply (ctx) {
            for(let i = 0; i < ctx.args[0].length; i++){
                if (typeof ctx.args[0][i] === "string" || ctx.args[0][i] instanceof URL) {
                    ctx.args[0][i] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0][i], client.meta);
                }
            }
        }
    });
    client.Proxy("Cache.prototype.put", {
        apply (ctx) {
            if (typeof ctx.args[0] === "string" || ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
            }
        }
    });
    client.Proxy("Cache.prototype.match", {
        apply (ctx) {
            if (typeof ctx.args[0] === "string" || ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
            }
        }
    });
    client.Proxy("Cache.prototype.matchAll", {
        apply (ctx) {
            if (ctx.args[0] && typeof ctx.args[0] === "string" || ctx.args[0] && ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
            }
        }
    });
    client.Proxy("Cache.prototype.keys", {
        apply (ctx) {
            if (ctx.args[0] && typeof ctx.args[0] === "string" || ctx.args[0] && ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
            }
        }
    });
    client.Proxy("Cache.prototype.delete", {
        apply (ctx) {
            if (typeof ctx.args[0] === "string" || ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
            }
        }
    });
}


}),
"./src/client/shared/chrome.ts": 
/*!*************************************!*\
  !*** ./src/client/shared/chrome.ts ***!
  \*************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _client_entry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @client/entry */ "./src/client/entry.ts");
// delete all chrome specific apis, or apis that are not supported by any browser other than chrome
// these are not worth emulating and typically cause issues

// type self as any here, most of these are not defined in the types
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    const del = (name)=>{
        const split = name.split(".");
        const prop = split.pop();
        const target = split.reduce((a, b)=>a?.[b], self);
        if (!target) return;
        if (prop && prop in target) {
            delete target[prop];
        } else {}
    };
    // obviously
    // del("chrome");
    // ShapeDetector https://developer.chrome.com/docs/capabilities/shape-detection
    del("BarcodeDetector");
    del("FaceDetector");
    del("TextDetector");
    // background synchronization api
    if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.iswindow) {
        del("ServiceWorkerRegistration.prototype.sync");
    }
    if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.isemulatedsw) {
        del("SyncManager");
        del("SyncEvent");
    }
    // trustedtypes
    del("TrustedHTML");
    del("TrustedScript");
    del("TrustedScriptURL");
    del("TrustedTypePolicy");
    del("TrustedTypePolicyFactory");
    self.__defineGetter__("trustedTypes", ()=>undefined);
    // whatever this is
    del("Navigator.prototype.joinAdInterestGroup");
    if (!_client_entry__WEBPACK_IMPORTED_MODULE_0__.iswindow) return;
    // DOM specific ones below here
    del("MediaDevices.prototype.setCaptureHandleConfig");
    // web bluetooth api
    del("Navigator.prototype.bluetooth");
    del("Bluetooth");
    del("BluetoothDevice");
    del("BluetoothRemoteGATTServer");
    del("BluetoothRemoteGATTCharacteristic");
    del("BluetoothRemoteGATTDescriptor");
    del("BluetoothUUID");
    // contact picker api
    del("Navigator.prototype.contacts");
    del("ContactAddress");
    del("ContactManager");
    // Idle Detection API
    del("IdleDetector");
    // Presentation API
    del("Navigator.prototype.presentation");
    del("Presentation");
    del("PresentationConnection");
    del("PresentationReceiver");
    del("PresentationRequest");
    del("PresentationAvailability");
    del("PresentationConnectionAvailableEvent");
    del("PresentationConnectionCloseEvent");
    del("PresentationConnectionList");
    // Window Controls Overlay API
    del("WindowControlsOverlay");
    del("WindowControlsOverlayGeometryChangeEvent");
    del("Navigator.prototype.windowControlsOverlay");
    // WebHID API
    del("Navigator.prototype.hid");
    del("HID");
    del("HIDDevice");
    del("HIDConnectionEvent");
    del("HIDInputReportEvent");
    // Navigation API (not chrome only but it's really annoying to implement)
    del("navigation");
    del("NavigateEvent");
    del("NavigationActivation");
    del("NavigationCurrentEntryChangeEvent");
    del("NavigationDestination");
    del("NavigationHistoryEntry");
    del("NavigationTransition");
}


}),
"./src/client/shared/err.ts": 
/*!**********************************!*\
  !*** ./src/client/shared/err.ts ***!
  \**********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  argdbg: () => (argdbg),
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
  enabled: () => (enabled)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");

const enabled = (client)=>(0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("captureErrors", client.url);
function argdbg(arg, recurse = []) {
    switch(typeof arg){
        case "string":
            break;
        case "object":
            if (arg && arg[Symbol.iterator] && typeof arg[Symbol.iterator] === "function") for(const prop in arg){
                // make sure it's not a getter
                const desc = Object.getOwnPropertyDescriptor(arg, prop);
                if (desc && desc.get) continue;
                const ar = arg[prop];
                if (recurse.includes(ar)) continue;
                recurse.push(ar);
                argdbg(ar, recurse);
            }
            break;
    }
}
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    const warn = console.warn;
    self.$scramerr = function scramerr(e) {
        warn("CAUGHT ERROR", e);
    };
    self.$scramdbg = function scramdbg(args, t) {
        if (args && typeof args === "object" && args.length > 0) argdbg(args);
        argdbg(t);
        return t;
    };
    client.Proxy("Promise.prototype.catch", {
        apply (ctx) {
            if (ctx.args[0]) ctx.args[0] = new Proxy(ctx.args[0], {
                apply (target, that, args) {
                    // console.warn("CAUGHT PROMISE REJECTION", args);
                    Reflect.apply(target, that, args);
                }
            });
        }
    });
}


}),
"./src/client/shared/error.ts": 
/*!************************************!*\
  !*** ./src/client/shared/error.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
  enabled: () => (enabled)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");


const enabled = (client)=>(0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("cleanErrors", client.url);
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    // v8 only. all we need to do is clean the scramjet urls from stack traces
    const closure = (error, stack)=>{
        let newstack = error.stack;
        for(let i = 0; i < stack.length; i++){
            const url = stack[i].getFileName();
            try {
                if (url.endsWith(_shared__WEBPACK_IMPORTED_MODULE_0__.config.files.all)) {
                    // strip stack frames including scramjet handlers from the trace
                    const lines = newstack.split("\n");
                    const line = lines.find((l)=>l.includes(url));
                    lines.splice(line, 1);
                    newstack = lines.join("\n");
                    continue;
                }
            } catch  {}
            try {
                newstack = newstack.replaceAll(url, (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.unrewriteUrl)(url));
            } catch  {}
        }
        return newstack;
    };
    client.Trap("Error.prepareStackTrace", {
        get (_ctx) {
            // this is a funny js quirk. the getter is ran every time you type something in console
            return closure;
        },
        set (_value) {
        // just ignore it if a site tries setting their own. not much we can really do
        }
    });
}


}),
"./src/client/shared/eval.ts": 
/*!***********************************!*\
  !*** ./src/client/shared/eval.ts ***!
  \***********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
  indirectEval: () => (indirectEval)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");


/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    // used for proxying *direct eval*
    // eval("...") -> eval($scramjet$rewrite("..."))
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_0__.config.globals.rewritefn, {
        value: function(js) {
            if (typeof js !== "string") return js;
            const rewritten = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_1__.rewriteJs)(js, "(direct eval proxy)", client.meta);
            return rewritten;
        },
        writable: false,
        configurable: false
    });
}
function indirectEval(strict, js) {
    // > If the argument of eval() is not a string, eval() returns the argument unchanged
    if (typeof js !== "string") return js;
    let indirection;
    if (this.url.hostname === "accounts.google.com") {
        console.log("USING STRICT EVAL - BOTGUARD");
        indirection = new Function(`
			"use strict";
			return eval;
		`);
    } else {
        indirection = this.global.eval;
    }
    return indirection((0,_rewriters_js__WEBPACK_IMPORTED_MODULE_1__.rewriteJs)(js, "(indirect eval proxy)", this.meta));
}


}),
"./src/client/shared/event.ts": 
/*!************************************!*\
  !*** ./src/client/shared/event.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _client_entry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @client/entry */ "./src/client/entry.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _client_helpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @client/helpers */ "./src/client/helpers.ts");



const realOnEvent = Symbol.for("scramjet original onevent function");
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    const handlers = {
        message: {
            _init () {
                if (typeof this.data === "object" && "$scramjet$type" in this.data) {
                    // this is a ctl message
                    return false;
                }
                return true;
            },
            ports () {
                // don't know why i have to do this?
                return this.ports;
            },
            source () {
                if (this.source === null) return null;
                // const scram: ScramjetClient = this.source[SCRAMJETCLIENT];
                // if (scram) return scram.globalProxy;
                return this.source;
            },
            origin () {
                if (typeof this.data === "object" && "$scramjet$origin" in this.data) return this.data.$scramjet$origin;
                return client.url.origin;
            },
            data () {
                if (typeof this.data === "object" && "$scramjet$data" in this.data) return this.data.$scramjet$data;
                return this.data;
            }
        },
        hashchange: {
            oldURL () {
                return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.unrewriteUrl)(this.oldURL);
            },
            newURL () {
                return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.unrewriteUrl)(this.newURL);
            }
        },
        storage: {
            _init () {
                return this.key.startsWith(client.url.host + "@");
            },
            key () {
                return this.key.substring(this.key.indexOf("@") + 1);
            },
            url () {
                return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.unrewriteUrl)(this.url);
            }
        }
    };
    function wraplistener(listener) {
        return new Proxy(listener, {
            apply (target, that, args) {
                const realEvent = args[0];
                // we only need to handle events dispatched from the browser
                if (realEvent.isTrusted) {
                    const type = realEvent.type;
                    if (type in handlers) {
                        const handler = handlers[type];
                        if (handler._init) {
                            if (handler._init.call(realEvent) === false) return;
                        }
                        args[0] = new Proxy(realEvent, {
                            get (target, prop, reciever) {
                                const value = Reflect.get(target, prop);
                                if (prop in handler) {
                                    return handler[prop].call(target);
                                }
                                if (typeof value === "function") {
                                    return new Proxy(value, {
                                        apply (target, that, args) {
                                            if (that === reciever) {
                                                return Reflect.apply(target, realEvent, args);
                                            }
                                            return Reflect.apply(target, that, args);
                                        }
                                    });
                                }
                                return value;
                            },
                            getOwnPropertyDescriptor: _client_helpers__WEBPACK_IMPORTED_MODULE_2__.getOwnPropertyDescriptorHandler
                        });
                    }
                }
                if (!self.event) {
                    Object.defineProperty(self, "event", {
                        get () {
                            return args[0];
                        },
                        configurable: true
                    });
                }
                const rv = Reflect.apply(target, that, args);
                return rv;
            },
            getOwnPropertyDescriptor: _client_helpers__WEBPACK_IMPORTED_MODULE_2__.getOwnPropertyDescriptorHandler
        });
    }
    client.Proxy("EventTarget.prototype.addEventListener", {
        apply (ctx) {
            if (typeof ctx.args[1] !== "function") return;
            const origlistener = ctx.args[1];
            const proxylistener = wraplistener(origlistener);
            ctx.args[1] = proxylistener;
            let arr = client.eventcallbacks.get(ctx.this);
            arr ||= [];
            arr.push({
                event: ctx.args[0],
                originalCallback: origlistener,
                proxiedCallback: proxylistener
            });
            client.eventcallbacks.set(ctx.this, arr);
        }
    });
    client.Proxy("EventTarget.prototype.removeEventListener", {
        apply (ctx) {
            if (typeof ctx.args[1] !== "function") return;
            const arr = client.eventcallbacks.get(ctx.this);
            if (!arr) return;
            const i = arr.findIndex((e)=>e.event === ctx.args[0] && e.originalCallback === ctx.args[1]);
            if (i === -1) return;
            const r = arr.splice(i, 1);
            client.eventcallbacks.set(ctx.this, arr);
            ctx.args[1] = r[0].proxiedCallback;
        }
    });
    const targets = [
        self.self,
        self.MessagePort.prototype
    ];
    if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.iswindow) targets.push(self.HTMLElement.prototype);
    if (self.Worker) targets.push(self.Worker.prototype);
    for (const target of targets){
        const keys = Reflect.ownKeys(target);
        for (const key of keys){
            if (typeof key === "string" && key.startsWith("on") && handlers[key.slice(2)]) {
                const descriptor = client.natives.call("Object.getOwnPropertyDescriptor", null, target, key);
                if (!descriptor.get || !descriptor.set || !descriptor.configurable) continue;
                // these are the `onmessage`, `onclick`, etc. properties
                client.RawTrap(target, key, {
                    get (ctx) {
                        if (this[realOnEvent]) return this[realOnEvent];
                        return ctx.get();
                    },
                    set (ctx, value) {
                        this[realOnEvent] = value;
                        if (typeof value !== "function") return ctx.set(value);
                        ctx.set(wraplistener(value));
                    }
                });
            }
        }
    }
}


}),
"./src/client/shared/function.ts": 
/*!***************************************!*\
  !*** ./src/client/shared/function.ts ***!
  \***************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");

function rewriteFunction(ctx, client) {
    const stringifiedFunction = ctx.call().toString();
    const content = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_0__.rewriteJs)(`return ${stringifiedFunction}`, "(function proxy)", client.meta);
    ctx.return(ctx.fn(content)());
}
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    const handler = {
        apply (ctx) {
            rewriteFunction(ctx, client);
        },
        construct (ctx) {
            rewriteFunction(ctx, client);
        }
    };
    client.Proxy("Function", handler);
    const RawFunction = client.natives.call("eval", null, "(function () {})").constructor;
    const RawAsyncFunction = client.natives.call("eval", null, "(async function () {})").constructor;
    const RawGeneratorFunction = client.natives.call("eval", null, "(function* () {})").constructor;
    const RawAsyncGeneratorFunction = client.natives.call("eval", null, "(async function* () {})").constructor;
    client.RawProxy(RawFunction.prototype, "constructor", handler);
    client.RawProxy(RawAsyncFunction.prototype, "constructor", handler);
    client.RawProxy(RawGeneratorFunction.prototype, "constructor", handler);
    client.RawProxy(RawAsyncGeneratorFunction.prototype, "constructor", handler);
}


}),
"./src/client/shared/import.ts": 
/*!*************************************!*\
  !*** ./src/client/shared/import.ts ***!
  \*************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");


/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    const boundimport = client.natives.call("Function", null, "url", "return import(url)");
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_0__.config.globals.importfn, {
        value: function(base, url) {
            const resolved = new URL(url, base).href;
            if (url.includes(":") || url.startsWith("/") || url.startsWith(".") || url.startsWith("..")) {
                // this is a url
                return boundimport(`${(0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(resolved, client.meta)}?type=module`);
            } else {
                // this is a specifier handled by importmaps
                return boundimport(url);
            }
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_0__.config.globals.metafn, {
        value: function(metaobj, base) {
            metaobj.url = base;
            metaobj.resolve = function(url) {
                return new URL(url, base).href;
            };
            return metaobj;
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
}


}),
"./src/client/shared/indexeddb.ts": 
/*!****************************************!*\
  !*** ./src/client/shared/indexeddb.ts ***!
  \****************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("IDBFactory.prototype.open", {
        apply (ctx) {
            ctx.args[0] = `${client.url.origin}@${ctx.args[0]}`;
        }
    });
    client.Trap("IDBDatabase.prototype.name", {
        get (ctx) {
            const name = ctx.get();
            return name.substring(name.indexOf("@") + 1);
        }
    });
}


}),
"./src/client/shared/opfs.ts": 
/*!***********************************!*\
  !*** ./src/client/shared/opfs.ts ***!
  \***********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("StorageManager.prototype.getDirectory", {
        apply (ctx) {
            const rootPromise = ctx.call();
            ctx.return((async ()=>{
                const root = await rootPromise;
                const directory = await root.getDirectoryHandle(`${client.url.origin.replace(/\/|\s|\./g, "-")}`, {
                    create: true
                });
                Object.defineProperty(directory, "name", {
                    value: "",
                    writable: false
                });
                return directory;
            })());
        }
    });
}


}),
"./src/client/shared/postmessage.ts": 
/*!******************************************!*\
  !*** ./src/client/shared/postmessage.ts ***!
  \******************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _client_entry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @client/entry */ "./src/client/entry.ts");
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");
/* ESM import */var _client_shared_realm__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @client/shared/realm */ "./src/client/shared/realm.ts");



/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.iswindow) client.Proxy("window.postMessage", {
        apply (ctx) {
            // so we need to send the real origin here, since the recieving window can't possibly know.
            // except, remember that this code is being ran in a different realm than the invoker, so if we ask our `client` it may give us the wrong origin
            // if we were given any object that came from the real realm we can use that to get the real origin
            // and this works in every case EXCEPT for the fact that all three arguments can be strings which are copied instead of cloned
            // so we have to use `$setrealm` which will pollute this with an object from the real realm
            let pollutant;
            if (typeof ctx.args[0] === "object" && ctx.args[0] !== null) {
                pollutant = ctx.args[0]; // try to use the first object we can find because it's more reliable
            } else if (typeof ctx.args[2] === "object" && ctx.args[2] !== null) {
                pollutant = ctx.args[2]; // next try to use transfer
            } else if (ctx.this && _client_shared_realm__WEBPACK_IMPORTED_MODULE_2__.POLLUTANT in ctx.this && typeof ctx.this[_client_shared_realm__WEBPACK_IMPORTED_MODULE_2__.POLLUTANT] === "object" && ctx.this[_client_shared_realm__WEBPACK_IMPORTED_MODULE_2__.POLLUTANT] !== null) {
                pollutant = ctx.this[_client_shared_realm__WEBPACK_IMPORTED_MODULE_2__.POLLUTANT]; // lastly try to use the object from $setrealm
            } else {
                pollutant = {}; // give up
            }
            // and now we can steal Function from the caller's realm
            const { constructor: { constructor: Function } } = pollutant;
            // invoking stolen function will give us the caller's globalThis, remember scramjet has already proxied it!!!
            const callerGlobalThisProxied = Function("return globalThis")();
            const callerClient = callerGlobalThisProxied[_symbols__WEBPACK_IMPORTED_MODULE_1__.SCRAMJETCLIENT];
            // this WOULD be enough but the source argument of MessageEvent has to return the caller's window
            // and if we just call it normally it would be coming from here, which WILL NOT BE THE CALLER'S because the accessor is from the parent
            // so with the stolen function we wrap postmessage so the source will truly be the caller's window (remember that function is scramjet's!!!)
            const wrappedPostMessage = Function("...args", "this(...args)");
            ctx.args[0] = {
                $scramjet$messagetype: "window",
                $scramjet$origin: callerClient.url.origin,
                $scramjet$data: ctx.args[0]
            };
            // * origin because obviously
            if (typeof ctx.args[1] === "string") ctx.args[1] = "*";
            if (typeof ctx.args[1] === "object") ctx.args[1].targetOrigin = "*";
            ctx.return(wrappedPostMessage.call(ctx.fn, ...ctx.args));
        }
    });
    const toproxy = [
        "MessagePort.prototype.postMessage"
    ];
    if (self.Worker) toproxy.push("Worker.prototype.postMessage");
    if (!_client_entry__WEBPACK_IMPORTED_MODULE_0__.iswindow) toproxy.push("self.postMessage"); // only do the generic version if we're in a worker
    client.Proxy(toproxy, {
        apply (ctx) {
            // origin/source doesn't need to be preserved - it's null in the message event
            ctx.args[0] = {
                $scramjet$messagetype: "worker",
                $scramjet$data: ctx.args[0]
            };
        }
    });
}


}),
"./src/client/shared/realm.ts": 
/*!************************************!*\
  !*** ./src/client/shared/realm.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  POLLUTANT: () => (POLLUTANT),
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");

const POLLUTANT = Symbol.for("scramjet realm pollutant");
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    // object.$setrealm({}).postMessage(...)
    // the empty object is the "pollutant" which can reconstruct the real realm
    // i explain more in postmessage.ts
    Object.defineProperty(self.Object.prototype, _shared__WEBPACK_IMPORTED_MODULE_0__.config.globals.setrealmfn, {
        value (pollution) {
            // this is bad!! sites could detect this
            Object.defineProperty(this, POLLUTANT, {
                value: pollution,
                writable: false,
                configurable: true,
                enumerable: false
            });
            return this;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}


}),
"./src/client/shared/requests/eventsource.ts": 
/*!***************************************************!*\
  !*** ./src/client/shared/requests/eventsource.ts ***!
  \***************************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("EventSource", {
        construct (ctx) {
            ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[0], client.meta);
        }
    });
    client.Trap("EventSource.prototype.url", {
        get (ctx) {
            (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.unrewriteUrl)(ctx.get());
        }
    });
}


}),
"./src/client/shared/requests/fetch.ts": 
/*!*********************************************!*\
  !*** ./src/client/shared/requests/fetch.ts ***!
  \*********************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _client_entry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @client/entry */ "./src/client/entry.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");


/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("fetch", {
        apply (ctx) {
            if (typeof ctx.args[0] === "string" || ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(ctx.args[0], client.meta);
                if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.isemulatedsw) ctx.args[0] += "?from=swruntime";
            }
        }
    });
    client.Proxy("Request", {
        construct (ctx) {
            if (typeof ctx.args[0] === "string" || ctx.args[0] instanceof URL) {
                ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(ctx.args[0], client.meta);
                if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.isemulatedsw) ctx.args[0] += "?from=swruntime";
            }
        }
    });
    client.Trap("Response.prototype.url", {
        get (ctx) {
            return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.unrewriteUrl)(ctx.get());
        }
    });
    client.Trap("Request.prototype.url", {
        get (ctx) {
            return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.unrewriteUrl)(ctx.get());
        }
    });
}


}),
"./src/client/shared/requests/websocket.ts": 
/*!*************************************************!*\
  !*** ./src/client/shared/requests/websocket.ts ***!
  \*************************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    const socketmap = new WeakMap();
    const socketstreammap = new WeakMap();
    client.Proxy("WebSocket", {
        construct (ctx) {
            const fakeWebSocket = new EventTarget();
            Object.setPrototypeOf(fakeWebSocket, ctx.fn.prototype);
            fakeWebSocket.constructor = ctx.fn;
            const trustEvent = (ev)=>new Proxy(ev, {
                    get (target, prop) {
                        if (prop === "isTrusted") return true;
                        return Reflect.get(target, prop);
                    }
                });
            const barews = client.bare.createWebSocket(ctx.args[0], ctx.args[1], null, {
                "User-Agent": self.navigator.userAgent,
                Origin: client.url.origin
            });
            const state = {
                extensions: "",
                protocol: "",
                url: ctx.args[0],
                binaryType: "blob",
                barews,
                onclose: null,
                onerror: null,
                onmessage: null,
                onopen: null
            };
            function fakeEventSend(fakeev) {
                state["on" + fakeev.type]?.(trustEvent(fakeev));
                fakeWebSocket.dispatchEvent(fakeev);
            }
            barews.addEventListener("open", ()=>{
                fakeEventSend(new Event("open"));
            });
            barews.addEventListener("close", (ev)=>{
                fakeEventSend(new CloseEvent("close", ev));
            });
            barews.addEventListener("message", async (ev)=>{
                let payload = ev.data;
                if (typeof payload === "string") {
                // DO NOTHING
                } else if ("byteLength" in payload) {
                    // arraybuffer, convert to blob if needed or set the proper prototype
                    if (state.binaryType === "blob") {
                        payload = new Blob([
                            payload
                        ]);
                    } else {
                        Object.setPrototypeOf(payload, ArrayBuffer.prototype);
                    }
                } else if ("arrayBuffer" in payload) {
                    // blob, convert to arraybuffer if neccesary.
                    if (state.binaryType === "arraybuffer") {
                        payload = await payload.arrayBuffer();
                        Object.setPrototypeOf(payload, ArrayBuffer.prototype);
                    }
                }
                const fakeev = new MessageEvent("message", {
                    data: payload,
                    origin: ev.origin,
                    lastEventId: ev.lastEventId,
                    source: ev.source,
                    ports: ev.ports
                });
                fakeEventSend(fakeev);
            });
            barews.addEventListener("error", ()=>{
                fakeEventSend(new Event("error"));
            });
            socketmap.set(fakeWebSocket, state);
            ctx.return(fakeWebSocket);
        }
    });
    client.Trap("WebSocket.prototype.binaryType", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.binaryType;
        },
        set (ctx, v) {
            const ws = socketmap.get(ctx.this);
            if (v === "blob" || v === "arraybuffer") ws.binaryType = v;
        }
    });
    client.Trap("WebSocket.prototype.bufferedAmount", {
        get () {
            return 0;
        }
    });
    client.Trap("WebSocket.prototype.extensions", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.extensions;
        }
    });
    client.Trap("WebSocket.prototype.onclose", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.onclose;
        },
        set (ctx, v) {
            const ws = socketmap.get(ctx.this);
            ws.onclose = v;
        }
    });
    client.Trap("WebSocket.prototype.onerror", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.onerror;
        },
        set (ctx, v) {
            const ws = socketmap.get(ctx.this);
            ws.onerror = v;
        }
    });
    client.Trap("WebSocket.prototype.onmessage", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.onmessage;
        },
        set (ctx, v) {
            const ws = socketmap.get(ctx.this);
            ws.onmessage = v;
        }
    });
    client.Trap("WebSocket.prototype.onopen", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.onopen;
        },
        set (ctx, v) {
            const ws = socketmap.get(ctx.this);
            ws.onopen = v;
        }
    });
    client.Trap("WebSocket.prototype.url", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.url;
        }
    });
    client.Trap("WebSocket.prototype.protocol", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.protocol;
        }
    });
    client.Trap("WebSocket.prototype.readyState", {
        get (ctx) {
            const ws = socketmap.get(ctx.this);
            return ws.barews.readyState;
        }
    });
    client.Proxy("WebSocket.prototype.send", {
        apply (ctx) {
            const ws = socketmap.get(ctx.this);
            ctx.return(ws.barews.send(ctx.args[0]));
        }
    });
    client.Proxy("WebSocket.prototype.close", {
        apply (ctx) {
            const ws = socketmap.get(ctx.this);
            if (ctx.args[0] === undefined) ctx.args[0] = 1000;
            if (ctx.args[1] === undefined) ctx.args[1] = "";
            ctx.return(ws.barews.close(ctx.args[0], ctx.args[1]));
        }
    });
    client.Proxy("WebSocketStream", {
        construct (ctx) {
            const fakeWebSocket = {};
            Object.setPrototypeOf(fakeWebSocket, ctx.fn.prototype);
            fakeWebSocket.constructor = ctx.fn;
            const barews = client.bare.createWebSocket(ctx.args[0], ctx.args[1], null, {
                "User-Agent": self.navigator.userAgent,
                Origin: client.url.origin
            });
            ctx.args[1]?.signal.addEventListener("abort", ()=>{
                barews.close(1000, "");
            });
            let openResolver, closeResolver;
            let openRejector;
            const state = {
                extensions: "",
                protocol: "",
                url: ctx.args[0],
                barews,
                opened: new Promise((resolve, reject)=>{
                    openResolver = resolve;
                    openRejector = reject;
                }),
                closed: new Promise((resolve)=>{
                    closeResolver = resolve;
                }),
                readable: new ReadableStream({
                    start (controller) {
                        barews.addEventListener("message", async (ev)=>{
                            let payload = ev.data;
                            if (typeof payload === "string") {
                            // DO NOTHING
                            } else if ("byteLength" in payload) {
                                // arraybuffer, set the realms prototype so its recognized
                                Object.setPrototypeOf(payload, ArrayBuffer.prototype);
                            } else if ("arrayBuffer" in payload) {
                                // blob, convert to arraybuffer
                                payload = await payload.arrayBuffer();
                                Object.setPrototypeOf(payload, ArrayBuffer.prototype);
                            }
                            controller.enqueue(payload);
                        });
                    }
                }),
                writable: new WritableStream({
                    write (chunk) {
                        barews.send(chunk);
                    }
                })
            };
            barews.addEventListener("open", ()=>{
                openResolver({
                    readable: state.readable,
                    writable: state.writable,
                    extensions: state.extensions,
                    protocol: state.protocol
                });
            });
            barews.addEventListener("close", (ev)=>{
                closeResolver({
                    code: ev.code,
                    reason: ev.reason
                });
            });
            barews.addEventListener("error", (ev)=>{
                openRejector(ev);
            });
            socketstreammap.set(fakeWebSocket, state);
            ctx.return(fakeWebSocket);
        }
    });
    client.Trap("WebSocketStream.prototype.closed", {
        get (ctx) {
            const ws = socketstreammap.get(ctx.this);
            return ws.closed;
        }
    });
    client.Trap("WebSocketStream.prototype.opened", {
        get (ctx) {
            const ws = socketstreammap.get(ctx.this);
            return ws.opened;
        }
    });
    client.Trap("WebSocketStream.prototype.url", {
        get (ctx) {
            const ws = socketstreammap.get(ctx.this);
            return ws.url;
        }
    });
    client.Proxy("WebSocketStream.prototype.close", {
        apply (ctx) {
            const ws = socketstreammap.get(ctx.this);
            if (ctx.args[0]) {
                if (ctx.args[0].closeCode === undefined) ctx.args[0].closeCode = 1000;
                if (ctx.args[0].reason === undefined) ctx.args[0].reason = "";
                return ctx.return(ws.barews.close(ctx.args[0].closeCode, ctx.args[0].reason));
            }
            return ctx.return(ws.barews.close(1000, ""));
        }
    });
}


}),
"./src/client/shared/requests/xmlhttprequest.ts": 
/*!******************************************************!*\
  !*** ./src/client/shared/requests/xmlhttprequest.ts ***!
  \******************************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");


/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    let worker;
    if (self.Worker && (0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("syncxhr", client.url)) {
        worker = client.natives.construct("Worker", _shared__WEBPACK_IMPORTED_MODULE_0__.config.files.sync);
    }
    const ARGS = Symbol("xhr original args");
    const HEADERS = Symbol("xhr headers");
    client.Proxy("XMLHttpRequest.prototype.open", {
        apply (ctx) {
            if (ctx.args[1]) ctx.args[1] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(ctx.args[1], client.meta);
            if (ctx.args[2] === undefined) ctx.args[2] = true;
            ctx.this[ARGS] = ctx.args;
        }
    });
    client.Proxy("XMLHttpRequest.prototype.setRequestHeader", {
        apply (ctx) {
            const headers = ctx.this[HEADERS] || (ctx.this[HEADERS] = {});
            headers[ctx.args[0]] = ctx.args[1];
        }
    });
    client.Proxy("XMLHttpRequest.prototype.send", {
        apply (ctx) {
            const args = ctx.this[ARGS];
            if (!args || args[2]) return;
            if (!(0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("syncxhr", client.url)) {
                console.warn("ignoring request - sync xhr disabled in flags");
                return ctx.return(undefined);
            }
            // it's a sync request
            // sync xhr to service worker is not supported
            // there's a nice way of polyfilling this though, we can spin on an atomic using sharedarraybuffer. this will maintain the sync behavior
            //@ts-ignore
            const sab = new SharedArrayBuffer(1024, {
                maxByteLength: 2147483647
            });
            const view = new DataView(sab);
            client.natives.call("Worker.prototype.postMessage", worker, {
                sab,
                args,
                headers: ctx.this[HEADERS],
                body: ctx.args[0]
            });
            const now = performance.now();
            while(view.getUint8(0) === 0){
                if (performance.now() - now > 1000) {
                    throw new Error("xhr timeout");
                }
            /* spin */ }
            const status = view.getUint16(1);
            const headersLength = view.getUint32(3);
            const headersab = new Uint8Array(headersLength);
            headersab.set(new Uint8Array(sab.slice(7, 7 + headersLength)));
            const headers = new TextDecoder().decode(headersab);
            const bodyLength = view.getUint32(7 + headersLength);
            const bodyab = new Uint8Array(bodyLength);
            bodyab.set(new Uint8Array(sab.slice(11 + headersLength, 11 + headersLength + bodyLength)));
            const body = new TextDecoder().decode(bodyab);
            // these should be using proxies to not leak scram strings but who cares
            client.RawTrap(ctx.this, "status", {
                get () {
                    return status;
                }
            });
            client.RawTrap(ctx.this, "responseText", {
                get () {
                    return body;
                }
            });
            client.RawTrap(ctx.this, "response", {
                get () {
                    if (ctx.this.responseType === "arraybuffer") return bodyab.buffer;
                    return body;
                }
            });
            client.RawTrap(ctx.this, "responseXML", {
                get () {
                    const parser = new DOMParser();
                    return parser.parseFromString(body, "text/xml");
                }
            });
            client.RawTrap(ctx.this, "getAllResponseHeaders", {
                get () {
                    return ()=>headers;
                }
            });
            client.RawTrap(ctx.this, "getResponseHeader", {
                get () {
                    return (header)=>{
                        const re = new RegExp(`^${header}: (.*)$`, "m");
                        const match = re.exec(headers);
                        return match ? match[1] : null;
                    };
                }
            });
            // send has no return value right
            ctx.return(undefined);
        }
    });
    client.Trap("XMLHttpRequest.prototype.responseURL", {
        get (ctx) {
            return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.unrewriteUrl)(ctx.get());
        }
    });
}


}),
"./src/client/shared/settimeout.ts": 
/*!*****************************************!*\
  !*** ./src/client/shared/settimeout.ts ***!
  \*****************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    client.Proxy([
        "setTimeout",
        "setInterval"
    ], {
        apply (ctx) {
            if (ctx.args.length > 0 && typeof ctx.args[0] === "string") {
                ctx.args[0] = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_0__.rewriteJs)(ctx.args[0], "(setTimeout string eval)", client.meta);
            }
        }
    });
}


}),
"./src/client/shared/sourcemaps.ts": 
/*!*****************************************!*\
  !*** ./src/client/shared/sourcemaps.ts ***!
  \*****************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
  enabled: () => (enabled)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];

var RewriteType = /*#__PURE__*/ function(RewriteType) {
    RewriteType[RewriteType["Insert"] = 0] = "Insert";
    RewriteType[RewriteType["Replace"] = 1] = "Replace";
    return RewriteType;
}(RewriteType || {});
function getEnd(rewrite) {
    if (rewrite.type === 0) {
        return rewrite.start + rewrite.size;
    } else if (rewrite.type === 1) {
        return rewrite.end;
    }
    throw "unreachable";
}
function registerRewrites(client, buf, tag) {
    const sourcemap = Uint8Array.from(buf);
    const view = new DataView(sourcemap.buffer);
    const decoder = new TextDecoder("utf-8");
    const rewrites = [];
    const rewritelen = view.getUint32(0, true);
    let cursor = 4;
    for(let i = 0; i < rewritelen; i++){
        const start = view.getUint32(cursor, true);
        cursor += 4;
        const size = view.getUint32(cursor, true);
        cursor += 4;
        const type = view.getUint8(cursor);
        cursor += 1;
        if (type == 0) {
            rewrites.push({
                type,
                start,
                size
            });
        } else if (type == 1) {
            const end = start + size;
            const oldLen = view.getUint32(cursor, true);
            cursor += 4;
            const oldStr = decoder.decode(sourcemap.subarray(cursor, cursor + oldLen));
            rewrites.push({
                type,
                start,
                end,
                str: oldStr
            });
        }
    }
    client.box.sourcemaps[tag] = rewrites;
}
const SCRAMTAG = "/*scramtag ";
function extractTag(fn) {
    // every function rewritten will have a scramtag comment
    // it will look like this:
    // function name()[possible whitespace]/*scramtag [index] [tag]*/[possible whitespace]{ ... }
    let start = fn.indexOf(SCRAMTAG);
    // no scramtag, probably native function or stolen from scramjet
    if (start === -1) return null;
    const end = fn.indexOf("*/", start);
    if (end === -1) {
        console.log(fn, start, end);
        throw new Error("unreachable");
    }
    let tag = fn.substring(start + 2, end).split(" ");
    if (tag.length !== 3 || tag[0] !== "scramtag" || !Number.isSafeInteger(+tag[1])) {
        console.log(fn, start, end, tag);
        throw new Error("invalid tag");
    }
    return [
        tag[2],
        start,
        +tag[1]
    ];
}
function doUnrewrite(client, ctx) {
    const stringified = ctx.fn.call(ctx.this);
    const extracted = extractTag(stringified);
    if (!extracted) return ctx.return(stringified);
    const [tag, tagOffset, tagStart] = extracted;
    const fnStart = tagStart - tagOffset;
    const fnEnd = fnStart + stringified.length;
    const rewrites = client.box.sourcemaps[tag];
    if (!rewrites) {
        console.warn("failed to get rewrites for tag", tag);
        return ctx.return(stringified);
    }
    let i = 0;
    // skip all rewrites in the file before the fn
    while(i < rewrites.length){
        if (rewrites[i].start < fnStart) i++;
        else break;
    }
    let end = i;
    while(end < rewrites.length){
        if (getEnd(rewrites[end]) < fnEnd) end++;
        else break;
    }
    const fnrewrites = rewrites.slice(i, end);
    let newString = "";
    let lastpos = 0;
    for (const rewrite of fnrewrites){
        newString += stringified.slice(lastpos, rewrite.start - fnStart);
        if (rewrite.type === 0) {
            lastpos = rewrite.start + rewrite.size - fnStart;
        } else if (rewrite.type === 1) {
            newString += rewrite.str;
            lastpos = rewrite.end - fnStart;
        } else {
            throw "unreachable";
        }
    }
    newString += stringified.slice(lastpos);
    newString = newString.replace(`${SCRAMTAG}${tagStart} ${tag}*/`, "");
    return ctx.return(newString);
}
const enabled = (client)=>(0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("sourcemaps", client.url);
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    // every script will push a sourcemap
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_0__.config.globals.pushsourcemapfn, {
        value: (buf, tag)=>{
            const before = performance.now();
            registerRewrites(client, buf, tag);
            dbg.time(client.meta, before, `scramtag parse for ${tag}`);
        },
        enumerable: false,
        writable: false,
        configurable: false
    });
    // when we rewrite javascript it will make function.toString leak internals
    // this can lead to double rewrites which is bad
    client.Proxy("Function.prototype.toString", {
        apply (ctx) {
            const before = performance.now();
            doUnrewrite(client, ctx);
        // dbg.time(client.meta, before, `scramtag unrewrite for ${ctx.fn.name}`);
        }
    });
}


}),
"./src/client/shared/worker.ts": 
/*!*************************************!*\
  !*** ./src/client/shared/worker.ts ***!
  \*************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @mercuryworkshop/bare-mux */ "./node_modules/.pnpm/@mercuryworkshop+bare-mux@2.1.7/node_modules/@mercuryworkshop/bare-mux/dist/index.mjs");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");


/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, _self) {
    client.Proxy("Worker", {
        construct (ctx) {
            ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(ctx.args[0], client.meta) + "?dest=worker";
            if (ctx.args[1] && ctx.args[1].type === "module") {
                ctx.args[0] += "&type=module";
            }
            const worker = ctx.call();
            const conn = new _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_0__.BareMuxConnection();
            (async ()=>{
                const port = await conn.getInnerPort();
                client.natives.call("Worker.prototype.postMessage", worker, {
                    $scramjet$type: "baremuxinit",
                    port
                }, [
                    port
                ]);
            })();
        }
    });
    // sharedworkers can only be constructed from window
    client.Proxy("SharedWorker", {
        construct (ctx) {
            ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(ctx.args[0], client.meta) + "?dest=sharedworker";
            if (ctx.args[1] && typeof ctx.args[1] === "string") ctx.args[1] = `${client.url.origin}@${ctx.args[1]}`;
            if (ctx.args[1] && typeof ctx.args[1] === "object") {
                if (ctx.args[1].type === "module") {
                    ctx.args[0] += "&type=module";
                }
                if (ctx.args[1].name) {
                    ctx.args[1].name = `${client.url.origin}@${ctx.args[1].name}`;
                }
            }
            const worker = ctx.call();
            const conn = new _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_0__.BareMuxConnection();
            (async ()=>{
                const port = await conn.getInnerPort();
                client.natives.call("MessagePort.prototype.postMessage", worker.port, {
                    $scramjet$type: "baremuxinit",
                    port
                }, [
                    port
                ]);
            })();
        }
    });
    client.Proxy("Worklet.prototype.addModule", {
        apply (ctx) {
            if (ctx.args[0]) ctx.args[0] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_1__.rewriteUrl)(ctx.args[0], client.meta) + "?dest=worklet";
        }
    });
}


}),
"./src/client/shared/wrap.ts": 
/*!***********************************!*\
  !*** ./src/client/shared/wrap.ts ***!
  \***********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  createWrapFn: () => (createWrapFn),
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
  order: () => (order)
});
/* ESM import */var _client_entry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @client/entry */ "./src/client/entry.ts");
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _client_shared_eval__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @client/shared/eval */ "./src/client/shared/eval.ts");



// import { argdbg } from "@client/shared/err";

function createWrapFn(client, self) {
    return function(identifier, strict) {
        if (identifier === self.location) return client.locationProxy;
        if (identifier === self.eval) return _client_shared_eval__WEBPACK_IMPORTED_MODULE_3__.indirectEval.bind(client, strict);
        if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.iswindow) {
            if (identifier === self.parent) {
                if (_symbols__WEBPACK_IMPORTED_MODULE_1__.SCRAMJETCLIENT in self.parent) {
                    // ... then we're in a subframe, and the parent frame is also in a proxy context, so we should return its proxy
                    return self.parent;
                } else {
                    // ... then we should pretend we aren't nested and return the current window
                    return self;
                }
            } else if (identifier === self.top) {
                // instead of returning top, we need to return the uppermost parent that's inside a scramjet context
                let current = self;
                for(;;){
                    const test = current.parent.self;
                    if (test === current) break; // there is no parent, actual or emulated.
                    // ... then `test` represents a window outside of the proxy context, and therefore `current` is the topmost window in the proxy context
                    if (!(_symbols__WEBPACK_IMPORTED_MODULE_1__.SCRAMJETCLIENT in test)) break;
                    // test is also insde a proxy, so we should continue up the chain
                    current = test;
                }
                return current;
            }
        }
        return identifier;
    };
}
const order = 4;
/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client, self) {
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.wrapfn, {
        value: client.wrapfn,
        writable: false,
        configurable: false,
        enumerable: false
    });
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.wrappropertyfn, {
        value: function(str) {
            if (str === "location" || str === "parent" || str === "top" || str === "eval") return _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.wrappropertybase + str;
            return str;
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.cleanrestfn, {
        value: function(obj) {
        // TODO
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
    Object.defineProperty(self.Object.prototype, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.wrappropertybase + "location", {
        get: function() {
            // if (this.location.constructor.toString().includes("Location")) {
            if (this === self || this === self.document) {
                return client.locationProxy;
            }
            return this.location;
        },
        set (value) {
            if (this === self || this === self.document) {
                client.url = value;
                return;
            }
            this.location = value;
        },
        configurable: false,
        enumerable: false
    });
    Object.defineProperty(self.Object.prototype, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.wrappropertybase + "parent", {
        get: function() {
            return client.wrapfn(this.parent, false);
        },
        set (value) {
            // i guess??
            this.parent = value;
        },
        configurable: false,
        enumerable: false
    });
    Object.defineProperty(self.Object.prototype, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.wrappropertybase + "top", {
        get: function() {
            return client.wrapfn(this.top, false);
        },
        set (value) {
            this.top = value;
        },
        configurable: false,
        enumerable: false
    });
    Object.defineProperty(self.Object.prototype, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.wrappropertybase + "eval", {
        get: function() {
            return client.wrapfn(this.eval, true);
        },
        set (value) {
            this.eval = value;
        },
        configurable: false,
        enumerable: false
    });
    self.$scramitize = function(v) {
        if (v === location) debugger;
        if (_client_entry__WEBPACK_IMPORTED_MODULE_0__.iswindow) {
            // if (v === self.parent) debugger;
            if (v === self.top) debugger;
        }
        if (typeof v === "string" && v.includes("scramjet")) debugger;
        if (typeof v === "string" && v.includes(location.origin)) debugger;
        return v;
    };
    // location = "..." can't be rewritten as wrapfn(location) = ..., so instead it will actually be rewritten as
    // ((t)=>$scramjet$tryset(location,"+=",t)||location+=t)(...);
    // it has to be a discrete function because there's always the possibility that "location" is a local variable
    // we have to use an IIFE to avoid duplicating side-effects in the getter
    Object.defineProperty(self, _shared__WEBPACK_IMPORTED_MODULE_2__.config.globals.trysetfn, {
        value: function(lhs, op, rhs) {
            // TODO: not cross frame safe
            if (lhs instanceof self.Location) {
                // @ts-ignore
                client.locationProxy.href = rhs;
                return true;
            }
            return false;
        },
        writable: false,
        configurable: false
    });
}


}),
"./src/client/singletonbox.ts": 
/*!************************************!*\
  !*** ./src/client/singletonbox.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  SingletonBox: () => (SingletonBox)
});
class SingletonBox {
    ownerclient;
    clients = [];
    globals = new Map();
    documents = new Map();
    locations = new Map();
    sourcemaps = {};
    constructor(ownerclient){
        this.ownerclient = ownerclient;
    }
    registerClient(client, global) {
        this.clients.push(client);
        this.globals.set(global, client);
        this.documents.set(global.document, client);
        this.locations.set(global.location, client);
    }
}


}),
"./src/client/swruntime.ts": 
/*!*********************************!*\
  !*** ./src/client/swruntime.ts ***!
  \*********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ScramjetServiceWorkerRuntime: () => (ScramjetServiceWorkerRuntime)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];

class ScramjetServiceWorkerRuntime {
    client;
    recvport;
    constructor(client){
        this.client = client;
        // @ts-ignore
        self.onconnect = (cevent)=>{
            const port = cevent.ports[0];
            dbg.log("sw", "connected");
            port.addEventListener("message", (event)=>{
                console.log("sw", event.data);
                if ("scramjet$type" in event.data) {
                    if (event.data.scramjet$type === "init") {
                        this.recvport = event.data.scramjet$port;
                        this.recvport.postMessage({
                            scramjet$type: "init"
                        });
                    } else {
                        handleMessage.call(this, client, event.data);
                    }
                }
            });
            port.start();
        };
    }
    hook() {
        // @ts-ignore
        this.client.global.registration = {
            // TODO IMPLEMENT SCOPES
            scope: this.client.url.href,
            active: {
                scriptURL: this.client.url.href,
                state: "activated",
                onstatechange: null,
                onerror: null,
                postMessage: ()=>{},
                addEventListener: ()=>{},
                removeEventListener: ()=>{},
                dispatchEvent: (_e)=>{
                    return false;
                }
            },
            showNotification: async ()=>{},
            unregister: async ()=>true,
            //@ts-ignore
            update: async ()=>{},
            installing: null,
            waiting: null
        };
        // @ts-ignore
        this.client.global.ServiceWorkerGlobalScope = this.client.global;
    }
}
function handleMessage(client, data) {
    const port = this.recvport;
    const type = data.scramjet$type;
    const token = data.scramjet$token;
    const handlers = client.eventcallbacks.get(self);
    if (type === "fetch") {
        dbg.log("ee", data);
        const fetchhandlers = handlers.filter((event)=>event.event === "fetch");
        if (!fetchhandlers) return;
        for (const handler of fetchhandlers){
            const request = data.scramjet$request;
            const Request = client.natives["Request"];
            const fakeRequest = new Request((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.unrewriteUrl)(request.url), {
                body: request.body,
                headers: new Headers(request.headers),
                method: request.method,
                mode: "same-origin"
            });
            Object.defineProperty(fakeRequest, "destination", {
                value: request.destinitation
            });
            // TODO: clean up, maybe put into a class
            const fakeFetchEvent = new Event("fetch");
            fakeFetchEvent.request = fakeRequest;
            let responded = false;
            fakeFetchEvent.respondWith = (response)=>{
                responded = true;
                (async ()=>{
                    response = await response;
                    const message = {
                        scramjet$type: "fetch",
                        scramjet$token: token,
                        scramjet$response: {
                            body: response.body,
                            headers: Array.from(response.headers.entries()),
                            status: response.status,
                            statusText: response.statusText
                        }
                    };
                    dbg.log("sw", "responding", message);
                    port.postMessage(message, [
                        response.body
                    ]);
                })();
            };
            dbg.log("to fn", fakeFetchEvent);
            handler.proxiedCallback(trustEvent(fakeFetchEvent));
            if (!responded) {
                console.log("sw", "no response");
                port.postMessage({
                    scramjet$type: "fetch",
                    scramjet$token: token,
                    scramjet$response: false
                });
            }
        }
    }
}
function trustEvent(event) {
    return new Proxy(event, {
        get (target, prop, _reciever) {
            if (prop === "isTrusted") return true;
            return Reflect.get(target, prop);
        }
    });
}


}),
"./src/client/worker/importScripts.ts": 
/*!********************************************!*\
  !*** ./src/client/worker/importScripts.ts ***!
  \********************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var _shared_rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/rewriters/url */ "./src/shared/rewriters/url.ts");

/* ESM default export */ function __WEBPACK_DEFAULT_EXPORT__(client) {
    client.Proxy("importScripts", {
        apply (ctx) {
            for(const i in ctx.args){
                ctx.args[i] = (0,_shared_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(ctx.args[i], client.meta);
            }
        }
    });
}


}),
"./src/controller/controller.ts": 
/*!**************************************!*\
  !*** ./src/controller/controller.ts ***!
  \**************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ScramjetController: () => (ScramjetController)
});
/* ESM import */var _shared_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared/index */ "./src/shared/index.ts");
/* ESM import */var _controller_frame__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/controller/frame */ "./src/controller/frame.ts");
/* ESM import */var idb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! idb */ "./node_modules/.pnpm/idb@8.0.3/node_modules/idb/build/index.js");
/* ESM import */var _client_events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @client/events */ "./src/client/events.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];




class ScramjetController extends EventTarget {
    db;
    constructor(config){
        super();
        // sane ish defaults
        const defaultConfig = {
            // wisp: "/wisp/",
            prefix: "/scramjet/",
            globals: {
                wrapfn: "$scramjet$wrap",
                wrappropertybase: "$scramjet__",
                wrappropertyfn: "$scramjet$prop",
                cleanrestfn: "$scramjet$clean",
                importfn: "$scramjet$import",
                rewritefn: "$scramjet$rewrite",
                metafn: "$scramjet$meta",
                setrealmfn: "$scramjet$setrealm",
                pushsourcemapfn: "$scramjet$pushsourcemap",
                trysetfn: "$scramjet$tryset",
                templocid: "$scramjet$temploc",
                tempunusedid: "$scramjet$tempunused"
            },
            files: {
                wasm: "/scramjet.wasm.wasm",
                all: "/scramjet.all.js",
                sync: "/scramjet.sync.js"
            },
            flags: {
                serviceworkers: false,
                syncxhr: false,
                strictRewrites: true,
                rewriterLogs: false,
                captureErrors: true,
                cleanErrors: false,
                scramitize: false,
                sourcemaps: true,
                destructureRewrites: false,
                interceptDownloads: false,
                allowInvalidJs: true,
                allowFailedIntercepts: true
            },
            siteFlags: {},
            codec: {
                encode: (url)=>{
                    if (!url) return url;
                    return encodeURIComponent(url);
                },
                decode: (url)=>{
                    if (!url) return url;
                    return decodeURIComponent(url);
                }
            }
        };
        const deepMerge = (target, source)=>{
            for(const key in source){
                if (source[key] instanceof Object && key in target) {
                    Object.assign(source[key], deepMerge(target[key], source[key]));
                }
            }
            return Object.assign(target || {}, source);
        };
        const newConfig = deepMerge(defaultConfig, config);
        newConfig.codec.encode = newConfig.codec.encode.toString();
        newConfig.codec.decode = newConfig.codec.decode.toString();
        (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.setConfig)(newConfig);
    }
    async init() {
        (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.loadCodecs)();
        await this.openIDB();
        navigator.serviceWorker.controller?.postMessage({
            scramjet$type: "loadConfig",
            config: _shared_index__WEBPACK_IMPORTED_MODULE_0__.config
        });
        dbg.log("config loaded");
        navigator.serviceWorker.addEventListener("message", (e)=>{
            if (!("scramjet$type" in e.data)) return;
            const data = e.data;
            if (data.scramjet$type === "download") {
                this.dispatchEvent(new _client_events__WEBPACK_IMPORTED_MODULE_3__.ScramjetGlobalDownloadEvent(data.download));
            }
        });
    }
    createFrame(frame) {
        if (!frame) {
            frame = document.createElement("iframe");
        }
        return new _controller_frame__WEBPACK_IMPORTED_MODULE_1__.ScramjetFrame(this, frame);
    }
    encodeUrl(url) {
        if (typeof url === "string") url = new URL(url);
        if (url.protocol != "http:" && url.protocol != "https:") {
            return url.href;
        }
        const encodedHash = (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.codecEncode)(url.hash.slice(1));
        const realHash = encodedHash ? "#" + encodedHash : "";
        url.hash = "";
        return _shared_index__WEBPACK_IMPORTED_MODULE_0__.config.prefix + (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.codecEncode)(url.href) + realHash;
    }
    decodeUrl(url) {
        if (url instanceof URL) url = url.toString();
        const prefixed = location.origin + _shared_index__WEBPACK_IMPORTED_MODULE_0__.config.prefix;
        return (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.codecDecode)(url.slice(prefixed.length));
    }
    async openIDB() {
        const db = await (0,idb__WEBPACK_IMPORTED_MODULE_2__.openDB)("$scramjet", 1, {
            upgrade (db) {
                if (!db.objectStoreNames.contains("config")) {
                    db.createObjectStore("config");
                }
                if (!db.objectStoreNames.contains("cookies")) {
                    db.createObjectStore("cookies");
                }
                if (!db.objectStoreNames.contains("redirectTrackers")) {
                    db.createObjectStore("redirectTrackers");
                }
                if (!db.objectStoreNames.contains("referrerPolicies")) {
                    db.createObjectStore("referrerPolicies");
                }
                if (!db.objectStoreNames.contains("publicSuffixList")) {
                    db.createObjectStore("publicSuffixList");
                }
            }
        });
        this.db = db;
        await this.#saveConfig();
        return db;
    }
    async #saveConfig() {
        if (!this.db) {
            console.error("Store not ready!");
            return;
        }
        await this.db.put("config", _shared_index__WEBPACK_IMPORTED_MODULE_0__.config, "config");
    }
    async modifyConfig(newconfig) {
        (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.setConfig)(Object.assign({}, _shared_index__WEBPACK_IMPORTED_MODULE_0__.config, newconfig));
        (0,_shared_index__WEBPACK_IMPORTED_MODULE_0__.loadCodecs)();
        await this.#saveConfig();
        navigator.serviceWorker.controller?.postMessage({
            scramjet$type: "loadConfig",
            config: _shared_index__WEBPACK_IMPORTED_MODULE_0__.config
        });
    }
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
    }
}


}),
"./src/controller/frame.ts": 
/*!*********************************!*\
  !*** ./src/controller/frame.ts ***!
  \*********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ScramjetFrame: () => (ScramjetFrame)
});
/* ESM import */var _symbols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/symbols */ "./src/symbols.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];
/**
 * @fileoverview Contains abstractions for using Scrmajet under an iframe.
 */ 
function createFrameId() {
    return `${Array(8).fill(0).map(()=>Math.floor(Math.random() * 36).toString(36)).join("")}`;
}
/**
 * An abstraction over proxy iframe creation, which lets you manage instances of Scramjet and not have to worry about the proxy internals, since everything you need is already proxified.
 *
 * @example
 * ```typescript
 * const { ScramjetController } = $scramjetLoadController();
 * const scramjet = new ScramjetController({ prefix: "/scramjet/" });
 * await scramjet.init();
 *
 * const frame = scramjet.createFrame();
 * document.body.appendChild(frame.frame);
 *
 * // Navigate to a URL
 * frame.go("https://example.com");
 *
 * // Listen for proxified navigation events
 * frame.addEventListener("urlchange", (e) => {
 *   console.log("URL changed to:", e.url);
 * });
 *
 * // Go back
 * frame.back();
 * // Go forward
 * frame.forward();
 * // Reload page
 * frame.reload();
 * ```
 */ class ScramjetFrame extends EventTarget {
    controller;
    frame;
    /**
	 * Create a ScramjetFrame instance. You likely won't need to interact the {@link ScramjetFrame.constructor | constructor} directly.
	 * You can instead use {@link ScramjetController.createFrame} on your existing `ScramjetController`.
	 *
	 * @param controller The `ScramjetController` instance that manages this frame with.
	 * @param frame The frame to be controlled for you under Scramjet.
	 */ constructor(controller, frame){
        super(), this.controller = controller, this.frame = frame;
        frame.name = createFrameId();
        frame[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETFRAME] = this;
    }
    /**
	 * Returns the {@link ScramjetClient} instance running inside the iframe's contentWindow.
	 *
	 * @returns The `ScramjetClient` instance.
	 */ get client() {
        return this.frame.contentWindow.window[_symbols__WEBPACK_IMPORTED_MODULE_0__.SCRAMJETCLIENT];
    }
    /**
	 * Returns the proxified URL.
	 *
	 * @returns The proxified URL.
	 */ get url() {
        return this.client.url;
    }
    /**
	 * Navigates the iframe to a new URL under Scramjet.
	 *
	 * @example
	 * ```typescript
	 * frame.go("https://example.net");
	 * ```
	 *
	 * @param url A real URL to navigate to
	 */ go(url) {
        if (url instanceof URL) url = url.toString();
        dbg.log("navigated to", url);
        this.frame.src = this.controller.encodeUrl(url);
    }
    /**
	 * Goes backwards in the browser history.
	 */ back() {
        this.frame.contentWindow?.history.back();
    }
    /**
	 * Goes forward in the browser history.
	 */ forward() {
        this.frame.contentWindow?.history.forward();
    }
    /**
	 * Reloads the iframe.
	 */ reload() {
        this.frame.contentWindow?.location.reload();
    }
    /**
	 * Binds event listeners to listen for proxified navigation events in Scramjet.
	 *
	 * @example
	 * ```typescript
	 * // Listen for URL changes
	 * frame.addEventListener("urlchange", (event) => {
	 *   console.log("URL changed:", event.url);
	 *   document.title = event.url; // Update page title
	 * });
	 *
	 * // Listen for navigation events
	 * frame.addEventListener("navigate", (event) => {
	 *   console.log("Navigating to:", event.url);
	 * });
	 * ```
	 *
	 * @param type Type of event to listen for.
	 * @param listener Event listener to dispatch.
	 * @param options Options for the event listener.
	 */ addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
    }
}


}),
"./src/controller/index.ts": 
/*!*********************************!*\
  !*** ./src/controller/index.ts ***!
  \*********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ScramjetController: () => (/* reexport safe */ _controller__WEBPACK_IMPORTED_MODULE_1__.ScramjetController),
  ScramjetFrame: () => (/* reexport safe */ _frame__WEBPACK_IMPORTED_MODULE_0__.ScramjetFrame)
});
/* ESM import */var _frame__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./frame */ "./src/controller/frame.ts");
/* ESM import */var _controller__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./controller */ "./src/controller/controller.ts");




}),
"./src/log.ts": 
/*!********************!*\
  !*** ./src/log.ts ***!
  \********************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (__WEBPACK_DEFAULT_EXPORT__)
});
// import { flagEnabled } from "@/shared";
const logfuncs = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    info: console.info
};
/* ESM default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    fmt: function(severity, message, ...args) {
        const old = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack)=>{
            stack.shift(); // stack();
            stack.shift(); // fmt();
            stack.shift();
            let fmt = "";
            for(let i = 1; i < Math.min(2, stack.length); i++){
                if (stack[i].getFunctionName()) {
                    // const f = stack[i].getThis()?.constructor?.name;
                    // if (f) fmt += `${f}.`
                    fmt += `${stack[i].getFunctionName()} -> ` + fmt;
                }
            }
            fmt += stack[0].getFunctionName() || "Anonymous";
            return fmt;
        };
        const fmt = function stack() {
            try {
                throw new Error();
            } catch (e) {
                return e.stack;
            }
        }();
        Error.prepareStackTrace = old;
        this.print(severity, fmt, message, ...args);
    },
    print (severity, tag, message, ...args) {
        const fn = logfuncs[severity] || logfuncs.log;
        const bg = {
            log: "#000",
            warn: "#f80",
            error: "#f00",
            debug: "transparent"
        }[severity];
        const fg = {
            log: "#fff",
            warn: "#fff",
            error: "#fff",
            debug: "gray"
        }[severity];
        const padding = {
            log: 2,
            warn: 4,
            error: 4,
            debug: 0
        }[severity];
        fn(`%c${tag}%c ${message}`, `
  	background-color: ${bg};
  	color: ${fg};
  	padding: ${padding}px;
  	font-weight: bold;
  	font-family: monospace;
  	font-size: 0.9em;
  `, `${severity === "debug" ? "color: gray" : ""}`, ...args);
    },
    log: function(message, ...args) {
        this.fmt("log", message, ...args);
    },
    warn: function(message, ...args) {
        this.fmt("warn", message, ...args);
    },
    error: function(message, ...args) {
        this.fmt("error", message, ...args);
    },
    debug: function(message, ...args) {
        this.fmt("debug", message, ...args);
    },
    time (meta, before, type) {
        if (true) return;
        const after = performance.now();
        const duration = after - before;
        let timespan;
        if (duration < 1) {
            timespan = "BLAZINGLY FAST";
        } else if (duration < 500) {
            timespan = "decent speed";
        } else {
            timespan = "really slow";
        }
        this.print("debug", "[time]", `${type} was ${timespan} (${duration.toFixed(2)}ms)`);
    }
});


}),
"./src/shared/cookie.ts": 
/*!******************************!*\
  !*** ./src/shared/cookie.ts ***!
  \******************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  CookieStore: () => (CookieStore)
});
/* ESM import */var set_cookie_parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! set-cookie-parser */ "./node_modules/.pnpm/set-cookie-parser@2.7.1/node_modules/set-cookie-parser/lib/set-cookie.js");
/* ESM import */var set_cookie_parser__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(set_cookie_parser__WEBPACK_IMPORTED_MODULE_0__);
// thnank you node unblocker guy

class CookieStore {
    cookies = {};
    setCookies(cookies, url) {
        for (const str of cookies){
            const parsed = set_cookie_parser__WEBPACK_IMPORTED_MODULE_0___default()(str);
            const domain = parsed.domain;
            const sameSite = parsed.sameSite;
            const cookie = {
                domain,
                sameSite,
                ...parsed[0]
            };
            if (!cookie.domain) cookie.domain = "." + url.hostname;
            if (!cookie.domain.startsWith(".")) cookie.domain = "." + cookie.domain;
            if (!cookie.path) cookie.path = "/";
            if (!cookie.sameSite) cookie.sameSite = "lax";
            if (cookie.expires) cookie.expires = cookie.expires.toString();
            const id = `${cookie.domain}@${cookie.path}@${cookie.name}`;
            this.cookies[id] = cookie;
        }
    }
    getCookies(url, fromJs) {
        const now = new Date();
        const cookies = Object.values(this.cookies);
        const validCookies = [];
        for (const cookie of cookies){
            if (cookie.expires && new Date(cookie.expires) < now) {
                delete this.cookies[`${cookie.domain}@${cookie.path}@${cookie.name}`];
                continue;
            }
            if (cookie.secure && url.protocol !== "https:") continue;
            if (cookie.httpOnly && fromJs) continue;
            if (!url.pathname.startsWith(cookie.path)) continue;
            if (cookie.domain.startsWith(".")) {
                if (!url.hostname.endsWith(cookie.domain.slice(1))) continue;
            }
            validCookies.push(cookie);
        }
        return validCookies.map((cookie)=>`${cookie.name}=${cookie.value}`).join("; ");
    }
    load(cookies) {
        if (typeof cookies === "object") return cookies;
        this.cookies = JSON.parse(cookies);
    }
    dump() {
        return JSON.stringify(this.cookies);
    }
}


}),
"./src/shared/headers.ts": 
/*!*******************************!*\
  !*** ./src/shared/headers.ts ***!
  \*******************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ScramjetHeaders: () => (ScramjetHeaders)
});
class ScramjetHeaders {
    headers = {};
    set(key, v) {
        this.headers[key.toLowerCase()] = v;
    }
}


}),
"./src/shared/htmlRules.ts": 
/*!*********************************!*\
  !*** ./src/shared/htmlRules.ts ***!
  \*********************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  htmlRules: () => (htmlRules)
});
/* ESM import */var _rewriters_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/css */ "./src/shared/rewriters/css.ts");
/* ESM import */var _rewriters_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/html */ "./src/shared/rewriters/html.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");



const htmlRules = [
    {
        fn: (value, meta)=>{
            return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_2__.rewriteUrl)(value, meta);
        },
        // url rewrites
        src: [
            "embed",
            "script",
            "img",
            "frame",
            "source",
            "input",
            "track"
        ],
        href: [
            "a",
            "link",
            "area",
            "use",
            "image"
        ],
        data: [
            "object"
        ],
        action: [
            "form"
        ],
        formaction: [
            "button",
            "input",
            "textarea",
            "submit"
        ],
        poster: [
            "video"
        ],
        "xlink:href": [
            "image"
        ]
    },
    {
        fn: (value, meta)=>{
            let url = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_2__.rewriteUrl)(value, meta);
            // if (meta.topFrameName)
            // 	url += `?topFrame=${meta.topFrameName}&parentFrame=${meta.parentFrameName}`;
            return url;
        },
        src: [
            "iframe"
        ]
    },
    {
        // is this a good idea?
        fn: (value, meta)=>{
            return null;
        },
        sandbox: [
            "iframe"
        ]
    },
    {
        fn: (value, meta)=>{
            if (value.startsWith("blob:")) {
                // for media elements specifically they must take the original blob
                // because they can't be fetch'd
                return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_2__.unrewriteBlob)(value);
            }
            return (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_2__.rewriteUrl)(value, meta);
        },
        src: [
            "video",
            "audio"
        ]
    },
    {
        fn: ()=>"",
        integrity: [
            "script",
            "link"
        ]
    },
    {
        fn: ()=>null,
        // csp stuff that must be deleted
        nonce: "*",
        csp: [
            "iframe"
        ],
        credentialless: [
            "iframe"
        ]
    },
    {
        fn: (value, meta)=>(0,_rewriters_html__WEBPACK_IMPORTED_MODULE_1__.rewriteSrcset)(value, meta),
        // srcset
        srcset: [
            "img",
            "source"
        ],
        imagesrcset: [
            "link"
        ]
    },
    {
        fn: (value, meta, cookieStore)=>(0,_rewriters_html__WEBPACK_IMPORTED_MODULE_1__.rewriteHtml)(value, cookieStore, {
                // for srcdoc origin is the origin of the page that the iframe is on. base and path get dropped
                origin: new URL(meta.origin.origin),
                base: new URL(meta.origin.origin)
            }, true),
        // srcdoc
        srcdoc: [
            "iframe"
        ]
    },
    {
        fn: (value, meta)=>(0,_rewriters_css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss)(value, meta),
        style: "*"
    },
    {
        fn: (value, meta)=>{
            if (value === "_top" || value === "_unfencedTop") return meta.topFrameName;
            else if (value === "_parent") return meta.parentFrameName;
            else return value;
        },
        target: [
            "a",
            "base"
        ]
    }
];


}),
"./src/shared/index.ts": 
/*!*****************************!*\
  !*** ./src/shared/index.ts ***!
  \*****************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  CookieStore: () => (/* reexport safe */ _cookie__WEBPACK_IMPORTED_MODULE_0__.CookieStore),
  ScramjetHeaders: () => (/* reexport safe */ _headers__WEBPACK_IMPORTED_MODULE_1__.ScramjetHeaders),
  asyncSetWasm: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.asyncSetWasm),
  cleanExpiredTrackers: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.cleanExpiredTrackers),
  cleanTracker: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.cleanTracker),
  codecDecode: () => (codecDecode),
  codecEncode: () => (codecEncode),
  config: () => (config),
  flagEnabled: () => (flagEnabled),
  getInjectScripts: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.getInjectScripts),
  getMostRestrictiveSite: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.getMostRestrictiveSite),
  getPublicSuffixList: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.getPublicSuffixList),
  getReferrerPolicy: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.getReferrerPolicy),
  getRewriter: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.getRewriter),
  getSiteDirective: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.getSiteDirective),
  htmlRules: () => (/* reexport safe */ _htmlRules__WEBPACK_IMPORTED_MODULE_2__.htmlRules),
  initializeTracker: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.initializeTracker),
  isSameSite: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.isSameSite),
  loadCodecs: () => (loadCodecs),
  rewriteBlob: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteBlob),
  rewriteCss: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteCss),
  rewriteHeaders: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteHeaders),
  rewriteHtml: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteHtml),
  rewriteJs: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteJs),
  rewriteJsInner: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteJsInner),
  rewriteSrcset: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteSrcset),
  rewriteUrl: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteUrl),
  rewriteWorkers: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.rewriteWorkers),
  setConfig: () => (setConfig),
  storeReferrerPolicy: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.storeReferrerPolicy),
  textDecoder: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.textDecoder),
  unrewriteBlob: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.unrewriteBlob),
  unrewriteCss: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.unrewriteCss),
  unrewriteHtml: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.unrewriteHtml),
  unrewriteUrl: () => (/* reexport safe */ _rewriters__WEBPACK_IMPORTED_MODULE_3__.unrewriteUrl),
  updateTracker: () => (/* reexport safe */ _security__WEBPACK_IMPORTED_MODULE_4__.updateTracker)
});
/* ESM import */var _cookie__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./cookie */ "./src/shared/cookie.ts");
/* ESM import */var _headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./headers */ "./src/shared/headers.ts");
/* ESM import */var _htmlRules__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./htmlRules */ "./src/shared/htmlRules.ts");
/* ESM import */var _rewriters__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./rewriters */ "./src/shared/rewriters/index.ts");
/* ESM import */var _security__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./security */ "./src/shared/security/index.ts");





let codecEncode;
let codecDecode;
const nativeFunction = Function;
function loadCodecs() {
    codecEncode = nativeFunction(`return ${config.codec.encode}`)();
    codecDecode = nativeFunction(`return ${config.codec.decode}`)();
}
function flagEnabled(flag, url) {
    const value = config.flags[flag];
    for(const regex in config.siteFlags){
        const partialflags = config.siteFlags[regex];
        if (new RegExp(regex).test(url.href) && flag in partialflags) {
            return partialflags[flag];
        }
    }
    return value;
}
let config;
function setConfig(newConfig) {
    config = newConfig;
    loadCodecs();
}


}),
"./src/shared/rewriters/css.ts": 
/*!*************************************!*\
  !*** ./src/shared/rewriters/css.ts ***!
  \*************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  rewriteCss: () => (rewriteCss),
  unrewriteCss: () => (unrewriteCss)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");

function rewriteCss(css, meta) {
    return handleCss("rewrite", css, meta);
}
function unrewriteCss(css) {
    return handleCss("unrewrite", css);
}
function handleCss(type, css, meta) {
    // regex from vk6 (https://github.com/ading2210)
    const urlRegex = /url\(['"]?(.+?)['"]?\)/gm;
    const Atruleregex = /@import\s+(url\s*?\(.{0,9999}?\)|['"].{0,9999}?['"]|.{0,9999}?)($|\s|;)/gm;
    css = new String(css).toString();
    css = css.replace(urlRegex, (match, url)=>{
        const encodedUrl = type === "rewrite" ? (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(url.trim(), meta) : (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.unrewriteUrl)(url.trim());
        return match.replace(url, encodedUrl);
    });
    css = css.replace(Atruleregex, (match, importStatement)=>{
        return match.replace(importStatement, importStatement.replace(/^(url\(['"]?|['"]|)(.+?)(['"]|['"]?\)|)$/gm, (match, firstQuote, url, endQuote)=>{
            if (firstQuote.startsWith("url")) {
                return match;
            }
            const encodedUrl = type === "rewrite" ? (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(url.trim(), meta) : (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.unrewriteUrl)(url.trim());
            return `${firstQuote}${encodedUrl}${endQuote}`;
        }));
    });
    return css;
}


}),
"./src/shared/rewriters/headers.ts": 
/*!*****************************************!*\
  !*** ./src/shared/rewriters/headers.ts ***!
  \*****************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  rewriteHeaders: () => (rewriteHeaders)
});
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _shared_security_siteTests__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/shared/security/siteTests */ "./src/shared/security/siteTests.ts");


/**
 * Headers for security policy features that haven't been emulated yet
 */ const SEC_HEADERS = new Set([
    "cross-origin-embedder-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "content-security-policy",
    "content-security-policy-report-only",
    "expect-ct",
    "feature-policy",
    "origin-isolation",
    "strict-transport-security",
    "upgrade-insecure-requests",
    "x-content-type-options",
    "x-download-options",
    "x-frame-options",
    "x-permitted-cross-domain-policies",
    "x-powered-by",
    "x-xss-protection",
    // This needs to be emulated, but for right now it isn't that important of a feature to be worried about
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data
    "clear-site-data"
]);
/**
 * Headers that are actually URLs that need to be rewritten
 */ const URL_HEADERS = new Set([
    "location",
    "content-location",
    "referer"
]);
function rewriteLinkHeader(link, meta) {
    return link.replace(/<(.*)>/gi, (match)=>(0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(match, meta));
}
/**
 * Rewrites response headers
 * @param rawHeaders Headers before they were rewritten
 * @param meta Parsed Proxy URL
 * @param client `BareClient` instance used for fetching
 * @param isNavigationRequest Whether the request is a navigation request
 */ async function rewriteHeaders(rawHeaders, meta, client, storedReferrerPolicies) {
    const headers = {};
    for(const key in rawHeaders){
        headers[key.toLowerCase()] = rawHeaders[key];
    }
    for (const cspHeader of SEC_HEADERS){
        delete headers[cspHeader];
    }
    for (const urlHeader of URL_HEADERS){
        if (headers[urlHeader]) headers[urlHeader] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_0__.rewriteUrl)(headers[urlHeader]?.toString(), meta);
    }
    if (typeof headers["link"] === "string") {
        headers["link"] = rewriteLinkHeader(headers["link"], meta);
    } else if (Array.isArray(headers["link"])) {
        headers["link"] = headers["link"].map((link)=>rewriteLinkHeader(link, meta));
    }
    // Emulate the referrer policy to set it back to what it should've been without Force Referrer in place
    if (typeof headers["referer"] === "string") {
        const referrerUrl = new URL(headers["referer"]);
        const storedPolicyData = await storedReferrerPolicies.get(referrerUrl.href);
        if (storedPolicyData) {
            const storedReferrerPolicy = storedPolicyData.policy.toLowerCase().split(",").map((rawDir)=>rawDir.trim());
            if (storedReferrerPolicy.includes("no-referrer") || storedReferrerPolicy.includes("no-referrer-when-downgrade") && meta.origin.protocol === "http:" && referrerUrl.protocol === "https:") {
                delete headers["referer"];
            } else if (storedReferrerPolicy.includes("origin")) {
                headers["referer"] = referrerUrl.origin;
            } else if (storedReferrerPolicy.includes("origin-when-cross-origin")) {
                if (referrerUrl.origin !== meta.origin.origin) {
                    headers["referer"] = referrerUrl.origin;
                } else {
                    headers["referer"] = referrerUrl.href;
                }
            } else if (storedReferrerPolicy.includes("same-origin")) {
                if (referrerUrl.origin === meta.origin.origin) {
                    headers["referer"] = referrerUrl.href;
                } else {
                    delete headers["referer"];
                }
            } else if (storedReferrerPolicy.includes("strict-origin")) {
                if (meta.origin.protocol === "http:" && referrerUrl.protocol === "https:") {
                    delete headers["referer"];
                } else {
                    headers["referer"] = referrerUrl.origin;
                }
            } else {
                if (referrerUrl.origin === meta.origin.origin) {
                    headers["referer"] = referrerUrl.href;
                } else if (meta.origin.protocol === "http:" && referrerUrl.protocol === "https:") {
                    delete headers["referer"];
                } else {
                    headers["referer"] = referrerUrl.origin;
                }
            }
        }
    }
    if (typeof headers["sec-fetch-dest"] === "string" && headers["sec-fetch-dest"] === "") {
        headers["sec-fetch-dest"] = "empty";
    }
    if (typeof headers["sec-fetch-site"] === "string" && headers["sec-fetch-site"] !== "none") {
        if (typeof headers["referer"] === "string") {
            headers["sec-fetch-site"] = await (0,_shared_security_siteTests__WEBPACK_IMPORTED_MODULE_1__.getSiteDirective)(meta, new URL(headers["referer"]), client);
        } else {
            console.warn("Missing referrer header; can't rewrite sec-fetch-site properly. Falling back to unsafe deletion.");
            delete headers["sec-fetch-site"];
        }
    }
    return headers;
}


}),
"./src/shared/rewriters/html.ts": 
/*!**************************************!*\
  !*** ./src/shared/rewriters/html.ts ***!
  \**************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  getInjectScripts: () => (getInjectScripts),
  rewriteHtml: () => (rewriteHtml),
  rewriteSrcset: () => (rewriteSrcset),
  unrewriteHtml: () => (unrewriteHtml)
});
/* ESM import */var htmlparser2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! htmlparser2 */ "./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/index.js");
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");
/* ESM import */var dom_serializer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! dom-serializer */ "./node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _rewriters_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @rewriters/css */ "./src/shared/rewriters/css.ts");
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _shared_htmlRules__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/shared/htmlRules */ "./src/shared/htmlRules.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];








function getInjectScripts(cookieStore, script) {
    const dump = JSON.stringify(cookieStore.dump());
    const injected = `
		self.COOKIE = ${dump};
		$scramjetLoadClient().loadAndHook(${JSON.stringify(_shared__WEBPACK_IMPORTED_MODULE_6__.config)});
		if ("document" in self && document?.currentScript) {
			document.currentScript.remove();
		}
	`;
    // for compatibility purpose
    const base64Injected = bytesToBase64(encoder.encode(injected));
    return [
        script(_shared__WEBPACK_IMPORTED_MODULE_6__.config.files.wasm),
        script(_shared__WEBPACK_IMPORTED_MODULE_6__.config.files.all),
        script("data:application/javascript;base64," + base64Injected)
    ];
}
const encoder = new TextEncoder();
function rewriteHtmlInner(html, cookieStore, meta, fromTop = false) {
    const handler = new domhandler__WEBPACK_IMPORTED_MODULE_1__.DomHandler((err, dom)=>dom);
    const parser = new htmlparser2__WEBPACK_IMPORTED_MODULE_0__.Parser(handler);
    parser.write(html);
    parser.end();
    traverseParsedHtml(handler.root, cookieStore, meta);
    function findhead(node) {
        if (node.type === htmlparser2__WEBPACK_IMPORTED_MODULE_0__.ElementType.Tag && node.name === "head") {
            return node;
        } else if (node.childNodes) {
            for (const child of node.childNodes){
                const head = findhead(child);
                if (head) return head;
            }
        }
        return null;
    }
    if (fromTop) {
        let head = findhead(handler.root);
        if (!head) {
            head = new domhandler__WEBPACK_IMPORTED_MODULE_1__.Element("head", {}, []);
            handler.root.children.unshift(head);
        }
        const script = (src)=>new domhandler__WEBPACK_IMPORTED_MODULE_1__.Element("script", {
                src
            });
        head.children.unshift(...getInjectScripts(cookieStore, script));
    }
    return (0,dom_serializer__WEBPACK_IMPORTED_MODULE_2__["default"])(handler.root, {
        encodeEntities: "utf8",
        decodeEntities: false
    });
}
function rewriteHtml(html, cookieStore, meta, fromTop = false) {
    const before = performance.now();
    const ret = rewriteHtmlInner(html, cookieStore, meta, fromTop);
    dbg.time(meta, before, "html rewrite");
    return ret;
}
// type ParseState = {
// 	base: string;
// 	origin?: URL;
// };
function unrewriteHtml(html) {
    const handler = new domhandler__WEBPACK_IMPORTED_MODULE_1__.DomHandler((err, dom)=>dom);
    const parser = new htmlparser2__WEBPACK_IMPORTED_MODULE_0__.Parser(handler);
    parser.write(html);
    parser.end();
    function traverse(node) {
        if ("attribs" in node) {
            for(const key in node.attribs){
                if (key == "scramjet-attr-script-source-src") {
                    if (node.children[0] && "data" in node.children[0]) node.children[0].data = atob(node.attribs[key]);
                    continue;
                }
                if (key.startsWith("scramjet-attr-")) {
                    node.attribs[key.slice("scramjet-attr-".length)] = node.attribs[key];
                    delete node.attribs[key];
                }
            }
        }
        if ("childNodes" in node) {
            for (const child of node.childNodes){
                traverse(child);
            }
        }
    }
    traverse(handler.root);
    return (0,dom_serializer__WEBPACK_IMPORTED_MODULE_2__["default"])(handler.root, {
        decodeEntities: false
    });
}
// i need to add the attributes in during rewriting
function traverseParsedHtml(node, cookieStore, meta) {
    if (node.name === "base" && node.attribs.href !== undefined) {
        meta.base = new URL(node.attribs.href, meta.origin);
    }
    if (node.attribs) {
        for (const rule of _shared_htmlRules__WEBPACK_IMPORTED_MODULE_7__.htmlRules){
            for(const attr in rule){
                const sel = rule[attr.toLowerCase()];
                if (typeof sel === "function") continue;
                if (sel === "*" || sel.includes(node.name)) {
                    if (node.attribs[attr] !== undefined) {
                        const value = node.attribs[attr];
                        const v = rule.fn(value, meta, cookieStore);
                        if (v === null) delete node.attribs[attr];
                        else {
                            node.attribs[attr] = v;
                        }
                        node.attribs[`scramjet-attr-${attr}`] = value;
                    }
                }
            }
        }
        for (const [attr, value] of Object.entries(node.attribs)){
            if (eventAttributes.includes(attr)) {
                node.attribs[`scramjet-attr-${attr}`] = value;
                node.attribs[attr] = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_5__.rewriteJs)(value, `(inline ${attr} on element)`, meta);
            }
        }
    }
    if (node.name === "style" && node.children[0] !== undefined) node.children[0].data = (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_4__.rewriteCss)(node.children[0].data, meta);
    if (node.name === "script" && node.attribs.type === "module" && node.attribs.src) node.attribs.src = node.attribs.src + "?type=module";
    if (node.name === "script" && node.attribs.type === "importmap" && node.children[0] !== undefined) {
        let json = node.children[0].data;
        try {
            const map = JSON.parse(json);
            if (map.imports) {
                for(const key in map.imports){
                    let url = map.imports[key];
                    if (typeof url === "string") {
                        url = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.rewriteUrl)(url, meta);
                        map.imports[key] = url;
                    }
                }
            }
            node.children[0].data = JSON.stringify(map);
        } catch (e) {
            console.error("Failed to parse importmap JSON:", e);
        }
    }
    if (node.name === "script" && /(application|text)\/javascript|module|undefined/.test(node.attribs.type) && node.children[0] !== undefined) {
        let js = node.children[0].data;
        const module = node.attribs.type === "module" ? true : false;
        node.attribs["scramjet-attr-script-source-src"] = bytesToBase64(encoder.encode(js));
        const htmlcomment = /<!--[\s\S]*?-->/g;
        js = js.replace(htmlcomment, "");
        node.children[0].data = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_5__.rewriteJs)(js, "(inline script element)", meta, module);
    }
    if (node.name === "meta" && node.attribs["http-equiv"] !== undefined) {
        if (node.attribs["http-equiv"].toLowerCase() === "content-security-policy") {
            // just delete it. this needs to be emulated eventually but like
            node = new domhandler__WEBPACK_IMPORTED_MODULE_1__.Comment(node.attribs.content);
        } else if (node.attribs["http-equiv"] === "refresh" && node.attribs.content.includes("url")) {
            const contentArray = node.attribs.content.split("url=");
            if (contentArray[1]) contentArray[1] = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.rewriteUrl)(contentArray[1].trim(), meta);
            node.attribs.content = contentArray.join("url=");
        }
    }
    if (node.childNodes) {
        for(const childNode in node.childNodes){
            node.childNodes[childNode] = traverseParsedHtml(node.childNodes[childNode], cookieStore, meta);
        }
    }
    return node;
}
function rewriteSrcset(srcset, meta) {
    const sources = srcset.split(/ .*,/).map((src)=>src.trim());
    const rewrittenSources = sources.map((source)=>{
        // Split into URLs and descriptors (if any)
        // e.g. url0, url1 1.5x, url2 2x
        const [url, ...descriptors] = source.split(/\s+/);
        // Rewrite the URLs and keep the descriptors (if any)
        const rewrittenUrl = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.rewriteUrl)(url.trim(), meta);
        return descriptors.length > 0 ? `${rewrittenUrl} ${descriptors.join(" ")}` : rewrittenUrl;
    });
    return rewrittenSources.join(", ");
}
// function base64ToBytes(base64) {
// 	const binString = atob(base64);
// 	return Uint8Array.from(binString, (m) => m.codePointAt(0));
// }
function bytesToBase64(bytes) {
    const binString = Array.from(bytes, (byte)=>String.fromCodePoint(byte)).join("");
    return btoa(binString);
}
const eventAttributes = [
    "onbeforexrselect",
    "onabort",
    "onbeforeinput",
    "onbeforematch",
    "onbeforetoggle",
    "onblur",
    "oncancel",
    "oncanplay",
    "oncanplaythrough",
    "onchange",
    "onclick",
    "onclose",
    "oncontentvisibilityautostatechange",
    "oncontextlost",
    "oncontextmenu",
    "oncontextrestored",
    "oncuechange",
    "ondblclick",
    "ondrag",
    "ondragend",
    "ondragenter",
    "ondragleave",
    "ondragover",
    "ondragstart",
    "ondrop",
    "ondurationchange",
    "onemptied",
    "onended",
    "onerror",
    "onfocus",
    "onformdata",
    "oninput",
    "oninvalid",
    "onkeydown",
    "onkeypress",
    "onkeyup",
    "onload",
    "onloadeddata",
    "onloadedmetadata",
    "onloadstart",
    "onmousedown",
    "onmouseenter",
    "onmouseleave",
    "onmousemove",
    "onmouseout",
    "onmouseover",
    "onmouseup",
    "onmousewheel",
    "onpause",
    "onplay",
    "onplaying",
    "onprogress",
    "onratechange",
    "onreset",
    "onresize",
    "onscroll",
    "onsecuritypolicyviolation",
    "onseeked",
    "onseeking",
    "onselect",
    "onslotchange",
    "onstalled",
    "onsubmit",
    "onsuspend",
    "ontimeupdate",
    "ontoggle",
    "onvolumechange",
    "onwaiting",
    "onwebkitanimationend",
    "onwebkitanimationiteration",
    "onwebkitanimationstart",
    "onwebkittransitionend",
    "onwheel",
    "onauxclick",
    "ongotpointercapture",
    "onlostpointercapture",
    "onpointerdown",
    "onpointermove",
    "onpointerrawupdate",
    "onpointerup",
    "onpointercancel",
    "onpointerover",
    "onpointerout",
    "onpointerenter",
    "onpointerleave",
    "onselectstart",
    "onselectionchange",
    "onanimationend",
    "onanimationiteration",
    "onanimationstart",
    "ontransitionrun",
    "ontransitionstart",
    "ontransitionend",
    "ontransitioncancel",
    "oncopy",
    "oncut",
    "onpaste",
    "onscrollend",
    "onscrollsnapchange",
    "onscrollsnapchanging"
];


}),
"./src/shared/rewriters/index.ts": 
/*!***************************************!*\
  !*** ./src/shared/rewriters/index.ts ***!
  \***************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  asyncSetWasm: () => (/* reexport safe */ _wasm__WEBPACK_IMPORTED_MODULE_6__.asyncSetWasm),
  getInjectScripts: () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_2__.getInjectScripts),
  getRewriter: () => (/* reexport safe */ _wasm__WEBPACK_IMPORTED_MODULE_6__.getRewriter),
  rewriteBlob: () => (/* reexport safe */ _url__WEBPACK_IMPORTED_MODULE_4__.rewriteBlob),
  rewriteCss: () => (/* reexport safe */ _css__WEBPACK_IMPORTED_MODULE_0__.rewriteCss),
  rewriteHeaders: () => (/* reexport safe */ _headers__WEBPACK_IMPORTED_MODULE_1__.rewriteHeaders),
  rewriteHtml: () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_2__.rewriteHtml),
  rewriteJs: () => (/* reexport safe */ _js__WEBPACK_IMPORTED_MODULE_3__.rewriteJs),
  rewriteJsInner: () => (/* reexport safe */ _js__WEBPACK_IMPORTED_MODULE_3__.rewriteJsInner),
  rewriteSrcset: () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_2__.rewriteSrcset),
  rewriteUrl: () => (/* reexport safe */ _url__WEBPACK_IMPORTED_MODULE_4__.rewriteUrl),
  rewriteWorkers: () => (/* reexport safe */ _worker__WEBPACK_IMPORTED_MODULE_5__.rewriteWorkers),
  textDecoder: () => (/* reexport safe */ _wasm__WEBPACK_IMPORTED_MODULE_6__.textDecoder),
  unrewriteBlob: () => (/* reexport safe */ _url__WEBPACK_IMPORTED_MODULE_4__.unrewriteBlob),
  unrewriteCss: () => (/* reexport safe */ _css__WEBPACK_IMPORTED_MODULE_0__.unrewriteCss),
  unrewriteHtml: () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_2__.unrewriteHtml),
  unrewriteUrl: () => (/* reexport safe */ _url__WEBPACK_IMPORTED_MODULE_4__.unrewriteUrl)
});
/* ESM import */var _css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./css */ "./src/shared/rewriters/css.ts");
/* ESM import */var _headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./headers */ "./src/shared/rewriters/headers.ts");
/* ESM import */var _html__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./html */ "./src/shared/rewriters/html.ts");
/* ESM import */var _js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./js */ "./src/shared/rewriters/js.ts");
/* ESM import */var _url__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _worker__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./worker */ "./src/shared/rewriters/worker.ts");
/* ESM import */var _wasm__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./wasm */ "./src/shared/rewriters/wasm.ts");









}),
"./src/shared/rewriters/js.ts": 
/*!************************************!*\
  !*** ./src/shared/rewriters/js.ts ***!
  \************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  rewriteJs: () => (rewriteJs),
  rewriteJsInner: () => (rewriteJsInner)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_wasm__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/wasm */ "./src/shared/rewriters/wasm.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];


Error.stackTraceLimit = 50;
function rewriteJsWasm(input, source, meta, module) {
    let [rewriter, ret] = (0,_rewriters_wasm__WEBPACK_IMPORTED_MODULE_1__.getRewriter)(meta);
    try {
        let out;
        const before = performance.now();
        // try {
        if (typeof input === "string") {
            out = rewriter.rewrite_js(input, meta.base.href, source || "(unknown)", module);
        } else {
            out = rewriter.rewrite_js_bytes(input, meta.base.href, source || "(unknown)", module);
        }
        // } catch (err) {
        // 	const err1 = err as Error;
        // 	console.warn(
        // 		"failed rewriting js for",
        // 		source,
        // 		err1.message,
        // 		input instanceof Uint8Array ? textDecoder.decode(input) : input
        // 	);
        // 	return { js: input, tag: "", map: null };
        // }
        dbg.time(meta, before, `oxc rewrite for "${source || "(unknown)"}"`);
        const { js, map, scramtag, errors } = out;
        return {
            js: typeof input === "string" ? _rewriters_wasm__WEBPACK_IMPORTED_MODULE_1__.textDecoder.decode(js) : js,
            tag: scramtag,
            map,
            errors
        };
    } finally{
        ret();
    }
}
function rewriteJsInner(js, url, meta, module = false) {
    return rewriteJsWasm(js, url, meta, module);
}
function rewriteJs(js, url, meta, module = false) {
    try {
        const res = rewriteJsInner(js, url, meta, module);
        let newjs = res.js;
        if ((0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("sourcemaps", meta.base)) {
            const pushmap = globalThis[_shared__WEBPACK_IMPORTED_MODULE_0__.config.globals.pushsourcemapfn];
            if (pushmap) {
                pushmap(Array.from(res.map), res.tag);
            } else {
                if (newjs instanceof Uint8Array) {
                    newjs = new TextDecoder().decode(newjs);
                }
                const sourcemapfn = `${_shared__WEBPACK_IMPORTED_MODULE_0__.config.globals.pushsourcemapfn}([${res.map.join(",")}], "${res.tag}");`;
                // don't put the sourcemap call before "use strict"
                const strictMode = /^\s*(['"])use strict\1;?/;
                if (strictMode.test(newjs)) {
                    newjs = newjs.replace(strictMode, `$&\n${sourcemapfn}`);
                } else {
                    newjs = `${sourcemapfn}\n${newjs}`;
                }
            }
        }
        if ((0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("rewriterLogs", meta.base)) {
            for (const error of res.errors){
                console.error("oxc parse error", error);
            }
        }
        return newjs;
    } catch (err) {
        console.warn("failed rewriting js for", url || "(unknown)", err.message, js instanceof Uint8Array ? _rewriters_wasm__WEBPACK_IMPORTED_MODULE_1__.textDecoder.decode(js) : js);
        if ((0,_shared__WEBPACK_IMPORTED_MODULE_0__.flagEnabled)("allowInvalidJs", meta.base)) {
            return js;
        } else {
            throw err;
        }
    }
}


}),
"./src/shared/rewriters/url.ts": 
/*!*************************************!*\
  !*** ./src/shared/rewriters/url.ts ***!
  \*************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  rewriteBlob: () => (rewriteBlob),
  rewriteUrl: () => (rewriteUrl),
  unrewriteBlob: () => (unrewriteBlob),
  unrewriteUrl: () => (unrewriteUrl)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");



function tryCanParseURL(url, origin) {
    try {
        return new URL(url, origin);
    } catch  {
        return null;
    }
}
function rewriteBlob(url, meta) {
    const blob = new URL(url.substring("blob:".length));
    return "blob:" + meta.origin.origin + blob.pathname;
}
function unrewriteBlob(url) {
    const blob = new URL(url.substring("blob:".length));
    return "blob:" + location.origin + blob.pathname;
}
function rewriteUrl(url, meta) {
    if (url instanceof URL) url = url.toString();
    if (url.startsWith("javascript:")) {
        return "javascript:" + (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_1__.rewriteJs)(url.slice("javascript:".length), "(javascript: url)", meta);
    } else if (url.startsWith("blob:")) {
        return location.origin + _shared__WEBPACK_IMPORTED_MODULE_0__.config.prefix + url;
    } else if (url.startsWith("data:")) {
        return location.origin + _shared__WEBPACK_IMPORTED_MODULE_0__.config.prefix + url;
    } else if (url.startsWith("mailto:") || url.startsWith("about:")) {
        return url;
    } else {
        let base = meta.base.href;
        if (base.startsWith("about:")) base = unrewriteUrl(self.location.href); // jank!!!!! weird jank!!!
        const realUrl = tryCanParseURL(url, base);
        if (!realUrl) return url;
        const encodedHash = (0,_shared__WEBPACK_IMPORTED_MODULE_0__.codecEncode)(realUrl.hash.slice(1));
        const realHash = encodedHash ? "#" + encodedHash : "";
        realUrl.hash = "";
        return location.origin + _shared__WEBPACK_IMPORTED_MODULE_0__.config.prefix + (0,_shared__WEBPACK_IMPORTED_MODULE_0__.codecEncode)(realUrl.href) + realHash;
    }
}
function unrewriteUrl(url) {
    if (url instanceof URL) url = url.toString();
    // remove query string
    // if (url.includes("?")) {
    // 	url = url.split("?")[0];
    // }
    const prefixed = location.origin + _shared__WEBPACK_IMPORTED_MODULE_0__.config.prefix;
    if (url.startsWith("javascript:")) {
        //TODO
        return url;
    } else if (url.startsWith("blob:")) {
        // realistically this shouldn't happen
        return url;
    } else if (url.startsWith(prefixed + "blob:")) {
        return url.substring(prefixed.length);
    } else if (url.startsWith(prefixed + "data:")) {
        return url.substring(prefixed.length);
    } else if (url.startsWith("mailto:") || url.startsWith("about:")) {
        return url;
    } else {
        const realUrl = tryCanParseURL(url);
        if (!realUrl) return url;
        const decodedHash = (0,_shared__WEBPACK_IMPORTED_MODULE_0__.codecDecode)(realUrl.hash.slice(1));
        const realHash = decodedHash ? "#" + decodedHash : "";
        realUrl.hash = "";
        return (0,_shared__WEBPACK_IMPORTED_MODULE_0__.codecDecode)(realUrl.href.slice(prefixed.length) + realHash);
    }
}


}),
"./src/shared/rewriters/wasm.ts": 
/*!**************************************!*\
  !*** ./src/shared/rewriters/wasm.ts ***!
  \**************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  asyncSetWasm: () => (asyncSetWasm),
  getRewriter: () => (getRewriter),
  textDecoder: () => (textDecoder)
});
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../../rewriter/wasm/out/wasm.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _shared_htmlRules__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/shared/htmlRules */ "./src/shared/htmlRules.ts");
/* ESM import */var _rewriters_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @rewriters/css */ "./src/shared/rewriters/css.ts");
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");
/* ESM import */var _rewriters_html__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @rewriters/html */ "./src/shared/rewriters/html.ts");
// i am a cat. i like to be petted. i like to be fed. i like to be







let wasm_u8;
if (false) {}
else if (self.WASM) wasm_u8 = Uint8Array.from(atob(self.WASM), (c)=>c.charCodeAt(0));
// only use in sw
async function asyncSetWasm() {
    const buf = await fetch(_shared__WEBPACK_IMPORTED_MODULE_1__.config.files.wasm).then((r)=>r.arrayBuffer());
    wasm_u8 = new Uint8Array(buf);
}
const textDecoder = new TextDecoder();
let MAGIC = "\0asm".split("").map((x)=>x.charCodeAt(0));
function initWasm() {
    if (!(wasm_u8 instanceof Uint8Array)) throw new Error("rewriter wasm not found (was it fetched correctly?)");
    if (![
        ...wasm_u8.slice(0, 4)
    ].every((x, i)=>x === MAGIC[i])) throw new Error("rewriter wasm does not have wasm magic (was it fetched correctly?)\nrewriter wasm contents: " + textDecoder.decode(wasm_u8));
    Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../../rewriter/wasm/out/wasm.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({
        module: new WebAssembly.Module(wasm_u8)
    });
}
let rewriters = [];
function getRewriter(meta) {
    initWasm();
    let obj;
    let index = rewriters.findIndex((x)=>!x.inUse);
    let len = rewriters.length;
    if (index === -1) {
        if ((0,_shared__WEBPACK_IMPORTED_MODULE_1__.flagEnabled)("rewriterLogs", meta.base)) console.log(`creating new rewriter, ${len} rewriters made already`);
        let rewriter = new Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../../rewriter/wasm/out/wasm.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({
            config: _shared__WEBPACK_IMPORTED_MODULE_1__.config,
            shared: {
                rewrite: {
                    htmlRules: _shared_htmlRules__WEBPACK_IMPORTED_MODULE_3__.htmlRules,
                    rewriteUrl: _rewriters_url__WEBPACK_IMPORTED_MODULE_2__.rewriteUrl,
                    rewriteCss: _rewriters_css__WEBPACK_IMPORTED_MODULE_4__.rewriteCss,
                    rewriteJs: _rewriters_js__WEBPACK_IMPORTED_MODULE_5__.rewriteJs,
                    getHtmlInjectCode (cookieStore, foundHead) {
                        let inject = (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_6__.getInjectScripts)(cookieStore, (src)=>`<script src="${src}"></script>`).join("");
                        return foundHead ? `<head>${inject}</head>` : inject;
                    }
                }
            },
            flagEnabled: _shared__WEBPACK_IMPORTED_MODULE_1__.flagEnabled,
            codec: {
                encode: _shared__WEBPACK_IMPORTED_MODULE_1__.codecEncode,
                decode: _shared__WEBPACK_IMPORTED_MODULE_1__.codecDecode
            }
        });
        obj = {
            rewriter,
            inUse: false
        };
        rewriters.push(obj);
    } else {
        if ((0,_shared__WEBPACK_IMPORTED_MODULE_1__.flagEnabled)("rewriterLogs", meta.base)) console.log(`using cached rewriter ${index} from list of ${len} rewriters`);
        obj = rewriters[index];
    }
    obj.inUse = true;
    return [
        obj.rewriter,
        ()=>obj.inUse = false
    ];
}


}),
"./src/shared/rewriters/worker.ts": 
/*!****************************************!*\
  !*** ./src/shared/rewriters/worker.ts ***!
  \****************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  rewriteWorkers: () => (rewriteWorkers)
});
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");


function rewriteWorkers(js, type, url, meta) {
    let str = "";
    const module = type === "module";
    const script = (script)=>{
        if (module) {
            str += `import "${_shared__WEBPACK_IMPORTED_MODULE_0__.config.files[script]}"\n`;
        } else {
            str += `importScripts("${_shared__WEBPACK_IMPORTED_MODULE_0__.config.files[script]}");\n`;
        }
    };
    script("wasm");
    script("all");
    str += `$scramjetLoadClient().loadAndHook(${JSON.stringify(_shared__WEBPACK_IMPORTED_MODULE_0__.config)});`;
    let rewritten = (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_1__.rewriteJs)(js, url, meta, module);
    if (rewritten instanceof Uint8Array) {
        rewritten = new TextDecoder().decode(rewritten);
    }
    str += rewritten;
    return str;
}


}),
"./src/shared/security/forceReferrer.ts": 
/*!**********************************************!*\
  !*** ./src/shared/security/forceReferrer.ts ***!
  \**********************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  cleanExpiredTrackers: () => (cleanExpiredTrackers),
  cleanTracker: () => (cleanTracker),
  getMostRestrictiveSite: () => (getMostRestrictiveSite),
  getReferrerPolicy: () => (getReferrerPolicy),
  initializeTracker: () => (initializeTracker),
  storeReferrerPolicy: () => (storeReferrerPolicy),
  updateTracker: () => (updateTracker)
});
/* ESM import */var idb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! idb */ "./node_modules/.pnpm/idb@8.0.3/node_modules/idb/build/index.js");

// Persist the redirect trackers for an hour
const TRACKER_EXPIRY = 60 * 60 * 1000;
const SITE_HIERARCHY = {
    none: 0,
    "same-origin": 1,
    "same-site": 2,
    "cross-site": 3
};
/**
 * Gets a connection to the IndexedDB database
 *
 * @returns Promise that resolves to the database connection
 */ async function getDB() {
    return (0,idb__WEBPACK_IMPORTED_MODULE_0__.openDB)("$scramjet", 1);
}
/**
 * Retrieves a redirect tracker for a given URL
 *
 * @param url The URL to look up
 * @returns Redirect tracker if found, or `null`
 */ async function getTracker(url) {
    const db = await getDB();
    return await db.get("redirectTrackers", url) || null;
}
/**
 * Store or update a redirect tracker for a given URL
 *
 * @param url URL to store the tracker for
 * @param tracker Redirect tracker data to store
 */ async function setTracker(url, tracker) {
    const db = await getDB();
    await db.put("redirectTrackers", tracker, url);
}
/**
 * Delete a redirect tracker for a given URL
 *
 * @param url URL whose tracker should be deleted
 */ async function deleteTracker(url) {
    const db = await getDB();
    await db.delete("redirectTrackers", url);
}
/**
 * Initialize tracking for a new request that might redirect
 *
 * @param requestUrl URL of the request being made
 * @param referrer Referrer URL of the request, or `null`
 * @param initialSite Initial Sec-Fetch-Site directive
 */ async function initializeTracker(requestUrl, referrer, initialSite) {
    const existing = await getTracker(requestUrl);
    if (existing) {
        return;
    }
    await setTracker(requestUrl, {
        originalReferrer: referrer || "",
        mostRestrictiveSite: initialSite,
        referrerPolicy: "",
        chainStarted: Date.now()
    });
}
/**
 * Update tracker when a redirect is encountered
 *
 * @param originalUrl URL that is redirecting
 * @param redirectUrl URL being redirected to
 * @param newReferrerPolicy Referrer Policy from the redirect response
 */ async function updateTracker(originalUrl, redirectUrl, newReferrerPolicy) {
    const tracker = await getTracker(originalUrl);
    if (!tracker) return;
    await deleteTracker(originalUrl);
    if (newReferrerPolicy) {
        tracker.referrerPolicy = newReferrerPolicy;
    }
    await setTracker(redirectUrl, tracker);
}
/**
 * Get most restrictive site value for a request
 *
 * @param requestUrl The URL of the current request
 * @param currentSite The current `Sec-Fetch-Site` directive for this request
 * @returns Most restrictive `Sec-Fetch-Site` directive from the redirect chain
 */ async function getMostRestrictiveSite(requestUrl, currentSite) {
    const tracker = await getTracker(requestUrl);
    if (!tracker) return currentSite;
    const trackedValue = SITE_HIERARCHY[tracker.mostRestrictiveSite];
    const currentValue = SITE_HIERARCHY[currentSite] ?? 0;
    if (currentValue > trackedValue) {
        tracker.mostRestrictiveSite = currentSite;
        await setTracker(requestUrl, tracker);
        return currentSite;
    }
    return tracker.mostRestrictiveSite;
}
/**
 * Clean up tracker after request completes
 * @param requestUrl URL of the completed request
 */ async function cleanTracker(requestUrl) {
    await deleteTracker(requestUrl);
}
/**
 * Clean up expired trackers
 */ async function cleanExpiredTrackers() {
    const now = Date.now();
    const db = await getDB();
    const tx = db.transaction("redirectTrackers", "readwrite");
    for await (const cursor of tx.store){
        const tracker = cursor.value;
        if (now - tracker.chainStarted > TRACKER_EXPIRY) {
            cursor.delete();
        }
    }
    await tx.done;
}
/**
 * Store referrer policy for a URL
 *
 * @param url URL to store the policy for
 * @param policy Referrer policy to store
 * @param referrer The referrer URL that set this policy
 */ async function storeReferrerPolicy(url, policy, referrer) {
    const db = await getDB();
    const data = {
        policy,
        referrer
    };
    await db.put("referrerPolicies", data, url);
}
/**
 * Get referrer policy data for a URL
 *
 * @param url URL to get the policy for
 * @returns Referrer policy data if found, or `null`
 */ async function getReferrerPolicy(url) {
    const db = await getDB();
    return await db.get("referrerPolicies", url) || null;
}


}),
"./src/shared/security/index.ts": 
/*!**************************************!*\
  !*** ./src/shared/security/index.ts ***!
  \**************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  cleanExpiredTrackers: () => (/* reexport safe */ _forceReferrer__WEBPACK_IMPORTED_MODULE_0__.cleanExpiredTrackers),
  cleanTracker: () => (/* reexport safe */ _forceReferrer__WEBPACK_IMPORTED_MODULE_0__.cleanTracker),
  getMostRestrictiveSite: () => (/* reexport safe */ _forceReferrer__WEBPACK_IMPORTED_MODULE_0__.getMostRestrictiveSite),
  getPublicSuffixList: () => (/* reexport safe */ _siteTests__WEBPACK_IMPORTED_MODULE_1__.getPublicSuffixList),
  getReferrerPolicy: () => (/* reexport safe */ _forceReferrer__WEBPACK_IMPORTED_MODULE_0__.getReferrerPolicy),
  getSiteDirective: () => (/* reexport safe */ _siteTests__WEBPACK_IMPORTED_MODULE_1__.getSiteDirective),
  initializeTracker: () => (/* reexport safe */ _forceReferrer__WEBPACK_IMPORTED_MODULE_0__.initializeTracker),
  isSameSite: () => (/* reexport safe */ _siteTests__WEBPACK_IMPORTED_MODULE_1__.isSameSite),
  storeReferrerPolicy: () => (/* reexport safe */ _forceReferrer__WEBPACK_IMPORTED_MODULE_0__.storeReferrerPolicy),
  updateTracker: () => (/* reexport safe */ _forceReferrer__WEBPACK_IMPORTED_MODULE_0__.updateTracker)
});
/* ESM import */var _forceReferrer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./forceReferrer */ "./src/shared/security/forceReferrer.ts");
/* ESM import */var _siteTests__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./siteTests */ "./src/shared/security/siteTests.ts");




}),
"./src/shared/security/siteTests.ts": 
/*!******************************************!*\
  !*** ./src/shared/security/siteTests.ts ***!
  \******************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  getPublicSuffixList: () => (getPublicSuffixList),
  getSiteDirective: () => (getSiteDirective),
  isSameSite: () => (isSameSite)
});
/* ESM import */var idb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! idb */ "./node_modules/.pnpm/idb@8.0.3/node_modules/idb/build/index.js");

// Cache every hour
const CACHE_DURATION_MINUTES = 60;
const CACHE_KEY = "publicSuffixList";
/**
 * Gets a connection to the IndexedDB database
 *
 * @returns Resolves to the database connection
 */ async function getDB() {
    return (0,idb__WEBPACK_IMPORTED_MODULE_0__.openDB)("$scramjet", 1);
}
/**
 * Gets cached Public Suffix List
 *
 * @returns Cached Public Suffix List data if not expired, or `null`
 */ async function getCachedSuffixList() {
    const db = await getDB();
    return await db.get("publicSuffixList", CACHE_KEY) || null;
}
/**
 * Stores public suffix list
 *
 * @param data Public Suffix list data to cache
 */ async function setCachedSuffixList(data) {
    const db = await getDB();
    await db.put("publicSuffixList", {
        data,
        expiry: Date.now() + CACHE_DURATION_MINUTES * 60 * 1000
    }, CACHE_KEY);
}
/**
 * Emulate `Sec-Fetch-Site` header using the referrer (another reason why Force Referrer is now a needed SJ feature)
 */ async function getSiteDirective(meta, referrerURL, client) {
    if (!referrerURL) {
        return "none";
    }
    if (meta.origin.origin === referrerURL.origin) {
        return "same-origin";
    }
    const sameSite = await isSameSite(meta.origin, referrerURL, client);
    if (sameSite) {
        return "same-site";
    }
    return "cross-site";
}
/**
 * Tests if the two URLs are from the same site.
 * This will be used in the response header rewriter.
 *
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Site
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site#directives
 *
 * @param url1 First URL to compare
 * @param url2 Second URL to compare
 * @param client `BareClient` instance used for fetching
 * @returns Whether the two URLs are from the same site
 *
 * @throws {Error} If an error occurs while getting the Public Suffix List
 */ async function isSameSite(url1, url2, client) {
    const registrableDomain1 = await getRegistrableDomain(url1, client);
    const registrableDomain2 = await getRegistrableDomain(url2, client);
    return registrableDomain1 === registrableDomain2;
}
/**
 * Gets the registrable domain (eTLD+1) for a URL
 * @param url URL to get registrable domain for
 * @param client `BareClient` instance for fetching public suffix list
 * @returns Registrable domain
 */ async function getRegistrableDomain(url, client) {
    const publicSuffixes = await getPublicSuffixList(client);
    const hostname = url.hostname.toLowerCase();
    const labels = hostname.split(".");
    let matchedSuffix = "";
    let isException = false;
    for (const suffix of publicSuffixes){
        const actualSuffix = suffix.startsWith("!") ? suffix.substring(1) : suffix;
        const suffixLabels = actualSuffix.split(".");
        if (matchesSuffix(labels, suffixLabels)) {
            if (suffix.startsWith("!")) {
                matchedSuffix = actualSuffix;
                isException = true;
                break;
            }
            if (!isException && actualSuffix.length > matchedSuffix.length) {
                matchedSuffix = actualSuffix;
            }
        }
    }
    if (!matchedSuffix) {
        return labels.slice(-2).join(".");
    }
    const suffixLabelCount = matchedSuffix.split(".").length;
    const domainLabelCount = isException ? suffixLabelCount : suffixLabelCount + 1;
    return labels.slice(-domainLabelCount).join(".");
}
/**
 * Checks if hostname labels match a suffix pattern
 * @param hostnameLabels Labels of the hostname (split by `.`)
 * @param suffixLabels Labels of the suffix pattern (split by `.`)
 * @returns Whether the hostname matches the suffix
 */ function matchesSuffix(hostnameLabels, suffixLabels) {
    if (hostnameLabels.length < suffixLabels.length) {
        return false;
    }
    const offset = hostnameLabels.length - suffixLabels.length;
    for(let i = 0; i < suffixLabels.length; i++){
        const hostLabel = hostnameLabels[offset + i];
        const suffixLabel = suffixLabels[i];
        if (suffixLabel === "*") {
            continue;
        }
        if (hostLabel !== suffixLabel) {
            return false;
        }
    }
    return true;
}
/**
 * Gets parsed Public Suffix list from the API.
 *
 * Complies with the standard format.
 * @see https://github.com/publicsuffix/list/wiki/Format#format
 *
 * @param {BareClient} client `BareClient` instance used for fetching
 * @returns {Promise<string[]>} Parsed Public Suffix list
 *
 * @throws {Error} If an error occurs while fetching from the Public Suffix List
 */ async function getPublicSuffixList(client) {
    const cached = await getCachedSuffixList();
    if (cached && Date.now() < cached.expiry) {
        return cached.data;
    }
    let publicSuffixesResponse;
    try {
        publicSuffixesResponse = await client.fetch("https://publicsuffix.org/list/public_suffix_list.dat");
    } catch (err) {
        throw new Error(`Failed to fetch public suffix list: ${err}`);
    }
    const publicSuffixesRaw = await publicSuffixesResponse.text();
    const publicSuffixes = publicSuffixesRaw.split("\n").map((line)=>{
        const trimmed = line.trim();
        const spaceIndex = trimmed.indexOf(" ");
        return spaceIndex > -1 ? trimmed.substring(0, spaceIndex) : trimmed;
    }).filter((line)=>line && !line.startsWith("//"));
    await setCachedSuffixList(publicSuffixes);
    return publicSuffixes;
}


}),
"./src/symbols.ts": 
/*!************************!*\
  !*** ./src/symbols.ts ***!
  \************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  SCRAMJETCLIENT: () => (SCRAMJETCLIENT),
  SCRAMJETCLIENTNAME: () => (SCRAMJETCLIENTNAME),
  SCRAMJETFRAME: () => (SCRAMJETFRAME)
});
/**
 * @fileoverview
 * See `types.ts` for context on these symbols.
 */ const SCRAMJETCLIENTNAME = "scramjet client global";
const SCRAMJETCLIENT = Symbol.for(SCRAMJETCLIENTNAME);
const SCRAMJETFRAME = Symbol.for("scramjet frame handle");


}),
"./src/worker/error.ts": 
/*!*****************************!*\
  !*** ./src/worker/error.ts ***!
  \*****************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  errorTemplate: () => (errorTemplate),
  renderError: () => (renderError)
});
function errorTemplate(trace, fetchedURL) {
    // turn script into a data URI so we don"t have to escape any HTML values
    const script = `
                errorTrace.value = ${JSON.stringify(trace)};
                fetchedURL.textContent = ${JSON.stringify(fetchedURL)};
                for (const node of document.querySelectorAll("#hostname")) node.textContent = ${JSON.stringify(location.hostname)};
                reload.addEventListener("click", () => location.reload());
                version.textContent = ${JSON.stringify(globalThis.$scramjetVersion?.version || "unknown")};
                build.textContent = ${JSON.stringify(globalThis.$scramjetVersion?.build || "unknown")};

                document.getElementById('copy-button').addEventListener('click', async () => {
                    const text = document.getElementById('errorTrace').value;
                    await navigator.clipboard.writeText(text);
                    const btn = document.getElementById('copy-button');
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
        `;
    return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Scramjet</title>
                    <style>
                    :root {
                        --deep: #080602;
                        --shallow: #181412;
                        --beach: #f1e8e1;
                        --shore: #b1a8a1;
                        --accent: #ffa938;
                        --font-sans: -apple-system, system-ui, BlinkMacSystemFont, sans-serif;
                        --font-monospace: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    }

                    *:not(div,p,span,ul,li,i,span) {
                        background-color: var(--deep);
                        color: var(--beach);
                        font-family: var(--font-sans);
                    }

                    textarea,
                    button {
                        background-color: var(--shallow);
                        border-radius: 0.6em;
                        padding: 0.6em;
                        border: none;
                        appearance: none;
                        font-family: var(--font-sans);
                        color: var(--beach);
                    }

                    button.primary {
                        background-color: var(--accent);
                        color: var(--deep);
                        font-weight: bold;
                    }

                    textarea {
                        resize: none;
                        height: 20em;
                        text-align: left;
                        font-family: var(--font-monospace);
                    }

                    body {
                        width: 100vw;
                        height: 100vh;
                        justify-content: center;
                        align-items: center;
                    }

                    body,
                    html,
                    #inner {
                        display: flex;
                        align-items: center;
                        flex-direction: column;
                        gap: 0.5em;
                        overflow: hidden;
                    }

                    #inner {
                        z-index: 100;
                    }

                    #cover {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        background-color: color-mix(in srgb, var(--deep) 70%, transparent);
                        z-index: 99;
                    }

                    #info {
                        display: flex;
                        flex-direction: row;
                        align-items: flex-start;
                        gap: 1em;
                    }

                    #version-wrapper {
                        width: auto;
                        text-align: right;
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;
                        font-size: 0.8rem;
                        color: var(--shore)!important;
                        i {
                            background-color: color-mix(in srgb, var(--deep), transparent 50%);
                            border-radius: 9999px;
                            padding: 0.2em 0.5em;
                        }
                        z-index: 101;
                    }

                    #errorTrace-wrapper {
                        position: relative;
                        width: fit-content;
                    }

                    #copy-button {
                        position: absolute;
                        top: 0.5em;
                        right: 0.5em;
                        padding: 0.23em;
                        cursor: pointer;
                        opacity: 0;
                        transition: opacity 0.4s;
                        font-size: 0.9em;
                    }

                    #errorTrace-wrapper:hover #copy-button {
                        opacity: 1;
                    }
                    </style>
                </head>
                <body>
                    <div id="cover"></div>
                    <div id="inner">
                        <h1 id="errorTitle">Uh oh!</h1>
                        <p>There was an error loading <b id="fetchedURL"></b></p>
                        <!-- <p id="errorMessage">Internal Server Error</p> -->

                        <div id="info">
                            <div id="errorTrace-wrapper">
                                <textarea id="errorTrace" cols="40" rows="10" readonly></textarea>
                                <button id="copy-button" class="primary">Copy</button>
                            </div>
                            <div id="troubleshooting">
                                <p>Try:</p>
                                <ul>
                                    <li>Checking your internet connection</li>
                                    <li>Verifying you entered the correct address</li>
                                    <li>Clearing the site data</li>
                                    <li>Contacting <b id="hostname"></b>'s administrator</li>
                                    <li>Verify the server isn't censored</li>
                                </ul>
                                <p>If you're the administrator of <b id="hostname"></b>, try:</p>
                                    <ul>
                                    <li>Restarting your server</li>
                                    <li>Updating Scramjet</li>
                                    <li>Troubleshooting the error on the <a href="https://github.com/MercuryWorkshop/scramjet" target="_blank">GitHub repository</a></li>
                                </ul>
                            </div>
                        </div>
                        <br>
                        <button id="reload" class="primary">Reload</button>
                    </div>
                    <p id="version-wrapper"><i>Scramjet v<span id="version"></span> (build <span id="build"></span>)</i></p>
                    <script src="${"data:application/javascript," + encodeURIComponent(script)}"></script>
                </body>
            </html>
        `;
}
function renderError(err, fetchedURL) {
    const headers = {
        "content-type": "text/html"
    };
    if (crossOriginIsolated) {
        headers["Cross-Origin-Embedder-Policy"] = "require-corp";
    }
    return new Response(errorTemplate(String(err), fetchedURL), {
        status: 500,
        headers: headers
    });
}


}),
"./src/worker/fakesw.ts": 
/*!******************************!*\
  !*** ./src/worker/fakesw.ts ***!
  \******************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  FakeServiceWorker: () => (FakeServiceWorker)
});
class FakeServiceWorker {
    handle;
    origin;
    syncToken = 0;
    promises = {};
    messageChannel = new MessageChannel();
    connected = false;
    constructor(handle, origin){
        this.handle = handle;
        this.origin = origin;
        this.messageChannel.port1.addEventListener("message", (event)=>{
            if ("scramjet$type" in event.data) {
                if (event.data.scramjet$type === "init") {
                    this.connected = true;
                } else {
                    this.handleMessage(event.data);
                }
            }
        });
        this.messageChannel.port1.start();
        this.handle.postMessage({
            scramjet$type: "init",
            scramjet$port: this.messageChannel.port2
        }, [
            this.messageChannel.port2
        ]);
    }
    handleMessage(data) {
        const cb = this.promises[data.scramjet$token];
        if (cb) {
            cb(data);
            delete this.promises[data.scramjet$token];
        }
    }
    async fetch(request) {
        const token = this.syncToken++;
        const message = {
            scramjet$type: "fetch",
            scramjet$token: token,
            scramjet$request: {
                url: request.url,
                body: request.body,
                headers: Array.from(request.headers.entries()),
                method: request.method,
                mode: request.mode,
                destinitation: request.destination
            }
        };
        const transfer = request.body ? [
            request.body
        ] : [];
        this.handle.postMessage(message, transfer);
        const { scramjet$response: r } = await new Promise((resolve)=>{
            this.promises[token] = resolve;
        });
        if (!r) return false;
        return new Response(r.body, {
            headers: r.headers,
            status: r.status,
            statusText: r.statusText
        });
    }
}


}),
"./src/worker/fetch.ts": 
/*!*****************************!*\
  !*** ./src/worker/fetch.ts ***!
  \*****************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ScramjetHandleResponseEvent: () => (ScramjetHandleResponseEvent),
  ScramjetRequestEvent: () => (ScramjetRequestEvent),
  handleFetch: () => (handleFetch)
});
/* ESM import */var _worker_error__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/worker/error */ "./src/worker/error.ts");
/* ESM import */var _shared_security_siteTests__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/shared/security/siteTests */ "./src/shared/security/siteTests.ts");
/* ESM import */var _shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/shared/security/forceReferrer */ "./src/shared/security/forceReferrer.ts");
/* ESM import */var _rewriters_url__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @rewriters/url */ "./src/shared/rewriters/url.ts");
/* ESM import */var _rewriters_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @rewriters/js */ "./src/shared/rewriters/js.ts");
/* ESM import */var _shared_headers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/shared/headers */ "./src/shared/headers.ts");
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _rewriters_headers__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @rewriters/headers */ "./src/shared/rewriters/headers.ts");
/* ESM import */var _rewriters_html__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @rewriters/html */ "./src/shared/rewriters/html.ts");
/* ESM import */var _rewriters_css__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @rewriters/css */ "./src/shared/rewriters/css.ts");
/* ESM import */var _rewriters_worker__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @rewriters/worker */ "./src/shared/rewriters/worker.ts");
/* provided dependency */ var dbg = __webpack_require__(/*! ./src/log.ts */ "./src/log.ts")["default"];











function isRedirect(response) {
    return response.status >= 300 && response.status < 400;
}
function isDownload(responseHeaders, destination) {
    if ([
        "document",
        "iframe"
    ].includes(destination)) {
        const header = responseHeaders["content-disposition"];
        if (header) {
            if (header === "inline") {
                return false; // force it to show in browser
            } else {
                return true;
            }
        } else {
            // check mime type as fallback
            const displayableMimes = [
                // Text types
                "text/html",
                "text/plain",
                "text/css",
                "text/javascript",
                "text/xml",
                "application/javascript",
                "application/json",
                "application/xml",
                "application/pdf"
            ];
            const contentType = responseHeaders["content-type"]?.split(";")[0].trim().toLowerCase();
            if (contentType && !displayableMimes.includes(contentType) && !contentType.startsWith("text") && !contentType.startsWith("image") && !contentType.startsWith("font") && !contentType.startsWith("video")) {
                return true;
            }
        }
    }
    return false;
}
async function handleFetch(request, client) {
    try {
        const requestUrl = new URL(request.url);
        if (requestUrl.pathname === this.config.files.wasm) {
            return fetch(this.config.files.wasm).then(async (x)=>{
                const buf = await x.arrayBuffer();
                const b64 = btoa(new Uint8Array(buf).reduce((data, byte)=>(data.push(String.fromCharCode(byte)), data), []).join(""));
                let payload = "";
                payload += "if ('document' in self && document.currentScript) { document.currentScript.remove(); }\n";
                payload += `self.WASM = '${b64}';`;
                return new Response(payload, {
                    headers: {
                        "content-type": "text/javascript"
                    }
                });
            });
        }
        let scriptType = "";
        let topFrameName;
        let parentFrameName;
        const extraParams = {};
        for (const [param, value] of [
            ...requestUrl.searchParams.entries()
        ]){
            switch(param){
                case "type":
                    scriptType = value;
                    break;
                case "dest":
                    break;
                case "topFrame":
                    topFrameName = value;
                    break;
                case "parentFrame":
                    parentFrameName = value;
                    break;
                default:
                    dbg.warn(`${requestUrl.href} extraneous query parameter ${param}. Assuming <form> element`);
                    extraParams[param] = value;
                    break;
            }
            requestUrl.searchParams.delete(param);
        }
        const url = new URL((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.unrewriteUrl)(requestUrl));
        // now that we're past unrewriting it's safe to add back the params
        for (const [param, value] of Object.entries(extraParams)){
            url.searchParams.set(param, value);
        }
        const meta = {
            origin: url,
            base: url,
            topFrameName,
            parentFrameName
        };
        if (requestUrl.pathname.startsWith(`${this.config.prefix}blob:`) || requestUrl.pathname.startsWith(`${this.config.prefix}data:`)) {
            let dataUrl = requestUrl.pathname.substring(this.config.prefix.length);
            if (dataUrl.startsWith("blob:")) {
                dataUrl = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.unrewriteBlob)(dataUrl);
            }
            const response = await fetch(dataUrl, {});
            const url = dataUrl.startsWith("blob:") ? dataUrl : "(data url)";
            response.finalURL = url;
            let body;
            if (response.body) {
                body = await rewriteBody(response, meta, request.destination, scriptType, this.cookieStore);
            }
            const headers = Object.fromEntries(response.headers.entries());
            if (crossOriginIsolated) {
                headers["Cross-Origin-Opener-Policy"] = "same-origin";
                headers["Cross-Origin-Embedder-Policy"] = "require-corp";
            }
            return new Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });
        }
        const activeWorker = this.serviceWorkers.find((w)=>w.origin === url.origin);
        if (activeWorker?.connected && requestUrl.searchParams.get("from") !== "swruntime") {
            // TODO: check scope
            const r = await activeWorker.fetch(request);
            if (r) return r;
        }
        if (url.origin === new URL(request.url).origin) {
            throw new Error("attempted to fetch from same origin - this means the site has obtained a reference to the real origin, aborting");
        }
        const headers = new _shared_headers__WEBPACK_IMPORTED_MODULE_5__.ScramjetHeaders();
        for (const [key, value] of request.headers.entries()){
            headers.set(key, value);
        }
        if (client && new URL(client.url).pathname.startsWith(_shared__WEBPACK_IMPORTED_MODULE_6__.config.prefix)) {
            // TODO: i was against cors emulation but we might actually break stuff if we send full origin/referrer always
            const clientURL = new URL((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.unrewriteUrl)(client.url));
            if (clientURL.toString().includes("youtube.com")) {
            // console.log(headers);
            } else {
                // Force referrer to unsafe-url for all requests
                headers.set("Referer", clientURL.href);
                headers.set("Origin", clientURL.origin);
            }
        }
        const cookies = this.cookieStore.getCookies(url, false);
        if (cookies.length) {
            headers.set("Cookie", cookies);
        }
        // Check if we should emulate a top-level navigation
        let isTopLevelProxyNavigation = false;
        if (request.destination === "iframe" && request.mode === "navigate" && request.referrer && request.referrer !== "no-referrer" && request.referrer !== location.origin + _shared__WEBPACK_IMPORTED_MODULE_6__.config.prefix + "no-referrer") {
            // Trace back through the referrer chain, checking if each was an iframe navigation using the clients, until we find a non-iframe parent on a non-proxy page
            let currentReferrer = request.referrer;
            const allClients = await self.clients.matchAll({
                type: "window"
            });
            // Trace backwards
            while(currentReferrer){
                if (!currentReferrer.includes(_shared__WEBPACK_IMPORTED_MODULE_6__.config.prefix)) {
                    isTopLevelProxyNavigation = true;
                    break;
                }
                // Find the parent for this iteration
                const parentChainClient = allClients.find((c)=>c.url === currentReferrer);
                // Get the next referrer policy that applies to this parent
                // eslint-disable-next-line no-await-in-loop
                const parentPolicyData = await (0,_shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.getReferrerPolicy)(currentReferrer);
                if (!parentPolicyData || !parentPolicyData.referrer) {
                    // Check if this ends at the proxy origin
                    if (parentChainClient && currentReferrer.startsWith(location.origin)) {
                        isTopLevelProxyNavigation = true;
                    }
                    break;
                }
                // Check if this was an iframe navigation by looking at the client
                if (parentChainClient && parentChainClient.frameType === "nested") {
                    // Continue checking the chain
                    currentReferrer = parentPolicyData.referrer;
                } else {
                    break;
                }
            }
        }
        if (isTopLevelProxyNavigation) {
            headers.set("Sec-Fetch-Dest", "document");
            headers.set("Sec-Fetch-Mode", "navigate");
        } else {
            // Convert empty destination to "empty" string per spec
            headers.set("Sec-Fetch-Dest", request.destination || "empty");
            headers.set("Sec-Fetch-Mode", request.mode);
        }
        let siteDirective = "none";
        if (request.referrer && request.referrer !== "" && request.referrer !== "no-referrer" && request.referrer !== location.origin + _shared__WEBPACK_IMPORTED_MODULE_6__.config.prefix + "no-referrer") {
            if (request.referrer.includes(_shared__WEBPACK_IMPORTED_MODULE_6__.config.prefix)) {
                const unrewrittenReferrer = (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.unrewriteUrl)(request.referrer);
                if (unrewrittenReferrer) {
                    const referrerUrl = new URL(unrewrittenReferrer);
                    siteDirective = await (0,_shared_security_siteTests__WEBPACK_IMPORTED_MODULE_1__.getSiteDirective)(meta, referrerUrl, this.client);
                }
            }
        }
        await (0,_shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.initializeTracker)(url.toString(), request.referrer ? (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.unrewriteUrl)(request.referrer) : null, siteDirective);
        headers.set("Sec-Fetch-Site", await (0,_shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.getMostRestrictiveSite)(url.toString(), siteDirective));
        const ev = new ScramjetRequestEvent(url, headers.headers, request.body, request.method, request.destination, client);
        this.dispatchEvent(ev);
        const response = await ev.response || await this.client.fetch(ev.url, {
            method: ev.method,
            body: ev.body,
            headers: ev.requestHeaders,
            credentials: "omit",
            mode: request.mode === "cors" ? request.mode : "same-origin",
            cache: request.cache,
            redirect: "manual",
            // @ts-ignore why the fuck is this not typed microsoft
            duplex: "half"
        });
        response.finalURL = ev.url.href;
        return await handleResponse(url, meta, scriptType, request.destination, request.mode, response, this.cookieStore, client, this.client, this, request.referrer);
    } catch (err) {
        const errorDetails = {
            message: err.message,
            url: request.url,
            destination: request.destination
        };
        if (err.stack) {
            errorDetails["stack"] = err.stack;
        }
        console.error("ERROR FROM SERVICE WORKER FETCH: ", errorDetails);
        console.error(err);
        if (![
            "document",
            "iframe"
        ].includes(request.destination)) return new Response(undefined, {
            status: 500
        });
        const formattedError = Object.entries(errorDetails).map(([key, value])=>`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join("\n\n");
        return (0,_worker_error__WEBPACK_IMPORTED_MODULE_0__.renderError)(formattedError, (0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.unrewriteUrl)(request.url));
    }
}
async function handleResponse(url, meta, scriptType, destination, mode, response, cookieStore, client, bareClient, swtarget, referrer) {
    let responseBody;
    // response.rawHeaders = {};
    // for (let h of response.raw_headers) {
    // 	const key = h[0];
    // 	const value = h[1];
    // 	if (response.rawHeaders[key] === undefined) {
    // 		response.rawHeaders[key] = value;
    // 	} else if (Array.isArray(response.rawHeaders[key])) {
    // 		(response.rawHeaders[key] as string[]).push(value);
    // 	} else {
    // 		response.rawHeaders[key] = [response.rawHeaders[key] as string, value];
    // 	}
    // }
    const isNavigationRequest = mode === "navigate" && [
        "document",
        "iframe"
    ].includes(destination);
    const responseHeaders = await (0,_rewriters_headers__WEBPACK_IMPORTED_MODULE_7__.rewriteHeaders)(response.rawHeaders, meta, bareClient, {
        get: _shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.getReferrerPolicy,
        set: _shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.storeReferrerPolicy
    });
    // Store referrer policy from navigation responses for Force Referrer
    if (isNavigationRequest && responseHeaders["referrer-policy"] && referrer) {
        await (0,_shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.storeReferrerPolicy)(url.href, responseHeaders["referrer-policy"], referrer);
    }
    if (isRedirect(response)) {
        const redirectUrl = new URL((0,_rewriters_url__WEBPACK_IMPORTED_MODULE_3__.unrewriteUrl)(responseHeaders["location"]));
        await (0,_shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.updateTracker)(url.toString(), redirectUrl.toString(), responseHeaders["referrer-policy"]);
        const redirectMeta = {
            origin: redirectUrl,
            base: redirectUrl
        };
        const newSiteDirective = await (0,_shared_security_siteTests__WEBPACK_IMPORTED_MODULE_1__.getSiteDirective)(redirectMeta, url, bareClient);
        await (0,_shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.getMostRestrictiveSite)(redirectUrl.toString(), newSiteDirective);
        // ensure that ?type=module is not lost in a redirect
        if (scriptType) {
            const url = new URL(responseHeaders["location"]);
            url.searchParams.set("type", scriptType);
            responseHeaders["location"] = url.href;
        }
    }
    const maybeHeaders = responseHeaders["set-cookie"] || [];
    for(const cookie in maybeHeaders){
        if (client) {
            const promise = swtarget.dispatch(client, {
                scramjet$type: "cookie",
                cookie,
                url: url.href
            });
            if (destination !== "document" && destination !== "iframe") {
                await promise;
            }
        }
    }
    await cookieStore.setCookies(maybeHeaders instanceof Array ? maybeHeaders : [
        maybeHeaders
    ], url);
    for(const header in responseHeaders){
        // flatten everything past here
        if (Array.isArray(responseHeaders[header])) responseHeaders[header] = responseHeaders[header][0];
    }
    if (isDownload(responseHeaders, destination) && !isRedirect(response)) {
        if ((0,_shared__WEBPACK_IMPORTED_MODULE_6__.flagEnabled)("interceptDownloads", url)) {
            if (!client) {
                throw new Error("cant find client");
            }
            let filename = null;
            const disp = responseHeaders["content-disposition"];
            if (typeof disp === "string") {
                const filenameMatch = disp.match(/filename=["']?([^"';\n]*)["']?/i);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            const length = responseHeaders["content-length"];
            // there's no reliable way of finding the top level client that made the request
            // just take the first one and hope
            let clis = await clients.matchAll({});
            // only want controller windows
            clis = clis.filter((e)=>!e.url.includes(_shared__WEBPACK_IMPORTED_MODULE_6__.config.prefix));
            if (clis.length < 1) {
                throw Error("couldn't find a controller client to dispatch download to");
            }
            const download = {
                filename,
                url: url.href,
                type: responseHeaders["content-type"],
                body: response.body,
                length: Number(length)
            };
            clis[0].postMessage({
                scramjet$type: "download",
                download
            }, [
                response.body
            ]);
            // endless vortex reference
            await new Promise(()=>{});
        } else {
            // manually rewrite for regular browser download
            const header = responseHeaders["content-disposition"];
            // validate header and test for filename
            if (!/\s*?((inline|attachment);\s*?)filename=/i.test(header)) {
                // if filename= wasn"t specified then maybe the remote specified to download this as an attachment?
                // if it"s invalid then we can still possibly test for the attachment/inline type
                const type = /^\s*?attachment/i.test(header) ? "attachment" : "inline";
                // set the filename
                const [filename] = new URL(response.finalURL).pathname.split("/").slice(-1);
                responseHeaders["content-disposition"] = `${type}; filename=${JSON.stringify(filename)}`;
            }
        }
    }
    if (response.body && !isRedirect(response)) {
        responseBody = await rewriteBody(response, meta, destination, scriptType, cookieStore);
    }
    if (responseHeaders["accept"] === "text/event-stream") {
        responseHeaders["content-type"] = "text/event-stream";
    }
    // scramjet runtime can use features that permissions-policy blocks
    delete responseHeaders["permissions-policy"];
    if (crossOriginIsolated && [
        "document",
        "iframe",
        "worker",
        "sharedworker",
        "style",
        "script"
    ].includes(destination)) {
        responseHeaders["Cross-Origin-Embedder-Policy"] = "require-corp";
        responseHeaders["Cross-Origin-Opener-Policy"] = "same-origin";
    }
    const ev = new ScramjetHandleResponseEvent(responseBody, responseHeaders, response.status, response.statusText, destination, url, response, client);
    swtarget.dispatchEvent(ev);
    // Clean up tracker if not a redirect
    if (!isRedirect(response)) {
        await (0,_shared_security_forceReferrer__WEBPACK_IMPORTED_MODULE_2__.cleanTracker)(url.toString());
    }
    return new Response(ev.responseBody, {
        headers: ev.responseHeaders,
        status: ev.status,
        statusText: ev.statusText
    });
}
async function rewriteBody(response, meta, destination, workertype, cookieStore) {
    switch(destination){
        case "iframe":
        case "document":
            if (response.headers.get("content-type")?.startsWith("text/html")) {
                // note from percs: i think this has the potential to be slow asf, but for right now its fine (we should probably look for a better solution)
                // another note from percs: regex seems to be broken, gonna comment this out
                /*
        const buf = await response.arrayBuffer();
        const decode = new TextDecoder("utf-8").decode(buf);
        const charsetHeader = response.headers.get("content-type");
        const charset =
          charsetHeader?.split("charset=")[1] ||
          decode.match(/charset=([^"]+)/)?.[1] ||
          "utf-8";
        const htmlContent = charset
          ? new TextDecoder(charset).decode(buf)
          : decode;
        */ return (0,_rewriters_html__WEBPACK_IMPORTED_MODULE_8__.rewriteHtml)(await response.text(), cookieStore, meta, true);
            } else {
                return response.body;
            }
        case "script":
            {
                return (0,_rewriters_js__WEBPACK_IMPORTED_MODULE_4__.rewriteJs)(new Uint8Array(await response.arrayBuffer()), response.finalURL, meta, workertype === "module");
            }
        case "style":
            return (0,_rewriters_css__WEBPACK_IMPORTED_MODULE_9__.rewriteCss)(await response.text(), meta);
        case "sharedworker":
        case "worker":
            return (0,_rewriters_worker__WEBPACK_IMPORTED_MODULE_10__.rewriteWorkers)(new Uint8Array(await response.arrayBuffer()), workertype, response.finalURL, meta);
        default:
            return response.body;
    }
}
class ScramjetHandleResponseEvent extends Event {
    responseBody;
    responseHeaders;
    status;
    statusText;
    destination;
    url;
    rawResponse;
    client;
    constructor(responseBody, responseHeaders, status, statusText, destination, url, rawResponse, client){
        super("handleResponse"), this.responseBody = responseBody, this.responseHeaders = responseHeaders, this.status = status, this.statusText = statusText, this.destination = destination, this.url = url, this.rawResponse = rawResponse, this.client = client;
    }
}
class ScramjetRequestEvent extends Event {
    url;
    requestHeaders;
    body;
    method;
    destination;
    client;
    constructor(url, requestHeaders, body, method, destination, client){
        super("request"), this.url = url, this.requestHeaders = requestHeaders, this.body = body, this.method = method, this.destination = destination, this.client = client;
    }
    response;
}


}),
"./src/worker/index.ts": 
/*!*****************************!*\
  !*** ./src/worker/index.ts ***!
  \*****************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  FakeServiceWorker: () => (/* reexport safe */ _worker_fakesw__WEBPACK_IMPORTED_MODULE_0__.FakeServiceWorker),
  ScramjetHandleResponseEvent: () => (/* reexport safe */ _worker_fetch__WEBPACK_IMPORTED_MODULE_1__.ScramjetHandleResponseEvent),
  ScramjetRequestEvent: () => (/* reexport safe */ _worker_fetch__WEBPACK_IMPORTED_MODULE_1__.ScramjetRequestEvent),
  ScramjetServiceWorker: () => (ScramjetServiceWorker),
  errorTemplate: () => (/* reexport safe */ _error__WEBPACK_IMPORTED_MODULE_7__.errorTemplate),
  handleFetch: () => (/* reexport safe */ _worker_fetch__WEBPACK_IMPORTED_MODULE_1__.handleFetch),
  renderError: () => (/* reexport safe */ _error__WEBPACK_IMPORTED_MODULE_7__.renderError)
});
/* ESM import */var _worker_fakesw__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/worker/fakesw */ "./src/worker/fakesw.ts");
/* ESM import */var _worker_fetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/worker/fetch */ "./src/worker/fetch.ts");
/* ESM import */var _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mercuryworkshop/bare-mux */ "./node_modules/.pnpm/@mercuryworkshop+bare-mux@2.1.7/node_modules/@mercuryworkshop/bare-mux/dist/index.mjs");
/* ESM import */var _rewriters_wasm__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @rewriters/wasm */ "./src/shared/rewriters/wasm.ts");
/* ESM import */var _shared_cookie__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/shared/cookie */ "./src/shared/cookie.ts");
/* ESM import */var idb__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! idb */ "./node_modules/.pnpm/idb@8.0.3/node_modules/idb/build/index.js");
/* ESM import */var _shared__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/shared */ "./src/shared/index.ts");
/* ESM import */var _error__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./error */ "./src/worker/error.ts");
/**
 * @fileoverview Contains the core Service Worker logic for Scramjet, which handles the initial request interception and handles client management for the Scramjet service.
 */ 









/**
 * Main `ScramjetServiceWorker` class created by the `$scramjetLoadWorker` factory, which handles routing the proxy and contains the core logic for request interception.
 */ class ScramjetServiceWorker extends EventTarget {
    /**
	 * `BareClient` instance to fetch requests under a chosen proxy transport.
	 */ client;
    /**
	 * Current ScramjetConfig saved in memory.
	 */ config;
    /**
	 * Recorded sync messages in the message queue.
	 */ syncPool = {};
    /**
	 * Current sync token for collected messages in the queue.
	 */ synctoken = 0;
    /**
	 * Scramjet's cookie jar for cookie emulation through other storage means, connected to a client.
	 */ cookieStore = new _shared_cookie__WEBPACK_IMPORTED_MODULE_4__.CookieStore();
    /**
	 * Fake service worker registrations, so that some sites don't complain.
	 * This will eventually be replaced with a NestedSW feature under a flag in the future, but this will remain for stability even then.
	 */ serviceWorkers = [];
    /**
	 * Initializes the `BareClient` Scramjet uses to fetch requests under a chosen proxy transport, the cookie jar store for proxifying cookies, and inits the listeners for emulation features and dynamic configs set through the Scramjet Controller.
	 */ constructor(){
        super();
        this.client = new _mercuryworkshop_bare_mux__WEBPACK_IMPORTED_MODULE_2__["default"]();
        (async ()=>{
            const db = await (0,idb__WEBPACK_IMPORTED_MODULE_5__.openDB)("$scramjet", 1);
            const cookies = await db.get("cookies", "cookies");
            if (cookies) {
                this.cookieStore.load(cookies);
            }
        })();
        addEventListener("message", async ({ data })=>{
            if (!("scramjet$type" in data)) return;
            if ("scramjet$token" in data) {
                // (ack message)
                const cb = this.syncPool[data.scramjet$token];
                delete this.syncPool[data.scramjet$token];
                cb(data);
                return;
            }
            if (data.scramjet$type === "registerServiceWorker") {
                this.serviceWorkers.push(new _worker_fakesw__WEBPACK_IMPORTED_MODULE_0__.FakeServiceWorker(data.port, data.origin));
                return;
            }
            if (data.scramjet$type === "cookie") {
                this.cookieStore.setCookies([
                    data.cookie
                ], new URL(data.url));
                const db = await (0,idb__WEBPACK_IMPORTED_MODULE_5__.openDB)("$scramjet", 1);
                await db.put("cookies", JSON.parse(this.cookieStore.dump()), "cookies");
            }
            if (data.scramjet$type === "loadConfig") {
                this.config = data.config;
            }
        });
    }
    /**
	 * Dispatches a message in the message queues.
	 */ async dispatch(client, data) {
        const token = this.synctoken++;
        let cb;
        const promise = new Promise((r)=>cb = r);
        this.syncPool[token] = cb;
        data.scramjet$token = token;
        client.postMessage(data);
        return await promise;
    }
    /**
	 * Persists the current Scramjet config into an IndexedDB store.
	 * Remember, this is because the Scramjet config can be dynamically updated via the Scramjet Controller APIs.
	 *
	 * @example
	 * self.addEventListener("fetch", async (ev) => {
	 *   await scramjet.loadConfig();
	 *
	 *   ...
	 * });
	 */ async loadConfig() {
        if (this.config) return;
        const db = await (0,idb__WEBPACK_IMPORTED_MODULE_5__.openDB)("$scramjet", 1);
        this.config = await db.get("config", "config");
        if (this.config) {
            (0,_shared__WEBPACK_IMPORTED_MODULE_6__.setConfig)(this.config);
            await (0,_rewriters_wasm__WEBPACK_IMPORTED_MODULE_3__.asyncSetWasm)();
        }
    }
    /**
	 * Whether to route a request from a `FetchEvent` in Scramjet.
	 *
	 * @example
	 * self.addEventListener("fetch", async (ev) => {
	 *   ...
	 *
	 *   if (scramjet.route(ev)) {
	 *     ...
	 *   }
	 * });
	 * ```
	 */ route({ request }) {
        if (request.url.startsWith(location.origin + this.config.prefix)) return true;
        else if (request.url.startsWith(location.origin + this.config.files.wasm)) return true;
        else return false;
    }
    /**
	 * Handles a `FetchEvent` to be routed in Scramjet.
	 * This is the heart of adding Scramjet support to your web proxy.
	 *
	 * @example
	 * self.addEventListener("fetch", async (ev) => {
	 *   ...
	 *
	 *   if (scramjet.route(ev)) {
	 *     ev.respondWith(scramjet.fetch(ev));
	 *   }
	 * });
	 */ async fetch({ request, clientId }) {
        if (!this.config) await this.loadConfig();
        const client = await self.clients.get(clientId);
        return _worker_fetch__WEBPACK_IMPORTED_MODULE_1__.handleFetch.call(this, request, client);
    }
}


}),
"./node_modules/.pnpm/@mercuryworkshop+bare-mux@2.1.7/node_modules/@mercuryworkshop/bare-mux/dist/index.mjs": 
/*!******************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/@mercuryworkshop+bare-mux@2.1.7/node_modules/@mercuryworkshop/bare-mux/dist/index.mjs ***!
  \******************************************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  BareClient: () => (k),
  BareMuxConnection: () => (m),
  BareWebSocket: () => (w),
  WebSocketFields: () => (n),
  WorkerConnection: () => (p),
  browserSupportsTransferringStreams: () => (d),
  "default": () => (k),
  maxRedirects: () => (e),
  validProtocol: () => (g)
});
const e=20,t=globalThis.fetch,r=globalThis.SharedWorker,a=globalThis.localStorage,s=globalThis.navigator.serviceWorker,o=MessagePort.prototype.postMessage,n={prototype:{send:WebSocket.prototype.send},CLOSED:WebSocket.CLOSED,CLOSING:WebSocket.CLOSING,CONNECTING:WebSocket.CONNECTING,OPEN:WebSocket.OPEN};async function c(){const e=(await self.clients.matchAll({type:"window",includeUncontrolled:!0})).map((async e=>{const t=await function(e){let t=new MessageChannel;return new Promise((r=>{e.postMessage({type:"getPort",port:t.port2},[t.port2]),t.port1.onmessage=e=>{r(e.data)}}))}(e);return await i(t),t})),t=Promise.race([Promise.any(e),new Promise(((e,t)=>setTimeout(t,1e3,new TypeError("timeout"))))]);try{return await t}catch(e){if(e instanceof AggregateError)throw console.error("bare-mux: failed to get a bare-mux SharedWorker MessagePort as all clients returned an invalid MessagePort."),new Error("All clients returned an invalid MessagePort.");return console.warn("bare-mux: failed to get a bare-mux SharedWorker MessagePort within 1s, retrying"),await c()}}function i(e){const t=new MessageChannel,r=new Promise(((e,r)=>{t.port1.onmessage=t=>{"pong"===t.data.type&&e()},setTimeout(r,1500)}));return o.call(e,{message:{type:"ping"},port:t.port2},[t.port2]),r}function l(e,t){const a=new r(e,"bare-mux-worker");return t&&s.addEventListener("message",(t=>{if("getPort"===t.data.type&&t.data.port){console.debug("bare-mux: recieved request for port from sw");const a=new r(e,"bare-mux-worker");o.call(t.data.port,a.port,[a.port])}})),a.port}let h=null;function d(){if(null===h){const e=new MessageChannel,t=new ReadableStream;let r;try{o.call(e.port1,t,[t]),r=!0}catch(e){r=!1}return h=r,r}return h}class p{constructor(e){this.channel=new BroadcastChannel("bare-mux"),e instanceof MessagePort||e instanceof Promise?this.port=e:this.createChannel(e,!0)}createChannel(e,t){if(self.clients)this.port=c(),this.channel.onmessage=e=>{"refreshPort"===e.data.type&&(this.port=c())};else if(e&&SharedWorker){if(!e.startsWith("/")&&!e.includes("://"))throw new Error("Invalid URL. Must be absolute or start at the root.");this.port=l(e,t),console.debug("bare-mux: setting localStorage bare-mux-path to",e),a["bare-mux-path"]=e}else{if(!SharedWorker)throw new Error("Unable to get a channel to the SharedWorker.");{const e=a["bare-mux-path"];if(console.debug("bare-mux: got localStorage bare-mux-path:",e),!e)throw new Error("Unable to get bare-mux workerPath from localStorage.");this.port=l(e,t)}}}async sendMessage(e,t){this.port instanceof Promise&&(this.port=await this.port);try{await i(this.port)}catch{return console.warn("bare-mux: Failed to get a ping response from the worker within 1.5s. Assuming port is dead."),this.createChannel(),await this.sendMessage(e,t)}const r=new MessageChannel,a=[r.port2,...t||[]],s=new Promise(((e,t)=>{r.port1.onmessage=r=>{const a=r.data;"error"===a.type?t(a.error):e(a)}}));return o.call(this.port,{message:e,port:r.port2},a),await s}}class w extends EventTarget{constructor(e,t=[],r,a){super(),this.protocols=t,this.readyState=n.CONNECTING,this.url=e.toString(),this.protocols=t;const s=e=>{this.protocols=e,this.readyState=n.OPEN;const t=new Event("open");this.dispatchEvent(t)},o=async e=>{const t=new MessageEvent("message",{data:e});this.dispatchEvent(t)},c=(e,t)=>{this.readyState=n.CLOSED;const r=new CloseEvent("close",{code:e,reason:t});this.dispatchEvent(r)},i=()=>{this.readyState=n.CLOSED;const e=new Event("error");this.dispatchEvent(e)};this.channel=new MessageChannel,this.channel.port1.onmessage=e=>{"open"===e.data.type?s(e.data.args[0]):"message"===e.data.type?o(e.data.args[0]):"close"===e.data.type?c(e.data.args[0],e.data.args[1]):"error"===e.data.type&&i()},r.sendMessage({type:"websocket",websocket:{url:e.toString(),protocols:t,requestHeaders:a,channel:this.channel.port2}},[this.channel.port2])}send(...e){if(this.readyState===n.CONNECTING)throw new DOMException("Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.");let t=e[0];t.buffer&&(t=t.buffer.slice(t.byteOffset,t.byteOffset+t.byteLength)),o.call(this.channel.port1,{type:"data",data:t},t instanceof ArrayBuffer?[t]:[])}close(e,t){o.call(this.channel.port1,{type:"close",closeCode:e,closeReason:t})}}function u(e,t,r){console.error(`error while processing '${r}': `,t),e.postMessage({type:"error",error:t})}function g(e){for(let t=0;t<e.length;t++){const r=e[t];if(!"!#$%&'*+-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ^_`abcdefghijklmnopqrstuvwxyz|~".includes(r))return!1}return!0}const f=["ws:","wss:"],y=[101,204,205,304],b=[301,302,303,307,308];class m{constructor(e){this.worker=new p(e)}async getTransport(){return(await this.worker.sendMessage({type:"get"})).name}async setTransport(e,t,r){await this.setManualTransport(`\n\t\t\tconst { default: BareTransport } = await import("${e}");\n\t\t\treturn [BareTransport, "${e}"];\n\t\t`,t,r)}async setManualTransport(e,t,r){if("bare-mux-remote"===e)throw new Error("Use setRemoteTransport.");await this.worker.sendMessage({type:"set",client:{function:e,args:t}},r)}async setRemoteTransport(e,t){const r=new MessageChannel;r.port1.onmessage=async t=>{const r=t.data.port,a=t.data.message;if("fetch"===a.type)try{e.ready||await e.init(),await async function(e,t,r){const a=await r.request(new URL(e.fetch.remote),e.fetch.method,e.fetch.body,e.fetch.headers,null);if(!d()&&a.body instanceof ReadableStream){const e=new Response(a.body);a.body=await e.arrayBuffer()}a.body instanceof ReadableStream||a.body instanceof ArrayBuffer?o.call(t,{type:"fetch",fetch:a},[a.body]):o.call(t,{type:"fetch",fetch:a})}(a,r,e)}catch(e){u(r,e,"fetch")}else if("websocket"===a.type)try{e.ready||await e.init(),await async function(e,t,r){const[a,s]=r.connect(new URL(e.websocket.url),e.websocket.protocols,e.websocket.requestHeaders,(t=>{o.call(e.websocket.channel,{type:"open",args:[t]})}),(t=>{t instanceof ArrayBuffer?o.call(e.websocket.channel,{type:"message",args:[t]},[t]):o.call(e.websocket.channel,{type:"message",args:[t]})}),((t,r)=>{o.call(e.websocket.channel,{type:"close",args:[t,r]})}),(t=>{o.call(e.websocket.channel,{type:"error",args:[t]})}));e.websocket.channel.onmessage=e=>{"data"===e.data.type?a(e.data.data):"close"===e.data.type&&s(e.data.closeCode,e.data.closeReason)},o.call(t,{type:"websocket"})}(a,r,e)}catch(e){u(r,e,"websocket")}},await this.worker.sendMessage({type:"set",client:{function:"bare-mux-remote",args:[r.port2,t]}},[r.port2])}getInnerPort(){return this.worker.port}}class k{constructor(e){this.worker=new p(e)}createWebSocket(e,t=[],r,a){try{e=new URL(e)}catch(t){throw new DOMException(`Faiiled to construct 'WebSocket': The URL '${e}' is invalid.`)}if(!f.includes(e.protocol))throw new DOMException(`Failed to construct 'WebSocket': The URL's scheme must be either 'ws' or 'wss'. '${e.protocol}' is not allowed.`);Array.isArray(t)||(t=[t]),t=t.map(String);for(const e of t)if(!g(e))throw new DOMException(`Failed to construct 'WebSocket': The subprotocol '${e}' is invalid.`);a=a||{};return new w(e,t,this.worker,a)}async fetch(e,r){const a=new Request(e,r),s=r?.headers||a.headers,o=s instanceof Headers?Object.fromEntries(s):s,n=a.body;let c=new URL(a.url);if(c.protocol.startsWith("blob:")){const e=await t(c),r=new Response(e.body,e);return r.rawHeaders=Object.fromEntries(e.headers),r}for(let e=0;;e++){let t=(await this.worker.sendMessage({type:"fetch",fetch:{remote:c.toString(),method:a.method,headers:o,body:n||void 0}},n?[n]:[])).fetch,s=new Response(y.includes(t.status)?void 0:t.body,{headers:new Headers(t.headers),status:t.status,statusText:t.statusText});s.rawHeaders=t.headers,s.rawResponse=t,s.finalURL=c.toString();const i=r?.redirect||a.redirect;if(!b.includes(s.status))return s;switch(i){case"follow":{const t=s.headers.get("location");if(20>e&&null!==t){c=new URL(t,c);continue}throw new TypeError("Failed to fetch")}case"error":throw new TypeError("Failed to fetch");case"manual":return s}}}}console.debug("bare-mux: running v2.1.7 (build c56d286)");
//# sourceMappingURL=index.mjs.map


}),
"./node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js": 
/*!*****************************************************************************************************!*\
  !*** ./node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js ***!
  \*****************************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  attributeNames: () => (attributeNames),
  elementNames: () => (elementNames)
});
const elementNames = new Map([
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "clipPath",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "foreignObject",
    "glyphRef",
    "linearGradient",
    "radialGradient",
    "textPath",
].map((val) => [val.toLowerCase(), val]));
const attributeNames = new Map([
    "definitionURL",
    "attributeName",
    "attributeType",
    "baseFrequency",
    "baseProfile",
    "calcMode",
    "clipPathUnits",
    "diffuseConstant",
    "edgeMode",
    "filterUnits",
    "glyphRef",
    "gradientTransform",
    "gradientUnits",
    "kernelMatrix",
    "kernelUnitLength",
    "keyPoints",
    "keySplines",
    "keyTimes",
    "lengthAdjust",
    "limitingConeAngle",
    "markerHeight",
    "markerUnits",
    "markerWidth",
    "maskContentUnits",
    "maskUnits",
    "numOctaves",
    "pathLength",
    "patternContentUnits",
    "patternTransform",
    "patternUnits",
    "pointsAtX",
    "pointsAtY",
    "pointsAtZ",
    "preserveAlpha",
    "preserveAspectRatio",
    "primitiveUnits",
    "refX",
    "refY",
    "repeatCount",
    "repeatDur",
    "requiredExtensions",
    "requiredFeatures",
    "specularConstant",
    "specularExponent",
    "spreadMethod",
    "startOffset",
    "stdDeviation",
    "stitchTiles",
    "surfaceScale",
    "systemLanguage",
    "tableValues",
    "targetX",
    "targetY",
    "textLength",
    "viewBox",
    "viewTarget",
    "xChannelSelector",
    "yChannelSelector",
    "zoomAndPan",
].map((val) => [val.toLowerCase(), val]));


}),
"./node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js": 
/*!**********************************************************************************************!*\
  !*** ./node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js ***!
  \**********************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (__WEBPACK_DEFAULT_EXPORT__),
  render: () => (render)
});
/* ESM import */var domelementtype__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domelementtype */ "./node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js");
/* ESM import */var entities__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! entities */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/index.js");
/* ESM import */var _foreignNames_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foreignNames.js */ "./node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js");
/*
 * Module dependencies
 */


/**
 * Mixed-case SVG and MathML tags & attributes
 * recognized by the HTML parser.
 *
 * @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
 */

const unencodedElements = new Set([
    "style",
    "script",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "plaintext",
    "noscript",
]);
function replaceQuotes(value) {
    return value.replace(/"/g, "&quot;");
}
/**
 * Format attributes
 */
function formatAttributes(attributes, opts) {
    var _a;
    if (!attributes)
        return;
    const encode = ((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) === false
        ? replaceQuotes
        : opts.xmlMode || opts.encodeEntities !== "utf8"
            ? entities__WEBPACK_IMPORTED_MODULE_1__.encodeXML
            : entities__WEBPACK_IMPORTED_MODULE_1__.escapeAttribute;
    return Object.keys(attributes)
        .map((key) => {
        var _a, _b;
        const value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
        if (opts.xmlMode === "foreign") {
            /* Fix up mixed-case attribute names */
            key = (_b = _foreignNames_js__WEBPACK_IMPORTED_MODULE_2__.attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
        }
        if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
            return key;
        }
        return `${key}="${encode(value)}"`;
    })
        .join(" ");
}
/**
 * Self-enclosing tags
 */
const singleTag = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);
/**
 * Renders a DOM node or an array of DOM nodes to a string.
 *
 * Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
 *
 * @param node Node to be rendered.
 * @param options Changes serialization behavior
 */
function render(node, options = {}) {
    const nodes = "length" in node ? node : [node];
    let output = "";
    for (let i = 0; i < nodes.length; i++) {
        output += renderNode(nodes[i], options);
    }
    return output;
}
/* ESM default export */ const __WEBPACK_DEFAULT_EXPORT__ = (render);
function renderNode(node, options) {
    switch (node.type) {
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Root:
            return render(node.children, options);
        // @ts-expect-error We don't use `Doctype` yet
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Doctype:
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Directive:
            return renderDirective(node);
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Comment:
            return renderComment(node);
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.CDATA:
            return renderCdata(node);
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Script:
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Style:
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Tag:
            return renderTag(node, options);
        case domelementtype__WEBPACK_IMPORTED_MODULE_0__.Text:
            return renderText(node, options);
    }
}
const foreignModeIntegrationPoints = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title",
]);
const foreignElements = new Set(["svg", "math"]);
function renderTag(elem, opts) {
    var _a;
    // Handle SVG / MathML in HTML
    if (opts.xmlMode === "foreign") {
        /* Fix up mixed-case element names */
        elem.name = (_a = _foreignNames_js__WEBPACK_IMPORTED_MODULE_2__.elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
        /* Exit foreign mode at integration points */
        if (elem.parent &&
            foreignModeIntegrationPoints.has(elem.parent.name)) {
            opts = { ...opts, xmlMode: false };
        }
    }
    if (!opts.xmlMode && foreignElements.has(elem.name)) {
        opts = { ...opts, xmlMode: "foreign" };
    }
    let tag = `<${elem.name}`;
    const attribs = formatAttributes(elem.attribs, opts);
    if (attribs) {
        tag += ` ${attribs}`;
    }
    if (elem.children.length === 0 &&
        (opts.xmlMode
            ? // In XML mode or foreign mode, and user hasn't explicitly turned off self-closing tags
                opts.selfClosingTags !== false
            : // User explicitly asked for self-closing tags, even in HTML mode
                opts.selfClosingTags && singleTag.has(elem.name))) {
        if (!opts.xmlMode)
            tag += " ";
        tag += "/>";
    }
    else {
        tag += ">";
        if (elem.children.length > 0) {
            tag += render(elem.children, opts);
        }
        if (opts.xmlMode || !singleTag.has(elem.name)) {
            tag += `</${elem.name}>`;
        }
    }
    return tag;
}
function renderDirective(elem) {
    return `<${elem.data}>`;
}
function renderText(elem, opts) {
    var _a;
    let data = elem.data || "";
    // If entities weren't decoded, no need to encode them back
    if (((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) !== false &&
        !(!opts.xmlMode &&
            elem.parent &&
            unencodedElements.has(elem.parent.name))) {
        data =
            opts.xmlMode || opts.encodeEntities !== "utf8"
                ? (0,entities__WEBPACK_IMPORTED_MODULE_1__.encodeXML)(data)
                : (0,entities__WEBPACK_IMPORTED_MODULE_1__.escapeText)(data);
    }
    return data;
}
function renderCdata(elem) {
    return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
    return `<!--${elem.data}-->`;
}


}),
"./node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js": 
/*!**********************************************************************************************!*\
  !*** ./node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js ***!
  \**********************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  CDATA: () => (CDATA),
  Comment: () => (Comment),
  Directive: () => (Directive),
  Doctype: () => (Doctype),
  ElementType: () => (ElementType),
  Root: () => (Root),
  Script: () => (Script),
  Style: () => (Style),
  Tag: () => (Tag),
  Text: () => (Text),
  isTag: () => (isTag)
});
/** Types of elements found in htmlparser2's DOM */
var ElementType;
(function (ElementType) {
    /** Type for the root element of a document */
    ElementType["Root"] = "root";
    /** Type for Text */
    ElementType["Text"] = "text";
    /** Type for <? ... ?> */
    ElementType["Directive"] = "directive";
    /** Type for <!-- ... --> */
    ElementType["Comment"] = "comment";
    /** Type for <script> tags */
    ElementType["Script"] = "script";
    /** Type for <style> tags */
    ElementType["Style"] = "style";
    /** Type for Any tag */
    ElementType["Tag"] = "tag";
    /** Type for <![CDATA[ ... ]]> */
    ElementType["CDATA"] = "cdata";
    /** Type for <!doctype ...> */
    ElementType["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
/**
 * Tests whether an element is a tag or not.
 *
 * @param elem Element to test
 */
function isTag(elem) {
    return (elem.type === ElementType.Tag ||
        elem.type === ElementType.Script ||
        elem.type === ElementType.Style);
}
// Exports for backwards compatibility
/** Type for the root element of a document */
const Root = ElementType.Root;
/** Type for Text */
const Text = ElementType.Text;
/** Type for <? ... ?> */
const Directive = ElementType.Directive;
/** Type for <!-- ... --> */
const Comment = ElementType.Comment;
/** Type for <script> tags */
const Script = ElementType.Script;
/** Type for <style> tags */
const Style = ElementType.Style;
/** Type for Any tag */
const Tag = ElementType.Tag;
/** Type for <![CDATA[ ... ]]> */
const CDATA = ElementType.CDATA;
/** Type for <!doctype ...> */
const Doctype = ElementType.Doctype;


}),
"./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js": 
/*!**************************************************************************************!*\
  !*** ./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js ***!
  \**************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  CDATA: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.CDATA),
  Comment: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.Comment),
  DataNode: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.DataNode),
  Document: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.Document),
  DomHandler: () => (DomHandler),
  Element: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.Element),
  Node: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.Node),
  NodeWithChildren: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.NodeWithChildren),
  ProcessingInstruction: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.ProcessingInstruction),
  Text: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.Text),
  cloneNode: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.cloneNode),
  "default": () => (__WEBPACK_DEFAULT_EXPORT__),
  hasChildren: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.hasChildren),
  isCDATA: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.isCDATA),
  isComment: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.isComment),
  isDirective: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.isDirective),
  isDocument: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.isDocument),
  isTag: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.isTag),
  isText: () => (/* reexport safe */ _node_js__WEBPACK_IMPORTED_MODULE_1__.isText)
});
/* ESM import */var domelementtype__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domelementtype */ "./node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js");
/* ESM import */var _node_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node.js */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js");



// Default options
const defaultOpts = {
    withStartIndices: false,
    withEndIndices: false,
    xmlMode: false,
};
class DomHandler {
    /**
     * @param callback Called once parsing has completed.
     * @param options Settings for the handler.
     * @param elementCB Callback whenever a tag is closed.
     */
    constructor(callback, options, elementCB) {
        /** The elements of the DOM */
        this.dom = [];
        /** The root element for the DOM */
        this.root = new _node_js__WEBPACK_IMPORTED_MODULE_1__.Document(this.dom);
        /** Indicated whether parsing has been completed. */
        this.done = false;
        /** Stack of open tags. */
        this.tagStack = [this.root];
        /** A data node that is still being written to. */
        this.lastNode = null;
        /** Reference to the parser instance. Used for location information. */
        this.parser = null;
        // Make it possible to skip arguments, for backwards-compatibility
        if (typeof options === "function") {
            elementCB = options;
            options = defaultOpts;
        }
        if (typeof callback === "object") {
            options = callback;
            callback = undefined;
        }
        this.callback = callback !== null && callback !== void 0 ? callback : null;
        this.options = options !== null && options !== void 0 ? options : defaultOpts;
        this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
    }
    onparserinit(parser) {
        this.parser = parser;
    }
    // Resets the handler back to starting state
    onreset() {
        this.dom = [];
        this.root = new _node_js__WEBPACK_IMPORTED_MODULE_1__.Document(this.dom);
        this.done = false;
        this.tagStack = [this.root];
        this.lastNode = null;
        this.parser = null;
    }
    // Signals the handler that parsing is done
    onend() {
        if (this.done)
            return;
        this.done = true;
        this.parser = null;
        this.handleCallback(null);
    }
    onerror(error) {
        this.handleCallback(error);
    }
    onclosetag() {
        this.lastNode = null;
        const elem = this.tagStack.pop();
        if (this.options.withEndIndices) {
            elem.endIndex = this.parser.endIndex;
        }
        if (this.elementCB)
            this.elementCB(elem);
    }
    onopentag(name, attribs) {
        const type = this.options.xmlMode ? domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Tag : undefined;
        const element = new _node_js__WEBPACK_IMPORTED_MODULE_1__.Element(name, attribs, undefined, type);
        this.addNode(element);
        this.tagStack.push(element);
    }
    ontext(data) {
        const { lastNode } = this;
        if (lastNode && lastNode.type === domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Text) {
            lastNode.data += data;
            if (this.options.withEndIndices) {
                lastNode.endIndex = this.parser.endIndex;
            }
        }
        else {
            const node = new _node_js__WEBPACK_IMPORTED_MODULE_1__.Text(data);
            this.addNode(node);
            this.lastNode = node;
        }
    }
    oncomment(data) {
        if (this.lastNode && this.lastNode.type === domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Comment) {
            this.lastNode.data += data;
            return;
        }
        const node = new _node_js__WEBPACK_IMPORTED_MODULE_1__.Comment(data);
        this.addNode(node);
        this.lastNode = node;
    }
    oncommentend() {
        this.lastNode = null;
    }
    oncdatastart() {
        const text = new _node_js__WEBPACK_IMPORTED_MODULE_1__.Text("");
        const node = new _node_js__WEBPACK_IMPORTED_MODULE_1__.CDATA([text]);
        this.addNode(node);
        text.parent = node;
        this.lastNode = text;
    }
    oncdataend() {
        this.lastNode = null;
    }
    onprocessinginstruction(name, data) {
        const node = new _node_js__WEBPACK_IMPORTED_MODULE_1__.ProcessingInstruction(name, data);
        this.addNode(node);
    }
    handleCallback(error) {
        if (typeof this.callback === "function") {
            this.callback(error, this.dom);
        }
        else if (error) {
            throw error;
        }
    }
    addNode(node) {
        const parent = this.tagStack[this.tagStack.length - 1];
        const previousSibling = parent.children[parent.children.length - 1];
        if (this.options.withStartIndices) {
            node.startIndex = this.parser.startIndex;
        }
        if (this.options.withEndIndices) {
            node.endIndex = this.parser.endIndex;
        }
        parent.children.push(node);
        if (previousSibling) {
            node.prev = previousSibling;
            previousSibling.next = node;
        }
        node.parent = parent;
        this.lastNode = null;
    }
}
/* ESM default export */ const __WEBPACK_DEFAULT_EXPORT__ = (DomHandler);


}),
"./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js": 
/*!*************************************************************************************!*\
  !*** ./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js ***!
  \*************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  CDATA: () => (CDATA),
  Comment: () => (Comment),
  DataNode: () => (DataNode),
  Document: () => (Document),
  Element: () => (Element),
  Node: () => (Node),
  NodeWithChildren: () => (NodeWithChildren),
  ProcessingInstruction: () => (ProcessingInstruction),
  Text: () => (Text),
  cloneNode: () => (cloneNode),
  hasChildren: () => (hasChildren),
  isCDATA: () => (isCDATA),
  isComment: () => (isComment),
  isDirective: () => (isDirective),
  isDocument: () => (isDocument),
  isTag: () => (isTag),
  isText: () => (isText)
});
/* ESM import */var domelementtype__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domelementtype */ "./node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js");

/**
 * This object will be used as the prototype for Nodes when creating a
 * DOM-Level-1-compliant structure.
 */
class Node {
    constructor() {
        /** Parent of the node */
        this.parent = null;
        /** Previous sibling */
        this.prev = null;
        /** Next sibling */
        this.next = null;
        /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
        this.startIndex = null;
        /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
        this.endIndex = null;
    }
    // Read-write aliases for properties
    /**
     * Same as {@link parent}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get parentNode() {
        return this.parent;
    }
    set parentNode(parent) {
        this.parent = parent;
    }
    /**
     * Same as {@link prev}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get previousSibling() {
        return this.prev;
    }
    set previousSibling(prev) {
        this.prev = prev;
    }
    /**
     * Same as {@link next}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get nextSibling() {
        return this.next;
    }
    set nextSibling(next) {
        this.next = next;
    }
    /**
     * Clone this node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */
    cloneNode(recursive = false) {
        return cloneNode(this, recursive);
    }
}
/**
 * A node that contains some data.
 */
class DataNode extends Node {
    /**
     * @param data The content of the data node
     */
    constructor(data) {
        super();
        this.data = data;
    }
    /**
     * Same as {@link data}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get nodeValue() {
        return this.data;
    }
    set nodeValue(data) {
        this.data = data;
    }
}
/**
 * Text within the document.
 */
class Text extends DataNode {
    constructor() {
        super(...arguments);
        this.type = domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Text;
    }
    get nodeType() {
        return 3;
    }
}
/**
 * Comments within the document.
 */
class Comment extends DataNode {
    constructor() {
        super(...arguments);
        this.type = domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Comment;
    }
    get nodeType() {
        return 8;
    }
}
/**
 * Processing instructions, including doc types.
 */
class ProcessingInstruction extends DataNode {
    constructor(name, data) {
        super(data);
        this.name = name;
        this.type = domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Directive;
    }
    get nodeType() {
        return 1;
    }
}
/**
 * A `Node` that can have children.
 */
class NodeWithChildren extends Node {
    /**
     * @param children Children of the node. Only certain node types can have children.
     */
    constructor(children) {
        super();
        this.children = children;
    }
    // Aliases
    /** First child of the node. */
    get firstChild() {
        var _a;
        return (_a = this.children[0]) !== null && _a !== void 0 ? _a : null;
    }
    /** Last child of the node. */
    get lastChild() {
        return this.children.length > 0
            ? this.children[this.children.length - 1]
            : null;
    }
    /**
     * Same as {@link children}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get childNodes() {
        return this.children;
    }
    set childNodes(children) {
        this.children = children;
    }
}
class CDATA extends NodeWithChildren {
    constructor() {
        super(...arguments);
        this.type = domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.CDATA;
    }
    get nodeType() {
        return 4;
    }
}
/**
 * The root node of the document.
 */
class Document extends NodeWithChildren {
    constructor() {
        super(...arguments);
        this.type = domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Root;
    }
    get nodeType() {
        return 9;
    }
}
/**
 * An element within the DOM.
 */
class Element extends NodeWithChildren {
    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */
    constructor(name, attribs, children = [], type = name === "script"
        ? domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Script
        : name === "style"
            ? domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Style
            : domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Tag) {
        super(children);
        this.name = name;
        this.attribs = attribs;
        this.type = type;
    }
    get nodeType() {
        return 1;
    }
    // DOM Level 1 aliases
    /**
     * Same as {@link name}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get tagName() {
        return this.name;
    }
    set tagName(name) {
        this.name = name;
    }
    get attributes() {
        return Object.keys(this.attribs).map((name) => {
            var _a, _b;
            return ({
                name,
                value: this.attribs[name],
                namespace: (_a = this["x-attribsNamespace"]) === null || _a === void 0 ? void 0 : _a[name],
                prefix: (_b = this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name],
            });
        });
    }
}
/**
 * @param node Node to check.
 * @returns `true` if the node is a `Element`, `false` otherwise.
 */
function isTag(node) {
    return (0,domelementtype__WEBPACK_IMPORTED_MODULE_0__.isTag)(node);
}
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `CDATA`, `false` otherwise.
 */
function isCDATA(node) {
    return node.type === domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.CDATA;
}
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `Text`, `false` otherwise.
 */
function isText(node) {
    return node.type === domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Text;
}
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `Comment`, `false` otherwise.
 */
function isComment(node) {
    return node.type === domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Comment;
}
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
 */
function isDirective(node) {
    return node.type === domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Directive;
}
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
 */
function isDocument(node) {
    return node.type === domelementtype__WEBPACK_IMPORTED_MODULE_0__.ElementType.Root;
}
/**
 * @param node Node to check.
 * @returns `true` if the node has children, `false` otherwise.
 */
function hasChildren(node) {
    return Object.prototype.hasOwnProperty.call(node, "children");
}
/**
 * Clone a node, and optionally its children.
 *
 * @param recursive Clone child nodes as well.
 * @returns A clone of the node.
 */
function cloneNode(node, recursive = false) {
    let result;
    if (isText(node)) {
        result = new Text(node.data);
    }
    else if (isComment(node)) {
        result = new Comment(node.data);
    }
    else if (isTag(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new Element(node.name, { ...node.attribs }, children);
        children.forEach((child) => (child.parent = clone));
        if (node.namespace != null) {
            clone.namespace = node.namespace;
        }
        if (node["x-attribsNamespace"]) {
            clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
        }
        if (node["x-attribsPrefix"]) {
            clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
        }
        result = clone;
    }
    else if (isCDATA(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new CDATA(children);
        children.forEach((child) => (child.parent = clone));
        result = clone;
    }
    else if (isDocument(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new Document(children);
        children.forEach((child) => (child.parent = clone));
        if (node["x-mode"]) {
            clone["x-mode"] = node["x-mode"];
        }
        result = clone;
    }
    else if (isDirective(node)) {
        const instruction = new ProcessingInstruction(node.name, node.data);
        if (node["x-name"] != null) {
            instruction["x-name"] = node["x-name"];
            instruction["x-publicId"] = node["x-publicId"];
            instruction["x-systemId"] = node["x-systemId"];
        }
        result = instruction;
    }
    else {
        throw new Error(`Not implemented yet: ${node.type}`);
    }
    result.startIndex = node.startIndex;
    result.endIndex = node.endIndex;
    if (node.sourceCodeLocation != null) {
        result.sourceCodeLocation = node.sourceCodeLocation;
    }
    return result;
}
function cloneChildren(childs) {
    const children = childs.map((child) => cloneNode(child, true));
    for (let i = 1; i < children.length; i++) {
        children[i].prev = children[i - 1];
        children[i - 1].next = children[i];
    }
    return children;
}


}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/feeds.js": 
/*!**********************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/feeds.js ***!
  \**********************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  getFeed: () => (getFeed)
});
/* ESM import */var _stringify_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./stringify.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/stringify.js");
/* ESM import */var _legacy_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./legacy.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/legacy.js");


/**
 * Get the feed object from the root of a DOM tree.
 *
 * @category Feeds
 * @param doc - The DOM to to extract the feed from.
 * @returns The feed.
 */
function getFeed(doc) {
    const feedRoot = getOneElement(isValidFeed, doc);
    return !feedRoot
        ? null
        : feedRoot.name === "feed"
            ? getAtomFeed(feedRoot)
            : getRssFeed(feedRoot);
}
/**
 * Parse an Atom feed.
 *
 * @param feedRoot The root of the feed.
 * @returns The parsed feed.
 */
function getAtomFeed(feedRoot) {
    var _a;
    const childs = feedRoot.children;
    const feed = {
        type: "atom",
        items: (0,_legacy_js__WEBPACK_IMPORTED_MODULE_1__.getElementsByTagName)("entry", childs).map((item) => {
            var _a;
            const { children } = item;
            const entry = { media: getMediaElements(children) };
            addConditionally(entry, "id", "id", children);
            addConditionally(entry, "title", "title", children);
            const href = (_a = getOneElement("link", children)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
            if (href) {
                entry.link = href;
            }
            const description = fetch("summary", children) || fetch("content", children);
            if (description) {
                entry.description = description;
            }
            const pubDate = fetch("updated", children);
            if (pubDate) {
                entry.pubDate = new Date(pubDate);
            }
            return entry;
        }),
    };
    addConditionally(feed, "id", "id", childs);
    addConditionally(feed, "title", "title", childs);
    const href = (_a = getOneElement("link", childs)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
    if (href) {
        feed.link = href;
    }
    addConditionally(feed, "description", "subtitle", childs);
    const updated = fetch("updated", childs);
    if (updated) {
        feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "email", childs, true);
    return feed;
}
/**
 * Parse a RSS feed.
 *
 * @param feedRoot The root of the feed.
 * @returns The parsed feed.
 */
function getRssFeed(feedRoot) {
    var _a, _b;
    const childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [];
    const feed = {
        type: feedRoot.name.substr(0, 3),
        id: "",
        items: (0,_legacy_js__WEBPACK_IMPORTED_MODULE_1__.getElementsByTagName)("item", feedRoot.children).map((item) => {
            const { children } = item;
            const entry = { media: getMediaElements(children) };
            addConditionally(entry, "id", "guid", children);
            addConditionally(entry, "title", "title", children);
            addConditionally(entry, "link", "link", children);
            addConditionally(entry, "description", "description", children);
            const pubDate = fetch("pubDate", children) || fetch("dc:date", children);
            if (pubDate)
                entry.pubDate = new Date(pubDate);
            return entry;
        }),
    };
    addConditionally(feed, "title", "title", childs);
    addConditionally(feed, "link", "link", childs);
    addConditionally(feed, "description", "description", childs);
    const updated = fetch("lastBuildDate", childs);
    if (updated) {
        feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "managingEditor", childs, true);
    return feed;
}
const MEDIA_KEYS_STRING = ["url", "type", "lang"];
const MEDIA_KEYS_INT = [
    "fileSize",
    "bitrate",
    "framerate",
    "samplingrate",
    "channels",
    "duration",
    "height",
    "width",
];
/**
 * Get all media elements of a feed item.
 *
 * @param where Nodes to search in.
 * @returns Media elements.
 */
function getMediaElements(where) {
    return (0,_legacy_js__WEBPACK_IMPORTED_MODULE_1__.getElementsByTagName)("media:content", where).map((elem) => {
        const { attribs } = elem;
        const media = {
            medium: attribs["medium"],
            isDefault: !!attribs["isDefault"],
        };
        for (const attrib of MEDIA_KEYS_STRING) {
            if (attribs[attrib]) {
                media[attrib] = attribs[attrib];
            }
        }
        for (const attrib of MEDIA_KEYS_INT) {
            if (attribs[attrib]) {
                media[attrib] = parseInt(attribs[attrib], 10);
            }
        }
        if (attribs["expression"]) {
            media.expression = attribs["expression"];
        }
        return media;
    });
}
/**
 * Get one element by tag name.
 *
 * @param tagName Tag name to look for
 * @param node Node to search in
 * @returns The element or null
 */
function getOneElement(tagName, node) {
    return (0,_legacy_js__WEBPACK_IMPORTED_MODULE_1__.getElementsByTagName)(tagName, node, true, 1)[0];
}
/**
 * Get the text content of an element with a certain tag name.
 *
 * @param tagName Tag name to look for.
 * @param where Node to search in.
 * @param recurse Whether to recurse into child nodes.
 * @returns The text content of the element.
 */
function fetch(tagName, where, recurse = false) {
    return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_0__.textContent)((0,_legacy_js__WEBPACK_IMPORTED_MODULE_1__.getElementsByTagName)(tagName, where, recurse, 1)).trim();
}
/**
 * Adds a property to an object if it has a value.
 *
 * @param obj Object to be extended
 * @param prop Property name
 * @param tagName Tag name that contains the conditionally added property
 * @param where Element to search for the property
 * @param recurse Whether to recurse into child nodes.
 */
function addConditionally(obj, prop, tagName, where, recurse = false) {
    const val = fetch(tagName, where, recurse);
    if (val)
        obj[prop] = val;
}
/**
 * Checks if an element is a feed root node.
 *
 * @param value The name of the element to check.
 * @returns Whether an element is a feed root node.
 */
function isValidFeed(value) {
    return value === "rss" || value === "feed" || value === "rdf:RDF";
}
//# sourceMappingURL=feeds.js.map

}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/helpers.js": 
/*!************************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/helpers.js ***!
  \************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  DocumentPosition: () => (DocumentPosition),
  compareDocumentPosition: () => (compareDocumentPosition),
  removeSubsets: () => (removeSubsets),
  uniqueSort: () => (uniqueSort)
});
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");

/**
 * Given an array of nodes, remove any member that is contained by another
 * member.
 *
 * @category Helpers
 * @param nodes Nodes to filter.
 * @returns Remaining nodes that aren't contained by other nodes.
 */
function removeSubsets(nodes) {
    let idx = nodes.length;
    /*
     * Check if each node (or one of its ancestors) is already contained in the
     * array.
     */
    while (--idx >= 0) {
        const node = nodes[idx];
        /*
         * Remove the node if it is not unique.
         * We are going through the array from the end, so we only
         * have to check nodes that preceed the node under consideration in the array.
         */
        if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
            nodes.splice(idx, 1);
            continue;
        }
        for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
            if (nodes.includes(ancestor)) {
                nodes.splice(idx, 1);
                break;
            }
        }
    }
    return nodes;
}
/**
 * @category Helpers
 * @see {@link http://dom.spec.whatwg.org/#dom-node-comparedocumentposition}
 */
var DocumentPosition;
(function (DocumentPosition) {
    DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
    DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
    DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
    DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
    DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
})(DocumentPosition || (DocumentPosition = {}));
/**
 * Compare the position of one node against another node in any other document,
 * returning a bitmask with the values from {@link DocumentPosition}.
 *
 * Document order:
 * > There is an ordering, document order, defined on all the nodes in the
 * > document corresponding to the order in which the first character of the
 * > XML representation of each node occurs in the XML representation of the
 * > document after expansion of general entities. Thus, the document element
 * > node will be the first node. Element nodes occur before their children.
 * > Thus, document order orders element nodes in order of the occurrence of
 * > their start-tag in the XML (after expansion of entities). The attribute
 * > nodes of an element occur after the element and before its children. The
 * > relative order of attribute nodes is implementation-dependent.
 *
 * Source:
 * http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
 *
 * @category Helpers
 * @param nodeA The first node to use in the comparison
 * @param nodeB The second node to use in the comparison
 * @returns A bitmask describing the input nodes' relative position.
 *
 * See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
 * a description of these values.
 */
function compareDocumentPosition(nodeA, nodeB) {
    const aParents = [];
    const bParents = [];
    if (nodeA === nodeB) {
        return 0;
    }
    let current = (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(nodeA) ? nodeA : nodeA.parent;
    while (current) {
        aParents.unshift(current);
        current = current.parent;
    }
    current = (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(nodeB) ? nodeB : nodeB.parent;
    while (current) {
        bParents.unshift(current);
        current = current.parent;
    }
    const maxIdx = Math.min(aParents.length, bParents.length);
    let idx = 0;
    while (idx < maxIdx && aParents[idx] === bParents[idx]) {
        idx++;
    }
    if (idx === 0) {
        return DocumentPosition.DISCONNECTED;
    }
    const sharedParent = aParents[idx - 1];
    const siblings = sharedParent.children;
    const aSibling = aParents[idx];
    const bSibling = bParents[idx];
    if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
        if (sharedParent === nodeB) {
            return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
        }
        return DocumentPosition.FOLLOWING;
    }
    if (sharedParent === nodeA) {
        return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
    }
    return DocumentPosition.PRECEDING;
}
/**
 * Sort an array of nodes based on their relative position in the document,
 * removing any duplicate nodes. If the array contains nodes that do not belong
 * to the same document, sort order is unspecified.
 *
 * @category Helpers
 * @param nodes Array of DOM nodes.
 * @returns Collection of unique nodes, sorted in document order.
 */
function uniqueSort(nodes) {
    nodes = nodes.filter((node, i, arr) => !arr.includes(node, i + 1));
    nodes.sort((a, b) => {
        const relative = compareDocumentPosition(a, b);
        if (relative & DocumentPosition.PRECEDING) {
            return -1;
        }
        else if (relative & DocumentPosition.FOLLOWING) {
            return 1;
        }
        return 0;
    });
    return nodes;
}
//# sourceMappingURL=helpers.js.map

}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/index.js": 
/*!**********************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/index.js ***!
  \**********************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  DocumentPosition: () => (/* reexport safe */ _helpers_js__WEBPACK_IMPORTED_MODULE_5__.DocumentPosition),
  append: () => (/* reexport safe */ _manipulation_js__WEBPACK_IMPORTED_MODULE_2__.append),
  appendChild: () => (/* reexport safe */ _manipulation_js__WEBPACK_IMPORTED_MODULE_2__.appendChild),
  compareDocumentPosition: () => (/* reexport safe */ _helpers_js__WEBPACK_IMPORTED_MODULE_5__.compareDocumentPosition),
  existsOne: () => (/* reexport safe */ _querying_js__WEBPACK_IMPORTED_MODULE_3__.existsOne),
  filter: () => (/* reexport safe */ _querying_js__WEBPACK_IMPORTED_MODULE_3__.filter),
  find: () => (/* reexport safe */ _querying_js__WEBPACK_IMPORTED_MODULE_3__.find),
  findAll: () => (/* reexport safe */ _querying_js__WEBPACK_IMPORTED_MODULE_3__.findAll),
  findOne: () => (/* reexport safe */ _querying_js__WEBPACK_IMPORTED_MODULE_3__.findOne),
  findOneChild: () => (/* reexport safe */ _querying_js__WEBPACK_IMPORTED_MODULE_3__.findOneChild),
  getAttributeValue: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.getAttributeValue),
  getChildren: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.getChildren),
  getElementById: () => (/* reexport safe */ _legacy_js__WEBPACK_IMPORTED_MODULE_4__.getElementById),
  getElements: () => (/* reexport safe */ _legacy_js__WEBPACK_IMPORTED_MODULE_4__.getElements),
  getElementsByClassName: () => (/* reexport safe */ _legacy_js__WEBPACK_IMPORTED_MODULE_4__.getElementsByClassName),
  getElementsByTagName: () => (/* reexport safe */ _legacy_js__WEBPACK_IMPORTED_MODULE_4__.getElementsByTagName),
  getElementsByTagType: () => (/* reexport safe */ _legacy_js__WEBPACK_IMPORTED_MODULE_4__.getElementsByTagType),
  getFeed: () => (/* reexport safe */ _feeds_js__WEBPACK_IMPORTED_MODULE_6__.getFeed),
  getInnerHTML: () => (/* reexport safe */ _stringify_js__WEBPACK_IMPORTED_MODULE_0__.getInnerHTML),
  getName: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.getName),
  getOuterHTML: () => (/* reexport safe */ _stringify_js__WEBPACK_IMPORTED_MODULE_0__.getOuterHTML),
  getParent: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.getParent),
  getSiblings: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.getSiblings),
  getText: () => (/* reexport safe */ _stringify_js__WEBPACK_IMPORTED_MODULE_0__.getText),
  hasAttrib: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.hasAttrib),
  hasChildren: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_7__.hasChildren),
  innerText: () => (/* reexport safe */ _stringify_js__WEBPACK_IMPORTED_MODULE_0__.innerText),
  isCDATA: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_7__.isCDATA),
  isComment: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_7__.isComment),
  isDocument: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_7__.isDocument),
  isTag: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_7__.isTag),
  isText: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_7__.isText),
  nextElementSibling: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.nextElementSibling),
  prepend: () => (/* reexport safe */ _manipulation_js__WEBPACK_IMPORTED_MODULE_2__.prepend),
  prependChild: () => (/* reexport safe */ _manipulation_js__WEBPACK_IMPORTED_MODULE_2__.prependChild),
  prevElementSibling: () => (/* reexport safe */ _traversal_js__WEBPACK_IMPORTED_MODULE_1__.prevElementSibling),
  removeElement: () => (/* reexport safe */ _manipulation_js__WEBPACK_IMPORTED_MODULE_2__.removeElement),
  removeSubsets: () => (/* reexport safe */ _helpers_js__WEBPACK_IMPORTED_MODULE_5__.removeSubsets),
  replaceElement: () => (/* reexport safe */ _manipulation_js__WEBPACK_IMPORTED_MODULE_2__.replaceElement),
  testElement: () => (/* reexport safe */ _legacy_js__WEBPACK_IMPORTED_MODULE_4__.testElement),
  textContent: () => (/* reexport safe */ _stringify_js__WEBPACK_IMPORTED_MODULE_0__.textContent),
  uniqueSort: () => (/* reexport safe */ _helpers_js__WEBPACK_IMPORTED_MODULE_5__.uniqueSort)
});
/* ESM import */var _stringify_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./stringify.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/stringify.js");
/* ESM import */var _traversal_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./traversal.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/traversal.js");
/* ESM import */var _manipulation_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./manipulation.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/manipulation.js");
/* ESM import */var _querying_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./querying.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/querying.js");
/* ESM import */var _legacy_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./legacy.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/legacy.js");
/* ESM import */var _helpers_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./helpers.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/helpers.js");
/* ESM import */var _feeds_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./feeds.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/feeds.js");
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");







/** @deprecated Use these methods from `domhandler` directly. */

//# sourceMappingURL=index.js.map

}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/legacy.js": 
/*!***********************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/legacy.js ***!
  \***********************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  getElementById: () => (getElementById),
  getElements: () => (getElements),
  getElementsByClassName: () => (getElementsByClassName),
  getElementsByTagName: () => (getElementsByTagName),
  getElementsByTagType: () => (getElementsByTagType),
  testElement: () => (testElement)
});
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");
/* ESM import */var _querying_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./querying.js */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/querying.js");


/**
 * A map of functions to check nodes against.
 */
const Checks = {
    tag_name(name) {
        if (typeof name === "function") {
            return (elem) => (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(elem) && name(elem.name);
        }
        else if (name === "*") {
            return domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag;
        }
        return (elem) => (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(elem) && elem.name === name;
    },
    tag_type(type) {
        if (typeof type === "function") {
            return (elem) => type(elem.type);
        }
        return (elem) => elem.type === type;
    },
    tag_contains(data) {
        if (typeof data === "function") {
            return (elem) => (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isText)(elem) && data(elem.data);
        }
        return (elem) => (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isText)(elem) && elem.data === data;
    },
};
/**
 * Returns a function to check whether a node has an attribute with a particular
 * value.
 *
 * @param attrib Attribute to check.
 * @param value Attribute value to look for.
 * @returns A function to check whether the a node has an attribute with a
 *   particular value.
 */
function getAttribCheck(attrib, value) {
    if (typeof value === "function") {
        return (elem) => (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(elem) && value(elem.attribs[attrib]);
    }
    return (elem) => (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(elem) && elem.attribs[attrib] === value;
}
/**
 * Returns a function that returns `true` if either of the input functions
 * returns `true` for a node.
 *
 * @param a First function to combine.
 * @param b Second function to combine.
 * @returns A function taking a node and returning `true` if either of the input
 *   functions returns `true` for the node.
 */
function combineFuncs(a, b) {
    return (elem) => a(elem) || b(elem);
}
/**
 * Returns a function that executes all checks in `options` and returns `true`
 * if any of them match a node.
 *
 * @param options An object describing nodes to look for.
 * @returns A function that executes all checks in `options` and returns `true`
 *   if any of them match a node.
 */
function compileTest(options) {
    const funcs = Object.keys(options).map((key) => {
        const value = options[key];
        return Object.prototype.hasOwnProperty.call(Checks, key)
            ? Checks[key](value)
            : getAttribCheck(key, value);
    });
    return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
/**
 * Checks whether a node matches the description in `options`.
 *
 * @category Legacy Query Functions
 * @param options An object describing nodes to look for.
 * @param node The element to test.
 * @returns Whether the element matches the description in `options`.
 */
function testElement(options, node) {
    const test = compileTest(options);
    return test ? test(node) : true;
}
/**
 * Returns all nodes that match `options`.
 *
 * @category Legacy Query Functions
 * @param options An object describing nodes to look for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes that match `options`.
 */
function getElements(options, nodes, recurse, limit = Infinity) {
    const test = compileTest(options);
    return test ? (0,_querying_js__WEBPACK_IMPORTED_MODULE_1__.filter)(test, nodes, recurse, limit) : [];
}
/**
 * Returns the node with the supplied ID.
 *
 * @category Legacy Query Functions
 * @param id The unique ID attribute value to look for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @returns The node with the supplied ID.
 */
function getElementById(id, nodes, recurse = true) {
    if (!Array.isArray(nodes))
        nodes = [nodes];
    return (0,_querying_js__WEBPACK_IMPORTED_MODULE_1__.findOne)(getAttribCheck("id", id), nodes, recurse);
}
/**
 * Returns all nodes with the supplied `tagName`.
 *
 * @category Legacy Query Functions
 * @param tagName Tag name to search for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes with the supplied `tagName`.
 */
function getElementsByTagName(tagName, nodes, recurse = true, limit = Infinity) {
    return (0,_querying_js__WEBPACK_IMPORTED_MODULE_1__.filter)(Checks["tag_name"](tagName), nodes, recurse, limit);
}
/**
 * Returns all nodes with the supplied `className`.
 *
 * @category Legacy Query Functions
 * @param className Class name to search for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes with the supplied `className`.
 */
function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
    return (0,_querying_js__WEBPACK_IMPORTED_MODULE_1__.filter)(getAttribCheck("class", className), nodes, recurse, limit);
}
/**
 * Returns all nodes with the supplied `type`.
 *
 * @category Legacy Query Functions
 * @param type Element type to look for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes with the supplied `type`.
 */
function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
    return (0,_querying_js__WEBPACK_IMPORTED_MODULE_1__.filter)(Checks["tag_type"](type), nodes, recurse, limit);
}
//# sourceMappingURL=legacy.js.map

}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/manipulation.js": 
/*!*****************************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/manipulation.js ***!
  \*****************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  append: () => (append),
  appendChild: () => (appendChild),
  prepend: () => (prepend),
  prependChild: () => (prependChild),
  removeElement: () => (removeElement),
  replaceElement: () => (replaceElement)
});
/**
 * Remove an element from the dom
 *
 * @category Manipulation
 * @param elem The element to be removed
 */
function removeElement(elem) {
    if (elem.prev)
        elem.prev.next = elem.next;
    if (elem.next)
        elem.next.prev = elem.prev;
    if (elem.parent) {
        const childs = elem.parent.children;
        const childsIndex = childs.lastIndexOf(elem);
        if (childsIndex >= 0) {
            childs.splice(childsIndex, 1);
        }
    }
    elem.next = null;
    elem.prev = null;
    elem.parent = null;
}
/**
 * Replace an element in the dom
 *
 * @category Manipulation
 * @param elem The element to be replaced
 * @param replacement The element to be added
 */
function replaceElement(elem, replacement) {
    const prev = (replacement.prev = elem.prev);
    if (prev) {
        prev.next = replacement;
    }
    const next = (replacement.next = elem.next);
    if (next) {
        next.prev = replacement;
    }
    const parent = (replacement.parent = elem.parent);
    if (parent) {
        const childs = parent.children;
        childs[childs.lastIndexOf(elem)] = replacement;
        elem.parent = null;
    }
}
/**
 * Append a child to an element.
 *
 * @category Manipulation
 * @param parent The element to append to.
 * @param child The element to be added as a child.
 */
function appendChild(parent, child) {
    removeElement(child);
    child.next = null;
    child.parent = parent;
    if (parent.children.push(child) > 1) {
        const sibling = parent.children[parent.children.length - 2];
        sibling.next = child;
        child.prev = sibling;
    }
    else {
        child.prev = null;
    }
}
/**
 * Append an element after another.
 *
 * @category Manipulation
 * @param elem The element to append after.
 * @param next The element be added.
 */
function append(elem, next) {
    removeElement(next);
    const { parent } = elem;
    const currNext = elem.next;
    next.next = currNext;
    next.prev = elem;
    elem.next = next;
    next.parent = parent;
    if (currNext) {
        currNext.prev = next;
        if (parent) {
            const childs = parent.children;
            childs.splice(childs.lastIndexOf(currNext), 0, next);
        }
    }
    else if (parent) {
        parent.children.push(next);
    }
}
/**
 * Prepend a child to an element.
 *
 * @category Manipulation
 * @param parent The element to prepend before.
 * @param child The element to be added as a child.
 */
function prependChild(parent, child) {
    removeElement(child);
    child.parent = parent;
    child.prev = null;
    if (parent.children.unshift(child) !== 1) {
        const sibling = parent.children[1];
        sibling.prev = child;
        child.next = sibling;
    }
    else {
        child.next = null;
    }
}
/**
 * Prepend an element before another.
 *
 * @category Manipulation
 * @param elem The element to prepend before.
 * @param prev The element be added.
 */
function prepend(elem, prev) {
    removeElement(prev);
    const { parent } = elem;
    if (parent) {
        const childs = parent.children;
        childs.splice(childs.indexOf(elem), 0, prev);
    }
    if (elem.prev) {
        elem.prev.next = prev;
    }
    prev.parent = parent;
    prev.prev = elem.prev;
    prev.next = elem;
    elem.prev = prev;
}
//# sourceMappingURL=manipulation.js.map

}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/querying.js": 
/*!*************************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/querying.js ***!
  \*************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  existsOne: () => (existsOne),
  filter: () => (filter),
  find: () => (find),
  findAll: () => (findAll),
  findOne: () => (findOne),
  findOneChild: () => (findOneChild)
});
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");

/**
 * Search a node and its children for nodes passing a test function. If `node` is not an array, it will be wrapped in one.
 *
 * @category Querying
 * @param test Function to test nodes on.
 * @param node Node to search. Will be included in the result set if it matches.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes passing `test`.
 */
function filter(test, node, recurse = true, limit = Infinity) {
    return find(test, Array.isArray(node) ? node : [node], recurse, limit);
}
/**
 * Search an array of nodes and their children for nodes passing a test function.
 *
 * @category Querying
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes passing `test`.
 */
function find(test, nodes, recurse, limit) {
    const result = [];
    /** Stack of the arrays we are looking at. */
    const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
    /** Stack of the indices within the arrays. */
    const indexStack = [0];
    for (;;) {
        // First, check if the current array has any more elements to look at.
        if (indexStack[0] >= nodeStack[0].length) {
            // If we have no more arrays to look at, we are done.
            if (indexStack.length === 1) {
                return result;
            }
            // Otherwise, remove the current array from the stack.
            nodeStack.shift();
            indexStack.shift();
            // Loop back to the start to continue with the next array.
            continue;
        }
        const elem = nodeStack[0][indexStack[0]++];
        if (test(elem)) {
            result.push(elem);
            if (--limit <= 0)
                return result;
        }
        if (recurse && (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(elem) && elem.children.length > 0) {
            /*
             * Add the children to the stack. We are depth-first, so this is
             * the next array we look at.
             */
            indexStack.unshift(0);
            nodeStack.unshift(elem.children);
        }
    }
}
/**
 * Finds the first element inside of an array that matches a test function. This is an alias for `Array.prototype.find`.
 *
 * @category Querying
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @returns The first node in the array that passes `test`.
 * @deprecated Use `Array.prototype.find` directly.
 */
function findOneChild(test, nodes) {
    return nodes.find(test);
}
/**
 * Finds one element in a tree that passes a test.
 *
 * @category Querying
 * @param test Function to test nodes on.
 * @param nodes Node or array of nodes to search.
 * @param recurse Also consider child nodes.
 * @returns The first node that passes `test`.
 */
function findOne(test, nodes, recurse = true) {
    const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
    for (let i = 0; i < searchedNodes.length; i++) {
        const node = searchedNodes[i];
        if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(node) && test(node)) {
            return node;
        }
        if (recurse && (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(node) && node.children.length > 0) {
            const found = findOne(test, node.children, true);
            if (found)
                return found;
        }
    }
    return null;
}
/**
 * Checks if a tree of nodes contains at least one node passing a test.
 *
 * @category Querying
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @returns Whether a tree of nodes contains at least one node passing the test.
 */
function existsOne(test, nodes) {
    return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(node) && test(node)) ||
        ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(node) && existsOne(test, node.children)));
}
/**
 * Search an array of nodes and their children for elements passing a test function.
 *
 * Same as `find`, but limited to elements and with less options, leading to reduced complexity.
 *
 * @category Querying
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @returns All nodes passing `test`.
 */
function findAll(test, nodes) {
    const result = [];
    const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
    const indexStack = [0];
    for (;;) {
        if (indexStack[0] >= nodeStack[0].length) {
            if (nodeStack.length === 1) {
                return result;
            }
            // Otherwise, remove the current array from the stack.
            nodeStack.shift();
            indexStack.shift();
            // Loop back to the start to continue with the next array.
            continue;
        }
        const elem = nodeStack[0][indexStack[0]++];
        if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(elem) && test(elem))
            result.push(elem);
        if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(elem) && elem.children.length > 0) {
            indexStack.unshift(0);
            nodeStack.unshift(elem.children);
        }
    }
}
//# sourceMappingURL=querying.js.map

}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/stringify.js": 
/*!**************************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/stringify.js ***!
  \**************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  getInnerHTML: () => (getInnerHTML),
  getOuterHTML: () => (getOuterHTML),
  getText: () => (getText),
  innerText: () => (innerText),
  textContent: () => (textContent)
});
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");
/* ESM import */var dom_serializer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! dom-serializer */ "./node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js");
/* ESM import */var domelementtype__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! domelementtype */ "./node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js");



/**
 * @category Stringify
 * @deprecated Use the `dom-serializer` module directly.
 * @param node Node to get the outer HTML of.
 * @param options Options for serialization.
 * @returns `node`'s outer HTML.
 */
function getOuterHTML(node, options) {
    return (0,dom_serializer__WEBPACK_IMPORTED_MODULE_1__["default"])(node, options);
}
/**
 * @category Stringify
 * @deprecated Use the `dom-serializer` module directly.
 * @param node Node to get the inner HTML of.
 * @param options Options for serialization.
 * @returns `node`'s inner HTML.
 */
function getInnerHTML(node, options) {
    return (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(node)
        ? node.children.map((node) => getOuterHTML(node, options)).join("")
        : "";
}
/**
 * Get a node's inner text. Same as `textContent`, but inserts newlines for `<br>` tags. Ignores comments.
 *
 * @category Stringify
 * @deprecated Use `textContent` instead.
 * @param node Node to get the inner text of.
 * @returns `node`'s inner text.
 */
function getText(node) {
    if (Array.isArray(node))
        return node.map(getText).join("");
    if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(node))
        return node.name === "br" ? "\n" : getText(node.children);
    if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isCDATA)(node))
        return getText(node.children);
    if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isText)(node))
        return node.data;
    return "";
}
/**
 * Get a node's text content. Ignores comments.
 *
 * @category Stringify
 * @param node Node to get the text content of.
 * @returns `node`'s text content.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent}
 */
function textContent(node) {
    if (Array.isArray(node))
        return node.map(textContent).join("");
    if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(node) && !(0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isComment)(node)) {
        return textContent(node.children);
    }
    if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isText)(node))
        return node.data;
    return "";
}
/**
 * Get a node's inner text, ignoring `<script>` and `<style>` tags. Ignores comments.
 *
 * @category Stringify
 * @param node Node to get the inner text of.
 * @returns `node`'s inner text.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/innerText}
 */
function innerText(node) {
    if (Array.isArray(node))
        return node.map(innerText).join("");
    if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(node) && (node.type === domelementtype__WEBPACK_IMPORTED_MODULE_2__.ElementType.Tag || (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isCDATA)(node))) {
        return innerText(node.children);
    }
    if ((0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isText)(node))
        return node.data;
    return "";
}
//# sourceMappingURL=stringify.js.map

}),
"./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/traversal.js": 
/*!**************************************************************************************!*\
  !*** ./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/traversal.js ***!
  \**************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  getAttributeValue: () => (getAttributeValue),
  getChildren: () => (getChildren),
  getName: () => (getName),
  getParent: () => (getParent),
  getSiblings: () => (getSiblings),
  hasAttrib: () => (hasAttrib),
  nextElementSibling: () => (nextElementSibling),
  prevElementSibling: () => (prevElementSibling)
});
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");

/**
 * Get a node's children.
 *
 * @category Traversal
 * @param elem Node to get the children of.
 * @returns `elem`'s children, or an empty array.
 */
function getChildren(elem) {
    return (0,domhandler__WEBPACK_IMPORTED_MODULE_0__.hasChildren)(elem) ? elem.children : [];
}
/**
 * Get a node's parent.
 *
 * @category Traversal
 * @param elem Node to get the parent of.
 * @returns `elem`'s parent node, or `null` if `elem` is a root node.
 */
function getParent(elem) {
    return elem.parent || null;
}
/**
 * Gets an elements siblings, including the element itself.
 *
 * Attempts to get the children through the element's parent first. If we don't
 * have a parent (the element is a root node), we walk the element's `prev` &
 * `next` to get all remaining nodes.
 *
 * @category Traversal
 * @param elem Element to get the siblings of.
 * @returns `elem`'s siblings, including `elem`.
 */
function getSiblings(elem) {
    const parent = getParent(elem);
    if (parent != null)
        return getChildren(parent);
    const siblings = [elem];
    let { prev, next } = elem;
    while (prev != null) {
        siblings.unshift(prev);
        ({ prev } = prev);
    }
    while (next != null) {
        siblings.push(next);
        ({ next } = next);
    }
    return siblings;
}
/**
 * Gets an attribute from an element.
 *
 * @category Traversal
 * @param elem Element to check.
 * @param name Attribute name to retrieve.
 * @returns The element's attribute value, or `undefined`.
 */
function getAttributeValue(elem, name) {
    var _a;
    return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
}
/**
 * Checks whether an element has an attribute.
 *
 * @category Traversal
 * @param elem Element to check.
 * @param name Attribute name to look for.
 * @returns Returns whether `elem` has the attribute `name`.
 */
function hasAttrib(elem, name) {
    return (elem.attribs != null &&
        Object.prototype.hasOwnProperty.call(elem.attribs, name) &&
        elem.attribs[name] != null);
}
/**
 * Get the tag name of an element.
 *
 * @category Traversal
 * @param elem The element to get the name for.
 * @returns The tag name of `elem`.
 */
function getName(elem) {
    return elem.name;
}
/**
 * Returns the next element sibling of a node.
 *
 * @category Traversal
 * @param elem The element to get the next sibling of.
 * @returns `elem`'s next sibling that is a tag, or `null` if there is no next
 * sibling.
 */
function nextElementSibling(elem) {
    let { next } = elem;
    while (next !== null && !(0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(next))
        ({ next } = next);
    return next;
}
/**
 * Returns the previous element sibling of a node.
 *
 * @category Traversal
 * @param elem The element to get the previous sibling of.
 * @returns `elem`'s previous sibling that is a tag, or `null` if there is no
 * previous sibling.
 */
function prevElementSibling(elem) {
    let { prev } = elem;
    while (prev !== null && !(0,domhandler__WEBPACK_IMPORTED_MODULE_0__.isTag)(prev))
        ({ prev } = prev);
    return prev;
}
//# sourceMappingURL=traversal.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode-codepoint.js": 
/*!**********************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode-codepoint.js ***!
  \**********************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  decodeCodePoint: () => (decodeCodePoint),
  fromCodePoint: () => (fromCodePoint),
  replaceCodePoint: () => (replaceCodePoint)
});
// Adapted from https://github.com/mathiasbynens/he/blob/36afe179392226cf1b6ccdb16ebbb7a5a844d93a/src/he.js#L106-L134
var _a;
const decodeMap = new Map([
    [0, 65533],
    // C1 Unicode control character reference replacements
    [128, 8364],
    [130, 8218],
    [131, 402],
    [132, 8222],
    [133, 8230],
    [134, 8224],
    [135, 8225],
    [136, 710],
    [137, 8240],
    [138, 352],
    [139, 8249],
    [140, 338],
    [142, 381],
    [145, 8216],
    [146, 8217],
    [147, 8220],
    [148, 8221],
    [149, 8226],
    [150, 8211],
    [151, 8212],
    [152, 732],
    [153, 8482],
    [154, 353],
    [155, 8250],
    [156, 339],
    [158, 382],
    [159, 376],
]);
/**
 * Polyfill for `String.fromCodePoint`. It is used to create a string from a Unicode code point.
 */
const fromCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, n/no-unsupported-features/es-builtins
(_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function (codePoint) {
    let output = "";
    if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(((codePoint >>> 10) & 1023) | 55296);
        codePoint = 56320 | (codePoint & 1023);
    }
    output += String.fromCharCode(codePoint);
    return output;
};
/**
 * Replace the given code point with a replacement character if it is a
 * surrogate or is outside the valid range. Otherwise return the code
 * point unchanged.
 */
function replaceCodePoint(codePoint) {
    var _a;
    if ((codePoint >= 55296 && codePoint <= 57343) ||
        codePoint > 1114111) {
        return 65533;
    }
    return (_a = decodeMap.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint;
}
/**
 * Replace the code point if relevant, then convert it to a string.
 *
 * @deprecated Use `fromCodePoint(replaceCodePoint(codePoint))` instead.
 * @param codePoint The code point to decode.
 * @returns The decoded code point.
 */
function decodeCodePoint(codePoint) {
    return fromCodePoint(replaceCodePoint(codePoint));
}
//# sourceMappingURL=decode-codepoint.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode.js": 
/*!************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode.js ***!
  \************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  BinTrieFlags: () => (BinTrieFlags),
  DecodingMode: () => (DecodingMode),
  EntityDecoder: () => (EntityDecoder),
  decodeCodePoint: () => (/* reexport safe */ _decode_codepoint_js__WEBPACK_IMPORTED_MODULE_2__.decodeCodePoint),
  decodeHTML: () => (decodeHTML),
  decodeHTMLAttribute: () => (decodeHTMLAttribute),
  decodeHTMLStrict: () => (decodeHTMLStrict),
  decodeXML: () => (decodeXML),
  determineBranch: () => (determineBranch),
  fromCodePoint: () => (/* reexport safe */ _decode_codepoint_js__WEBPACK_IMPORTED_MODULE_2__.fromCodePoint),
  htmlDecodeTree: () => (/* reexport safe */ _generated_decode_data_html_js__WEBPACK_IMPORTED_MODULE_0__.htmlDecodeTree),
  replaceCodePoint: () => (/* reexport safe */ _decode_codepoint_js__WEBPACK_IMPORTED_MODULE_2__.replaceCodePoint),
  xmlDecodeTree: () => (/* reexport safe */ _generated_decode_data_xml_js__WEBPACK_IMPORTED_MODULE_1__.xmlDecodeTree)
});
/* ESM import */var _generated_decode_data_html_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./generated/decode-data-html.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/decode-data-html.js");
/* ESM import */var _generated_decode_data_xml_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./generated/decode-data-xml.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/decode-data-xml.js");
/* ESM import */var _decode_codepoint_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./decode-codepoint.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode-codepoint.js");



var CharCodes;
(function (CharCodes) {
    CharCodes[CharCodes["NUM"] = 35] = "NUM";
    CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
    CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
    CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
    CharCodes[CharCodes["NINE"] = 57] = "NINE";
    CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
    CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
    CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
    CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
    CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
    CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
    CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
/** Bit that needs to be set to convert an upper case ASCII character to lower case */
const TO_LOWER_BIT = 32;
var BinTrieFlags;
(function (BinTrieFlags) {
    BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
    BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
    BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function isNumber(code) {
    return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
    return ((code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F) ||
        (code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F));
}
function isAsciiAlphaNumeric(code) {
    return ((code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z) ||
        (code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z) ||
        isNumber(code));
}
/**
 * Checks if the given character is a valid end character for an entity in an attribute.
 *
 * Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
 * See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
 */
function isEntityInAttributeInvalidEnd(code) {
    return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function (EntityDecoderState) {
    EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
    EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
    EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
    EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
    EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function (DecodingMode) {
    /** Entities in text nodes that can end with any character. */
    DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
    /** Only allow entities terminated with a semicolon. */
    DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
    /** Entities in attributes have limitations on ending characters. */
    DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
/**
 * Token decoder with support of writing partial entities.
 */
class EntityDecoder {
    constructor(
    /** The tree used to decode entities. */
    decodeTree, 
    /**
     * The function that is called when a codepoint is decoded.
     *
     * For multi-byte named entities, this will be called multiple times,
     * with the second codepoint, and the same `consumed` value.
     *
     * @param codepoint The decoded codepoint.
     * @param consumed The number of bytes consumed by the decoder.
     */
    emitCodePoint, 
    /** An object that is used to produce errors. */
    errors) {
        this.decodeTree = decodeTree;
        this.emitCodePoint = emitCodePoint;
        this.errors = errors;
        /** The current state of the decoder. */
        this.state = EntityDecoderState.EntityStart;
        /** Characters that were consumed while parsing an entity. */
        this.consumed = 1;
        /**
         * The result of the entity.
         *
         * Either the result index of a numeric entity, or the codepoint of a
         * numeric entity.
         */
        this.result = 0;
        /** The current index in the decode tree. */
        this.treeIndex = 0;
        /** The number of characters that were consumed in excess. */
        this.excess = 1;
        /** The mode in which the decoder is operating. */
        this.decodeMode = DecodingMode.Strict;
    }
    /** Resets the instance to make it reusable. */
    startEntity(decodeMode) {
        this.decodeMode = decodeMode;
        this.state = EntityDecoderState.EntityStart;
        this.result = 0;
        this.treeIndex = 0;
        this.excess = 1;
        this.consumed = 1;
    }
    /**
     * Write an entity to the decoder. This can be called multiple times with partial entities.
     * If the entity is incomplete, the decoder will return -1.
     *
     * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
     * entity is incomplete, and resume when the next string is written.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    write(input, offset) {
        switch (this.state) {
            case EntityDecoderState.EntityStart: {
                if (input.charCodeAt(offset) === CharCodes.NUM) {
                    this.state = EntityDecoderState.NumericStart;
                    this.consumed += 1;
                    return this.stateNumericStart(input, offset + 1);
                }
                this.state = EntityDecoderState.NamedEntity;
                return this.stateNamedEntity(input, offset);
            }
            case EntityDecoderState.NumericStart: {
                return this.stateNumericStart(input, offset);
            }
            case EntityDecoderState.NumericDecimal: {
                return this.stateNumericDecimal(input, offset);
            }
            case EntityDecoderState.NumericHex: {
                return this.stateNumericHex(input, offset);
            }
            case EntityDecoderState.NamedEntity: {
                return this.stateNamedEntity(input, offset);
            }
        }
    }
    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericStart(input, offset) {
        if (offset >= input.length) {
            return -1;
        }
        if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
            this.state = EntityDecoderState.NumericHex;
            this.consumed += 1;
            return this.stateNumericHex(input, offset + 1);
        }
        this.state = EntityDecoderState.NumericDecimal;
        return this.stateNumericDecimal(input, offset);
    }
    addToNumericResult(input, start, end, base) {
        if (start !== end) {
            const digitCount = end - start;
            this.result =
                this.result * Math.pow(base, digitCount) +
                    Number.parseInt(input.substr(start, digitCount), base);
            this.consumed += digitCount;
        }
    }
    /**
     * Parses a hexadecimal numeric entity.
     *
     * Equivalent to the `Hexademical character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericHex(input, offset) {
        const startIndex = offset;
        while (offset < input.length) {
            const char = input.charCodeAt(offset);
            if (isNumber(char) || isHexadecimalCharacter(char)) {
                offset += 1;
            }
            else {
                this.addToNumericResult(input, startIndex, offset, 16);
                return this.emitNumericEntity(char, 3);
            }
        }
        this.addToNumericResult(input, startIndex, offset, 16);
        return -1;
    }
    /**
     * Parses a decimal numeric entity.
     *
     * Equivalent to the `Decimal character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericDecimal(input, offset) {
        const startIndex = offset;
        while (offset < input.length) {
            const char = input.charCodeAt(offset);
            if (isNumber(char)) {
                offset += 1;
            }
            else {
                this.addToNumericResult(input, startIndex, offset, 10);
                return this.emitNumericEntity(char, 2);
            }
        }
        this.addToNumericResult(input, startIndex, offset, 10);
        return -1;
    }
    /**
     * Validate and emit a numeric entity.
     *
     * Implements the logic from the `Hexademical character reference start
     * state` and `Numeric character reference end state` in the HTML spec.
     *
     * @param lastCp The last code point of the entity. Used to see if the
     *               entity was terminated with a semicolon.
     * @param expectedLength The minimum number of characters that should be
     *                       consumed. Used to validate that at least one digit
     *                       was consumed.
     * @returns The number of characters that were consumed.
     */
    emitNumericEntity(lastCp, expectedLength) {
        var _a;
        // Ensure we consumed at least one digit.
        if (this.consumed <= expectedLength) {
            (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
            return 0;
        }
        // Figure out if this is a legit end of the entity
        if (lastCp === CharCodes.SEMI) {
            this.consumed += 1;
        }
        else if (this.decodeMode === DecodingMode.Strict) {
            return 0;
        }
        this.emitCodePoint((0,_decode_codepoint_js__WEBPACK_IMPORTED_MODULE_2__.replaceCodePoint)(this.result), this.consumed);
        if (this.errors) {
            if (lastCp !== CharCodes.SEMI) {
                this.errors.missingSemicolonAfterCharacterReference();
            }
            this.errors.validateNumericCharacterReference(this.result);
        }
        return this.consumed;
    }
    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNamedEntity(input, offset) {
        const { decodeTree } = this;
        let current = decodeTree[this.treeIndex];
        // The mask is the number of bytes of the value, including the current byte.
        let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
        for (; offset < input.length; offset++, this.excess++) {
            const char = input.charCodeAt(offset);
            this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
            if (this.treeIndex < 0) {
                return this.result === 0 ||
                    // If we are parsing an attribute
                    (this.decodeMode === DecodingMode.Attribute &&
                        // We shouldn't have consumed any characters after the entity,
                        (valueLength === 0 ||
                            // And there should be no invalid characters.
                            isEntityInAttributeInvalidEnd(char)))
                    ? 0
                    : this.emitNotTerminatedNamedEntity();
            }
            current = decodeTree[this.treeIndex];
            valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
            // If the branch is a value, store it and continue
            if (valueLength !== 0) {
                // If the entity is terminated by a semicolon, we are done.
                if (char === CharCodes.SEMI) {
                    return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
                }
                // If we encounter a non-terminated (legacy) entity while parsing strictly, then ignore it.
                if (this.decodeMode !== DecodingMode.Strict) {
                    this.result = this.treeIndex;
                    this.consumed += this.excess;
                    this.excess = 0;
                }
            }
        }
        return -1;
    }
    /**
     * Emit a named entity that was not terminated with a semicolon.
     *
     * @returns The number of characters consumed.
     */
    emitNotTerminatedNamedEntity() {
        var _a;
        const { result, decodeTree } = this;
        const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
        this.emitNamedEntityData(result, valueLength, this.consumed);
        (_a = this.errors) === null || _a === void 0 ? void 0 : _a.missingSemicolonAfterCharacterReference();
        return this.consumed;
    }
    /**
     * Emit a named entity.
     *
     * @param result The index of the entity in the decode tree.
     * @param valueLength The number of bytes in the entity.
     * @param consumed The number of characters consumed.
     *
     * @returns The number of characters consumed.
     */
    emitNamedEntityData(result, valueLength, consumed) {
        const { decodeTree } = this;
        this.emitCodePoint(valueLength === 1
            ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH
            : decodeTree[result + 1], consumed);
        if (valueLength === 3) {
            // For multi-byte values, we need to emit the second byte.
            this.emitCodePoint(decodeTree[result + 2], consumed);
        }
        return consumed;
    }
    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     *
     * @returns The number of characters consumed.
     */
    end() {
        var _a;
        switch (this.state) {
            case EntityDecoderState.NamedEntity: {
                // Emit a named entity if we have one.
                return this.result !== 0 &&
                    (this.decodeMode !== DecodingMode.Attribute ||
                        this.result === this.treeIndex)
                    ? this.emitNotTerminatedNamedEntity()
                    : 0;
            }
            // Otherwise, emit a numeric entity if we have one.
            case EntityDecoderState.NumericDecimal: {
                return this.emitNumericEntity(0, 2);
            }
            case EntityDecoderState.NumericHex: {
                return this.emitNumericEntity(0, 3);
            }
            case EntityDecoderState.NumericStart: {
                (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
                return 0;
            }
            case EntityDecoderState.EntityStart: {
                // Return 0 if we have no entity.
                return 0;
            }
        }
    }
}
/**
 * Creates a function that decodes entities in a string.
 *
 * @param decodeTree The decode tree.
 * @returns A function that decodes entities in a string.
 */
function getDecoder(decodeTree) {
    let returnValue = "";
    const decoder = new EntityDecoder(decodeTree, (data) => (returnValue += (0,_decode_codepoint_js__WEBPACK_IMPORTED_MODULE_2__.fromCodePoint)(data)));
    return function decodeWithTrie(input, decodeMode) {
        let lastIndex = 0;
        let offset = 0;
        while ((offset = input.indexOf("&", offset)) >= 0) {
            returnValue += input.slice(lastIndex, offset);
            decoder.startEntity(decodeMode);
            const length = decoder.write(input, 
            // Skip the "&"
            offset + 1);
            if (length < 0) {
                lastIndex = offset + decoder.end();
                break;
            }
            lastIndex = offset + length;
            // If `length` is 0, skip the current `&` and continue.
            offset = length === 0 ? lastIndex + 1 : lastIndex;
        }
        const result = returnValue + input.slice(lastIndex);
        // Make sure we don't keep a reference to the final string.
        returnValue = "";
        return result;
    };
}
/**
 * Determines the branch of the current node that is taken given the current
 * character. This function is used to traverse the trie.
 *
 * @param decodeTree The trie.
 * @param current The current node.
 * @param nodeIdx The index right after the current node and its value.
 * @param char The current character.
 * @returns The index of the next node, or -1 if no branch is taken.
 */
function determineBranch(decodeTree, current, nodeIndex, char) {
    const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
    const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
    // Case 1: Single branch encoded in jump offset
    if (branchCount === 0) {
        return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
    }
    // Case 2: Multiple branches encoded in jump table
    if (jumpOffset) {
        const value = char - jumpOffset;
        return value < 0 || value >= branchCount
            ? -1
            : decodeTree[nodeIndex + value] - 1;
    }
    // Case 3: Multiple branches encoded in dictionary
    // Binary search for the character.
    let lo = nodeIndex;
    let hi = lo + branchCount - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const midValue = decodeTree[mid];
        if (midValue < char) {
            lo = mid + 1;
        }
        else if (midValue > char) {
            hi = mid - 1;
        }
        else {
            return decodeTree[mid + branchCount];
        }
    }
    return -1;
}
const htmlDecoder = /* #__PURE__ */ getDecoder(_generated_decode_data_html_js__WEBPACK_IMPORTED_MODULE_0__.htmlDecodeTree);
const xmlDecoder = /* #__PURE__ */ getDecoder(_generated_decode_data_xml_js__WEBPACK_IMPORTED_MODULE_1__.xmlDecodeTree);
/**
 * Decodes an HTML string.
 *
 * @param htmlString The string to decode.
 * @param mode The decoding mode.
 * @returns The decoded string.
 */
function decodeHTML(htmlString, mode = DecodingMode.Legacy) {
    return htmlDecoder(htmlString, mode);
}
/**
 * Decodes an HTML string in an attribute.
 *
 * @param htmlAttribute The string to decode.
 * @returns The decoded string.
 */
function decodeHTMLAttribute(htmlAttribute) {
    return htmlDecoder(htmlAttribute, DecodingMode.Attribute);
}
/**
 * Decodes an HTML string, requiring all entities to be terminated by a semicolon.
 *
 * @param htmlString The string to decode.
 * @returns The decoded string.
 */
function decodeHTMLStrict(htmlString) {
    return htmlDecoder(htmlString, DecodingMode.Strict);
}
/**
 * Decodes an XML string, requiring all entities to be terminated by a semicolon.
 *
 * @param xmlString The string to decode.
 * @returns The decoded string.
 */
function decodeXML(xmlString) {
    return xmlDecoder(xmlString, DecodingMode.Strict);
}
// Re-export for use by eg. htmlparser2



//# sourceMappingURL=decode.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/encode.js": 
/*!************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/encode.js ***!
  \************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  encodeHTML: () => (encodeHTML),
  encodeNonAsciiHTML: () => (encodeNonAsciiHTML)
});
/* ESM import */var _generated_encode_html_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./generated/encode-html.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/encode-html.js");
/* ESM import */var _escape_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./escape.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/escape.js");


const htmlReplacer = /[\t\n\f!-,./:-@[-`{-}\u0080-\uFFFF]/g;
/**
 * Encodes all characters in the input using HTML entities. This includes
 * characters that are valid ASCII characters in HTML documents, such as `#`.
 *
 * To get a more compact output, consider using the `encodeNonAsciiHTML`
 * function, which will only encode characters that are not valid in HTML
 * documents, as well as non-ASCII characters.
 *
 * If a character has no equivalent entity, a numeric hexadecimal reference
 * (eg. `&#xfc;`) will be used.
 */
function encodeHTML(input) {
    return encodeHTMLTrieRe(htmlReplacer, input);
}
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities. This function will not encode characters that
 * are valid in HTML documents, such as `#`.
 *
 * If a character has no equivalent entity, a numeric hexadecimal reference
 * (eg. `&#xfc;`) will be used.
 */
function encodeNonAsciiHTML(input) {
    return encodeHTMLTrieRe(_escape_js__WEBPACK_IMPORTED_MODULE_1__.xmlReplacer, input);
}
function encodeHTMLTrieRe(regExp, input) {
    let returnValue = "";
    let lastIndex = 0;
    let match;
    while ((match = regExp.exec(input)) !== null) {
        const { index } = match;
        returnValue += input.substring(lastIndex, index);
        const char = input.charCodeAt(index);
        let next = _generated_encode_html_js__WEBPACK_IMPORTED_MODULE_0__.htmlTrie.get(char);
        if (typeof next === "object") {
            // We are in a branch. Try to match the next char.
            if (index + 1 < input.length) {
                const nextChar = input.charCodeAt(index + 1);
                const value = typeof next.n === "number"
                    ? next.n === nextChar
                        ? next.o
                        : undefined
                    : next.n.get(nextChar);
                if (value !== undefined) {
                    returnValue += value;
                    lastIndex = regExp.lastIndex += 1;
                    continue;
                }
            }
            next = next.v;
        }
        // We might have a tree node without a value; skip and use a numeric entity.
        if (next === undefined) {
            const cp = (0,_escape_js__WEBPACK_IMPORTED_MODULE_1__.getCodePoint)(input, index);
            returnValue += `&#x${cp.toString(16)};`;
            // Increase by 1 if we have a surrogate pair
            lastIndex = regExp.lastIndex += Number(cp !== char);
        }
        else {
            returnValue += next;
            lastIndex = index + 1;
        }
    }
    return returnValue + input.substr(lastIndex);
}
//# sourceMappingURL=encode.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/escape.js": 
/*!************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/escape.js ***!
  \************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  encodeXML: () => (encodeXML),
  escape: () => (escape),
  escapeAttribute: () => (escapeAttribute),
  escapeText: () => (escapeText),
  escapeUTF8: () => (escapeUTF8),
  getCodePoint: () => (getCodePoint),
  xmlReplacer: () => (xmlReplacer)
});
const xmlReplacer = /["$&'<>\u0080-\uFFFF]/g;
const xmlCodeMap = new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [39, "&apos;"],
    [60, "&lt;"],
    [62, "&gt;"],
]);
// For compatibility with node < 4, we wrap `codePointAt`
const getCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt == null
    ? (c, index) => (c.charCodeAt(index) & 64512) === 55296
        ? (c.charCodeAt(index) - 55296) * 1024 +
            c.charCodeAt(index + 1) -
            56320 +
            65536
        : c.charCodeAt(index)
    : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        (input, index) => input.codePointAt(index);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
function encodeXML(input) {
    let returnValue = "";
    let lastIndex = 0;
    let match;
    while ((match = xmlReplacer.exec(input)) !== null) {
        const { index } = match;
        const char = input.charCodeAt(index);
        const next = xmlCodeMap.get(char);
        if (next === undefined) {
            returnValue += `${input.substring(lastIndex, index)}&#x${getCodePoint(input, index).toString(16)};`;
            // Increase by 1 if we have a surrogate pair
            lastIndex = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
        }
        else {
            returnValue += input.substring(lastIndex, index) + next;
            lastIndex = index + 1;
        }
    }
    return returnValue + input.substr(lastIndex);
}
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
const escape = encodeXML;
/**
 * Creates a function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 *
 * @param regex Regular expression to match characters to escape.
 * @param map Map of characters to escape to their entities.
 *
 * @returns Function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 */
function getEscaper(regex, map) {
    return function escape(data) {
        let match;
        let lastIndex = 0;
        let result = "";
        while ((match = regex.exec(data))) {
            if (lastIndex !== match.index) {
                result += data.substring(lastIndex, match.index);
            }
            // We know that this character will be in the map.
            result += map.get(match[0].charCodeAt(0));
            // Every match will be of length 1
            lastIndex = match.index + 1;
        }
        return result + data.substring(lastIndex);
    };
}
/**
 * Encodes all characters not valid in XML documents using XML entities.
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
const escapeUTF8 = /* #__PURE__ */ getEscaper(/["&'<>]/g, xmlCodeMap);
/**
 * Encodes all characters that have to be escaped in HTML attributes,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 *
 * @param data String to escape.
 */
const escapeAttribute = 
/* #__PURE__ */ getEscaper(/["&\u00A0]/g, new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [160, "&nbsp;"],
]));
/**
 * Encodes all characters that have to be escaped in HTML text,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 *
 * @param data String to escape.
 */
const escapeText = /* #__PURE__ */ getEscaper(/[&<>\u00A0]/g, new Map([
    [38, "&amp;"],
    [60, "&lt;"],
    [62, "&gt;"],
    [160, "&nbsp;"],
]));
//# sourceMappingURL=escape.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/decode-data-html.js": 
/*!********************************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/decode-data-html.js ***!
  \********************************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  htmlDecodeTree: () => (htmlDecodeTree)
});
// Generated using scripts/write-decode-map.ts
const htmlDecodeTree = /* #__PURE__ */ new Uint16Array(
// prettier-ignore
/* #__PURE__ */ "\u1d41<\xd5\u0131\u028a\u049d\u057b\u05d0\u0675\u06de\u07a2\u07d6\u080f\u0a4a\u0a91\u0da1\u0e6d\u0f09\u0f26\u10ca\u1228\u12e1\u1415\u149d\u14c3\u14df\u1525\0\0\0\0\0\0\u156b\u16cd\u198d\u1c12\u1ddd\u1f7e\u2060\u21b0\u228d\u23c0\u23fb\u2442\u2824\u2912\u2d08\u2e48\u2fce\u3016\u32ba\u3639\u37ac\u38fe\u3a28\u3a71\u3ae0\u3b2e\u0800EMabcfglmnoprstu\\bfms\x7f\x84\x8b\x90\x95\x98\xa6\xb3\xb9\xc8\xcflig\u803b\xc6\u40c6P\u803b&\u4026cute\u803b\xc1\u40c1reve;\u4102\u0100iyx}rc\u803b\xc2\u40c2;\u4410r;\uc000\ud835\udd04rave\u803b\xc0\u40c0pha;\u4391acr;\u4100d;\u6a53\u0100gp\x9d\xa1on;\u4104f;\uc000\ud835\udd38plyFunction;\u6061ing\u803b\xc5\u40c5\u0100cs\xbe\xc3r;\uc000\ud835\udc9cign;\u6254ilde\u803b\xc3\u40c3ml\u803b\xc4\u40c4\u0400aceforsu\xe5\xfb\xfe\u0117\u011c\u0122\u0127\u012a\u0100cr\xea\xf2kslash;\u6216\u0176\xf6\xf8;\u6ae7ed;\u6306y;\u4411\u0180crt\u0105\u010b\u0114ause;\u6235noullis;\u612ca;\u4392r;\uc000\ud835\udd05pf;\uc000\ud835\udd39eve;\u42d8c\xf2\u0113mpeq;\u624e\u0700HOacdefhilorsu\u014d\u0151\u0156\u0180\u019e\u01a2\u01b5\u01b7\u01ba\u01dc\u0215\u0273\u0278\u027ecy;\u4427PY\u803b\xa9\u40a9\u0180cpy\u015d\u0162\u017aute;\u4106\u0100;i\u0167\u0168\u62d2talDifferentialD;\u6145leys;\u612d\u0200aeio\u0189\u018e\u0194\u0198ron;\u410cdil\u803b\xc7\u40c7rc;\u4108nint;\u6230ot;\u410a\u0100dn\u01a7\u01adilla;\u40b8terDot;\u40b7\xf2\u017fi;\u43a7rcle\u0200DMPT\u01c7\u01cb\u01d1\u01d6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01e2\u01f8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020foubleQuote;\u601duote;\u6019\u0200lnpu\u021e\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6a74\u0180git\u022f\u0236\u023aruent;\u6261nt;\u622fourIntegral;\u622e\u0100fr\u024c\u024e;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6a2fcr;\uc000\ud835\udc9ep\u0100;C\u0284\u0285\u62d3ap;\u624d\u0580DJSZacefios\u02a0\u02ac\u02b0\u02b4\u02b8\u02cb\u02d7\u02e1\u02e6\u0333\u048d\u0100;o\u0179\u02a5trahd;\u6911cy;\u4402cy;\u4405cy;\u440f\u0180grs\u02bf\u02c4\u02c7ger;\u6021r;\u61a1hv;\u6ae4\u0100ay\u02d0\u02d5ron;\u410e;\u4414l\u0100;t\u02dd\u02de\u6207a;\u4394r;\uc000\ud835\udd07\u0100af\u02eb\u0327\u0100cm\u02f0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031ccute;\u40b4o\u0174\u030b\u030d;\u42d9bleAcute;\u42ddrave;\u4060ilde;\u42dcond;\u62c4ferentialD;\u6146\u0470\u033d\0\0\0\u0342\u0354\0\u0405f;\uc000\ud835\udd3b\u0180;DE\u0348\u0349\u034d\u40a8ot;\u60dcqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03cf\u03e2\u03f8ontourIntegra\xec\u0239o\u0274\u0379\0\0\u037b\xbb\u0349nArrow;\u61d3\u0100eo\u0387\u03a4ft\u0180ART\u0390\u0396\u03a1rrow;\u61d0ightArrow;\u61d4e\xe5\u02cang\u0100LR\u03ab\u03c4eft\u0100AR\u03b3\u03b9rrow;\u67f8ightArrow;\u67faightArrow;\u67f9ight\u0100AT\u03d8\u03derrow;\u61d2ee;\u62a8p\u0241\u03e9\0\0\u03efrrow;\u61d1ownArrow;\u61d5erticalBar;\u6225n\u0300ABLRTa\u0412\u042a\u0430\u045e\u047f\u037crrow\u0180;BU\u041d\u041e\u0422\u6193ar;\u6913pArrow;\u61f5reve;\u4311eft\u02d2\u043a\0\u0446\0\u0450ightVector;\u6950eeVector;\u695eector\u0100;B\u0459\u045a\u61bdar;\u6956ight\u01d4\u0467\0\u0471eeVector;\u695fector\u0100;B\u047a\u047b\u61c1ar;\u6957ee\u0100;A\u0486\u0487\u62a4rrow;\u61a7\u0100ct\u0492\u0497r;\uc000\ud835\udc9frok;\u4110\u0800NTacdfglmopqstux\u04bd\u04c0\u04c4\u04cb\u04de\u04e2\u04e7\u04ee\u04f5\u0521\u052f\u0536\u0552\u055d\u0560\u0565G;\u414aH\u803b\xd0\u40d0cute\u803b\xc9\u40c9\u0180aiy\u04d2\u04d7\u04dcron;\u411arc\u803b\xca\u40ca;\u442dot;\u4116r;\uc000\ud835\udd08rave\u803b\xc8\u40c8ement;\u6208\u0100ap\u04fa\u04fecr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65fberySmallSquare;\u65ab\u0100gp\u0526\u052aon;\u4118f;\uc000\ud835\udd3csilon;\u4395u\u0100ai\u053c\u0549l\u0100;T\u0542\u0543\u6a75ilde;\u6242librium;\u61cc\u0100ci\u0557\u055ar;\u6130m;\u6a73a;\u4397ml\u803b\xcb\u40cb\u0100ip\u056a\u056fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058d\u05b2\u05ccy;\u4424r;\uc000\ud835\udd09lled\u0253\u0597\0\0\u05a3mallSquare;\u65fcerySmallSquare;\u65aa\u0370\u05ba\0\u05bf\0\0\u05c4f;\uc000\ud835\udd3dAll;\u6200riertrf;\u6131c\xf2\u05cb\u0600JTabcdfgorst\u05e8\u05ec\u05ef\u05fa\u0600\u0612\u0616\u061b\u061d\u0623\u066c\u0672cy;\u4403\u803b>\u403emma\u0100;d\u05f7\u05f8\u4393;\u43dcreve;\u411e\u0180eiy\u0607\u060c\u0610dil;\u4122rc;\u411c;\u4413ot;\u4120r;\uc000\ud835\udd0a;\u62d9pf;\uc000\ud835\udd3eeater\u0300EFGLST\u0635\u0644\u064e\u0656\u065b\u0666qual\u0100;L\u063e\u063f\u6265ess;\u62dbullEqual;\u6267reater;\u6aa2ess;\u6277lantEqual;\u6a7eilde;\u6273cr;\uc000\ud835\udca2;\u626b\u0400Aacfiosu\u0685\u068b\u0696\u069b\u069e\u06aa\u06be\u06caRDcy;\u442a\u0100ct\u0690\u0694ek;\u42c7;\u405eirc;\u4124r;\u610clbertSpace;\u610b\u01f0\u06af\0\u06b2f;\u610dizontalLine;\u6500\u0100ct\u06c3\u06c5\xf2\u06a9rok;\u4126mp\u0144\u06d0\u06d8ownHum\xf0\u012fqual;\u624f\u0700EJOacdfgmnostu\u06fa\u06fe\u0703\u0707\u070e\u071a\u071e\u0721\u0728\u0744\u0778\u078b\u078f\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803b\xcd\u40cd\u0100iy\u0713\u0718rc\u803b\xce\u40ce;\u4418ot;\u4130r;\u6111rave\u803b\xcc\u40cc\u0180;ap\u0720\u072f\u073f\u0100cg\u0734\u0737r;\u412ainaryI;\u6148lie\xf3\u03dd\u01f4\u0749\0\u0762\u0100;e\u074d\u074e\u622c\u0100gr\u0753\u0758ral;\u622bsection;\u62c2isible\u0100CT\u076c\u0772omma;\u6063imes;\u6062\u0180gpt\u077f\u0783\u0788on;\u412ef;\uc000\ud835\udd40a;\u4399cr;\u6110ilde;\u4128\u01eb\u079a\0\u079ecy;\u4406l\u803b\xcf\u40cf\u0280cfosu\u07ac\u07b7\u07bc\u07c2\u07d0\u0100iy\u07b1\u07b5rc;\u4134;\u4419r;\uc000\ud835\udd0dpf;\uc000\ud835\udd41\u01e3\u07c7\0\u07ccr;\uc000\ud835\udca5rcy;\u4408kcy;\u4404\u0380HJacfos\u07e4\u07e8\u07ec\u07f1\u07fd\u0802\u0808cy;\u4425cy;\u440cppa;\u439a\u0100ey\u07f6\u07fbdil;\u4136;\u441ar;\uc000\ud835\udd0epf;\uc000\ud835\udd42cr;\uc000\ud835\udca6\u0580JTaceflmost\u0825\u0829\u082c\u0850\u0863\u09b3\u09b8\u09c7\u09cd\u0a37\u0a47cy;\u4409\u803b<\u403c\u0280cmnpr\u0837\u083c\u0841\u0844\u084dute;\u4139bda;\u439bg;\u67ealacetrf;\u6112r;\u619e\u0180aey\u0857\u085c\u0861ron;\u413ddil;\u413b;\u441b\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087e\u08a9\u08b1\u08e0\u08e6\u08fc\u092f\u095b\u0390\u096a\u0100nr\u0883\u088fgleBracket;\u67e8row\u0180;BR\u0899\u089a\u089e\u6190ar;\u61e4ightArrow;\u61c6eiling;\u6308o\u01f5\u08b7\0\u08c3bleBracket;\u67e6n\u01d4\u08c8\0\u08d2eeVector;\u6961ector\u0100;B\u08db\u08dc\u61c3ar;\u6959loor;\u630aight\u0100AV\u08ef\u08f5rrow;\u6194ector;\u694e\u0100er\u0901\u0917e\u0180;AV\u0909\u090a\u0910\u62a3rrow;\u61a4ector;\u695aiangle\u0180;BE\u0924\u0925\u0929\u62b2ar;\u69cfqual;\u62b4p\u0180DTV\u0937\u0942\u094cownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61bfar;\u6958ector\u0100;B\u0965\u0966\u61bcar;\u6952ight\xe1\u039cs\u0300EFGLST\u097e\u098b\u0995\u099d\u09a2\u09adqualGreater;\u62daullEqual;\u6266reater;\u6276ess;\u6aa1lantEqual;\u6a7dilde;\u6272r;\uc000\ud835\udd0f\u0100;e\u09bd\u09be\u62d8ftarrow;\u61daidot;\u413f\u0180npw\u09d4\u0a16\u0a1bg\u0200LRlr\u09de\u09f7\u0a02\u0a10eft\u0100AR\u09e6\u09ecrrow;\u67f5ightArrow;\u67f7ightArrow;\u67f6eft\u0100ar\u03b3\u0a0aight\xe1\u03bfight\xe1\u03caf;\uc000\ud835\udd43er\u0100LR\u0a22\u0a2ceftArrow;\u6199ightArrow;\u6198\u0180cht\u0a3e\u0a40\u0a42\xf2\u084c;\u61b0rok;\u4141;\u626a\u0400acefiosu\u0a5a\u0a5d\u0a60\u0a77\u0a7c\u0a85\u0a8b\u0a8ep;\u6905y;\u441c\u0100dl\u0a65\u0a6fiumSpace;\u605flintrf;\u6133r;\uc000\ud835\udd10nusPlus;\u6213pf;\uc000\ud835\udd44c\xf2\u0a76;\u439c\u0480Jacefostu\u0aa3\u0aa7\u0aad\u0ac0\u0b14\u0b19\u0d91\u0d97\u0d9ecy;\u440acute;\u4143\u0180aey\u0ab4\u0ab9\u0aberon;\u4147dil;\u4145;\u441d\u0180gsw\u0ac7\u0af0\u0b0eative\u0180MTV\u0ad3\u0adf\u0ae8ediumSpace;\u600bhi\u0100cn\u0ae6\u0ad8\xeb\u0ad9eryThi\xee\u0ad9ted\u0100GL\u0af8\u0b06reaterGreate\xf2\u0673essLes\xf3\u0a48Line;\u400ar;\uc000\ud835\udd11\u0200Bnpt\u0b22\u0b28\u0b37\u0b3areak;\u6060BreakingSpace;\u40a0f;\u6115\u0680;CDEGHLNPRSTV\u0b55\u0b56\u0b6a\u0b7c\u0ba1\u0beb\u0c04\u0c5e\u0c84\u0ca6\u0cd8\u0d61\u0d85\u6aec\u0100ou\u0b5b\u0b64ngruent;\u6262pCap;\u626doubleVerticalBar;\u6226\u0180lqx\u0b83\u0b8a\u0b9bement;\u6209ual\u0100;T\u0b92\u0b93\u6260ilde;\uc000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0bb6\u0bb7\u0bbd\u0bc9\u0bd3\u0bd8\u0be5\u626fqual;\u6271ullEqual;\uc000\u2267\u0338reater;\uc000\u226b\u0338ess;\u6279lantEqual;\uc000\u2a7e\u0338ilde;\u6275ump\u0144\u0bf2\u0bfdownHump;\uc000\u224e\u0338qual;\uc000\u224f\u0338e\u0100fs\u0c0a\u0c27tTriangle\u0180;BE\u0c1a\u0c1b\u0c21\u62eaar;\uc000\u29cf\u0338qual;\u62ecs\u0300;EGLST\u0c35\u0c36\u0c3c\u0c44\u0c4b\u0c58\u626equal;\u6270reater;\u6278ess;\uc000\u226a\u0338lantEqual;\uc000\u2a7d\u0338ilde;\u6274ested\u0100GL\u0c68\u0c79reaterGreater;\uc000\u2aa2\u0338essLess;\uc000\u2aa1\u0338recedes\u0180;ES\u0c92\u0c93\u0c9b\u6280qual;\uc000\u2aaf\u0338lantEqual;\u62e0\u0100ei\u0cab\u0cb9verseElement;\u620cghtTriangle\u0180;BE\u0ccb\u0ccc\u0cd2\u62ebar;\uc000\u29d0\u0338qual;\u62ed\u0100qu\u0cdd\u0d0cuareSu\u0100bp\u0ce8\u0cf9set\u0100;E\u0cf0\u0cf3\uc000\u228f\u0338qual;\u62e2erset\u0100;E\u0d03\u0d06\uc000\u2290\u0338qual;\u62e3\u0180bcp\u0d13\u0d24\u0d4eset\u0100;E\u0d1b\u0d1e\uc000\u2282\u20d2qual;\u6288ceeds\u0200;EST\u0d32\u0d33\u0d3b\u0d46\u6281qual;\uc000\u2ab0\u0338lantEqual;\u62e1ilde;\uc000\u227f\u0338erset\u0100;E\u0d58\u0d5b\uc000\u2283\u20d2qual;\u6289ilde\u0200;EFT\u0d6e\u0d6f\u0d75\u0d7f\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uc000\ud835\udca9ilde\u803b\xd1\u40d1;\u439d\u0700Eacdfgmoprstuv\u0dbd\u0dc2\u0dc9\u0dd5\u0ddb\u0de0\u0de7\u0dfc\u0e02\u0e20\u0e22\u0e32\u0e3f\u0e44lig;\u4152cute\u803b\xd3\u40d3\u0100iy\u0dce\u0dd3rc\u803b\xd4\u40d4;\u441eblac;\u4150r;\uc000\ud835\udd12rave\u803b\xd2\u40d2\u0180aei\u0dee\u0df2\u0df6cr;\u414cga;\u43a9cron;\u439fpf;\uc000\ud835\udd46enCurly\u0100DQ\u0e0e\u0e1aoubleQuote;\u601cuote;\u6018;\u6a54\u0100cl\u0e27\u0e2cr;\uc000\ud835\udcaaash\u803b\xd8\u40d8i\u016c\u0e37\u0e3cde\u803b\xd5\u40d5es;\u6a37ml\u803b\xd6\u40d6er\u0100BP\u0e4b\u0e60\u0100ar\u0e50\u0e53r;\u603eac\u0100ek\u0e5a\u0e5c;\u63deet;\u63b4arenthesis;\u63dc\u0480acfhilors\u0e7f\u0e87\u0e8a\u0e8f\u0e92\u0e94\u0e9d\u0eb0\u0efcrtialD;\u6202y;\u441fr;\uc000\ud835\udd13i;\u43a6;\u43a0usMinus;\u40b1\u0100ip\u0ea2\u0eadncareplan\xe5\u069df;\u6119\u0200;eio\u0eb9\u0eba\u0ee0\u0ee4\u6abbcedes\u0200;EST\u0ec8\u0ec9\u0ecf\u0eda\u627aqual;\u6aaflantEqual;\u627cilde;\u627eme;\u6033\u0100dp\u0ee9\u0eeeuct;\u620fortion\u0100;a\u0225\u0ef9l;\u621d\u0100ci\u0f01\u0f06r;\uc000\ud835\udcab;\u43a8\u0200Ufos\u0f11\u0f16\u0f1b\u0f1fOT\u803b\"\u4022r;\uc000\ud835\udd14pf;\u611acr;\uc000\ud835\udcac\u0600BEacefhiorsu\u0f3e\u0f43\u0f47\u0f60\u0f73\u0fa7\u0faa\u0fad\u1096\u10a9\u10b4\u10bearr;\u6910G\u803b\xae\u40ae\u0180cnr\u0f4e\u0f53\u0f56ute;\u4154g;\u67ebr\u0100;t\u0f5c\u0f5d\u61a0l;\u6916\u0180aey\u0f67\u0f6c\u0f71ron;\u4158dil;\u4156;\u4420\u0100;v\u0f78\u0f79\u611cerse\u0100EU\u0f82\u0f99\u0100lq\u0f87\u0f8eement;\u620builibrium;\u61cbpEquilibrium;\u696fr\xbb\u0f79o;\u43a1ght\u0400ACDFTUVa\u0fc1\u0feb\u0ff3\u1022\u1028\u105b\u1087\u03d8\u0100nr\u0fc6\u0fd2gleBracket;\u67e9row\u0180;BL\u0fdc\u0fdd\u0fe1\u6192ar;\u61e5eftArrow;\u61c4eiling;\u6309o\u01f5\u0ff9\0\u1005bleBracket;\u67e7n\u01d4\u100a\0\u1014eeVector;\u695dector\u0100;B\u101d\u101e\u61c2ar;\u6955loor;\u630b\u0100er\u102d\u1043e\u0180;AV\u1035\u1036\u103c\u62a2rrow;\u61a6ector;\u695biangle\u0180;BE\u1050\u1051\u1055\u62b3ar;\u69d0qual;\u62b5p\u0180DTV\u1063\u106e\u1078ownVector;\u694feeVector;\u695cector\u0100;B\u1082\u1083\u61bear;\u6954ector\u0100;B\u1091\u1092\u61c0ar;\u6953\u0100pu\u109b\u109ef;\u611dndImplies;\u6970ightarrow;\u61db\u0100ch\u10b9\u10bcr;\u611b;\u61b1leDelayed;\u69f4\u0680HOacfhimoqstu\u10e4\u10f1\u10f7\u10fd\u1119\u111e\u1151\u1156\u1161\u1167\u11b5\u11bb\u11bf\u0100Cc\u10e9\u10eeHcy;\u4429y;\u4428FTcy;\u442ccute;\u415a\u0280;aeiy\u1108\u1109\u110e\u1113\u1117\u6abcron;\u4160dil;\u415erc;\u415c;\u4421r;\uc000\ud835\udd16ort\u0200DLRU\u112a\u1134\u113e\u1149ownArrow\xbb\u041eeftArrow\xbb\u089aightArrow\xbb\u0fddpArrow;\u6191gma;\u43a3allCircle;\u6218pf;\uc000\ud835\udd4a\u0272\u116d\0\0\u1170t;\u621aare\u0200;ISU\u117b\u117c\u1189\u11af\u65a1ntersection;\u6293u\u0100bp\u118f\u119eset\u0100;E\u1197\u1198\u628fqual;\u6291erset\u0100;E\u11a8\u11a9\u6290qual;\u6292nion;\u6294cr;\uc000\ud835\udcaear;\u62c6\u0200bcmp\u11c8\u11db\u1209\u120b\u0100;s\u11cd\u11ce\u62d0et\u0100;E\u11cd\u11d5qual;\u6286\u0100ch\u11e0\u1205eeds\u0200;EST\u11ed\u11ee\u11f4\u11ff\u627bqual;\u6ab0lantEqual;\u627dilde;\u627fTh\xe1\u0f8c;\u6211\u0180;es\u1212\u1213\u1223\u62d1rset\u0100;E\u121c\u121d\u6283qual;\u6287et\xbb\u1213\u0580HRSacfhiors\u123e\u1244\u1249\u1255\u125e\u1271\u1276\u129f\u12c2\u12c8\u12d1ORN\u803b\xde\u40deADE;\u6122\u0100Hc\u124e\u1252cy;\u440by;\u4426\u0100bu\u125a\u125c;\u4009;\u43a4\u0180aey\u1265\u126a\u126fron;\u4164dil;\u4162;\u4422r;\uc000\ud835\udd17\u0100ei\u127b\u1289\u01f2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128e\u1298kSpace;\uc000\u205f\u200aSpace;\u6009lde\u0200;EFT\u12ab\u12ac\u12b2\u12bc\u623cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uc000\ud835\udd4bipleDot;\u60db\u0100ct\u12d6\u12dbr;\uc000\ud835\udcafrok;\u4166\u0ae1\u12f7\u130e\u131a\u1326\0\u132c\u1331\0\0\0\0\0\u1338\u133d\u1377\u1385\0\u13ff\u1404\u140a\u1410\u0100cr\u12fb\u1301ute\u803b\xda\u40dar\u0100;o\u1307\u1308\u619fcir;\u6949r\u01e3\u1313\0\u1316y;\u440eve;\u416c\u0100iy\u131e\u1323rc\u803b\xdb\u40db;\u4423blac;\u4170r;\uc000\ud835\udd18rave\u803b\xd9\u40d9acr;\u416a\u0100di\u1341\u1369er\u0100BP\u1348\u135d\u0100ar\u134d\u1350r;\u405fac\u0100ek\u1357\u1359;\u63dfet;\u63b5arenthesis;\u63ddon\u0100;P\u1370\u1371\u62c3lus;\u628e\u0100gp\u137b\u137fon;\u4172f;\uc000\ud835\udd4c\u0400ADETadps\u1395\u13ae\u13b8\u13c4\u03e8\u13d2\u13d7\u13f3rrow\u0180;BD\u1150\u13a0\u13a4ar;\u6912ownArrow;\u61c5ownArrow;\u6195quilibrium;\u696eee\u0100;A\u13cb\u13cc\u62a5rrow;\u61a5own\xe1\u03f3er\u0100LR\u13de\u13e8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13f9\u13fa\u43d2on;\u43a5ing;\u416ecr;\uc000\ud835\udcb0ilde;\u4168ml\u803b\xdc\u40dc\u0480Dbcdefosv\u1427\u142c\u1430\u1433\u143e\u1485\u148a\u1490\u1496ash;\u62abar;\u6aeby;\u4412ash\u0100;l\u143b\u143c\u62a9;\u6ae6\u0100er\u1443\u1445;\u62c1\u0180bty\u144c\u1450\u147aar;\u6016\u0100;i\u144f\u1455cal\u0200BLST\u1461\u1465\u146a\u1474ar;\u6223ine;\u407ceparator;\u6758ilde;\u6240ThinSpace;\u600ar;\uc000\ud835\udd19pf;\uc000\ud835\udd4dcr;\uc000\ud835\udcb1dash;\u62aa\u0280cefos\u14a7\u14ac\u14b1\u14b6\u14bcirc;\u4174dge;\u62c0r;\uc000\ud835\udd1apf;\uc000\ud835\udd4ecr;\uc000\ud835\udcb2\u0200fios\u14cb\u14d0\u14d2\u14d8r;\uc000\ud835\udd1b;\u439epf;\uc000\ud835\udd4fcr;\uc000\ud835\udcb3\u0480AIUacfosu\u14f1\u14f5\u14f9\u14fd\u1504\u150f\u1514\u151a\u1520cy;\u442fcy;\u4407cy;\u442ecute\u803b\xdd\u40dd\u0100iy\u1509\u150drc;\u4176;\u442br;\uc000\ud835\udd1cpf;\uc000\ud835\udd50cr;\uc000\ud835\udcb4ml;\u4178\u0400Hacdefos\u1535\u1539\u153f\u154b\u154f\u155d\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417d;\u4417ot;\u417b\u01f2\u1554\0\u155boWidt\xe8\u0ad9a;\u4396r;\u6128pf;\u6124cr;\uc000\ud835\udcb5\u0be1\u1583\u158a\u1590\0\u15b0\u15b6\u15bf\0\0\0\0\u15c6\u15db\u15eb\u165f\u166d\0\u1695\u169b\u16b2\u16b9\0\u16becute\u803b\xe1\u40e1reve;\u4103\u0300;Ediuy\u159c\u159d\u15a1\u15a3\u15a8\u15ad\u623e;\uc000\u223e\u0333;\u623frc\u803b\xe2\u40e2te\u80bb\xb4\u0306;\u4430lig\u803b\xe6\u40e6\u0100;r\xb2\u15ba;\uc000\ud835\udd1erave\u803b\xe0\u40e0\u0100ep\u15ca\u15d6\u0100fp\u15cf\u15d4sym;\u6135\xe8\u15d3ha;\u43b1\u0100ap\u15dfc\u0100cl\u15e4\u15e7r;\u4101g;\u6a3f\u0264\u15f0\0\0\u160a\u0280;adsv\u15fa\u15fb\u15ff\u1601\u1607\u6227nd;\u6a55;\u6a5clope;\u6a58;\u6a5a\u0380;elmrsz\u1618\u1619\u161b\u161e\u163f\u164f\u1659\u6220;\u69a4e\xbb\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163a\u163c\u163e;\u69a8;\u69a9;\u69aa;\u69ab;\u69ac;\u69ad;\u69ae;\u69aft\u0100;v\u1645\u1646\u621fb\u0100;d\u164c\u164d\u62be;\u699d\u0100pt\u1654\u1657h;\u6222\xbb\xb9arr;\u637c\u0100gp\u1663\u1667on;\u4105f;\uc000\ud835\udd52\u0380;Eaeiop\u12c1\u167b\u167d\u1682\u1684\u1687\u168a;\u6a70cir;\u6a6f;\u624ad;\u624bs;\u4027rox\u0100;e\u12c1\u1692\xf1\u1683ing\u803b\xe5\u40e5\u0180cty\u16a1\u16a6\u16a8r;\uc000\ud835\udcb6;\u402amp\u0100;e\u12c1\u16af\xf1\u0288ilde\u803b\xe3\u40e3ml\u803b\xe4\u40e4\u0100ci\u16c2\u16c8onin\xf4\u0272nt;\u6a11\u0800Nabcdefiklnoprsu\u16ed\u16f1\u1730\u173c\u1743\u1748\u1778\u177d\u17e0\u17e6\u1839\u1850\u170d\u193d\u1948\u1970ot;\u6aed\u0100cr\u16f6\u171ek\u0200ceps\u1700\u1705\u170d\u1713ong;\u624cpsilon;\u43f6rime;\u6035im\u0100;e\u171a\u171b\u623dq;\u62cd\u0176\u1722\u1726ee;\u62bded\u0100;g\u172c\u172d\u6305e\xbb\u172drk\u0100;t\u135c\u1737brk;\u63b6\u0100oy\u1701\u1741;\u4431quo;\u601e\u0280cmprt\u1753\u175b\u1761\u1764\u1768aus\u0100;e\u010a\u0109ptyv;\u69b0s\xe9\u170cno\xf5\u0113\u0180ahw\u176f\u1771\u1773;\u43b2;\u6136een;\u626cr;\uc000\ud835\udd1fg\u0380costuvw\u178d\u179d\u17b3\u17c1\u17d5\u17db\u17de\u0180aiu\u1794\u1796\u179a\xf0\u0760rc;\u65efp\xbb\u1371\u0180dpt\u17a4\u17a8\u17adot;\u6a00lus;\u6a01imes;\u6a02\u0271\u17b9\0\0\u17becup;\u6a06ar;\u6605riangle\u0100du\u17cd\u17d2own;\u65bdp;\u65b3plus;\u6a04e\xe5\u1444\xe5\u14adarow;\u690d\u0180ako\u17ed\u1826\u1835\u0100cn\u17f2\u1823k\u0180lst\u17fa\u05ab\u1802ozenge;\u69ebriangle\u0200;dlr\u1812\u1813\u1818\u181d\u65b4own;\u65beeft;\u65c2ight;\u65b8k;\u6423\u01b1\u182b\0\u1833\u01b2\u182f\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183e\u184d\u0100;q\u1843\u1846\uc000=\u20e5uiv;\uc000\u2261\u20e5t;\u6310\u0200ptwx\u1859\u185e\u1867\u186cf;\uc000\ud835\udd53\u0100;t\u13cb\u1863om\xbb\u13cctie;\u62c8\u0600DHUVbdhmptuv\u1885\u1896\u18aa\u18bb\u18d7\u18db\u18ec\u18ff\u1905\u190a\u1910\u1921\u0200LRlr\u188e\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18a1\u18a2\u18a4\u18a6\u18a8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18b3\u18b5\u18b7\u18b9;\u655d;\u655a;\u655c;\u6559\u0380;HLRhlr\u18ca\u18cb\u18cd\u18cf\u18d1\u18d3\u18d5\u6551;\u656c;\u6563;\u6560;\u656b;\u6562;\u655fox;\u69c9\u0200LRlr\u18e4\u18e6\u18e8\u18ea;\u6555;\u6552;\u6510;\u650c\u0280;DUdu\u06bd\u18f7\u18f9\u18fb\u18fd;\u6565;\u6568;\u652c;\u6534inus;\u629flus;\u629eimes;\u62a0\u0200LRlr\u1919\u191b\u191d\u191f;\u655b;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193b\u6502;\u656a;\u6561;\u655e;\u653c;\u6524;\u651c\u0100ev\u0123\u1942bar\u803b\xa6\u40a6\u0200ceio\u1951\u1956\u195a\u1960r;\uc000\ud835\udcb7mi;\u604fm\u0100;e\u171a\u171cl\u0180;bh\u1968\u1969\u196b\u405c;\u69c5sub;\u67c8\u016c\u1974\u197el\u0100;e\u1979\u197a\u6022t\xbb\u197ap\u0180;Ee\u012f\u1985\u1987;\u6aae\u0100;q\u06dc\u06db\u0ce1\u19a7\0\u19e8\u1a11\u1a15\u1a32\0\u1a37\u1a50\0\0\u1ab4\0\0\u1ac1\0\0\u1b21\u1b2e\u1b4d\u1b52\0\u1bfd\0\u1c0c\u0180cpr\u19ad\u19b2\u19ddute;\u4107\u0300;abcds\u19bf\u19c0\u19c4\u19ca\u19d5\u19d9\u6229nd;\u6a44rcup;\u6a49\u0100au\u19cf\u19d2p;\u6a4bp;\u6a47ot;\u6a40;\uc000\u2229\ufe00\u0100eo\u19e2\u19e5t;\u6041\xee\u0693\u0200aeiu\u19f0\u19fb\u1a01\u1a05\u01f0\u19f5\0\u19f8s;\u6a4don;\u410ddil\u803b\xe7\u40e7rc;\u4109ps\u0100;s\u1a0c\u1a0d\u6a4cm;\u6a50ot;\u410b\u0180dmn\u1a1b\u1a20\u1a26il\u80bb\xb8\u01adptyv;\u69b2t\u8100\xa2;e\u1a2d\u1a2e\u40a2r\xe4\u01b2r;\uc000\ud835\udd20\u0180cei\u1a3d\u1a40\u1a4dy;\u4447ck\u0100;m\u1a47\u1a48\u6713ark\xbb\u1a48;\u43c7r\u0380;Ecefms\u1a5f\u1a60\u1a62\u1a6b\u1aa4\u1aaa\u1aae\u65cb;\u69c3\u0180;el\u1a69\u1a6a\u1a6d\u42c6q;\u6257e\u0261\u1a74\0\0\u1a88rrow\u0100lr\u1a7c\u1a81eft;\u61baight;\u61bb\u0280RSacd\u1a92\u1a94\u1a96\u1a9a\u1a9f\xbb\u0f47;\u64c8st;\u629birc;\u629aash;\u629dnint;\u6a10id;\u6aefcir;\u69c2ubs\u0100;u\u1abb\u1abc\u6663it\xbb\u1abc\u02ec\u1ac7\u1ad4\u1afa\0\u1b0aon\u0100;e\u1acd\u1ace\u403a\u0100;q\xc7\xc6\u026d\u1ad9\0\0\u1ae2a\u0100;t\u1ade\u1adf\u402c;\u4040\u0180;fl\u1ae8\u1ae9\u1aeb\u6201\xee\u1160e\u0100mx\u1af1\u1af6ent\xbb\u1ae9e\xf3\u024d\u01e7\u1afe\0\u1b07\u0100;d\u12bb\u1b02ot;\u6a6dn\xf4\u0246\u0180fry\u1b10\u1b14\u1b17;\uc000\ud835\udd54o\xe4\u0254\u8100\xa9;s\u0155\u1b1dr;\u6117\u0100ao\u1b25\u1b29rr;\u61b5ss;\u6717\u0100cu\u1b32\u1b37r;\uc000\ud835\udcb8\u0100bp\u1b3c\u1b44\u0100;e\u1b41\u1b42\u6acf;\u6ad1\u0100;e\u1b49\u1b4a\u6ad0;\u6ad2dot;\u62ef\u0380delprvw\u1b60\u1b6c\u1b77\u1b82\u1bac\u1bd4\u1bf9arr\u0100lr\u1b68\u1b6a;\u6938;\u6935\u0270\u1b72\0\0\u1b75r;\u62dec;\u62dfarr\u0100;p\u1b7f\u1b80\u61b6;\u693d\u0300;bcdos\u1b8f\u1b90\u1b96\u1ba1\u1ba5\u1ba8\u622arcap;\u6a48\u0100au\u1b9b\u1b9ep;\u6a46p;\u6a4aot;\u628dr;\u6a45;\uc000\u222a\ufe00\u0200alrv\u1bb5\u1bbf\u1bde\u1be3rr\u0100;m\u1bbc\u1bbd\u61b7;\u693cy\u0180evw\u1bc7\u1bd4\u1bd8q\u0270\u1bce\0\0\u1bd2re\xe3\u1b73u\xe3\u1b75ee;\u62ceedge;\u62cfen\u803b\xa4\u40a4earrow\u0100lr\u1bee\u1bf3eft\xbb\u1b80ight\xbb\u1bbde\xe4\u1bdd\u0100ci\u1c01\u1c07onin\xf4\u01f7nt;\u6231lcty;\u632d\u0980AHabcdefhijlorstuwz\u1c38\u1c3b\u1c3f\u1c5d\u1c69\u1c75\u1c8a\u1c9e\u1cac\u1cb7\u1cfb\u1cff\u1d0d\u1d7b\u1d91\u1dab\u1dbb\u1dc6\u1dcdr\xf2\u0381ar;\u6965\u0200glrs\u1c48\u1c4d\u1c52\u1c54ger;\u6020eth;\u6138\xf2\u1133h\u0100;v\u1c5a\u1c5b\u6010\xbb\u090a\u016b\u1c61\u1c67arow;\u690fa\xe3\u0315\u0100ay\u1c6e\u1c73ron;\u410f;\u4434\u0180;ao\u0332\u1c7c\u1c84\u0100gr\u02bf\u1c81r;\u61catseq;\u6a77\u0180glm\u1c91\u1c94\u1c98\u803b\xb0\u40b0ta;\u43b4ptyv;\u69b1\u0100ir\u1ca3\u1ca8sht;\u697f;\uc000\ud835\udd21ar\u0100lr\u1cb3\u1cb5\xbb\u08dc\xbb\u101e\u0280aegsv\u1cc2\u0378\u1cd6\u1cdc\u1ce0m\u0180;os\u0326\u1cca\u1cd4nd\u0100;s\u0326\u1cd1uit;\u6666amma;\u43ddin;\u62f2\u0180;io\u1ce7\u1ce8\u1cf8\u40f7de\u8100\xf7;o\u1ce7\u1cf0ntimes;\u62c7n\xf8\u1cf7cy;\u4452c\u026f\u1d06\0\0\u1d0arn;\u631eop;\u630d\u0280lptuw\u1d18\u1d1d\u1d22\u1d49\u1d55lar;\u4024f;\uc000\ud835\udd55\u0280;emps\u030b\u1d2d\u1d37\u1d3d\u1d42q\u0100;d\u0352\u1d33ot;\u6251inus;\u6238lus;\u6214quare;\u62a1blebarwedg\xe5\xfan\u0180adh\u112e\u1d5d\u1d67ownarrow\xf3\u1c83arpoon\u0100lr\u1d72\u1d76ef\xf4\u1cb4igh\xf4\u1cb6\u0162\u1d7f\u1d85karo\xf7\u0f42\u026f\u1d8a\0\0\u1d8ern;\u631fop;\u630c\u0180cot\u1d98\u1da3\u1da6\u0100ry\u1d9d\u1da1;\uc000\ud835\udcb9;\u4455l;\u69f6rok;\u4111\u0100dr\u1db0\u1db4ot;\u62f1i\u0100;f\u1dba\u1816\u65bf\u0100ah\u1dc0\u1dc3r\xf2\u0429a\xf2\u0fa6angle;\u69a6\u0100ci\u1dd2\u1dd5y;\u445fgrarr;\u67ff\u0900Dacdefglmnopqrstux\u1e01\u1e09\u1e19\u1e38\u0578\u1e3c\u1e49\u1e61\u1e7e\u1ea5\u1eaf\u1ebd\u1ee1\u1f2a\u1f37\u1f44\u1f4e\u1f5a\u0100Do\u1e06\u1d34o\xf4\u1c89\u0100cs\u1e0e\u1e14ute\u803b\xe9\u40e9ter;\u6a6e\u0200aioy\u1e22\u1e27\u1e31\u1e36ron;\u411br\u0100;c\u1e2d\u1e2e\u6256\u803b\xea\u40ealon;\u6255;\u444dot;\u4117\u0100Dr\u1e41\u1e45ot;\u6252;\uc000\ud835\udd22\u0180;rs\u1e50\u1e51\u1e57\u6a9aave\u803b\xe8\u40e8\u0100;d\u1e5c\u1e5d\u6a96ot;\u6a98\u0200;ils\u1e6a\u1e6b\u1e72\u1e74\u6a99nters;\u63e7;\u6113\u0100;d\u1e79\u1e7a\u6a95ot;\u6a97\u0180aps\u1e85\u1e89\u1e97cr;\u4113ty\u0180;sv\u1e92\u1e93\u1e95\u6205et\xbb\u1e93p\u01001;\u1e9d\u1ea4\u0133\u1ea1\u1ea3;\u6004;\u6005\u6003\u0100gs\u1eaa\u1eac;\u414bp;\u6002\u0100gp\u1eb4\u1eb8on;\u4119f;\uc000\ud835\udd56\u0180als\u1ec4\u1ece\u1ed2r\u0100;s\u1eca\u1ecb\u62d5l;\u69e3us;\u6a71i\u0180;lv\u1eda\u1edb\u1edf\u43b5on\xbb\u1edb;\u43f5\u0200csuv\u1eea\u1ef3\u1f0b\u1f23\u0100io\u1eef\u1e31rc\xbb\u1e2e\u0269\u1ef9\0\0\u1efb\xed\u0548ant\u0100gl\u1f02\u1f06tr\xbb\u1e5dess\xbb\u1e7a\u0180aei\u1f12\u1f16\u1f1als;\u403dst;\u625fv\u0100;D\u0235\u1f20D;\u6a78parsl;\u69e5\u0100Da\u1f2f\u1f33ot;\u6253rr;\u6971\u0180cdi\u1f3e\u1f41\u1ef8r;\u612fo\xf4\u0352\u0100ah\u1f49\u1f4b;\u43b7\u803b\xf0\u40f0\u0100mr\u1f53\u1f57l\u803b\xeb\u40ebo;\u60ac\u0180cip\u1f61\u1f64\u1f67l;\u4021s\xf4\u056e\u0100eo\u1f6c\u1f74ctatio\xee\u0559nential\xe5\u0579\u09e1\u1f92\0\u1f9e\0\u1fa1\u1fa7\0\0\u1fc6\u1fcc\0\u1fd3\0\u1fe6\u1fea\u2000\0\u2008\u205allingdotse\xf1\u1e44y;\u4444male;\u6640\u0180ilr\u1fad\u1fb3\u1fc1lig;\u8000\ufb03\u0269\u1fb9\0\0\u1fbdg;\u8000\ufb00ig;\u8000\ufb04;\uc000\ud835\udd23lig;\u8000\ufb01lig;\uc000fj\u0180alt\u1fd9\u1fdc\u1fe1t;\u666dig;\u8000\ufb02ns;\u65b1of;\u4192\u01f0\u1fee\0\u1ff3f;\uc000\ud835\udd57\u0100ak\u05bf\u1ff7\u0100;v\u1ffc\u1ffd\u62d4;\u6ad9artint;\u6a0d\u0100ao\u200c\u2055\u0100cs\u2011\u2052\u03b1\u201a\u2030\u2038\u2045\u2048\0\u2050\u03b2\u2022\u2025\u2027\u202a\u202c\0\u202e\u803b\xbd\u40bd;\u6153\u803b\xbc\u40bc;\u6155;\u6159;\u615b\u01b3\u2034\0\u2036;\u6154;\u6156\u02b4\u203e\u2041\0\0\u2043\u803b\xbe\u40be;\u6157;\u615c5;\u6158\u01b6\u204c\0\u204e;\u615a;\u615d8;\u615el;\u6044wn;\u6322cr;\uc000\ud835\udcbb\u0880Eabcdefgijlnorstv\u2082\u2089\u209f\u20a5\u20b0\u20b4\u20f0\u20f5\u20fa\u20ff\u2103\u2112\u2138\u0317\u213e\u2152\u219e\u0100;l\u064d\u2087;\u6a8c\u0180cmp\u2090\u2095\u209dute;\u41f5ma\u0100;d\u209c\u1cda\u43b3;\u6a86reve;\u411f\u0100iy\u20aa\u20aerc;\u411d;\u4433ot;\u4121\u0200;lqs\u063e\u0642\u20bd\u20c9\u0180;qs\u063e\u064c\u20c4lan\xf4\u0665\u0200;cdl\u0665\u20d2\u20d5\u20e5c;\u6aa9ot\u0100;o\u20dc\u20dd\u6a80\u0100;l\u20e2\u20e3\u6a82;\u6a84\u0100;e\u20ea\u20ed\uc000\u22db\ufe00s;\u6a94r;\uc000\ud835\udd24\u0100;g\u0673\u061bmel;\u6137cy;\u4453\u0200;Eaj\u065a\u210c\u210e\u2110;\u6a92;\u6aa5;\u6aa4\u0200Eaes\u211b\u211d\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6a8arox\xbb\u2124\u0100;q\u212e\u212f\u6a88\u0100;q\u212e\u211bim;\u62e7pf;\uc000\ud835\udd58\u0100ci\u2143\u2146r;\u610am\u0180;el\u066b\u214e\u2150;\u6a8e;\u6a90\u8300>;cdlqr\u05ee\u2160\u216a\u216e\u2173\u2179\u0100ci\u2165\u2167;\u6aa7r;\u6a7aot;\u62d7Par;\u6995uest;\u6a7c\u0280adels\u2184\u216a\u2190\u0656\u219b\u01f0\u2189\0\u218epro\xf8\u209er;\u6978q\u0100lq\u063f\u2196les\xf3\u2088i\xed\u066b\u0100en\u21a3\u21adrtneqq;\uc000\u2269\ufe00\xc5\u21aa\u0500Aabcefkosy\u21c4\u21c7\u21f1\u21f5\u21fa\u2218\u221d\u222f\u2268\u227dr\xf2\u03a0\u0200ilmr\u21d0\u21d4\u21d7\u21dbrs\xf0\u1484f\xbb\u2024il\xf4\u06a9\u0100dr\u21e0\u21e4cy;\u444a\u0180;cw\u08f4\u21eb\u21efir;\u6948;\u61adar;\u610firc;\u4125\u0180alr\u2201\u220e\u2213rts\u0100;u\u2209\u220a\u6665it\xbb\u220alip;\u6026con;\u62b9r;\uc000\ud835\udd25s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223a\u223e\u2243\u225e\u2263rr;\u61fftht;\u623bk\u0100lr\u2249\u2253eftarrow;\u61a9ightarrow;\u61aaf;\uc000\ud835\udd59bar;\u6015\u0180clt\u226f\u2274\u2278r;\uc000\ud835\udcbdas\xe8\u21f4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xbb\u1c5b\u0ae1\u22a3\0\u22aa\0\u22b8\u22c5\u22ce\0\u22d5\u22f3\0\0\u22f8\u2322\u2367\u2362\u237f\0\u2386\u23aa\u23b4cute\u803b\xed\u40ed\u0180;iy\u0771\u22b0\u22b5rc\u803b\xee\u40ee;\u4438\u0100cx\u22bc\u22bfy;\u4435cl\u803b\xa1\u40a1\u0100fr\u039f\u22c9;\uc000\ud835\udd26rave\u803b\xec\u40ec\u0200;ino\u073e\u22dd\u22e9\u22ee\u0100in\u22e2\u22e6nt;\u6a0ct;\u622dfin;\u69dcta;\u6129lig;\u4133\u0180aop\u22fe\u231a\u231d\u0180cgt\u2305\u2308\u2317r;\u412b\u0180elp\u071f\u230f\u2313in\xe5\u078ear\xf4\u0720h;\u4131f;\u62b7ed;\u41b5\u0280;cfot\u04f4\u232c\u2331\u233d\u2341are;\u6105in\u0100;t\u2338\u2339\u621eie;\u69dddo\xf4\u2319\u0280;celp\u0757\u234c\u2350\u235b\u2361al;\u62ba\u0100gr\u2355\u2359er\xf3\u1563\xe3\u234darhk;\u6a17rod;\u6a3c\u0200cgpt\u236f\u2372\u2376\u237by;\u4451on;\u412ff;\uc000\ud835\udd5aa;\u43b9uest\u803b\xbf\u40bf\u0100ci\u238a\u238fr;\uc000\ud835\udcben\u0280;Edsv\u04f4\u239b\u239d\u23a1\u04f3;\u62f9ot;\u62f5\u0100;v\u23a6\u23a7\u62f4;\u62f3\u0100;i\u0777\u23aelde;\u4129\u01eb\u23b8\0\u23bccy;\u4456l\u803b\xef\u40ef\u0300cfmosu\u23cc\u23d7\u23dc\u23e1\u23e7\u23f5\u0100iy\u23d1\u23d5rc;\u4135;\u4439r;\uc000\ud835\udd27ath;\u4237pf;\uc000\ud835\udd5b\u01e3\u23ec\0\u23f1r;\uc000\ud835\udcbfrcy;\u4458kcy;\u4454\u0400acfghjos\u240b\u2416\u2422\u2427\u242d\u2431\u2435\u243bppa\u0100;v\u2413\u2414\u43ba;\u43f0\u0100ey\u241b\u2420dil;\u4137;\u443ar;\uc000\ud835\udd28reen;\u4138cy;\u4445cy;\u445cpf;\uc000\ud835\udd5ccr;\uc000\ud835\udcc0\u0b80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248d\u2491\u250e\u253d\u255a\u2580\u264e\u265e\u2665\u2679\u267d\u269a\u26b2\u26d8\u275d\u2768\u278b\u27c0\u2801\u2812\u0180art\u2477\u247a\u247cr\xf2\u09c6\xf2\u0395ail;\u691barr;\u690e\u0100;g\u0994\u248b;\u6a8bar;\u6962\u0963\u24a5\0\u24aa\0\u24b1\0\0\0\0\0\u24b5\u24ba\0\u24c6\u24c8\u24cd\0\u24f9ute;\u413amptyv;\u69b4ra\xee\u084cbda;\u43bbg\u0180;dl\u088e\u24c1\u24c3;\u6991\xe5\u088e;\u6a85uo\u803b\xab\u40abr\u0400;bfhlpst\u0899\u24de\u24e6\u24e9\u24eb\u24ee\u24f1\u24f5\u0100;f\u089d\u24e3s;\u691fs;\u691d\xeb\u2252p;\u61abl;\u6939im;\u6973l;\u61a2\u0180;ae\u24ff\u2500\u2504\u6aabil;\u6919\u0100;s\u2509\u250a\u6aad;\uc000\u2aad\ufe00\u0180abr\u2515\u2519\u251drr;\u690crk;\u6772\u0100ak\u2522\u252cc\u0100ek\u2528\u252a;\u407b;\u405b\u0100es\u2531\u2533;\u698bl\u0100du\u2539\u253b;\u698f;\u698d\u0200aeuy\u2546\u254b\u2556\u2558ron;\u413e\u0100di\u2550\u2554il;\u413c\xec\u08b0\xe2\u2529;\u443b\u0200cqrs\u2563\u2566\u256d\u257da;\u6936uo\u0100;r\u0e19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694bh;\u61b2\u0280;fgqs\u258b\u258c\u0989\u25f3\u25ff\u6264t\u0280ahlrt\u2598\u25a4\u25b7\u25c2\u25e8rrow\u0100;t\u0899\u25a1a\xe9\u24f6arpoon\u0100du\u25af\u25b4own\xbb\u045ap\xbb\u0966eftarrows;\u61c7ight\u0180ahs\u25cd\u25d6\u25derrow\u0100;s\u08f4\u08a7arpoon\xf3\u0f98quigarro\xf7\u21f0hreetimes;\u62cb\u0180;qs\u258b\u0993\u25falan\xf4\u09ac\u0280;cdgs\u09ac\u260a\u260d\u261d\u2628c;\u6aa8ot\u0100;o\u2614\u2615\u6a7f\u0100;r\u261a\u261b\u6a81;\u6a83\u0100;e\u2622\u2625\uc000\u22da\ufe00s;\u6a93\u0280adegs\u2633\u2639\u263d\u2649\u264bppro\xf8\u24c6ot;\u62d6q\u0100gq\u2643\u2645\xf4\u0989gt\xf2\u248c\xf4\u099bi\xed\u09b2\u0180ilr\u2655\u08e1\u265asht;\u697c;\uc000\ud835\udd29\u0100;E\u099c\u2663;\u6a91\u0161\u2669\u2676r\u0100du\u25b2\u266e\u0100;l\u0965\u2673;\u696alk;\u6584cy;\u4459\u0280;acht\u0a48\u2688\u268b\u2691\u2696r\xf2\u25c1orne\xf2\u1d08ard;\u696bri;\u65fa\u0100io\u269f\u26a4dot;\u4140ust\u0100;a\u26ac\u26ad\u63b0che\xbb\u26ad\u0200Eaes\u26bb\u26bd\u26c9\u26d4;\u6268p\u0100;p\u26c3\u26c4\u6a89rox\xbb\u26c4\u0100;q\u26ce\u26cf\u6a87\u0100;q\u26ce\u26bbim;\u62e6\u0400abnoptwz\u26e9\u26f4\u26f7\u271a\u272f\u2741\u2747\u2750\u0100nr\u26ee\u26f1g;\u67ecr;\u61fdr\xeb\u08c1g\u0180lmr\u26ff\u270d\u2714eft\u0100ar\u09e6\u2707ight\xe1\u09f2apsto;\u67fcight\xe1\u09fdparrow\u0100lr\u2725\u2729ef\xf4\u24edight;\u61ac\u0180afl\u2736\u2739\u273dr;\u6985;\uc000\ud835\udd5dus;\u6a2dimes;\u6a34\u0161\u274b\u274fst;\u6217\xe1\u134e\u0180;ef\u2757\u2758\u1800\u65cange\xbb\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277c\u2785\u2787r\xf2\u08a8orne\xf2\u1d8car\u0100;d\u0f98\u2783;\u696d;\u600eri;\u62bf\u0300achiqt\u2798\u279d\u0a40\u27a2\u27ae\u27bbquo;\u6039r;\uc000\ud835\udcc1m\u0180;eg\u09b2\u27aa\u27ac;\u6a8d;\u6a8f\u0100bu\u252a\u27b3o\u0100;r\u0e1f\u27b9;\u601arok;\u4142\u8400<;cdhilqr\u082b\u27d2\u2639\u27dc\u27e0\u27e5\u27ea\u27f0\u0100ci\u27d7\u27d9;\u6aa6r;\u6a79re\xe5\u25f2mes;\u62c9arr;\u6976uest;\u6a7b\u0100Pi\u27f5\u27f9ar;\u6996\u0180;ef\u2800\u092d\u181b\u65c3r\u0100du\u2807\u280dshar;\u694ahar;\u6966\u0100en\u2817\u2821rtneqq;\uc000\u2268\ufe00\xc5\u281e\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288e\u2893\u28a0\u28a5\u28a8\u28da\u28e2\u28e4\u0a83\u28f3\u2902Dot;\u623a\u0200clpr\u284e\u2852\u2863\u287dr\u803b\xaf\u40af\u0100et\u2857\u2859;\u6642\u0100;e\u285e\u285f\u6720se\xbb\u285f\u0100;s\u103b\u2868to\u0200;dlu\u103b\u2873\u2877\u287bow\xee\u048cef\xf4\u090f\xf0\u13d1ker;\u65ae\u0100oy\u2887\u288cmma;\u6a29;\u443cash;\u6014asuredangle\xbb\u1626r;\uc000\ud835\udd2ao;\u6127\u0180cdn\u28af\u28b4\u28c9ro\u803b\xb5\u40b5\u0200;acd\u1464\u28bd\u28c0\u28c4s\xf4\u16a7ir;\u6af0ot\u80bb\xb7\u01b5us\u0180;bd\u28d2\u1903\u28d3\u6212\u0100;u\u1d3c\u28d8;\u6a2a\u0163\u28de\u28e1p;\u6adb\xf2\u2212\xf0\u0a81\u0100dp\u28e9\u28eeels;\u62a7f;\uc000\ud835\udd5e\u0100ct\u28f8\u28fdr;\uc000\ud835\udcc2pos\xbb\u159d\u0180;lm\u2909\u290a\u290d\u43bctimap;\u62b8\u0c00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297e\u2989\u2998\u29da\u29e9\u2a15\u2a1a\u2a58\u2a5d\u2a83\u2a95\u2aa4\u2aa8\u2b04\u2b07\u2b44\u2b7f\u2bae\u2c34\u2c67\u2c7c\u2ce9\u0100gt\u2947\u294b;\uc000\u22d9\u0338\u0100;v\u2950\u0bcf\uc000\u226b\u20d2\u0180elt\u295a\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61cdightarrow;\u61ce;\uc000\u22d8\u0338\u0100;v\u297b\u0c47\uc000\u226a\u20d2ightarrow;\u61cf\u0100Dd\u298e\u2993ash;\u62afash;\u62ae\u0280bcnpt\u29a3\u29a7\u29ac\u29b1\u29ccla\xbb\u02deute;\u4144g;\uc000\u2220\u20d2\u0280;Eiop\u0d84\u29bc\u29c0\u29c5\u29c8;\uc000\u2a70\u0338d;\uc000\u224b\u0338s;\u4149ro\xf8\u0d84ur\u0100;a\u29d3\u29d4\u666el\u0100;s\u29d3\u0b38\u01f3\u29df\0\u29e3p\u80bb\xa0\u0b37mp\u0100;e\u0bf9\u0c00\u0280aeouy\u29f4\u29fe\u2a03\u2a10\u2a13\u01f0\u29f9\0\u29fb;\u6a43on;\u4148dil;\u4146ng\u0100;d\u0d7e\u2a0aot;\uc000\u2a6d\u0338p;\u6a42;\u443dash;\u6013\u0380;Aadqsx\u0b92\u2a29\u2a2d\u2a3b\u2a41\u2a45\u2a50rr;\u61d7r\u0100hr\u2a33\u2a36k;\u6924\u0100;o\u13f2\u13f0ot;\uc000\u2250\u0338ui\xf6\u0b63\u0100ei\u2a4a\u2a4ear;\u6928\xed\u0b98ist\u0100;s\u0ba0\u0b9fr;\uc000\ud835\udd2b\u0200Eest\u0bc5\u2a66\u2a79\u2a7c\u0180;qs\u0bbc\u2a6d\u0be1\u0180;qs\u0bbc\u0bc5\u2a74lan\xf4\u0be2i\xed\u0bea\u0100;r\u0bb6\u2a81\xbb\u0bb7\u0180Aap\u2a8a\u2a8d\u2a91r\xf2\u2971rr;\u61aear;\u6af2\u0180;sv\u0f8d\u2a9c\u0f8c\u0100;d\u2aa1\u2aa2\u62fc;\u62facy;\u445a\u0380AEadest\u2ab7\u2aba\u2abe\u2ac2\u2ac5\u2af6\u2af9r\xf2\u2966;\uc000\u2266\u0338rr;\u619ar;\u6025\u0200;fqs\u0c3b\u2ace\u2ae3\u2aeft\u0100ar\u2ad4\u2ad9rro\xf7\u2ac1ightarro\xf7\u2a90\u0180;qs\u0c3b\u2aba\u2aealan\xf4\u0c55\u0100;s\u0c55\u2af4\xbb\u0c36i\xed\u0c5d\u0100;r\u0c35\u2afei\u0100;e\u0c1a\u0c25i\xe4\u0d90\u0100pt\u2b0c\u2b11f;\uc000\ud835\udd5f\u8180\xac;in\u2b19\u2b1a\u2b36\u40acn\u0200;Edv\u0b89\u2b24\u2b28\u2b2e;\uc000\u22f9\u0338ot;\uc000\u22f5\u0338\u01e1\u0b89\u2b33\u2b35;\u62f7;\u62f6i\u0100;v\u0cb8\u2b3c\u01e1\u0cb8\u2b41\u2b43;\u62fe;\u62fd\u0180aor\u2b4b\u2b63\u2b69r\u0200;ast\u0b7b\u2b55\u2b5a\u2b5flle\xec\u0b7bl;\uc000\u2afd\u20e5;\uc000\u2202\u0338lint;\u6a14\u0180;ce\u0c92\u2b70\u2b73u\xe5\u0ca5\u0100;c\u0c98\u2b78\u0100;e\u0c92\u2b7d\xf1\u0c98\u0200Aait\u2b88\u2b8b\u2b9d\u2ba7r\xf2\u2988rr\u0180;cw\u2b94\u2b95\u2b99\u619b;\uc000\u2933\u0338;\uc000\u219d\u0338ghtarrow\xbb\u2b95ri\u0100;e\u0ccb\u0cd6\u0380chimpqu\u2bbd\u2bcd\u2bd9\u2b04\u0b78\u2be4\u2bef\u0200;cer\u0d32\u2bc6\u0d37\u2bc9u\xe5\u0d45;\uc000\ud835\udcc3ort\u026d\u2b05\0\0\u2bd6ar\xe1\u2b56m\u0100;e\u0d6e\u2bdf\u0100;q\u0d74\u0d73su\u0100bp\u2beb\u2bed\xe5\u0cf8\xe5\u0d0b\u0180bcp\u2bf6\u2c11\u2c19\u0200;Ees\u2bff\u2c00\u0d22\u2c04\u6284;\uc000\u2ac5\u0338et\u0100;e\u0d1b\u2c0bq\u0100;q\u0d23\u2c00c\u0100;e\u0d32\u2c17\xf1\u0d38\u0200;Ees\u2c22\u2c23\u0d5f\u2c27\u6285;\uc000\u2ac6\u0338et\u0100;e\u0d58\u2c2eq\u0100;q\u0d60\u2c23\u0200gilr\u2c3d\u2c3f\u2c45\u2c47\xec\u0bd7lde\u803b\xf1\u40f1\xe7\u0c43iangle\u0100lr\u2c52\u2c5ceft\u0100;e\u0c1a\u2c5a\xf1\u0c26ight\u0100;e\u0ccb\u2c65\xf1\u0cd7\u0100;m\u2c6c\u2c6d\u43bd\u0180;es\u2c74\u2c75\u2c79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2c8f\u2c94\u2c99\u2c9e\u2ca3\u2cb0\u2cb6\u2cd3\u2ce3ash;\u62adarr;\u6904p;\uc000\u224d\u20d2ash;\u62ac\u0100et\u2ca8\u2cac;\uc000\u2265\u20d2;\uc000>\u20d2nfin;\u69de\u0180Aet\u2cbd\u2cc1\u2cc5rr;\u6902;\uc000\u2264\u20d2\u0100;r\u2cca\u2ccd\uc000<\u20d2ie;\uc000\u22b4\u20d2\u0100At\u2cd8\u2cdcrr;\u6903rie;\uc000\u22b5\u20d2im;\uc000\u223c\u20d2\u0180Aan\u2cf0\u2cf4\u2d02rr;\u61d6r\u0100hr\u2cfa\u2cfdk;\u6923\u0100;o\u13e7\u13e5ear;\u6927\u1253\u1a95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2d2d\0\u2d38\u2d48\u2d60\u2d65\u2d72\u2d84\u1b07\0\0\u2d8d\u2dab\0\u2dc8\u2dce\0\u2ddc\u2e19\u2e2b\u2e3e\u2e43\u0100cs\u2d31\u1a97ute\u803b\xf3\u40f3\u0100iy\u2d3c\u2d45r\u0100;c\u1a9e\u2d42\u803b\xf4\u40f4;\u443e\u0280abios\u1aa0\u2d52\u2d57\u01c8\u2d5alac;\u4151v;\u6a38old;\u69bclig;\u4153\u0100cr\u2d69\u2d6dir;\u69bf;\uc000\ud835\udd2c\u036f\u2d79\0\0\u2d7c\0\u2d82n;\u42dbave\u803b\xf2\u40f2;\u69c1\u0100bm\u2d88\u0df4ar;\u69b5\u0200acit\u2d95\u2d98\u2da5\u2da8r\xf2\u1a80\u0100ir\u2d9d\u2da0r;\u69beoss;\u69bbn\xe5\u0e52;\u69c0\u0180aei\u2db1\u2db5\u2db9cr;\u414dga;\u43c9\u0180cdn\u2dc0\u2dc5\u01cdron;\u43bf;\u69b6pf;\uc000\ud835\udd60\u0180ael\u2dd4\u2dd7\u01d2r;\u69b7rp;\u69b9\u0380;adiosv\u2dea\u2deb\u2dee\u2e08\u2e0d\u2e10\u2e16\u6228r\xf2\u1a86\u0200;efm\u2df7\u2df8\u2e02\u2e05\u6a5dr\u0100;o\u2dfe\u2dff\u6134f\xbb\u2dff\u803b\xaa\u40aa\u803b\xba\u40bagof;\u62b6r;\u6a56lope;\u6a57;\u6a5b\u0180clo\u2e1f\u2e21\u2e27\xf2\u2e01ash\u803b\xf8\u40f8l;\u6298i\u016c\u2e2f\u2e34de\u803b\xf5\u40f5es\u0100;a\u01db\u2e3as;\u6a36ml\u803b\xf6\u40f6bar;\u633d\u0ae1\u2e5e\0\u2e7d\0\u2e80\u2e9d\0\u2ea2\u2eb9\0\0\u2ecb\u0e9c\0\u2f13\0\0\u2f2b\u2fbc\0\u2fc8r\u0200;ast\u0403\u2e67\u2e72\u0e85\u8100\xb6;l\u2e6d\u2e6e\u40b6le\xec\u0403\u0269\u2e78\0\0\u2e7bm;\u6af3;\u6afdy;\u443fr\u0280cimpt\u2e8b\u2e8f\u2e93\u1865\u2e97nt;\u4025od;\u402eil;\u6030enk;\u6031r;\uc000\ud835\udd2d\u0180imo\u2ea8\u2eb0\u2eb4\u0100;v\u2ead\u2eae\u43c6;\u43d5ma\xf4\u0a76ne;\u660e\u0180;tv\u2ebf\u2ec0\u2ec8\u43c0chfork\xbb\u1ffd;\u43d6\u0100au\u2ecf\u2edfn\u0100ck\u2ed5\u2eddk\u0100;h\u21f4\u2edb;\u610e\xf6\u21f4s\u0480;abcdemst\u2ef3\u2ef4\u1908\u2ef9\u2efd\u2f04\u2f06\u2f0a\u2f0e\u402bcir;\u6a23ir;\u6a22\u0100ou\u1d40\u2f02;\u6a25;\u6a72n\u80bb\xb1\u0e9dim;\u6a26wo;\u6a27\u0180ipu\u2f19\u2f20\u2f25ntint;\u6a15f;\uc000\ud835\udd61nd\u803b\xa3\u40a3\u0500;Eaceinosu\u0ec8\u2f3f\u2f41\u2f44\u2f47\u2f81\u2f89\u2f92\u2f7e\u2fb6;\u6ab3p;\u6ab7u\xe5\u0ed9\u0100;c\u0ece\u2f4c\u0300;acens\u0ec8\u2f59\u2f5f\u2f66\u2f68\u2f7eppro\xf8\u2f43urlye\xf1\u0ed9\xf1\u0ece\u0180aes\u2f6f\u2f76\u2f7approx;\u6ab9qq;\u6ab5im;\u62e8i\xed\u0edfme\u0100;s\u2f88\u0eae\u6032\u0180Eas\u2f78\u2f90\u2f7a\xf0\u2f75\u0180dfp\u0eec\u2f99\u2faf\u0180als\u2fa0\u2fa5\u2faalar;\u632eine;\u6312urf;\u6313\u0100;t\u0efb\u2fb4\xef\u0efbrel;\u62b0\u0100ci\u2fc0\u2fc5r;\uc000\ud835\udcc5;\u43c8ncsp;\u6008\u0300fiopsu\u2fda\u22e2\u2fdf\u2fe5\u2feb\u2ff1r;\uc000\ud835\udd2epf;\uc000\ud835\udd62rime;\u6057cr;\uc000\ud835\udcc6\u0180aeo\u2ff8\u3009\u3013t\u0100ei\u2ffe\u3005rnion\xf3\u06b0nt;\u6a16st\u0100;e\u3010\u3011\u403f\xf1\u1f19\xf4\u0f14\u0a80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30e0\u310e\u312b\u3147\u3162\u3172\u318e\u3206\u3215\u3224\u3229\u3258\u326e\u3272\u3290\u32b0\u32b7\u0180art\u3047\u304a\u304cr\xf2\u10b3\xf2\u03ddail;\u691car\xf2\u1c65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307f\u308f\u3094\u30cc\u0100eu\u306d\u3071;\uc000\u223d\u0331te;\u4155i\xe3\u116emptyv;\u69b3g\u0200;del\u0fd1\u3089\u308b\u308d;\u6992;\u69a5\xe5\u0fd1uo\u803b\xbb\u40bbr\u0580;abcfhlpstw\u0fdc\u30ac\u30af\u30b7\u30b9\u30bc\u30be\u30c0\u30c3\u30c7\u30cap;\u6975\u0100;f\u0fe0\u30b4s;\u6920;\u6933s;\u691e\xeb\u225d\xf0\u272el;\u6945im;\u6974l;\u61a3;\u619d\u0100ai\u30d1\u30d5il;\u691ao\u0100;n\u30db\u30dc\u6236al\xf3\u0f1e\u0180abr\u30e7\u30ea\u30eer\xf2\u17e5rk;\u6773\u0100ak\u30f3\u30fdc\u0100ek\u30f9\u30fb;\u407d;\u405d\u0100es\u3102\u3104;\u698cl\u0100du\u310a\u310c;\u698e;\u6990\u0200aeuy\u3117\u311c\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xec\u0ff2\xe2\u30fa;\u4440\u0200clqs\u3134\u3137\u313d\u3144a;\u6937dhar;\u6969uo\u0100;r\u020e\u020dh;\u61b3\u0180acg\u314e\u315f\u0f44l\u0200;ips\u0f78\u3158\u315b\u109cn\xe5\u10bbar\xf4\u0fa9t;\u65ad\u0180ilr\u3169\u1023\u316esht;\u697d;\uc000\ud835\udd2f\u0100ao\u3177\u3186r\u0100du\u317d\u317f\xbb\u047b\u0100;l\u1091\u3184;\u696c\u0100;v\u318b\u318c\u43c1;\u43f1\u0180gns\u3195\u31f9\u31fcht\u0300ahlrst\u31a4\u31b0\u31c2\u31d8\u31e4\u31eerrow\u0100;t\u0fdc\u31ada\xe9\u30c8arpoon\u0100du\u31bb\u31bfow\xee\u317ep\xbb\u1092eft\u0100ah\u31ca\u31d0rrow\xf3\u0feaarpoon\xf3\u0551ightarrows;\u61c9quigarro\xf7\u30cbhreetimes;\u62ccg;\u42daingdotse\xf1\u1f32\u0180ahm\u320d\u3210\u3213r\xf2\u0feaa\xf2\u0551;\u600foust\u0100;a\u321e\u321f\u63b1che\xbb\u321fmid;\u6aee\u0200abpt\u3232\u323d\u3240\u3252\u0100nr\u3237\u323ag;\u67edr;\u61fer\xeb\u1003\u0180afl\u3247\u324a\u324er;\u6986;\uc000\ud835\udd63us;\u6a2eimes;\u6a35\u0100ap\u325d\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6a12ar\xf2\u31e3\u0200achq\u327b\u3280\u10bc\u3285quo;\u603ar;\uc000\ud835\udcc7\u0100bu\u30fb\u328ao\u0100;r\u0214\u0213\u0180hir\u3297\u329b\u32a0re\xe5\u31f8mes;\u62cai\u0200;efl\u32aa\u1059\u1821\u32ab\u65b9tri;\u69celuhar;\u6968;\u611e\u0d61\u32d5\u32db\u32df\u332c\u3338\u3371\0\u337a\u33a4\0\0\u33ec\u33f0\0\u3428\u3448\u345a\u34ad\u34b1\u34ca\u34f1\0\u3616\0\0\u3633cute;\u415bqu\xef\u27ba\u0500;Eaceinpsy\u11ed\u32f3\u32f5\u32ff\u3302\u330b\u330f\u331f\u3326\u3329;\u6ab4\u01f0\u32fa\0\u32fc;\u6ab8on;\u4161u\xe5\u11fe\u0100;d\u11f3\u3307il;\u415frc;\u415d\u0180Eas\u3316\u3318\u331b;\u6ab6p;\u6abaim;\u62e9olint;\u6a13i\xed\u1204;\u4441ot\u0180;be\u3334\u1d47\u3335\u62c5;\u6a66\u0380Aacmstx\u3346\u334a\u3357\u335b\u335e\u3363\u336drr;\u61d8r\u0100hr\u3350\u3352\xeb\u2228\u0100;o\u0a36\u0a34t\u803b\xa7\u40a7i;\u403bwar;\u6929m\u0100in\u3369\xf0nu\xf3\xf1t;\u6736r\u0100;o\u3376\u2055\uc000\ud835\udd30\u0200acoy\u3382\u3386\u3391\u33a0rp;\u666f\u0100hy\u338b\u338fcy;\u4449;\u4448rt\u026d\u3399\0\0\u339ci\xe4\u1464ara\xec\u2e6f\u803b\xad\u40ad\u0100gm\u33a8\u33b4ma\u0180;fv\u33b1\u33b2\u33b2\u43c3;\u43c2\u0400;deglnpr\u12ab\u33c5\u33c9\u33ce\u33d6\u33de\u33e1\u33e6ot;\u6a6a\u0100;q\u12b1\u12b0\u0100;E\u33d3\u33d4\u6a9e;\u6aa0\u0100;E\u33db\u33dc\u6a9d;\u6a9fe;\u6246lus;\u6a24arr;\u6972ar\xf2\u113d\u0200aeit\u33f8\u3408\u340f\u3417\u0100ls\u33fd\u3404lsetm\xe9\u336ahp;\u6a33parsl;\u69e4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341c\u341d\u6aaa\u0100;s\u3422\u3423\u6aac;\uc000\u2aac\ufe00\u0180flp\u342e\u3433\u3442tcy;\u444c\u0100;b\u3438\u3439\u402f\u0100;a\u343e\u343f\u69c4r;\u633ff;\uc000\ud835\udd64a\u0100dr\u344d\u0402es\u0100;u\u3454\u3455\u6660it\xbb\u3455\u0180csu\u3460\u3479\u349f\u0100au\u3465\u346fp\u0100;s\u1188\u346b;\uc000\u2293\ufe00p\u0100;s\u11b4\u3475;\uc000\u2294\ufe00u\u0100bp\u347f\u348f\u0180;es\u1197\u119c\u3486et\u0100;e\u1197\u348d\xf1\u119d\u0180;es\u11a8\u11ad\u3496et\u0100;e\u11a8\u349d\xf1\u11ae\u0180;af\u117b\u34a6\u05b0r\u0165\u34ab\u05b1\xbb\u117car\xf2\u1148\u0200cemt\u34b9\u34be\u34c2\u34c5r;\uc000\ud835\udcc8tm\xee\xf1i\xec\u3415ar\xe6\u11be\u0100ar\u34ce\u34d5r\u0100;f\u34d4\u17bf\u6606\u0100an\u34da\u34edight\u0100ep\u34e3\u34eapsilo\xee\u1ee0h\xe9\u2eafs\xbb\u2852\u0280bcmnp\u34fb\u355e\u1209\u358b\u358e\u0480;Edemnprs\u350e\u350f\u3511\u3515\u351e\u3523\u352c\u3531\u3536\u6282;\u6ac5ot;\u6abd\u0100;d\u11da\u351aot;\u6ac3ult;\u6ac1\u0100Ee\u3528\u352a;\u6acb;\u628alus;\u6abfarr;\u6979\u0180eiu\u353d\u3552\u3555t\u0180;en\u350e\u3545\u354bq\u0100;q\u11da\u350feq\u0100;q\u352b\u3528m;\u6ac7\u0100bp\u355a\u355c;\u6ad5;\u6ad3c\u0300;acens\u11ed\u356c\u3572\u3579\u357b\u3326ppro\xf8\u32faurlye\xf1\u11fe\xf1\u11f3\u0180aes\u3582\u3588\u331bppro\xf8\u331aq\xf1\u3317g;\u666a\u0680123;Edehlmnps\u35a9\u35ac\u35af\u121c\u35b2\u35b4\u35c0\u35c9\u35d5\u35da\u35df\u35e8\u35ed\u803b\xb9\u40b9\u803b\xb2\u40b2\u803b\xb3\u40b3;\u6ac6\u0100os\u35b9\u35bct;\u6abeub;\u6ad8\u0100;d\u1222\u35c5ot;\u6ac4s\u0100ou\u35cf\u35d2l;\u67c9b;\u6ad7arr;\u697bult;\u6ac2\u0100Ee\u35e4\u35e6;\u6acc;\u628blus;\u6ac0\u0180eiu\u35f4\u3609\u360ct\u0180;en\u121c\u35fc\u3602q\u0100;q\u1222\u35b2eq\u0100;q\u35e7\u35e4m;\u6ac8\u0100bp\u3611\u3613;\u6ad4;\u6ad6\u0180Aan\u361c\u3620\u362drr;\u61d9r\u0100hr\u3626\u3628\xeb\u222e\u0100;o\u0a2b\u0a29war;\u692alig\u803b\xdf\u40df\u0be1\u3651\u365d\u3660\u12ce\u3673\u3679\0\u367e\u36c2\0\0\0\0\0\u36db\u3703\0\u3709\u376c\0\0\0\u3787\u0272\u3656\0\0\u365bget;\u6316;\u43c4r\xeb\u0e5f\u0180aey\u3666\u366b\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uc000\ud835\udd31\u0200eiko\u3686\u369d\u36b5\u36bc\u01f2\u368b\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369b\u43b8ym;\u43d1\u0100cn\u36a2\u36b2k\u0100as\u36a8\u36aeppro\xf8\u12c1im\xbb\u12acs\xf0\u129e\u0100as\u36ba\u36ae\xf0\u12c1rn\u803b\xfe\u40fe\u01ec\u031f\u36c6\u22e7es\u8180\xd7;bd\u36cf\u36d0\u36d8\u40d7\u0100;a\u190f\u36d5r;\u6a31;\u6a30\u0180eps\u36e1\u36e3\u3700\xe1\u2a4d\u0200;bcf\u0486\u36ec\u36f0\u36f4ot;\u6336ir;\u6af1\u0100;o\u36f9\u36fc\uc000\ud835\udd65rk;\u6ada\xe1\u3362rime;\u6034\u0180aip\u370f\u3712\u3764d\xe5\u1248\u0380adempst\u3721\u374d\u3740\u3751\u3757\u375c\u375fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65b5own\xbb\u1dbbeft\u0100;e\u2800\u373e\xf1\u092e;\u625cight\u0100;e\u32aa\u374b\xf1\u105aot;\u65ecinus;\u6a3alus;\u6a39b;\u69cdime;\u6a3bezium;\u63e2\u0180cht\u3772\u377d\u3781\u0100ry\u3777\u377b;\uc000\ud835\udcc9;\u4446cy;\u445brok;\u4167\u0100io\u378b\u378ex\xf4\u1777head\u0100lr\u3797\u37a0eftarro\xf7\u084fightarrow\xbb\u0f5d\u0900AHabcdfghlmoprstuw\u37d0\u37d3\u37d7\u37e4\u37f0\u37fc\u380e\u381c\u3823\u3834\u3851\u385d\u386b\u38a9\u38cc\u38d2\u38ea\u38f6r\xf2\u03edar;\u6963\u0100cr\u37dc\u37e2ute\u803b\xfa\u40fa\xf2\u1150r\u01e3\u37ea\0\u37edy;\u445eve;\u416d\u0100iy\u37f5\u37farc\u803b\xfb\u40fb;\u4443\u0180abh\u3803\u3806\u380br\xf2\u13adlac;\u4171a\xf2\u13c3\u0100ir\u3813\u3818sht;\u697e;\uc000\ud835\udd32rave\u803b\xf9\u40f9\u0161\u3827\u3831r\u0100lr\u382c\u382e\xbb\u0957\xbb\u1083lk;\u6580\u0100ct\u3839\u384d\u026f\u383f\0\0\u384arn\u0100;e\u3845\u3846\u631cr\xbb\u3846op;\u630fri;\u65f8\u0100al\u3856\u385acr;\u416b\u80bb\xa8\u0349\u0100gp\u3862\u3866on;\u4173f;\uc000\ud835\udd66\u0300adhlsu\u114b\u3878\u387d\u1372\u3891\u38a0own\xe1\u13b3arpoon\u0100lr\u3888\u388cef\xf4\u382digh\xf4\u382fi\u0180;hl\u3899\u389a\u389c\u43c5\xbb\u13faon\xbb\u389aparrows;\u61c8\u0180cit\u38b0\u38c4\u38c8\u026f\u38b6\0\0\u38c1rn\u0100;e\u38bc\u38bd\u631dr\xbb\u38bdop;\u630eng;\u416fri;\u65f9cr;\uc000\ud835\udcca\u0180dir\u38d9\u38dd\u38e2ot;\u62f0lde;\u4169i\u0100;f\u3730\u38e8\xbb\u1813\u0100am\u38ef\u38f2r\xf2\u38a8l\u803b\xfc\u40fcangle;\u69a7\u0780ABDacdeflnoprsz\u391c\u391f\u3929\u392d\u39b5\u39b8\u39bd\u39df\u39e4\u39e8\u39f3\u39f9\u39fd\u3a01\u3a20r\xf2\u03f7ar\u0100;v\u3926\u3927\u6ae8;\u6ae9as\xe8\u03e1\u0100nr\u3932\u3937grt;\u699c\u0380eknprst\u34e3\u3946\u394b\u3952\u395d\u3964\u3996app\xe1\u2415othin\xe7\u1e96\u0180hir\u34eb\u2ec8\u3959op\xf4\u2fb5\u0100;h\u13b7\u3962\xef\u318d\u0100iu\u3969\u396dgm\xe1\u33b3\u0100bp\u3972\u3984setneq\u0100;q\u397d\u3980\uc000\u228a\ufe00;\uc000\u2acb\ufe00setneq\u0100;q\u398f\u3992\uc000\u228b\ufe00;\uc000\u2acc\ufe00\u0100hr\u399b\u399fet\xe1\u369ciangle\u0100lr\u39aa\u39afeft\xbb\u0925ight\xbb\u1051y;\u4432ash\xbb\u1036\u0180elr\u39c4\u39d2\u39d7\u0180;be\u2dea\u39cb\u39cfar;\u62bbq;\u625alip;\u62ee\u0100bt\u39dc\u1468a\xf2\u1469r;\uc000\ud835\udd33tr\xe9\u39aesu\u0100bp\u39ef\u39f1\xbb\u0d1c\xbb\u0d59pf;\uc000\ud835\udd67ro\xf0\u0efbtr\xe9\u39b4\u0100cu\u3a06\u3a0br;\uc000\ud835\udccb\u0100bp\u3a10\u3a18n\u0100Ee\u3980\u3a16\xbb\u397en\u0100Ee\u3992\u3a1e\xbb\u3990igzag;\u699a\u0380cefoprs\u3a36\u3a3b\u3a56\u3a5b\u3a54\u3a61\u3a6airc;\u4175\u0100di\u3a40\u3a51\u0100bg\u3a45\u3a49ar;\u6a5fe\u0100;q\u15fa\u3a4f;\u6259erp;\u6118r;\uc000\ud835\udd34pf;\uc000\ud835\udd68\u0100;e\u1479\u3a66at\xe8\u1479cr;\uc000\ud835\udccc\u0ae3\u178e\u3a87\0\u3a8b\0\u3a90\u3a9b\0\0\u3a9d\u3aa8\u3aab\u3aaf\0\0\u3ac3\u3ace\0\u3ad8\u17dc\u17dftr\xe9\u17d1r;\uc000\ud835\udd35\u0100Aa\u3a94\u3a97r\xf2\u03c3r\xf2\u09f6;\u43be\u0100Aa\u3aa1\u3aa4r\xf2\u03b8r\xf2\u09eba\xf0\u2713is;\u62fb\u0180dpt\u17a4\u3ab5\u3abe\u0100fl\u3aba\u17a9;\uc000\ud835\udd69im\xe5\u17b2\u0100Aa\u3ac7\u3acar\xf2\u03cer\xf2\u0a01\u0100cq\u3ad2\u17b8r;\uc000\ud835\udccd\u0100pt\u17d6\u3adcr\xe9\u17d4\u0400acefiosu\u3af0\u3afd\u3b08\u3b0c\u3b11\u3b15\u3b1b\u3b21c\u0100uy\u3af6\u3afbte\u803b\xfd\u40fd;\u444f\u0100iy\u3b02\u3b06rc;\u4177;\u444bn\u803b\xa5\u40a5r;\uc000\ud835\udd36cy;\u4457pf;\uc000\ud835\udd6acr;\uc000\ud835\udcce\u0100cm\u3b26\u3b29y;\u444el\u803b\xff\u40ff\u0500acdefhiosw\u3b42\u3b48\u3b54\u3b58\u3b64\u3b69\u3b6d\u3b74\u3b7a\u3b80cute;\u417a\u0100ay\u3b4d\u3b52ron;\u417e;\u4437ot;\u417c\u0100et\u3b5d\u3b61tr\xe6\u155fa;\u43b6r;\uc000\ud835\udd37cy;\u4436grarr;\u61ddpf;\uc000\ud835\udd6bcr;\uc000\ud835\udccf\u0100jn\u3b85\u3b87;\u600dj;\u600c"
    .split("")
    .map((c) => c.charCodeAt(0)));
//# sourceMappingURL=decode-data-html.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/decode-data-xml.js": 
/*!*******************************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/decode-data-xml.js ***!
  \*******************************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  xmlDecodeTree: () => (xmlDecodeTree)
});
// Generated using scripts/write-decode-map.ts
const xmlDecodeTree = /* #__PURE__ */ new Uint16Array(
// prettier-ignore
/* #__PURE__ */ "\u0200aglq\t\x15\x18\x1b\u026d\x0f\0\0\x12p;\u4026os;\u4027t;\u403et;\u403cuot;\u4022"
    .split("")
    .map((c) => c.charCodeAt(0)));
//# sourceMappingURL=decode-data-xml.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/encode-html.js": 
/*!***************************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/generated/encode-html.js ***!
  \***************************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  htmlTrie: () => (htmlTrie)
});
// Generated using scripts/write-encode-map.ts
function restoreDiff(array) {
    for (let index = 1; index < array.length; index++) {
        array[index][0] += array[index - 1][0] + 1;
    }
    return array;
}
// prettier-ignore
const htmlTrie = /* #__PURE__ */ new Map(/* #__PURE__ */ restoreDiff([[9, "&Tab;"], [0, "&NewLine;"], [22, "&excl;"], [0, "&quot;"], [0, "&num;"], [0, "&dollar;"], [0, "&percnt;"], [0, "&amp;"], [0, "&apos;"], [0, "&lpar;"], [0, "&rpar;"], [0, "&ast;"], [0, "&plus;"], [0, "&comma;"], [1, "&period;"], [0, "&sol;"], [10, "&colon;"], [0, "&semi;"], [0, { v: "&lt;", n: 8402, o: "&nvlt;" }], [0, { v: "&equals;", n: 8421, o: "&bne;" }], [0, { v: "&gt;", n: 8402, o: "&nvgt;" }], [0, "&quest;"], [0, "&commat;"], [26, "&lbrack;"], [0, "&bsol;"], [0, "&rbrack;"], [0, "&Hat;"], [0, "&lowbar;"], [0, "&DiacriticalGrave;"], [5, { n: 106, o: "&fjlig;" }], [20, "&lbrace;"], [0, "&verbar;"], [0, "&rbrace;"], [34, "&nbsp;"], [0, "&iexcl;"], [0, "&cent;"], [0, "&pound;"], [0, "&curren;"], [0, "&yen;"], [0, "&brvbar;"], [0, "&sect;"], [0, "&die;"], [0, "&copy;"], [0, "&ordf;"], [0, "&laquo;"], [0, "&not;"], [0, "&shy;"], [0, "&circledR;"], [0, "&macr;"], [0, "&deg;"], [0, "&PlusMinus;"], [0, "&sup2;"], [0, "&sup3;"], [0, "&acute;"], [0, "&micro;"], [0, "&para;"], [0, "&centerdot;"], [0, "&cedil;"], [0, "&sup1;"], [0, "&ordm;"], [0, "&raquo;"], [0, "&frac14;"], [0, "&frac12;"], [0, "&frac34;"], [0, "&iquest;"], [0, "&Agrave;"], [0, "&Aacute;"], [0, "&Acirc;"], [0, "&Atilde;"], [0, "&Auml;"], [0, "&angst;"], [0, "&AElig;"], [0, "&Ccedil;"], [0, "&Egrave;"], [0, "&Eacute;"], [0, "&Ecirc;"], [0, "&Euml;"], [0, "&Igrave;"], [0, "&Iacute;"], [0, "&Icirc;"], [0, "&Iuml;"], [0, "&ETH;"], [0, "&Ntilde;"], [0, "&Ograve;"], [0, "&Oacute;"], [0, "&Ocirc;"], [0, "&Otilde;"], [0, "&Ouml;"], [0, "&times;"], [0, "&Oslash;"], [0, "&Ugrave;"], [0, "&Uacute;"], [0, "&Ucirc;"], [0, "&Uuml;"], [0, "&Yacute;"], [0, "&THORN;"], [0, "&szlig;"], [0, "&agrave;"], [0, "&aacute;"], [0, "&acirc;"], [0, "&atilde;"], [0, "&auml;"], [0, "&aring;"], [0, "&aelig;"], [0, "&ccedil;"], [0, "&egrave;"], [0, "&eacute;"], [0, "&ecirc;"], [0, "&euml;"], [0, "&igrave;"], [0, "&iacute;"], [0, "&icirc;"], [0, "&iuml;"], [0, "&eth;"], [0, "&ntilde;"], [0, "&ograve;"], [0, "&oacute;"], [0, "&ocirc;"], [0, "&otilde;"], [0, "&ouml;"], [0, "&div;"], [0, "&oslash;"], [0, "&ugrave;"], [0, "&uacute;"], [0, "&ucirc;"], [0, "&uuml;"], [0, "&yacute;"], [0, "&thorn;"], [0, "&yuml;"], [0, "&Amacr;"], [0, "&amacr;"], [0, "&Abreve;"], [0, "&abreve;"], [0, "&Aogon;"], [0, "&aogon;"], [0, "&Cacute;"], [0, "&cacute;"], [0, "&Ccirc;"], [0, "&ccirc;"], [0, "&Cdot;"], [0, "&cdot;"], [0, "&Ccaron;"], [0, "&ccaron;"], [0, "&Dcaron;"], [0, "&dcaron;"], [0, "&Dstrok;"], [0, "&dstrok;"], [0, "&Emacr;"], [0, "&emacr;"], [2, "&Edot;"], [0, "&edot;"], [0, "&Eogon;"], [0, "&eogon;"], [0, "&Ecaron;"], [0, "&ecaron;"], [0, "&Gcirc;"], [0, "&gcirc;"], [0, "&Gbreve;"], [0, "&gbreve;"], [0, "&Gdot;"], [0, "&gdot;"], [0, "&Gcedil;"], [1, "&Hcirc;"], [0, "&hcirc;"], [0, "&Hstrok;"], [0, "&hstrok;"], [0, "&Itilde;"], [0, "&itilde;"], [0, "&Imacr;"], [0, "&imacr;"], [2, "&Iogon;"], [0, "&iogon;"], [0, "&Idot;"], [0, "&imath;"], [0, "&IJlig;"], [0, "&ijlig;"], [0, "&Jcirc;"], [0, "&jcirc;"], [0, "&Kcedil;"], [0, "&kcedil;"], [0, "&kgreen;"], [0, "&Lacute;"], [0, "&lacute;"], [0, "&Lcedil;"], [0, "&lcedil;"], [0, "&Lcaron;"], [0, "&lcaron;"], [0, "&Lmidot;"], [0, "&lmidot;"], [0, "&Lstrok;"], [0, "&lstrok;"], [0, "&Nacute;"], [0, "&nacute;"], [0, "&Ncedil;"], [0, "&ncedil;"], [0, "&Ncaron;"], [0, "&ncaron;"], [0, "&napos;"], [0, "&ENG;"], [0, "&eng;"], [0, "&Omacr;"], [0, "&omacr;"], [2, "&Odblac;"], [0, "&odblac;"], [0, "&OElig;"], [0, "&oelig;"], [0, "&Racute;"], [0, "&racute;"], [0, "&Rcedil;"], [0, "&rcedil;"], [0, "&Rcaron;"], [0, "&rcaron;"], [0, "&Sacute;"], [0, "&sacute;"], [0, "&Scirc;"], [0, "&scirc;"], [0, "&Scedil;"], [0, "&scedil;"], [0, "&Scaron;"], [0, "&scaron;"], [0, "&Tcedil;"], [0, "&tcedil;"], [0, "&Tcaron;"], [0, "&tcaron;"], [0, "&Tstrok;"], [0, "&tstrok;"], [0, "&Utilde;"], [0, "&utilde;"], [0, "&Umacr;"], [0, "&umacr;"], [0, "&Ubreve;"], [0, "&ubreve;"], [0, "&Uring;"], [0, "&uring;"], [0, "&Udblac;"], [0, "&udblac;"], [0, "&Uogon;"], [0, "&uogon;"], [0, "&Wcirc;"], [0, "&wcirc;"], [0, "&Ycirc;"], [0, "&ycirc;"], [0, "&Yuml;"], [0, "&Zacute;"], [0, "&zacute;"], [0, "&Zdot;"], [0, "&zdot;"], [0, "&Zcaron;"], [0, "&zcaron;"], [19, "&fnof;"], [34, "&imped;"], [63, "&gacute;"], [65, "&jmath;"], [142, "&circ;"], [0, "&caron;"], [16, "&breve;"], [0, "&DiacriticalDot;"], [0, "&ring;"], [0, "&ogon;"], [0, "&DiacriticalTilde;"], [0, "&dblac;"], [51, "&DownBreve;"], [127, "&Alpha;"], [0, "&Beta;"], [0, "&Gamma;"], [0, "&Delta;"], [0, "&Epsilon;"], [0, "&Zeta;"], [0, "&Eta;"], [0, "&Theta;"], [0, "&Iota;"], [0, "&Kappa;"], [0, "&Lambda;"], [0, "&Mu;"], [0, "&Nu;"], [0, "&Xi;"], [0, "&Omicron;"], [0, "&Pi;"], [0, "&Rho;"], [1, "&Sigma;"], [0, "&Tau;"], [0, "&Upsilon;"], [0, "&Phi;"], [0, "&Chi;"], [0, "&Psi;"], [0, "&ohm;"], [7, "&alpha;"], [0, "&beta;"], [0, "&gamma;"], [0, "&delta;"], [0, "&epsi;"], [0, "&zeta;"], [0, "&eta;"], [0, "&theta;"], [0, "&iota;"], [0, "&kappa;"], [0, "&lambda;"], [0, "&mu;"], [0, "&nu;"], [0, "&xi;"], [0, "&omicron;"], [0, "&pi;"], [0, "&rho;"], [0, "&sigmaf;"], [0, "&sigma;"], [0, "&tau;"], [0, "&upsi;"], [0, "&phi;"], [0, "&chi;"], [0, "&psi;"], [0, "&omega;"], [7, "&thetasym;"], [0, "&Upsi;"], [2, "&phiv;"], [0, "&piv;"], [5, "&Gammad;"], [0, "&digamma;"], [18, "&kappav;"], [0, "&rhov;"], [3, "&epsiv;"], [0, "&backepsilon;"], [10, "&IOcy;"], [0, "&DJcy;"], [0, "&GJcy;"], [0, "&Jukcy;"], [0, "&DScy;"], [0, "&Iukcy;"], [0, "&YIcy;"], [0, "&Jsercy;"], [0, "&LJcy;"], [0, "&NJcy;"], [0, "&TSHcy;"], [0, "&KJcy;"], [1, "&Ubrcy;"], [0, "&DZcy;"], [0, "&Acy;"], [0, "&Bcy;"], [0, "&Vcy;"], [0, "&Gcy;"], [0, "&Dcy;"], [0, "&IEcy;"], [0, "&ZHcy;"], [0, "&Zcy;"], [0, "&Icy;"], [0, "&Jcy;"], [0, "&Kcy;"], [0, "&Lcy;"], [0, "&Mcy;"], [0, "&Ncy;"], [0, "&Ocy;"], [0, "&Pcy;"], [0, "&Rcy;"], [0, "&Scy;"], [0, "&Tcy;"], [0, "&Ucy;"], [0, "&Fcy;"], [0, "&KHcy;"], [0, "&TScy;"], [0, "&CHcy;"], [0, "&SHcy;"], [0, "&SHCHcy;"], [0, "&HARDcy;"], [0, "&Ycy;"], [0, "&SOFTcy;"], [0, "&Ecy;"], [0, "&YUcy;"], [0, "&YAcy;"], [0, "&acy;"], [0, "&bcy;"], [0, "&vcy;"], [0, "&gcy;"], [0, "&dcy;"], [0, "&iecy;"], [0, "&zhcy;"], [0, "&zcy;"], [0, "&icy;"], [0, "&jcy;"], [0, "&kcy;"], [0, "&lcy;"], [0, "&mcy;"], [0, "&ncy;"], [0, "&ocy;"], [0, "&pcy;"], [0, "&rcy;"], [0, "&scy;"], [0, "&tcy;"], [0, "&ucy;"], [0, "&fcy;"], [0, "&khcy;"], [0, "&tscy;"], [0, "&chcy;"], [0, "&shcy;"], [0, "&shchcy;"], [0, "&hardcy;"], [0, "&ycy;"], [0, "&softcy;"], [0, "&ecy;"], [0, "&yucy;"], [0, "&yacy;"], [1, "&iocy;"], [0, "&djcy;"], [0, "&gjcy;"], [0, "&jukcy;"], [0, "&dscy;"], [0, "&iukcy;"], [0, "&yicy;"], [0, "&jsercy;"], [0, "&ljcy;"], [0, "&njcy;"], [0, "&tshcy;"], [0, "&kjcy;"], [1, "&ubrcy;"], [0, "&dzcy;"], [7074, "&ensp;"], [0, "&emsp;"], [0, "&emsp13;"], [0, "&emsp14;"], [1, "&numsp;"], [0, "&puncsp;"], [0, "&ThinSpace;"], [0, "&hairsp;"], [0, "&NegativeMediumSpace;"], [0, "&zwnj;"], [0, "&zwj;"], [0, "&lrm;"], [0, "&rlm;"], [0, "&dash;"], [2, "&ndash;"], [0, "&mdash;"], [0, "&horbar;"], [0, "&Verbar;"], [1, "&lsquo;"], [0, "&CloseCurlyQuote;"], [0, "&lsquor;"], [1, "&ldquo;"], [0, "&CloseCurlyDoubleQuote;"], [0, "&bdquo;"], [1, "&dagger;"], [0, "&Dagger;"], [0, "&bull;"], [2, "&nldr;"], [0, "&hellip;"], [9, "&permil;"], [0, "&pertenk;"], [0, "&prime;"], [0, "&Prime;"], [0, "&tprime;"], [0, "&backprime;"], [3, "&lsaquo;"], [0, "&rsaquo;"], [3, "&oline;"], [2, "&caret;"], [1, "&hybull;"], [0, "&frasl;"], [10, "&bsemi;"], [7, "&qprime;"], [7, { v: "&MediumSpace;", n: 8202, o: "&ThickSpace;" }], [0, "&NoBreak;"], [0, "&af;"], [0, "&InvisibleTimes;"], [0, "&ic;"], [72, "&euro;"], [46, "&tdot;"], [0, "&DotDot;"], [37, "&complexes;"], [2, "&incare;"], [4, "&gscr;"], [0, "&hamilt;"], [0, "&Hfr;"], [0, "&Hopf;"], [0, "&planckh;"], [0, "&hbar;"], [0, "&imagline;"], [0, "&Ifr;"], [0, "&lagran;"], [0, "&ell;"], [1, "&naturals;"], [0, "&numero;"], [0, "&copysr;"], [0, "&weierp;"], [0, "&Popf;"], [0, "&Qopf;"], [0, "&realine;"], [0, "&real;"], [0, "&reals;"], [0, "&rx;"], [3, "&trade;"], [1, "&integers;"], [2, "&mho;"], [0, "&zeetrf;"], [0, "&iiota;"], [2, "&bernou;"], [0, "&Cayleys;"], [1, "&escr;"], [0, "&Escr;"], [0, "&Fouriertrf;"], [1, "&Mellintrf;"], [0, "&order;"], [0, "&alefsym;"], [0, "&beth;"], [0, "&gimel;"], [0, "&daleth;"], [12, "&CapitalDifferentialD;"], [0, "&dd;"], [0, "&ee;"], [0, "&ii;"], [10, "&frac13;"], [0, "&frac23;"], [0, "&frac15;"], [0, "&frac25;"], [0, "&frac35;"], [0, "&frac45;"], [0, "&frac16;"], [0, "&frac56;"], [0, "&frac18;"], [0, "&frac38;"], [0, "&frac58;"], [0, "&frac78;"], [49, "&larr;"], [0, "&ShortUpArrow;"], [0, "&rarr;"], [0, "&darr;"], [0, "&harr;"], [0, "&updownarrow;"], [0, "&nwarr;"], [0, "&nearr;"], [0, "&LowerRightArrow;"], [0, "&LowerLeftArrow;"], [0, "&nlarr;"], [0, "&nrarr;"], [1, { v: "&rarrw;", n: 824, o: "&nrarrw;" }], [0, "&Larr;"], [0, "&Uarr;"], [0, "&Rarr;"], [0, "&Darr;"], [0, "&larrtl;"], [0, "&rarrtl;"], [0, "&LeftTeeArrow;"], [0, "&mapstoup;"], [0, "&map;"], [0, "&DownTeeArrow;"], [1, "&hookleftarrow;"], [0, "&hookrightarrow;"], [0, "&larrlp;"], [0, "&looparrowright;"], [0, "&harrw;"], [0, "&nharr;"], [1, "&lsh;"], [0, "&rsh;"], [0, "&ldsh;"], [0, "&rdsh;"], [1, "&crarr;"], [0, "&cularr;"], [0, "&curarr;"], [2, "&circlearrowleft;"], [0, "&circlearrowright;"], [0, "&leftharpoonup;"], [0, "&DownLeftVector;"], [0, "&RightUpVector;"], [0, "&LeftUpVector;"], [0, "&rharu;"], [0, "&DownRightVector;"], [0, "&dharr;"], [0, "&dharl;"], [0, "&RightArrowLeftArrow;"], [0, "&udarr;"], [0, "&LeftArrowRightArrow;"], [0, "&leftleftarrows;"], [0, "&upuparrows;"], [0, "&rightrightarrows;"], [0, "&ddarr;"], [0, "&leftrightharpoons;"], [0, "&Equilibrium;"], [0, "&nlArr;"], [0, "&nhArr;"], [0, "&nrArr;"], [0, "&DoubleLeftArrow;"], [0, "&DoubleUpArrow;"], [0, "&DoubleRightArrow;"], [0, "&dArr;"], [0, "&DoubleLeftRightArrow;"], [0, "&DoubleUpDownArrow;"], [0, "&nwArr;"], [0, "&neArr;"], [0, "&seArr;"], [0, "&swArr;"], [0, "&lAarr;"], [0, "&rAarr;"], [1, "&zigrarr;"], [6, "&larrb;"], [0, "&rarrb;"], [15, "&DownArrowUpArrow;"], [7, "&loarr;"], [0, "&roarr;"], [0, "&hoarr;"], [0, "&forall;"], [0, "&comp;"], [0, { v: "&part;", n: 824, o: "&npart;" }], [0, "&exist;"], [0, "&nexist;"], [0, "&empty;"], [1, "&Del;"], [0, "&Element;"], [0, "&NotElement;"], [1, "&ni;"], [0, "&notni;"], [2, "&prod;"], [0, "&coprod;"], [0, "&sum;"], [0, "&minus;"], [0, "&MinusPlus;"], [0, "&dotplus;"], [1, "&Backslash;"], [0, "&lowast;"], [0, "&compfn;"], [1, "&radic;"], [2, "&prop;"], [0, "&infin;"], [0, "&angrt;"], [0, { v: "&ang;", n: 8402, o: "&nang;" }], [0, "&angmsd;"], [0, "&angsph;"], [0, "&mid;"], [0, "&nmid;"], [0, "&DoubleVerticalBar;"], [0, "&NotDoubleVerticalBar;"], [0, "&and;"], [0, "&or;"], [0, { v: "&cap;", n: 65024, o: "&caps;" }], [0, { v: "&cup;", n: 65024, o: "&cups;" }], [0, "&int;"], [0, "&Int;"], [0, "&iiint;"], [0, "&conint;"], [0, "&Conint;"], [0, "&Cconint;"], [0, "&cwint;"], [0, "&ClockwiseContourIntegral;"], [0, "&awconint;"], [0, "&there4;"], [0, "&becaus;"], [0, "&ratio;"], [0, "&Colon;"], [0, "&dotminus;"], [1, "&mDDot;"], [0, "&homtht;"], [0, { v: "&sim;", n: 8402, o: "&nvsim;" }], [0, { v: "&backsim;", n: 817, o: "&race;" }], [0, { v: "&ac;", n: 819, o: "&acE;" }], [0, "&acd;"], [0, "&VerticalTilde;"], [0, "&NotTilde;"], [0, { v: "&eqsim;", n: 824, o: "&nesim;" }], [0, "&sime;"], [0, "&NotTildeEqual;"], [0, "&cong;"], [0, "&simne;"], [0, "&ncong;"], [0, "&ap;"], [0, "&nap;"], [0, "&ape;"], [0, { v: "&apid;", n: 824, o: "&napid;" }], [0, "&backcong;"], [0, { v: "&asympeq;", n: 8402, o: "&nvap;" }], [0, { v: "&bump;", n: 824, o: "&nbump;" }], [0, { v: "&bumpe;", n: 824, o: "&nbumpe;" }], [0, { v: "&doteq;", n: 824, o: "&nedot;" }], [0, "&doteqdot;"], [0, "&efDot;"], [0, "&erDot;"], [0, "&Assign;"], [0, "&ecolon;"], [0, "&ecir;"], [0, "&circeq;"], [1, "&wedgeq;"], [0, "&veeeq;"], [1, "&triangleq;"], [2, "&equest;"], [0, "&ne;"], [0, { v: "&Congruent;", n: 8421, o: "&bnequiv;" }], [0, "&nequiv;"], [1, { v: "&le;", n: 8402, o: "&nvle;" }], [0, { v: "&ge;", n: 8402, o: "&nvge;" }], [0, { v: "&lE;", n: 824, o: "&nlE;" }], [0, { v: "&gE;", n: 824, o: "&ngE;" }], [0, { v: "&lnE;", n: 65024, o: "&lvertneqq;" }], [0, { v: "&gnE;", n: 65024, o: "&gvertneqq;" }], [0, { v: "&ll;", n: /* #__PURE__ */ new Map(/* #__PURE__ */ restoreDiff([[824, "&nLtv;"], [7577, "&nLt;"]])) }], [0, { v: "&gg;", n: /* #__PURE__ */ new Map(/* #__PURE__ */ restoreDiff([[824, "&nGtv;"], [7577, "&nGt;"]])) }], [0, "&between;"], [0, "&NotCupCap;"], [0, "&nless;"], [0, "&ngt;"], [0, "&nle;"], [0, "&nge;"], [0, "&lesssim;"], [0, "&GreaterTilde;"], [0, "&nlsim;"], [0, "&ngsim;"], [0, "&LessGreater;"], [0, "&gl;"], [0, "&NotLessGreater;"], [0, "&NotGreaterLess;"], [0, "&pr;"], [0, "&sc;"], [0, "&prcue;"], [0, "&sccue;"], [0, "&PrecedesTilde;"], [0, { v: "&scsim;", n: 824, o: "&NotSucceedsTilde;" }], [0, "&NotPrecedes;"], [0, "&NotSucceeds;"], [0, { v: "&sub;", n: 8402, o: "&NotSubset;" }], [0, { v: "&sup;", n: 8402, o: "&NotSuperset;" }], [0, "&nsub;"], [0, "&nsup;"], [0, "&sube;"], [0, "&supe;"], [0, "&NotSubsetEqual;"], [0, "&NotSupersetEqual;"], [0, { v: "&subne;", n: 65024, o: "&varsubsetneq;" }], [0, { v: "&supne;", n: 65024, o: "&varsupsetneq;" }], [1, "&cupdot;"], [0, "&UnionPlus;"], [0, { v: "&sqsub;", n: 824, o: "&NotSquareSubset;" }], [0, { v: "&sqsup;", n: 824, o: "&NotSquareSuperset;" }], [0, "&sqsube;"], [0, "&sqsupe;"], [0, { v: "&sqcap;", n: 65024, o: "&sqcaps;" }], [0, { v: "&sqcup;", n: 65024, o: "&sqcups;" }], [0, "&CirclePlus;"], [0, "&CircleMinus;"], [0, "&CircleTimes;"], [0, "&osol;"], [0, "&CircleDot;"], [0, "&circledcirc;"], [0, "&circledast;"], [1, "&circleddash;"], [0, "&boxplus;"], [0, "&boxminus;"], [0, "&boxtimes;"], [0, "&dotsquare;"], [0, "&RightTee;"], [0, "&dashv;"], [0, "&DownTee;"], [0, "&bot;"], [1, "&models;"], [0, "&DoubleRightTee;"], [0, "&Vdash;"], [0, "&Vvdash;"], [0, "&VDash;"], [0, "&nvdash;"], [0, "&nvDash;"], [0, "&nVdash;"], [0, "&nVDash;"], [0, "&prurel;"], [1, "&LeftTriangle;"], [0, "&RightTriangle;"], [0, { v: "&LeftTriangleEqual;", n: 8402, o: "&nvltrie;" }], [0, { v: "&RightTriangleEqual;", n: 8402, o: "&nvrtrie;" }], [0, "&origof;"], [0, "&imof;"], [0, "&multimap;"], [0, "&hercon;"], [0, "&intcal;"], [0, "&veebar;"], [1, "&barvee;"], [0, "&angrtvb;"], [0, "&lrtri;"], [0, "&bigwedge;"], [0, "&bigvee;"], [0, "&bigcap;"], [0, "&bigcup;"], [0, "&diam;"], [0, "&sdot;"], [0, "&sstarf;"], [0, "&divideontimes;"], [0, "&bowtie;"], [0, "&ltimes;"], [0, "&rtimes;"], [0, "&leftthreetimes;"], [0, "&rightthreetimes;"], [0, "&backsimeq;"], [0, "&curlyvee;"], [0, "&curlywedge;"], [0, "&Sub;"], [0, "&Sup;"], [0, "&Cap;"], [0, "&Cup;"], [0, "&fork;"], [0, "&epar;"], [0, "&lessdot;"], [0, "&gtdot;"], [0, { v: "&Ll;", n: 824, o: "&nLl;" }], [0, { v: "&Gg;", n: 824, o: "&nGg;" }], [0, { v: "&leg;", n: 65024, o: "&lesg;" }], [0, { v: "&gel;", n: 65024, o: "&gesl;" }], [2, "&cuepr;"], [0, "&cuesc;"], [0, "&NotPrecedesSlantEqual;"], [0, "&NotSucceedsSlantEqual;"], [0, "&NotSquareSubsetEqual;"], [0, "&NotSquareSupersetEqual;"], [2, "&lnsim;"], [0, "&gnsim;"], [0, "&precnsim;"], [0, "&scnsim;"], [0, "&nltri;"], [0, "&NotRightTriangle;"], [0, "&nltrie;"], [0, "&NotRightTriangleEqual;"], [0, "&vellip;"], [0, "&ctdot;"], [0, "&utdot;"], [0, "&dtdot;"], [0, "&disin;"], [0, "&isinsv;"], [0, "&isins;"], [0, { v: "&isindot;", n: 824, o: "&notindot;" }], [0, "&notinvc;"], [0, "&notinvb;"], [1, { v: "&isinE;", n: 824, o: "&notinE;" }], [0, "&nisd;"], [0, "&xnis;"], [0, "&nis;"], [0, "&notnivc;"], [0, "&notnivb;"], [6, "&barwed;"], [0, "&Barwed;"], [1, "&lceil;"], [0, "&rceil;"], [0, "&LeftFloor;"], [0, "&rfloor;"], [0, "&drcrop;"], [0, "&dlcrop;"], [0, "&urcrop;"], [0, "&ulcrop;"], [0, "&bnot;"], [1, "&profline;"], [0, "&profsurf;"], [1, "&telrec;"], [0, "&target;"], [5, "&ulcorn;"], [0, "&urcorn;"], [0, "&dlcorn;"], [0, "&drcorn;"], [2, "&frown;"], [0, "&smile;"], [9, "&cylcty;"], [0, "&profalar;"], [7, "&topbot;"], [6, "&ovbar;"], [1, "&solbar;"], [60, "&angzarr;"], [51, "&lmoustache;"], [0, "&rmoustache;"], [2, "&OverBracket;"], [0, "&bbrk;"], [0, "&bbrktbrk;"], [37, "&OverParenthesis;"], [0, "&UnderParenthesis;"], [0, "&OverBrace;"], [0, "&UnderBrace;"], [2, "&trpezium;"], [4, "&elinters;"], [59, "&blank;"], [164, "&circledS;"], [55, "&boxh;"], [1, "&boxv;"], [9, "&boxdr;"], [3, "&boxdl;"], [3, "&boxur;"], [3, "&boxul;"], [3, "&boxvr;"], [7, "&boxvl;"], [7, "&boxhd;"], [7, "&boxhu;"], [7, "&boxvh;"], [19, "&boxH;"], [0, "&boxV;"], [0, "&boxdR;"], [0, "&boxDr;"], [0, "&boxDR;"], [0, "&boxdL;"], [0, "&boxDl;"], [0, "&boxDL;"], [0, "&boxuR;"], [0, "&boxUr;"], [0, "&boxUR;"], [0, "&boxuL;"], [0, "&boxUl;"], [0, "&boxUL;"], [0, "&boxvR;"], [0, "&boxVr;"], [0, "&boxVR;"], [0, "&boxvL;"], [0, "&boxVl;"], [0, "&boxVL;"], [0, "&boxHd;"], [0, "&boxhD;"], [0, "&boxHD;"], [0, "&boxHu;"], [0, "&boxhU;"], [0, "&boxHU;"], [0, "&boxvH;"], [0, "&boxVh;"], [0, "&boxVH;"], [19, "&uhblk;"], [3, "&lhblk;"], [3, "&block;"], [8, "&blk14;"], [0, "&blk12;"], [0, "&blk34;"], [13, "&square;"], [8, "&blacksquare;"], [0, "&EmptyVerySmallSquare;"], [1, "&rect;"], [0, "&marker;"], [2, "&fltns;"], [1, "&bigtriangleup;"], [0, "&blacktriangle;"], [0, "&triangle;"], [2, "&blacktriangleright;"], [0, "&rtri;"], [3, "&bigtriangledown;"], [0, "&blacktriangledown;"], [0, "&dtri;"], [2, "&blacktriangleleft;"], [0, "&ltri;"], [6, "&loz;"], [0, "&cir;"], [32, "&tridot;"], [2, "&bigcirc;"], [8, "&ultri;"], [0, "&urtri;"], [0, "&lltri;"], [0, "&EmptySmallSquare;"], [0, "&FilledSmallSquare;"], [8, "&bigstar;"], [0, "&star;"], [7, "&phone;"], [49, "&female;"], [1, "&male;"], [29, "&spades;"], [2, "&clubs;"], [1, "&hearts;"], [0, "&diamondsuit;"], [3, "&sung;"], [2, "&flat;"], [0, "&natural;"], [0, "&sharp;"], [163, "&check;"], [3, "&cross;"], [8, "&malt;"], [21, "&sext;"], [33, "&VerticalSeparator;"], [25, "&lbbrk;"], [0, "&rbbrk;"], [84, "&bsolhsub;"], [0, "&suphsol;"], [28, "&LeftDoubleBracket;"], [0, "&RightDoubleBracket;"], [0, "&lang;"], [0, "&rang;"], [0, "&Lang;"], [0, "&Rang;"], [0, "&loang;"], [0, "&roang;"], [7, "&longleftarrow;"], [0, "&longrightarrow;"], [0, "&longleftrightarrow;"], [0, "&DoubleLongLeftArrow;"], [0, "&DoubleLongRightArrow;"], [0, "&DoubleLongLeftRightArrow;"], [1, "&longmapsto;"], [2, "&dzigrarr;"], [258, "&nvlArr;"], [0, "&nvrArr;"], [0, "&nvHarr;"], [0, "&Map;"], [6, "&lbarr;"], [0, "&bkarow;"], [0, "&lBarr;"], [0, "&dbkarow;"], [0, "&drbkarow;"], [0, "&DDotrahd;"], [0, "&UpArrowBar;"], [0, "&DownArrowBar;"], [2, "&Rarrtl;"], [2, "&latail;"], [0, "&ratail;"], [0, "&lAtail;"], [0, "&rAtail;"], [0, "&larrfs;"], [0, "&rarrfs;"], [0, "&larrbfs;"], [0, "&rarrbfs;"], [2, "&nwarhk;"], [0, "&nearhk;"], [0, "&hksearow;"], [0, "&hkswarow;"], [0, "&nwnear;"], [0, "&nesear;"], [0, "&seswar;"], [0, "&swnwar;"], [8, { v: "&rarrc;", n: 824, o: "&nrarrc;" }], [1, "&cudarrr;"], [0, "&ldca;"], [0, "&rdca;"], [0, "&cudarrl;"], [0, "&larrpl;"], [2, "&curarrm;"], [0, "&cularrp;"], [7, "&rarrpl;"], [2, "&harrcir;"], [0, "&Uarrocir;"], [0, "&lurdshar;"], [0, "&ldrushar;"], [2, "&LeftRightVector;"], [0, "&RightUpDownVector;"], [0, "&DownLeftRightVector;"], [0, "&LeftUpDownVector;"], [0, "&LeftVectorBar;"], [0, "&RightVectorBar;"], [0, "&RightUpVectorBar;"], [0, "&RightDownVectorBar;"], [0, "&DownLeftVectorBar;"], [0, "&DownRightVectorBar;"], [0, "&LeftUpVectorBar;"], [0, "&LeftDownVectorBar;"], [0, "&LeftTeeVector;"], [0, "&RightTeeVector;"], [0, "&RightUpTeeVector;"], [0, "&RightDownTeeVector;"], [0, "&DownLeftTeeVector;"], [0, "&DownRightTeeVector;"], [0, "&LeftUpTeeVector;"], [0, "&LeftDownTeeVector;"], [0, "&lHar;"], [0, "&uHar;"], [0, "&rHar;"], [0, "&dHar;"], [0, "&luruhar;"], [0, "&ldrdhar;"], [0, "&ruluhar;"], [0, "&rdldhar;"], [0, "&lharul;"], [0, "&llhard;"], [0, "&rharul;"], [0, "&lrhard;"], [0, "&udhar;"], [0, "&duhar;"], [0, "&RoundImplies;"], [0, "&erarr;"], [0, "&simrarr;"], [0, "&larrsim;"], [0, "&rarrsim;"], [0, "&rarrap;"], [0, "&ltlarr;"], [1, "&gtrarr;"], [0, "&subrarr;"], [1, "&suplarr;"], [0, "&lfisht;"], [0, "&rfisht;"], [0, "&ufisht;"], [0, "&dfisht;"], [5, "&lopar;"], [0, "&ropar;"], [4, "&lbrke;"], [0, "&rbrke;"], [0, "&lbrkslu;"], [0, "&rbrksld;"], [0, "&lbrksld;"], [0, "&rbrkslu;"], [0, "&langd;"], [0, "&rangd;"], [0, "&lparlt;"], [0, "&rpargt;"], [0, "&gtlPar;"], [0, "&ltrPar;"], [3, "&vzigzag;"], [1, "&vangrt;"], [0, "&angrtvbd;"], [6, "&ange;"], [0, "&range;"], [0, "&dwangle;"], [0, "&uwangle;"], [0, "&angmsdaa;"], [0, "&angmsdab;"], [0, "&angmsdac;"], [0, "&angmsdad;"], [0, "&angmsdae;"], [0, "&angmsdaf;"], [0, "&angmsdag;"], [0, "&angmsdah;"], [0, "&bemptyv;"], [0, "&demptyv;"], [0, "&cemptyv;"], [0, "&raemptyv;"], [0, "&laemptyv;"], [0, "&ohbar;"], [0, "&omid;"], [0, "&opar;"], [1, "&operp;"], [1, "&olcross;"], [0, "&odsold;"], [1, "&olcir;"], [0, "&ofcir;"], [0, "&olt;"], [0, "&ogt;"], [0, "&cirscir;"], [0, "&cirE;"], [0, "&solb;"], [0, "&bsolb;"], [3, "&boxbox;"], [3, "&trisb;"], [0, "&rtriltri;"], [0, { v: "&LeftTriangleBar;", n: 824, o: "&NotLeftTriangleBar;" }], [0, { v: "&RightTriangleBar;", n: 824, o: "&NotRightTriangleBar;" }], [11, "&iinfin;"], [0, "&infintie;"], [0, "&nvinfin;"], [4, "&eparsl;"], [0, "&smeparsl;"], [0, "&eqvparsl;"], [5, "&blacklozenge;"], [8, "&RuleDelayed;"], [1, "&dsol;"], [9, "&bigodot;"], [0, "&bigoplus;"], [0, "&bigotimes;"], [1, "&biguplus;"], [1, "&bigsqcup;"], [5, "&iiiint;"], [0, "&fpartint;"], [2, "&cirfnint;"], [0, "&awint;"], [0, "&rppolint;"], [0, "&scpolint;"], [0, "&npolint;"], [0, "&pointint;"], [0, "&quatint;"], [0, "&intlarhk;"], [10, "&pluscir;"], [0, "&plusacir;"], [0, "&simplus;"], [0, "&plusdu;"], [0, "&plussim;"], [0, "&plustwo;"], [1, "&mcomma;"], [0, "&minusdu;"], [2, "&loplus;"], [0, "&roplus;"], [0, "&Cross;"], [0, "&timesd;"], [0, "&timesbar;"], [1, "&smashp;"], [0, "&lotimes;"], [0, "&rotimes;"], [0, "&otimesas;"], [0, "&Otimes;"], [0, "&odiv;"], [0, "&triplus;"], [0, "&triminus;"], [0, "&tritime;"], [0, "&intprod;"], [2, "&amalg;"], [0, "&capdot;"], [1, "&ncup;"], [0, "&ncap;"], [0, "&capand;"], [0, "&cupor;"], [0, "&cupcap;"], [0, "&capcup;"], [0, "&cupbrcap;"], [0, "&capbrcup;"], [0, "&cupcup;"], [0, "&capcap;"], [0, "&ccups;"], [0, "&ccaps;"], [2, "&ccupssm;"], [2, "&And;"], [0, "&Or;"], [0, "&andand;"], [0, "&oror;"], [0, "&orslope;"], [0, "&andslope;"], [1, "&andv;"], [0, "&orv;"], [0, "&andd;"], [0, "&ord;"], [1, "&wedbar;"], [6, "&sdote;"], [3, "&simdot;"], [2, { v: "&congdot;", n: 824, o: "&ncongdot;" }], [0, "&easter;"], [0, "&apacir;"], [0, { v: "&apE;", n: 824, o: "&napE;" }], [0, "&eplus;"], [0, "&pluse;"], [0, "&Esim;"], [0, "&Colone;"], [0, "&Equal;"], [1, "&ddotseq;"], [0, "&equivDD;"], [0, "&ltcir;"], [0, "&gtcir;"], [0, "&ltquest;"], [0, "&gtquest;"], [0, { v: "&leqslant;", n: 824, o: "&nleqslant;" }], [0, { v: "&geqslant;", n: 824, o: "&ngeqslant;" }], [0, "&lesdot;"], [0, "&gesdot;"], [0, "&lesdoto;"], [0, "&gesdoto;"], [0, "&lesdotor;"], [0, "&gesdotol;"], [0, "&lap;"], [0, "&gap;"], [0, "&lne;"], [0, "&gne;"], [0, "&lnap;"], [0, "&gnap;"], [0, "&lEg;"], [0, "&gEl;"], [0, "&lsime;"], [0, "&gsime;"], [0, "&lsimg;"], [0, "&gsiml;"], [0, "&lgE;"], [0, "&glE;"], [0, "&lesges;"], [0, "&gesles;"], [0, "&els;"], [0, "&egs;"], [0, "&elsdot;"], [0, "&egsdot;"], [0, "&el;"], [0, "&eg;"], [2, "&siml;"], [0, "&simg;"], [0, "&simlE;"], [0, "&simgE;"], [0, { v: "&LessLess;", n: 824, o: "&NotNestedLessLess;" }], [0, { v: "&GreaterGreater;", n: 824, o: "&NotNestedGreaterGreater;" }], [1, "&glj;"], [0, "&gla;"], [0, "&ltcc;"], [0, "&gtcc;"], [0, "&lescc;"], [0, "&gescc;"], [0, "&smt;"], [0, "&lat;"], [0, { v: "&smte;", n: 65024, o: "&smtes;" }], [0, { v: "&late;", n: 65024, o: "&lates;" }], [0, "&bumpE;"], [0, { v: "&PrecedesEqual;", n: 824, o: "&NotPrecedesEqual;" }], [0, { v: "&sce;", n: 824, o: "&NotSucceedsEqual;" }], [2, "&prE;"], [0, "&scE;"], [0, "&precneqq;"], [0, "&scnE;"], [0, "&prap;"], [0, "&scap;"], [0, "&precnapprox;"], [0, "&scnap;"], [0, "&Pr;"], [0, "&Sc;"], [0, "&subdot;"], [0, "&supdot;"], [0, "&subplus;"], [0, "&supplus;"], [0, "&submult;"], [0, "&supmult;"], [0, "&subedot;"], [0, "&supedot;"], [0, { v: "&subE;", n: 824, o: "&nsubE;" }], [0, { v: "&supE;", n: 824, o: "&nsupE;" }], [0, "&subsim;"], [0, "&supsim;"], [2, { v: "&subnE;", n: 65024, o: "&varsubsetneqq;" }], [0, { v: "&supnE;", n: 65024, o: "&varsupsetneqq;" }], [2, "&csub;"], [0, "&csup;"], [0, "&csube;"], [0, "&csupe;"], [0, "&subsup;"], [0, "&supsub;"], [0, "&subsub;"], [0, "&supsup;"], [0, "&suphsub;"], [0, "&supdsub;"], [0, "&forkv;"], [0, "&topfork;"], [0, "&mlcp;"], [8, "&Dashv;"], [1, "&Vdashl;"], [0, "&Barv;"], [0, "&vBar;"], [0, "&vBarv;"], [1, "&Vbar;"], [0, "&Not;"], [0, "&bNot;"], [0, "&rnmid;"], [0, "&cirmid;"], [0, "&midcir;"], [0, "&topcir;"], [0, "&nhpar;"], [0, "&parsim;"], [9, { v: "&parsl;", n: 8421, o: "&nparsl;" }], [44343, { n: /* #__PURE__ */ new Map(/* #__PURE__ */ restoreDiff([[56476, "&Ascr;"], [1, "&Cscr;"], [0, "&Dscr;"], [2, "&Gscr;"], [2, "&Jscr;"], [0, "&Kscr;"], [2, "&Nscr;"], [0, "&Oscr;"], [0, "&Pscr;"], [0, "&Qscr;"], [1, "&Sscr;"], [0, "&Tscr;"], [0, "&Uscr;"], [0, "&Vscr;"], [0, "&Wscr;"], [0, "&Xscr;"], [0, "&Yscr;"], [0, "&Zscr;"], [0, "&ascr;"], [0, "&bscr;"], [0, "&cscr;"], [0, "&dscr;"], [1, "&fscr;"], [1, "&hscr;"], [0, "&iscr;"], [0, "&jscr;"], [0, "&kscr;"], [0, "&lscr;"], [0, "&mscr;"], [0, "&nscr;"], [1, "&pscr;"], [0, "&qscr;"], [0, "&rscr;"], [0, "&sscr;"], [0, "&tscr;"], [0, "&uscr;"], [0, "&vscr;"], [0, "&wscr;"], [0, "&xscr;"], [0, "&yscr;"], [0, "&zscr;"], [52, "&Afr;"], [0, "&Bfr;"], [1, "&Dfr;"], [0, "&Efr;"], [0, "&Ffr;"], [0, "&Gfr;"], [2, "&Jfr;"], [0, "&Kfr;"], [0, "&Lfr;"], [0, "&Mfr;"], [0, "&Nfr;"], [0, "&Ofr;"], [0, "&Pfr;"], [0, "&Qfr;"], [1, "&Sfr;"], [0, "&Tfr;"], [0, "&Ufr;"], [0, "&Vfr;"], [0, "&Wfr;"], [0, "&Xfr;"], [0, "&Yfr;"], [1, "&afr;"], [0, "&bfr;"], [0, "&cfr;"], [0, "&dfr;"], [0, "&efr;"], [0, "&ffr;"], [0, "&gfr;"], [0, "&hfr;"], [0, "&ifr;"], [0, "&jfr;"], [0, "&kfr;"], [0, "&lfr;"], [0, "&mfr;"], [0, "&nfr;"], [0, "&ofr;"], [0, "&pfr;"], [0, "&qfr;"], [0, "&rfr;"], [0, "&sfr;"], [0, "&tfr;"], [0, "&ufr;"], [0, "&vfr;"], [0, "&wfr;"], [0, "&xfr;"], [0, "&yfr;"], [0, "&zfr;"], [0, "&Aopf;"], [0, "&Bopf;"], [1, "&Dopf;"], [0, "&Eopf;"], [0, "&Fopf;"], [0, "&Gopf;"], [1, "&Iopf;"], [0, "&Jopf;"], [0, "&Kopf;"], [0, "&Lopf;"], [0, "&Mopf;"], [1, "&Oopf;"], [3, "&Sopf;"], [0, "&Topf;"], [0, "&Uopf;"], [0, "&Vopf;"], [0, "&Wopf;"], [0, "&Xopf;"], [0, "&Yopf;"], [1, "&aopf;"], [0, "&bopf;"], [0, "&copf;"], [0, "&dopf;"], [0, "&eopf;"], [0, "&fopf;"], [0, "&gopf;"], [0, "&hopf;"], [0, "&iopf;"], [0, "&jopf;"], [0, "&kopf;"], [0, "&lopf;"], [0, "&mopf;"], [0, "&nopf;"], [0, "&oopf;"], [0, "&popf;"], [0, "&qopf;"], [0, "&ropf;"], [0, "&sopf;"], [0, "&topf;"], [0, "&uopf;"], [0, "&vopf;"], [0, "&wopf;"], [0, "&xopf;"], [0, "&yopf;"], [0, "&zopf;"]])) }], [8906, "&fflig;"], [0, "&filig;"], [0, "&fllig;"], [0, "&ffilig;"], [0, "&ffllig;"]]));
//# sourceMappingURL=encode-html.js.map

}),
"./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/index.js": 
/*!***********************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/index.js ***!
  \***********************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  DecodingMode: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.DecodingMode),
  EncodingMode: () => (EncodingMode),
  EntityDecoder: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.EntityDecoder),
  EntityLevel: () => (EntityLevel),
  decode: () => (decode),
  decodeHTML: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTML),
  decodeHTML4: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTML),
  decodeHTML4Strict: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTMLStrict),
  decodeHTML5: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTML),
  decodeHTML5Strict: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTMLStrict),
  decodeHTMLAttribute: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTMLAttribute),
  decodeHTMLStrict: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTMLStrict),
  decodeStrict: () => (decodeStrict),
  decodeXML: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeXML),
  decodeXMLStrict: () => (/* reexport safe */ _decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeXML),
  encode: () => (encode),
  encodeHTML: () => (/* reexport safe */ _encode_js__WEBPACK_IMPORTED_MODULE_1__.encodeHTML),
  encodeHTML4: () => (/* reexport safe */ _encode_js__WEBPACK_IMPORTED_MODULE_1__.encodeHTML),
  encodeHTML5: () => (/* reexport safe */ _encode_js__WEBPACK_IMPORTED_MODULE_1__.encodeHTML),
  encodeNonAsciiHTML: () => (/* reexport safe */ _encode_js__WEBPACK_IMPORTED_MODULE_1__.encodeNonAsciiHTML),
  encodeXML: () => (/* reexport safe */ _escape_js__WEBPACK_IMPORTED_MODULE_2__.encodeXML),
  escape: () => (/* reexport safe */ _escape_js__WEBPACK_IMPORTED_MODULE_2__.escape),
  escapeAttribute: () => (/* reexport safe */ _escape_js__WEBPACK_IMPORTED_MODULE_2__.escapeAttribute),
  escapeText: () => (/* reexport safe */ _escape_js__WEBPACK_IMPORTED_MODULE_2__.escapeText),
  escapeUTF8: () => (/* reexport safe */ _escape_js__WEBPACK_IMPORTED_MODULE_2__.escapeUTF8)
});
/* ESM import */var _decode_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./decode.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode.js");
/* ESM import */var _encode_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./encode.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/encode.js");
/* ESM import */var _escape_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./escape.js */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/escape.js");



/** The level of entities to support. */
var EntityLevel;
(function (EntityLevel) {
    /** Support only XML entities. */
    EntityLevel[EntityLevel["XML"] = 0] = "XML";
    /** Support HTML entities, which are a superset of XML entities. */
    EntityLevel[EntityLevel["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function (EncodingMode) {
    /**
     * The output is UTF-8 encoded. Only characters that need escaping within
     * XML will be escaped.
     */
    EncodingMode[EncodingMode["UTF8"] = 0] = "UTF8";
    /**
     * The output consists only of ASCII characters. Characters that need
     * escaping within HTML, and characters that aren't ASCII characters will
     * be escaped.
     */
    EncodingMode[EncodingMode["ASCII"] = 1] = "ASCII";
    /**
     * Encode all characters that have an equivalent entity, as well as all
     * characters that are not ASCII characters.
     */
    EncodingMode[EncodingMode["Extensive"] = 2] = "Extensive";
    /**
     * Encode all characters that have to be escaped in HTML attributes,
     * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
     */
    EncodingMode[EncodingMode["Attribute"] = 3] = "Attribute";
    /**
     * Encode all characters that have to be escaped in HTML text,
     * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
     */
    EncodingMode[EncodingMode["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));
/**
 * Decodes a string with entities.
 *
 * @param input String to decode.
 * @param options Decoding options.
 */
function decode(input, options = EntityLevel.XML) {
    const level = typeof options === "number" ? options : options.level;
    if (level === EntityLevel.HTML) {
        const mode = typeof options === "object" ? options.mode : undefined;
        return (0,_decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeHTML)(input, mode);
    }
    return (0,_decode_js__WEBPACK_IMPORTED_MODULE_0__.decodeXML)(input);
}
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param input String to decode.
 * @param options Decoding options.
 * @deprecated Use `decode` with the `mode` set to `Strict`.
 */
function decodeStrict(input, options = EntityLevel.XML) {
    var _a;
    const normalizedOptions = typeof options === "number" ? { level: options } : options;
    (_a = normalizedOptions.mode) !== null && _a !== void 0 ? _a : (normalizedOptions.mode = _decode_js__WEBPACK_IMPORTED_MODULE_0__.DecodingMode.Strict);
    return decode(input, normalizedOptions);
}
/**
 * Encodes a string with entities.
 *
 * @param input String to encode.
 * @param options Encoding options.
 */
function encode(input, options = EntityLevel.XML) {
    const { mode = EncodingMode.Extensive, level = EntityLevel.XML } = typeof options === "number" ? { level: options } : options;
    switch (mode) {
        case EncodingMode.UTF8: {
            return (0,_escape_js__WEBPACK_IMPORTED_MODULE_2__.escapeUTF8)(input);
        }
        case EncodingMode.Attribute: {
            return (0,_escape_js__WEBPACK_IMPORTED_MODULE_2__.escapeAttribute)(input);
        }
        case EncodingMode.Text: {
            return (0,_escape_js__WEBPACK_IMPORTED_MODULE_2__.escapeText)(input);
        }
        case EncodingMode.ASCII: {
            return level === EntityLevel.HTML
                ? (0,_encode_js__WEBPACK_IMPORTED_MODULE_1__.encodeNonAsciiHTML)(input)
                : (0,_escape_js__WEBPACK_IMPORTED_MODULE_2__.encodeXML)(input);
        }
        // eslint-disable-next-line unicorn/no-useless-switch-case
        case EncodingMode.Extensive:
        default: {
            return level === EntityLevel.HTML
                ? (0,_encode_js__WEBPACK_IMPORTED_MODULE_1__.encodeHTML)(input)
                : (0,_escape_js__WEBPACK_IMPORTED_MODULE_2__.encodeXML)(input);
        }
    }
}



//# sourceMappingURL=index.js.map

}),
"./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/Parser.js": 
/*!*******************************************************************************************!*\
  !*** ./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/Parser.js ***!
  \*******************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  Parser: () => (Parser)
});
/* ESM import */var _Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Tokenizer.js */ "./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/Tokenizer.js");
/* ESM import */var entities_decode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! entities/decode */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode.js");


const formTags = new Set([
    "input",
    "option",
    "optgroup",
    "select",
    "button",
    "datalist",
    "textarea",
]);
const pTag = new Set(["p"]);
const tableSectionTags = new Set(["thead", "tbody"]);
const ddtTags = new Set(["dd", "dt"]);
const rtpTags = new Set(["rt", "rp"]);
const openImpliesClose = new Map([
    ["tr", new Set(["tr", "th", "td"])],
    ["th", new Set(["th"])],
    ["td", new Set(["thead", "th", "td"])],
    ["body", new Set(["head", "link", "script"])],
    ["li", new Set(["li"])],
    ["p", pTag],
    ["h1", pTag],
    ["h2", pTag],
    ["h3", pTag],
    ["h4", pTag],
    ["h5", pTag],
    ["h6", pTag],
    ["select", formTags],
    ["input", formTags],
    ["output", formTags],
    ["button", formTags],
    ["datalist", formTags],
    ["textarea", formTags],
    ["option", new Set(["option"])],
    ["optgroup", new Set(["optgroup", "option"])],
    ["dd", ddtTags],
    ["dt", ddtTags],
    ["address", pTag],
    ["article", pTag],
    ["aside", pTag],
    ["blockquote", pTag],
    ["details", pTag],
    ["div", pTag],
    ["dl", pTag],
    ["fieldset", pTag],
    ["figcaption", pTag],
    ["figure", pTag],
    ["footer", pTag],
    ["form", pTag],
    ["header", pTag],
    ["hr", pTag],
    ["main", pTag],
    ["nav", pTag],
    ["ol", pTag],
    ["pre", pTag],
    ["section", pTag],
    ["table", pTag],
    ["ul", pTag],
    ["rt", rtpTags],
    ["rp", rtpTags],
    ["tbody", tableSectionTags],
    ["tfoot", tableSectionTags],
]);
const voidElements = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);
const foreignContextElements = new Set(["math", "svg"]);
const htmlIntegrationElements = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignobject",
    "desc",
    "title",
]);
const reNameEnd = /\s|\//;
class Parser {
    constructor(cbs, options = {}) {
        var _a, _b, _c, _d, _e, _f;
        this.options = options;
        /** The start index of the last event. */
        this.startIndex = 0;
        /** The end index of the last event. */
        this.endIndex = 0;
        /**
         * Store the start index of the current open tag,
         * so we can update the start index for attributes.
         */
        this.openTagStart = 0;
        this.tagname = "";
        this.attribname = "";
        this.attribvalue = "";
        this.attribs = null;
        this.stack = [];
        this.buffers = [];
        this.bufferOffset = 0;
        /** The index of the last written buffer. Used when resuming after a `pause()`. */
        this.writeIndex = 0;
        /** Indicates whether the parser has finished running / `.end` has been called. */
        this.ended = false;
        this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
        this.htmlMode = !this.options.xmlMode;
        this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : this.htmlMode;
        this.lowerCaseAttributeNames =
            (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : this.htmlMode;
        this.recognizeSelfClosing =
            (_c = options.recognizeSelfClosing) !== null && _c !== void 0 ? _c : !this.htmlMode;
        this.tokenizer = new ((_d = options.Tokenizer) !== null && _d !== void 0 ? _d : _Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__["default"])(this.options, this);
        this.foreignContext = [!this.htmlMode];
        (_f = (_e = this.cbs).onparserinit) === null || _f === void 0 ? void 0 : _f.call(_e, this);
    }
    // Tokenizer event handlers
    /** @internal */
    ontext(start, endIndex) {
        var _a, _b;
        const data = this.getSlice(start, endIndex);
        this.endIndex = endIndex - 1;
        (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        this.startIndex = endIndex;
    }
    /** @internal */
    ontextentity(cp, endIndex) {
        var _a, _b;
        this.endIndex = endIndex - 1;
        (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, (0,entities_decode__WEBPACK_IMPORTED_MODULE_1__.fromCodePoint)(cp));
        this.startIndex = endIndex;
    }
    /**
     * Checks if the current tag is a void element. Override this if you want
     * to specify your own additional void elements.
     */
    isVoidElement(name) {
        return this.htmlMode && voidElements.has(name);
    }
    /** @internal */
    onopentagname(start, endIndex) {
        this.endIndex = endIndex;
        let name = this.getSlice(start, endIndex);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        this.emitOpenTag(name);
    }
    emitOpenTag(name) {
        var _a, _b, _c, _d;
        this.openTagStart = this.startIndex;
        this.tagname = name;
        const impliesClose = this.htmlMode && openImpliesClose.get(name);
        if (impliesClose) {
            while (this.stack.length > 0 && impliesClose.has(this.stack[0])) {
                const element = this.stack.shift();
                (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, element, true);
            }
        }
        if (!this.isVoidElement(name)) {
            this.stack.unshift(name);
            if (this.htmlMode) {
                if (foreignContextElements.has(name)) {
                    this.foreignContext.unshift(true);
                }
                else if (htmlIntegrationElements.has(name)) {
                    this.foreignContext.unshift(false);
                }
            }
        }
        (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, name);
        if (this.cbs.onopentag)
            this.attribs = {};
    }
    endOpenTag(isImplied) {
        var _a, _b;
        this.startIndex = this.openTagStart;
        if (this.attribs) {
            (_b = (_a = this.cbs).onopentag) === null || _b === void 0 ? void 0 : _b.call(_a, this.tagname, this.attribs, isImplied);
            this.attribs = null;
        }
        if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
            this.cbs.onclosetag(this.tagname, true);
        }
        this.tagname = "";
    }
    /** @internal */
    onopentagend(endIndex) {
        this.endIndex = endIndex;
        this.endOpenTag(false);
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */
    onclosetag(start, endIndex) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.endIndex = endIndex;
        let name = this.getSlice(start, endIndex);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        if (this.htmlMode &&
            (foreignContextElements.has(name) ||
                htmlIntegrationElements.has(name))) {
            this.foreignContext.shift();
        }
        if (!this.isVoidElement(name)) {
            const pos = this.stack.indexOf(name);
            if (pos !== -1) {
                for (let index = 0; index <= pos; index++) {
                    const element = this.stack.shift();
                    // We know the stack has sufficient elements.
                    (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, element, index !== pos);
                }
            }
            else if (this.htmlMode && name === "p") {
                // Implicit open before close
                this.emitOpenTag("p");
                this.closeCurrentTag(true);
            }
        }
        else if (this.htmlMode && name === "br") {
            // We can't use `emitOpenTag` for implicit open, as `br` would be implicitly closed.
            (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, "br");
            (_f = (_e = this.cbs).onopentag) === null || _f === void 0 ? void 0 : _f.call(_e, "br", {}, true);
            (_h = (_g = this.cbs).onclosetag) === null || _h === void 0 ? void 0 : _h.call(_g, "br", false);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */
    onselfclosingtag(endIndex) {
        this.endIndex = endIndex;
        if (this.recognizeSelfClosing || this.foreignContext[0]) {
            this.closeCurrentTag(false);
            // Set `startIndex` for next node
            this.startIndex = endIndex + 1;
        }
        else {
            // Ignore the fact that the tag is self-closing.
            this.onopentagend(endIndex);
        }
    }
    closeCurrentTag(isOpenImplied) {
        var _a, _b;
        const name = this.tagname;
        this.endOpenTag(isOpenImplied);
        // Self-closing tags will be on the top of the stack
        if (this.stack[0] === name) {
            // If the opening tag isn't implied, the closing tag has to be implied.
            (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, name, !isOpenImplied);
            this.stack.shift();
        }
    }
    /** @internal */
    onattribname(start, endIndex) {
        this.startIndex = start;
        const name = this.getSlice(start, endIndex);
        this.attribname = this.lowerCaseAttributeNames
            ? name.toLowerCase()
            : name;
    }
    /** @internal */
    onattribdata(start, endIndex) {
        this.attribvalue += this.getSlice(start, endIndex);
    }
    /** @internal */
    onattribentity(cp) {
        this.attribvalue += (0,entities_decode__WEBPACK_IMPORTED_MODULE_1__.fromCodePoint)(cp);
    }
    /** @internal */
    onattribend(quote, endIndex) {
        var _a, _b;
        this.endIndex = endIndex;
        (_b = (_a = this.cbs).onattribute) === null || _b === void 0 ? void 0 : _b.call(_a, this.attribname, this.attribvalue, quote === _Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.QuoteType.Double
            ? '"'
            : quote === _Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.QuoteType.Single
                ? "'"
                : quote === _Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.QuoteType.NoValue
                    ? undefined
                    : null);
        if (this.attribs &&
            !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
            this.attribs[this.attribname] = this.attribvalue;
        }
        this.attribvalue = "";
    }
    getInstructionName(value) {
        const index = value.search(reNameEnd);
        let name = index < 0 ? value : value.substr(0, index);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        return name;
    }
    /** @internal */
    ondeclaration(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
            const name = this.getInstructionName(value);
            this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */
    onprocessinginstruction(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
            const name = this.getInstructionName(value);
            this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */
    oncomment(start, endIndex, offset) {
        var _a, _b, _c, _d;
        this.endIndex = endIndex;
        (_b = (_a = this.cbs).oncomment) === null || _b === void 0 ? void 0 : _b.call(_a, this.getSlice(start, endIndex - offset));
        (_d = (_c = this.cbs).oncommentend) === null || _d === void 0 ? void 0 : _d.call(_c);
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */
    oncdata(start, endIndex, offset) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex - offset);
        if (!this.htmlMode || this.options.recognizeCDATA) {
            (_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 ? void 0 : _b.call(_a);
            (_d = (_c = this.cbs).ontext) === null || _d === void 0 ? void 0 : _d.call(_c, value);
            (_f = (_e = this.cbs).oncdataend) === null || _f === void 0 ? void 0 : _f.call(_e);
        }
        else {
            (_h = (_g = this.cbs).oncomment) === null || _h === void 0 ? void 0 : _h.call(_g, `[CDATA[${value}]]`);
            (_k = (_j = this.cbs).oncommentend) === null || _k === void 0 ? void 0 : _k.call(_j);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */
    onend() {
        var _a, _b;
        if (this.cbs.onclosetag) {
            // Set the end index for all remaining tags
            this.endIndex = this.startIndex;
            for (let index = 0; index < this.stack.length; index++) {
                this.cbs.onclosetag(this.stack[index], true);
            }
        }
        (_b = (_a = this.cbs).onend) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    /**
     * Resets the parser to a blank state, ready to parse a new HTML document
     */
    reset() {
        var _a, _b, _c, _d;
        (_b = (_a = this.cbs).onreset) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.tokenizer.reset();
        this.tagname = "";
        this.attribname = "";
        this.attribs = null;
        this.stack.length = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        (_d = (_c = this.cbs).onparserinit) === null || _d === void 0 ? void 0 : _d.call(_c, this);
        this.buffers.length = 0;
        this.foreignContext.length = 0;
        this.foreignContext.unshift(!this.htmlMode);
        this.bufferOffset = 0;
        this.writeIndex = 0;
        this.ended = false;
    }
    /**
     * Resets the parser, then parses a complete document and
     * pushes it to the handler.
     *
     * @param data Document to parse.
     */
    parseComplete(data) {
        this.reset();
        this.end(data);
    }
    getSlice(start, end) {
        while (start - this.bufferOffset >= this.buffers[0].length) {
            this.shiftBuffer();
        }
        let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
        while (end - this.bufferOffset > this.buffers[0].length) {
            this.shiftBuffer();
            slice += this.buffers[0].slice(0, end - this.bufferOffset);
        }
        return slice;
    }
    shiftBuffer() {
        this.bufferOffset += this.buffers[0].length;
        this.writeIndex--;
        this.buffers.shift();
    }
    /**
     * Parses a chunk of data and calls the corresponding callbacks.
     *
     * @param chunk Chunk to parse.
     */
    write(chunk) {
        var _a, _b;
        if (this.ended) {
            (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(".write() after done!"));
            return;
        }
        this.buffers.push(chunk);
        if (this.tokenizer.running) {
            this.tokenizer.write(chunk);
            this.writeIndex++;
        }
    }
    /**
     * Parses the end of the buffer and clears the stack, calls onend.
     *
     * @param chunk Optional final chunk to parse.
     */
    end(chunk) {
        var _a, _b;
        if (this.ended) {
            (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(".end() after done!"));
            return;
        }
        if (chunk)
            this.write(chunk);
        this.ended = true;
        this.tokenizer.end();
    }
    /**
     * Pauses parsing. The parser won't emit events until `resume` is called.
     */
    pause() {
        this.tokenizer.pause();
    }
    /**
     * Resumes parsing after `pause` was called.
     */
    resume() {
        this.tokenizer.resume();
        while (this.tokenizer.running &&
            this.writeIndex < this.buffers.length) {
            this.tokenizer.write(this.buffers[this.writeIndex++]);
        }
        if (this.ended)
            this.tokenizer.end();
    }
    /**
     * Alias of `write`, for backwards compatibility.
     *
     * @param chunk Chunk to parse.
     * @deprecated
     */
    parseChunk(chunk) {
        this.write(chunk);
    }
    /**
     * Alias of `end`, for backwards compatibility.
     *
     * @param chunk Optional final chunk to parse.
     * @deprecated
     */
    done(chunk) {
        this.end(chunk);
    }
}
//# sourceMappingURL=Parser.js.map

}),
"./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/Tokenizer.js": 
/*!**********************************************************************************************!*\
  !*** ./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/Tokenizer.js ***!
  \**********************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  QuoteType: () => (QuoteType),
  "default": () => (Tokenizer)
});
/* ESM import */var entities_decode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! entities/decode */ "./node_modules/.pnpm/entities@6.0.1/node_modules/entities/dist/esm/decode.js");

var CharCodes;
(function (CharCodes) {
    CharCodes[CharCodes["Tab"] = 9] = "Tab";
    CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
    CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
    CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
    CharCodes[CharCodes["Space"] = 32] = "Space";
    CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
    CharCodes[CharCodes["Number"] = 35] = "Number";
    CharCodes[CharCodes["Amp"] = 38] = "Amp";
    CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
    CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
    CharCodes[CharCodes["Dash"] = 45] = "Dash";
    CharCodes[CharCodes["Slash"] = 47] = "Slash";
    CharCodes[CharCodes["Zero"] = 48] = "Zero";
    CharCodes[CharCodes["Nine"] = 57] = "Nine";
    CharCodes[CharCodes["Semi"] = 59] = "Semi";
    CharCodes[CharCodes["Lt"] = 60] = "Lt";
    CharCodes[CharCodes["Eq"] = 61] = "Eq";
    CharCodes[CharCodes["Gt"] = 62] = "Gt";
    CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
    CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
    CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
    CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
    CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
    CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
    CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
    CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
    CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes || (CharCodes = {}));
/** All the states the tokenizer can be in. */
var State;
(function (State) {
    State[State["Text"] = 1] = "Text";
    State[State["BeforeTagName"] = 2] = "BeforeTagName";
    State[State["InTagName"] = 3] = "InTagName";
    State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
    State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
    State[State["InClosingTagName"] = 6] = "InClosingTagName";
    State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
    // Attributes
    State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
    State[State["InAttributeName"] = 9] = "InAttributeName";
    State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
    State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
    State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
    State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
    State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
    // Declarations
    State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
    State[State["InDeclaration"] = 16] = "InDeclaration";
    // Processing instructions
    State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
    // Comments & CDATA
    State[State["BeforeComment"] = 18] = "BeforeComment";
    State[State["CDATASequence"] = 19] = "CDATASequence";
    State[State["InSpecialComment"] = 20] = "InSpecialComment";
    State[State["InCommentLike"] = 21] = "InCommentLike";
    // Special tags
    State[State["BeforeSpecialS"] = 22] = "BeforeSpecialS";
    State[State["BeforeSpecialT"] = 23] = "BeforeSpecialT";
    State[State["SpecialStartSequence"] = 24] = "SpecialStartSequence";
    State[State["InSpecialTag"] = 25] = "InSpecialTag";
    State[State["InEntity"] = 26] = "InEntity";
})(State || (State = {}));
function isWhitespace(c) {
    return (c === CharCodes.Space ||
        c === CharCodes.NewLine ||
        c === CharCodes.Tab ||
        c === CharCodes.FormFeed ||
        c === CharCodes.CarriageReturn);
}
function isEndOfTagSection(c) {
    return c === CharCodes.Slash || c === CharCodes.Gt || isWhitespace(c);
}
function isASCIIAlpha(c) {
    return ((c >= CharCodes.LowerA && c <= CharCodes.LowerZ) ||
        (c >= CharCodes.UpperA && c <= CharCodes.UpperZ));
}
var QuoteType;
(function (QuoteType) {
    QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
    QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
    QuoteType[QuoteType["Single"] = 2] = "Single";
    QuoteType[QuoteType["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
/**
 * Sequences used to match longer strings.
 *
 * We don't have `Script`, `Style`, or `Title` here. Instead, we re-use the *End
 * sequences with an increased offset.
 */
const Sequences = {
    Cdata: new Uint8Array([0x43, 0x44, 0x41, 0x54, 0x41, 0x5b]), // CDATA[
    CdataEnd: new Uint8Array([0x5d, 0x5d, 0x3e]), // ]]>
    CommentEnd: new Uint8Array([0x2d, 0x2d, 0x3e]), // `-->`
    ScriptEnd: new Uint8Array([0x3c, 0x2f, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74]), // `</script`
    StyleEnd: new Uint8Array([0x3c, 0x2f, 0x73, 0x74, 0x79, 0x6c, 0x65]), // `</style`
    TitleEnd: new Uint8Array([0x3c, 0x2f, 0x74, 0x69, 0x74, 0x6c, 0x65]), // `</title`
    TextareaEnd: new Uint8Array([
        0x3c, 0x2f, 0x74, 0x65, 0x78, 0x74, 0x61, 0x72, 0x65, 0x61,
    ]), // `</textarea`
    XmpEnd: new Uint8Array([0x3c, 0x2f, 0x78, 0x6d, 0x70]), // `</xmp`
};
class Tokenizer {
    constructor({ xmlMode = false, decodeEntities = true, }, cbs) {
        this.cbs = cbs;
        /** The current state the tokenizer is in. */
        this.state = State.Text;
        /** The read buffer. */
        this.buffer = "";
        /** The beginning of the section that is currently being read. */
        this.sectionStart = 0;
        /** The index within the buffer that we are currently looking at. */
        this.index = 0;
        /** The start of the last entity. */
        this.entityStart = 0;
        /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
        this.baseState = State.Text;
        /** For special parsing behavior inside of script and style tags. */
        this.isSpecial = false;
        /** Indicates whether the tokenizer has been paused. */
        this.running = true;
        /** The offset of the current buffer. */
        this.offset = 0;
        this.currentSequence = undefined;
        this.sequenceIndex = 0;
        this.xmlMode = xmlMode;
        this.decodeEntities = decodeEntities;
        this.entityDecoder = new entities_decode__WEBPACK_IMPORTED_MODULE_0__.EntityDecoder(xmlMode ? entities_decode__WEBPACK_IMPORTED_MODULE_0__.xmlDecodeTree : entities_decode__WEBPACK_IMPORTED_MODULE_0__.htmlDecodeTree, (cp, consumed) => this.emitCodePoint(cp, consumed));
    }
    reset() {
        this.state = State.Text;
        this.buffer = "";
        this.sectionStart = 0;
        this.index = 0;
        this.baseState = State.Text;
        this.currentSequence = undefined;
        this.running = true;
        this.offset = 0;
    }
    write(chunk) {
        this.offset += this.buffer.length;
        this.buffer = chunk;
        this.parse();
    }
    end() {
        if (this.running)
            this.finish();
    }
    pause() {
        this.running = false;
    }
    resume() {
        this.running = true;
        if (this.index < this.buffer.length + this.offset) {
            this.parse();
        }
    }
    stateText(c) {
        if (c === CharCodes.Lt ||
            (!this.decodeEntities && this.fastForwardTo(CharCodes.Lt))) {
            if (this.index > this.sectionStart) {
                this.cbs.ontext(this.sectionStart, this.index);
            }
            this.state = State.BeforeTagName;
            this.sectionStart = this.index;
        }
        else if (this.decodeEntities && c === CharCodes.Amp) {
            this.startEntity();
        }
    }
    stateSpecialStartSequence(c) {
        const isEnd = this.sequenceIndex === this.currentSequence.length;
        const isMatch = isEnd
            ? // If we are at the end of the sequence, make sure the tag name has ended
                isEndOfTagSection(c)
            : // Otherwise, do a case-insensitive comparison
                (c | 0x20) === this.currentSequence[this.sequenceIndex];
        if (!isMatch) {
            this.isSpecial = false;
        }
        else if (!isEnd) {
            this.sequenceIndex++;
            return;
        }
        this.sequenceIndex = 0;
        this.state = State.InTagName;
        this.stateInTagName(c);
    }
    /** Look for an end tag. For <title> tags, also decode entities. */
    stateInSpecialTag(c) {
        if (this.sequenceIndex === this.currentSequence.length) {
            if (c === CharCodes.Gt || isWhitespace(c)) {
                const endOfText = this.index - this.currentSequence.length;
                if (this.sectionStart < endOfText) {
                    // Spoof the index so that reported locations match up.
                    const actualIndex = this.index;
                    this.index = endOfText;
                    this.cbs.ontext(this.sectionStart, endOfText);
                    this.index = actualIndex;
                }
                this.isSpecial = false;
                this.sectionStart = endOfText + 2; // Skip over the `</`
                this.stateInClosingTagName(c);
                return; // We are done; skip the rest of the function.
            }
            this.sequenceIndex = 0;
        }
        if ((c | 0x20) === this.currentSequence[this.sequenceIndex]) {
            this.sequenceIndex += 1;
        }
        else if (this.sequenceIndex === 0) {
            if (this.currentSequence === Sequences.TitleEnd) {
                // We have to parse entities in <title> tags.
                if (this.decodeEntities && c === CharCodes.Amp) {
                    this.startEntity();
                }
            }
            else if (this.fastForwardTo(CharCodes.Lt)) {
                // Outside of <title> tags, we can fast-forward.
                this.sequenceIndex = 1;
            }
        }
        else {
            // If we see a `<`, set the sequence index to 1; useful for eg. `<</script>`.
            this.sequenceIndex = Number(c === CharCodes.Lt);
        }
    }
    stateCDATASequence(c) {
        if (c === Sequences.Cdata[this.sequenceIndex]) {
            if (++this.sequenceIndex === Sequences.Cdata.length) {
                this.state = State.InCommentLike;
                this.currentSequence = Sequences.CdataEnd;
                this.sequenceIndex = 0;
                this.sectionStart = this.index + 1;
            }
        }
        else {
            this.sequenceIndex = 0;
            this.state = State.InDeclaration;
            this.stateInDeclaration(c); // Reconsume the character
        }
    }
    /**
     * When we wait for one specific character, we can speed things up
     * by skipping through the buffer until we find it.
     *
     * @returns Whether the character was found.
     */
    fastForwardTo(c) {
        while (++this.index < this.buffer.length + this.offset) {
            if (this.buffer.charCodeAt(this.index - this.offset) === c) {
                return true;
            }
        }
        /*
         * We increment the index at the end of the `parse` loop,
         * so set it to `buffer.length - 1` here.
         *
         * TODO: Refactor `parse` to increment index before calling states.
         */
        this.index = this.buffer.length + this.offset - 1;
        return false;
    }
    /**
     * Comments and CDATA end with `-->` and `]]>`.
     *
     * Their common qualities are:
     * - Their end sequences have a distinct character they start with.
     * - That character is then repeated, so we have to check multiple repeats.
     * - All characters but the start character of the sequence can be skipped.
     */
    stateInCommentLike(c) {
        if (c === this.currentSequence[this.sequenceIndex]) {
            if (++this.sequenceIndex === this.currentSequence.length) {
                if (this.currentSequence === Sequences.CdataEnd) {
                    this.cbs.oncdata(this.sectionStart, this.index, 2);
                }
                else {
                    this.cbs.oncomment(this.sectionStart, this.index, 2);
                }
                this.sequenceIndex = 0;
                this.sectionStart = this.index + 1;
                this.state = State.Text;
            }
        }
        else if (this.sequenceIndex === 0) {
            // Fast-forward to the first character of the sequence
            if (this.fastForwardTo(this.currentSequence[0])) {
                this.sequenceIndex = 1;
            }
        }
        else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
            // Allow long sequences, eg. --->, ]]]>
            this.sequenceIndex = 0;
        }
    }
    /**
     * HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
     *
     * XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
     * We allow anything that wouldn't end the tag.
     */
    isTagStartChar(c) {
        return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
    }
    startSpecial(sequence, offset) {
        this.isSpecial = true;
        this.currentSequence = sequence;
        this.sequenceIndex = offset;
        this.state = State.SpecialStartSequence;
    }
    stateBeforeTagName(c) {
        if (c === CharCodes.ExclamationMark) {
            this.state = State.BeforeDeclaration;
            this.sectionStart = this.index + 1;
        }
        else if (c === CharCodes.Questionmark) {
            this.state = State.InProcessingInstruction;
            this.sectionStart = this.index + 1;
        }
        else if (this.isTagStartChar(c)) {
            const lower = c | 0x20;
            this.sectionStart = this.index;
            if (this.xmlMode) {
                this.state = State.InTagName;
            }
            else if (lower === Sequences.ScriptEnd[2]) {
                this.state = State.BeforeSpecialS;
            }
            else if (lower === Sequences.TitleEnd[2] ||
                lower === Sequences.XmpEnd[2]) {
                this.state = State.BeforeSpecialT;
            }
            else {
                this.state = State.InTagName;
            }
        }
        else if (c === CharCodes.Slash) {
            this.state = State.BeforeClosingTagName;
        }
        else {
            this.state = State.Text;
            this.stateText(c);
        }
    }
    stateInTagName(c) {
        if (isEndOfTagSection(c)) {
            this.cbs.onopentagname(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    stateBeforeClosingTagName(c) {
        if (isWhitespace(c)) {
            // Ignore
        }
        else if (c === CharCodes.Gt) {
            this.state = State.Text;
        }
        else {
            this.state = this.isTagStartChar(c)
                ? State.InClosingTagName
                : State.InSpecialComment;
            this.sectionStart = this.index;
        }
    }
    stateInClosingTagName(c) {
        if (c === CharCodes.Gt || isWhitespace(c)) {
            this.cbs.onclosetag(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.state = State.AfterClosingTagName;
            this.stateAfterClosingTagName(c);
        }
    }
    stateAfterClosingTagName(c) {
        // Skip everything until ">"
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeAttributeName(c) {
        if (c === CharCodes.Gt) {
            this.cbs.onopentagend(this.index);
            if (this.isSpecial) {
                this.state = State.InSpecialTag;
                this.sequenceIndex = 0;
            }
            else {
                this.state = State.Text;
            }
            this.sectionStart = this.index + 1;
        }
        else if (c === CharCodes.Slash) {
            this.state = State.InSelfClosingTag;
        }
        else if (!isWhitespace(c)) {
            this.state = State.InAttributeName;
            this.sectionStart = this.index;
        }
    }
    stateInSelfClosingTag(c) {
        if (c === CharCodes.Gt) {
            this.cbs.onselfclosingtag(this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
            this.isSpecial = false; // Reset special state, in case of self-closing special tags
        }
        else if (!isWhitespace(c)) {
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    stateInAttributeName(c) {
        if (c === CharCodes.Eq || isEndOfTagSection(c)) {
            this.cbs.onattribname(this.sectionStart, this.index);
            this.sectionStart = this.index;
            this.state = State.AfterAttributeName;
            this.stateAfterAttributeName(c);
        }
    }
    stateAfterAttributeName(c) {
        if (c === CharCodes.Eq) {
            this.state = State.BeforeAttributeValue;
        }
        else if (c === CharCodes.Slash || c === CharCodes.Gt) {
            this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
            this.sectionStart = -1;
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
        else if (!isWhitespace(c)) {
            this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
            this.state = State.InAttributeName;
            this.sectionStart = this.index;
        }
    }
    stateBeforeAttributeValue(c) {
        if (c === CharCodes.DoubleQuote) {
            this.state = State.InAttributeValueDq;
            this.sectionStart = this.index + 1;
        }
        else if (c === CharCodes.SingleQuote) {
            this.state = State.InAttributeValueSq;
            this.sectionStart = this.index + 1;
        }
        else if (!isWhitespace(c)) {
            this.sectionStart = this.index;
            this.state = State.InAttributeValueNq;
            this.stateInAttributeValueNoQuotes(c); // Reconsume token
        }
    }
    handleInAttributeValue(c, quote) {
        if (c === quote ||
            (!this.decodeEntities && this.fastForwardTo(quote))) {
            this.cbs.onattribdata(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.cbs.onattribend(quote === CharCodes.DoubleQuote
                ? QuoteType.Double
                : QuoteType.Single, this.index + 1);
            this.state = State.BeforeAttributeName;
        }
        else if (this.decodeEntities && c === CharCodes.Amp) {
            this.startEntity();
        }
    }
    stateInAttributeValueDoubleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes.DoubleQuote);
    }
    stateInAttributeValueSingleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes.SingleQuote);
    }
    stateInAttributeValueNoQuotes(c) {
        if (isWhitespace(c) || c === CharCodes.Gt) {
            this.cbs.onattribdata(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.cbs.onattribend(QuoteType.Unquoted, this.index);
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
        else if (this.decodeEntities && c === CharCodes.Amp) {
            this.startEntity();
        }
    }
    stateBeforeDeclaration(c) {
        if (c === CharCodes.OpeningSquareBracket) {
            this.state = State.CDATASequence;
            this.sequenceIndex = 0;
        }
        else {
            this.state =
                c === CharCodes.Dash
                    ? State.BeforeComment
                    : State.InDeclaration;
        }
    }
    stateInDeclaration(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.ondeclaration(this.sectionStart, this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateInProcessingInstruction(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.onprocessinginstruction(this.sectionStart, this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeComment(c) {
        if (c === CharCodes.Dash) {
            this.state = State.InCommentLike;
            this.currentSequence = Sequences.CommentEnd;
            // Allow short comments (eg. <!-->)
            this.sequenceIndex = 2;
            this.sectionStart = this.index + 1;
        }
        else {
            this.state = State.InDeclaration;
        }
    }
    stateInSpecialComment(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.oncomment(this.sectionStart, this.index, 0);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeSpecialS(c) {
        const lower = c | 0x20;
        if (lower === Sequences.ScriptEnd[3]) {
            this.startSpecial(Sequences.ScriptEnd, 4);
        }
        else if (lower === Sequences.StyleEnd[3]) {
            this.startSpecial(Sequences.StyleEnd, 4);
        }
        else {
            this.state = State.InTagName;
            this.stateInTagName(c); // Consume the token again
        }
    }
    stateBeforeSpecialT(c) {
        const lower = c | 0x20;
        switch (lower) {
            case Sequences.TitleEnd[3]: {
                this.startSpecial(Sequences.TitleEnd, 4);
                break;
            }
            case Sequences.TextareaEnd[3]: {
                this.startSpecial(Sequences.TextareaEnd, 4);
                break;
            }
            case Sequences.XmpEnd[3]: {
                this.startSpecial(Sequences.XmpEnd, 4);
                break;
            }
            default: {
                this.state = State.InTagName;
                this.stateInTagName(c); // Consume the token again
            }
        }
    }
    startEntity() {
        this.baseState = this.state;
        this.state = State.InEntity;
        this.entityStart = this.index;
        this.entityDecoder.startEntity(this.xmlMode
            ? entities_decode__WEBPACK_IMPORTED_MODULE_0__.DecodingMode.Strict
            : this.baseState === State.Text ||
                this.baseState === State.InSpecialTag
                ? entities_decode__WEBPACK_IMPORTED_MODULE_0__.DecodingMode.Legacy
                : entities_decode__WEBPACK_IMPORTED_MODULE_0__.DecodingMode.Attribute);
    }
    stateInEntity() {
        const length = this.entityDecoder.write(this.buffer, this.index - this.offset);
        // If `length` is positive, we are done with the entity.
        if (length >= 0) {
            this.state = this.baseState;
            if (length === 0) {
                this.index = this.entityStart;
            }
        }
        else {
            // Mark buffer as consumed.
            this.index = this.offset + this.buffer.length - 1;
        }
    }
    /**
     * Remove data that has already been consumed from the buffer.
     */
    cleanup() {
        // If we are inside of text or attributes, emit what we already have.
        if (this.running && this.sectionStart !== this.index) {
            if (this.state === State.Text ||
                (this.state === State.InSpecialTag && this.sequenceIndex === 0)) {
                this.cbs.ontext(this.sectionStart, this.index);
                this.sectionStart = this.index;
            }
            else if (this.state === State.InAttributeValueDq ||
                this.state === State.InAttributeValueSq ||
                this.state === State.InAttributeValueNq) {
                this.cbs.onattribdata(this.sectionStart, this.index);
                this.sectionStart = this.index;
            }
        }
    }
    shouldContinue() {
        return this.index < this.buffer.length + this.offset && this.running;
    }
    /**
     * Iterates through the buffer, calling the function corresponding to the current state.
     *
     * States that are more likely to be hit are higher up, as a performance improvement.
     */
    parse() {
        while (this.shouldContinue()) {
            const c = this.buffer.charCodeAt(this.index - this.offset);
            switch (this.state) {
                case State.Text: {
                    this.stateText(c);
                    break;
                }
                case State.SpecialStartSequence: {
                    this.stateSpecialStartSequence(c);
                    break;
                }
                case State.InSpecialTag: {
                    this.stateInSpecialTag(c);
                    break;
                }
                case State.CDATASequence: {
                    this.stateCDATASequence(c);
                    break;
                }
                case State.InAttributeValueDq: {
                    this.stateInAttributeValueDoubleQuotes(c);
                    break;
                }
                case State.InAttributeName: {
                    this.stateInAttributeName(c);
                    break;
                }
                case State.InCommentLike: {
                    this.stateInCommentLike(c);
                    break;
                }
                case State.InSpecialComment: {
                    this.stateInSpecialComment(c);
                    break;
                }
                case State.BeforeAttributeName: {
                    this.stateBeforeAttributeName(c);
                    break;
                }
                case State.InTagName: {
                    this.stateInTagName(c);
                    break;
                }
                case State.InClosingTagName: {
                    this.stateInClosingTagName(c);
                    break;
                }
                case State.BeforeTagName: {
                    this.stateBeforeTagName(c);
                    break;
                }
                case State.AfterAttributeName: {
                    this.stateAfterAttributeName(c);
                    break;
                }
                case State.InAttributeValueSq: {
                    this.stateInAttributeValueSingleQuotes(c);
                    break;
                }
                case State.BeforeAttributeValue: {
                    this.stateBeforeAttributeValue(c);
                    break;
                }
                case State.BeforeClosingTagName: {
                    this.stateBeforeClosingTagName(c);
                    break;
                }
                case State.AfterClosingTagName: {
                    this.stateAfterClosingTagName(c);
                    break;
                }
                case State.BeforeSpecialS: {
                    this.stateBeforeSpecialS(c);
                    break;
                }
                case State.BeforeSpecialT: {
                    this.stateBeforeSpecialT(c);
                    break;
                }
                case State.InAttributeValueNq: {
                    this.stateInAttributeValueNoQuotes(c);
                    break;
                }
                case State.InSelfClosingTag: {
                    this.stateInSelfClosingTag(c);
                    break;
                }
                case State.InDeclaration: {
                    this.stateInDeclaration(c);
                    break;
                }
                case State.BeforeDeclaration: {
                    this.stateBeforeDeclaration(c);
                    break;
                }
                case State.BeforeComment: {
                    this.stateBeforeComment(c);
                    break;
                }
                case State.InProcessingInstruction: {
                    this.stateInProcessingInstruction(c);
                    break;
                }
                case State.InEntity: {
                    this.stateInEntity();
                    break;
                }
            }
            this.index++;
        }
        this.cleanup();
    }
    finish() {
        if (this.state === State.InEntity) {
            this.entityDecoder.end();
            this.state = this.baseState;
        }
        this.handleTrailingData();
        this.cbs.onend();
    }
    /** Handle any trailing data. */
    handleTrailingData() {
        const endIndex = this.buffer.length + this.offset;
        // If there is no remaining data, we are done.
        if (this.sectionStart >= endIndex) {
            return;
        }
        if (this.state === State.InCommentLike) {
            if (this.currentSequence === Sequences.CdataEnd) {
                this.cbs.oncdata(this.sectionStart, endIndex, 0);
            }
            else {
                this.cbs.oncomment(this.sectionStart, endIndex, 0);
            }
        }
        else if (this.state === State.InTagName ||
            this.state === State.BeforeAttributeName ||
            this.state === State.BeforeAttributeValue ||
            this.state === State.AfterAttributeName ||
            this.state === State.InAttributeName ||
            this.state === State.InAttributeValueSq ||
            this.state === State.InAttributeValueDq ||
            this.state === State.InAttributeValueNq ||
            this.state === State.InClosingTagName) {
            /*
             * If we are currently in an opening or closing tag, us not calling the
             * respective callback signals that the tag should be ignored.
             */
        }
        else {
            this.cbs.ontext(this.sectionStart, endIndex);
        }
    }
    emitCodePoint(cp, consumed) {
        if (this.baseState !== State.Text &&
            this.baseState !== State.InSpecialTag) {
            if (this.sectionStart < this.entityStart) {
                this.cbs.onattribdata(this.sectionStart, this.entityStart);
            }
            this.sectionStart = this.entityStart + consumed;
            this.index = this.sectionStart - 1;
            this.cbs.onattribentity(cp);
        }
        else {
            if (this.sectionStart < this.entityStart) {
                this.cbs.ontext(this.sectionStart, this.entityStart);
            }
            this.sectionStart = this.entityStart + consumed;
            this.index = this.sectionStart - 1;
            this.cbs.ontextentity(cp, this.sectionStart);
        }
    }
}
//# sourceMappingURL=Tokenizer.js.map

}),
"./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/index.js": 
/*!******************************************************************************************!*\
  !*** ./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/index.js ***!
  \******************************************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  DefaultHandler: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_1__.DomHandler),
  DomHandler: () => (/* reexport safe */ domhandler__WEBPACK_IMPORTED_MODULE_1__.DomHandler),
  DomUtils: () => (/* reexport module object */ domutils__WEBPACK_IMPORTED_MODULE_4__),
  ElementType: () => (/* reexport module object */ domelementtype__WEBPACK_IMPORTED_MODULE_3__),
  Parser: () => (/* reexport safe */ _Parser_js__WEBPACK_IMPORTED_MODULE_0__.Parser),
  QuoteType: () => (/* reexport safe */ _Tokenizer_js__WEBPACK_IMPORTED_MODULE_2__.QuoteType),
  Tokenizer: () => (/* reexport safe */ _Tokenizer_js__WEBPACK_IMPORTED_MODULE_2__["default"]),
  createDocumentStream: () => (createDocumentStream),
  createDomStream: () => (createDomStream),
  getFeed: () => (/* reexport safe */ domutils__WEBPACK_IMPORTED_MODULE_4__.getFeed),
  parseDOM: () => (parseDOM),
  parseDocument: () => (parseDocument),
  parseFeed: () => (parseFeed)
});
/* ESM import */var _Parser_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Parser.js */ "./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/Parser.js");
/* ESM import */var domhandler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! domhandler */ "./node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js");
/* ESM import */var _Tokenizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Tokenizer.js */ "./node_modules/.pnpm/htmlparser2@10.0.0/node_modules/htmlparser2/dist/esm/Tokenizer.js");
/* ESM import */var domelementtype__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! domelementtype */ "./node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js");
/* ESM import */var domutils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! domutils */ "./node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/index.js");




// Helper methods
/**
 * Parses the data, returns the resulting document.
 *
 * @param data The data that should be parsed.
 * @param options Optional options for the parser and DOM handler.
 */
function parseDocument(data, options) {
    const handler = new domhandler__WEBPACK_IMPORTED_MODULE_1__.DomHandler(undefined, options);
    new _Parser_js__WEBPACK_IMPORTED_MODULE_0__.Parser(handler, options).end(data);
    return handler.root;
}
/**
 * Parses data, returns an array of the root nodes.
 *
 * Note that the root nodes still have a `Document` node as their parent.
 * Use `parseDocument` to get the `Document` node instead.
 *
 * @param data The data that should be parsed.
 * @param options Optional options for the parser and DOM handler.
 * @deprecated Use `parseDocument` instead.
 */
function parseDOM(data, options) {
    return parseDocument(data, options).children;
}
/**
 * Creates a parser instance, with an attached DOM handler.
 *
 * @param callback A callback that will be called once parsing has been completed, with the resulting document.
 * @param options Optional options for the parser and DOM handler.
 * @param elementCallback An optional callback that will be called every time a tag has been completed inside of the DOM.
 */
function createDocumentStream(callback, options, elementCallback) {
    const handler = new domhandler__WEBPACK_IMPORTED_MODULE_1__.DomHandler((error) => callback(error, handler.root), options, elementCallback);
    return new _Parser_js__WEBPACK_IMPORTED_MODULE_0__.Parser(handler, options);
}
/**
 * Creates a parser instance, with an attached DOM handler.
 *
 * @param callback A callback that will be called once parsing has been completed, with an array of root nodes.
 * @param options Optional options for the parser and DOM handler.
 * @param elementCallback An optional callback that will be called every time a tag has been completed inside of the DOM.
 * @deprecated Use `createDocumentStream` instead.
 */
function createDomStream(callback, options, elementCallback) {
    const handler = new domhandler__WEBPACK_IMPORTED_MODULE_1__.DomHandler(callback, options, elementCallback);
    return new _Parser_js__WEBPACK_IMPORTED_MODULE_0__.Parser(handler, options);
}

/*
 * All of the following exports exist for backwards-compatibility.
 * They should probably be removed eventually.
 */



const parseFeedDefaultOptions = { xmlMode: true };
/**
 * Parse a feed.
 *
 * @param feed The feed that should be parsed, as a string.
 * @param options Optionally, options for parsing. When using this, you should set `xmlMode` to `true`.
 */
function parseFeed(feed, options = parseFeedDefaultOptions) {
    return (0,domutils__WEBPACK_IMPORTED_MODULE_4__.getFeed)(parseDOM(feed, options));
}

//# sourceMappingURL=index.js.map

}),
"./node_modules/.pnpm/idb@8.0.3/node_modules/idb/build/index.js": 
/*!**********************************************************************!*\
  !*** ./node_modules/.pnpm/idb@8.0.3/node_modules/idb/build/index.js ***!
  \**********************************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  deleteDB: () => (deleteDB),
  openDB: () => (openDB),
  unwrap: () => (unwrap),
  wrap: () => (wrap)
});
const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const transactionDoneMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    // This mapping exists in reverseTransformCache but doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(this.request);
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */
function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event));
    }
    return wrap(request).then(() => undefined);
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap = {};
const advanceResults = new WeakMap();
const ittrProxiedCursorToOriginalProxy = new WeakMap();
const cursorIteratorTraps = {
    get(target, prop) {
        if (!advanceMethodProps.includes(prop))
            return target[prop];
        let cachedFunc = methodMap[prop];
        if (!cachedFunc) {
            cachedFunc = methodMap[prop] = function (...args) {
                advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
            };
        }
        return cachedFunc;
    },
};
async function* iterate(...args) {
    // tslint:disable-next-line:no-this-assignment
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
        cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
        return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    // Map this double-proxy back to the original, so other cursor methods work.
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
        yield proxiedCursor;
        // If one of the advancing methods was not called, call continue().
        cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
        advanceResults.delete(proxiedCursor);
    }
}
function isIteratorProp(target, prop) {
    return ((prop === Symbol.asyncIterator &&
        instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        (prop === 'iterate' && instanceOfAny(target, [IDBIndex, IDBObjectStore])));
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
        if (isIteratorProp(target, prop))
            return iterate;
        return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
        return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    },
}));




}),

});
/************************************************************************/
// The module cache
var __webpack_module_cache__ = {};

// The require function
function __webpack_require__(moduleId) {

// Check if module is in cache
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
return cachedModule.exports;
}
// Create a new module (and put it into the cache)
var module = (__webpack_module_cache__[moduleId] = {
exports: {}
});
// Execute the module function
__webpack_modules__[moduleId](module, module.exports, __webpack_require__);

// Return the exports of the module
return module.exports;

}

/************************************************************************/
// webpack/runtime/compat_get_default_export
(() => {
// getDefaultExport function for compatibility with non-ESM modules
__webpack_require__.n = (module) => {
	var getter = module && module.__esModule ?
		() => (module['default']) :
		() => (module);
	__webpack_require__.d(getter, { a: getter });
	return getter;
};

})();
// webpack/runtime/define_property_getters
(() => {
__webpack_require__.d = (exports, definition) => {
	for(var key in definition) {
        if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
        }
    }
};
})();
// webpack/runtime/has_own_property
(() => {
__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
})();
// webpack/runtime/make_namespace_object
(() => {
// define __esModule on exports
__webpack_require__.r = (exports) => {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
})();
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {

/*!**********************!*\
  !*** ./src/entry.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  $scramjetLoadClient: () => ($scramjetLoadClient),
  $scramjetLoadController: () => ($scramjetLoadController),
  $scramjetLoadWorker: () => ($scramjetLoadWorker),
  $scramjetVersion: () => ($scramjetVersion)
});
/// <reference types="@rspack/core/module" />
/**
 * @fileoverview Scramjet Entry Point. This module contain global constants and factory functions to load the APIs in the bundle.
 *
 * @categoryDescription Window Context
 * APIs for the main window context, which includes creating Scramjet Frames and the Controller for managing the Scramjet proxy behavior in the SW.
 * @categoryDescription Service Worker Context
 * APIs designed for the service worker context, where the core logic resides. These are the essentials and include the the `ScramjetServiceWorker`.
 */ /**
 * Factory function that creates the `ScramjetController` class.
 *
 * @returns The `ScramjetController` class.
 *
 * @example
 * ```typescript
 * const { ScramjetController } = $scramjetLoadController();
 *
 * const scramjet = new ScramjetController({
 *   prefix: "/scramjet/"
 * });
 *
 * await scramjet.init();
 *
 * const frame = scramjet.createFrame();
 * document.body.appendChild(frame.frame);
 * frame.navigate("https://example.com");
 * ```
 *
 * @category Window Context
 */ function $scramjetLoadController() {
    return __webpack_require__(/*! ./controller/index */ "./src/controller/index.ts");
}
/**
 * Factory function that creates the `ScramjetClient` for controlling sandboxing.
 *
 * @returns The `ScramjetClient` class.
 *
 * @example
 * ```typescript
 * const ScramjetClient = $scramjetLoadClient();
 *
 * const scramjetClient = new ScramjetClient.ScramjetClient();
 * ```
 * @category Window Context
 */ function $scramjetLoadClient() {
    return __webpack_require__(/*! ./client/entry */ "./src/client/entry.ts");
}
/**
 * Factory function that creates the `ScramjetServiceWorker` class.
 *
 * @returns The `ScramjetServiceWorker` class.
 *
 * Plain SW example
 * @example
 * ```typescript
 * // In your Service Worker
 * const { ScramjetServiceWorker } = $scramjetLoadWorker();
 *
 * const scramjet = new ScramjetServiceWorker();
 *
 * self.addEventListener("fetch", async (ev) => {
 *   await scramjet.loadConfig();
 *
 *   if (scramjet.route(ev)) {
 *     ev.respondWith(scramjet.fetch(ev));
 *   }
 * });
 * ```
 *
 * Workbox-powered SW routing example
 * @example
 * ```typescript
 * // In your Service Worker (ensure you are using a bundler for Workbox)
 * // This is more useful for a webOS or if you have Offline PWA support on your proxy site
 * import { registerRoute } from 'workbox-routing';
 *
 * const { ScramjetServiceWorker } = $scramjetLoadWorker();
 *
 * const scramjet = new ScramjetServiceWorker();
 *
 * registerRoute(
 *   ({ request }) => {
 *     return scramjet.route({ request });
 *   },
 *   async ({ event }) => {
 *     await scramjet.loadConfig();
 *
 *     return scramjet.fetch(event);
 *   }
 * );
 * ```
 *
 * @category Service Worker Context
 */ function $scramjetLoadWorker() {
    return __webpack_require__(/*! ./worker/index */ "./src/worker/index.ts");
}
globalThis.$scramjetRequire = function(path) {
    return __webpack_require__(/*! . */ "./src sync recursive")(path);
};
/**
 * Version information for the current Scramjet build.
 *
 * @category Window Context
 */ const $scramjetVersion = {
    build: unknown,
    version: "2.0.0-alpha"
};
globalThis.$scramjetLoadController = $scramjetLoadController;
globalThis.$scramjetLoadClient = $scramjetLoadClient;
globalThis.$scramjetLoadWorker = $scramjetLoadWorker;
globalThis.$scramjetVersion = $scramjetVersion;
if ("document" in globalThis && document?.currentScript) {
    document.currentScript.remove();
}

})();

})()
;
//# sourceMappingURL=scramjet.all.js.map