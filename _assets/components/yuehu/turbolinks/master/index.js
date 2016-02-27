/**
 * Turbolinks in component.
 */

var delegate = require('delegate');
var domparse = require('dom-parser');
var execute = require('execute-script');
var Emitter = require('emitter');

exports = module.exports = new Emitter();


var hasHistoryState = history && history.pushState && history.replaceState && (history.state !== undefined || navigator.userAgent.match(/Firefox\/2[6|7]/));
var buggyBrowsers = navigator.userAgent.match(/CriOS\//);

// TODO: cookie
var isSupported = hasHistoryState && !buggyBrowsers;

var currentState, referrer, cacheStorage = {}, cacheSize = 10;

function visit(url) {
  if (!isSupported) return location.href = url;
  exports.emit('page:visit', {url: url});

  // remember referer
  referrer = location.href;

  // set cacheSize = 0 to disable cache
  if (cacheSize) {
    cacheCurrentPage();
  }

  // reflect new url
  if (url !== referrer) {
    history.pushState({turbolinks: true, url: url}, '', url);
  }

  var cachedPage = cacheStorage[url];
  if (cachedPage) {
    return fetchHistory(cachedPage);
  }

  return fetch(url, function() {
    if (location.hash) {
      return location.href = location.href;
    } else {
      window.scrollTo(0, 0);
    }
  });
}


/**
 * Fetch and render the data.
 */
function fetch(url, cb) {
  exports.emit('page:fetch', {url: url});

  if (fetch.xhr) {
    fetch.xhr.abort();
  }

  // remove hash for IE10 compatibility
  var safeURL = removeHash(url);

  fetch.xhr = request(safeURL, function(xhr) {
    exports.emit('page:receive');
    var doc;
    var ct = xhr.getResponseHeader('Content-Type');
    if (validContentType(ct) && validStatus(xhr.status)) {
      doc = domparse(xhr.responseText);
    }
    if (!doc) {
      return location.href = url;
    }

    render(doc, true);

    // reflect redirected url
    var loc = xhr.getResponseHeader('X-XHR-Redirected-To');
    if (loc) {
      var preservedHash = removeHash(loc) === loc ? document.hash : '';
      history.replaceState(currentState, '', loc + preservedHash);
    }

    cb && cb();
    exports.emit('page:load');
  });

  fetch.xhr.onloadend = function() {
    fetch.xhr = null;
  };
}

/**
 * Fetch from history.
 */
function fetchHistory(page) {
  if (request.xhr) {
    request.xhr.abort();
  }
  render(page);
  // restore position
  window.scrollTo(page.positionX, page.positionY);
  exports.emit('page:restore');
}

/**
 * Render data to document.
 */
function render(doc, runscript) {
  // update title
  if (doc.title && doc.title.valueOf()) {
    document.title = doc.title;
  }

  var body = doc.body;
  // remove <noscript>
  body.innerHTML = body.innerHTML.replace(/<noscript[\S\s]*?<\/noscript>/ig, '');

  // update body
  document.documentElement.replaceChild(body, document.body);

  // update head
  updateHead(doc.head);

  if (runscript) {
    executeScripts(document.body);
  }

  currentState = history.state;
  exports.emit('page:change');
  exports.emit('page:update');
}


/**
 * Send a GET request.
 */
function request(url, cb) {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', url, true);
  xhr.setRequestHeader('Accept', 'text/html, application/xhtml+xml, application/xml');
  xhr.setRequestHeader('X-XHR-Referer', referrer);

  xhr.onload = function() {
    cb && cb(xhr);
  };

  xhr.onerror = function() {
    location.href = url;
  };

  // emit progress data
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      exports.emit('progress', e);
    };
  }

  xhr.send();
  return xhr;
}

/**
 * Cache current page
 */
function cacheCurrentPage() {
  cacheStorage[currentState.url] = {
    url: document.location.href,
    head: document.head,
    body: document.body,
    title: document.title,
    positionY: window.pageYOffset,
    positionX: window.pageXOffset,
    cachedAt: new Date().getTime()
  };

  // limitation on cache size
  var cacheKeys = Object.keys(cacheStorage);
  var limitAt = cacheKeys.map(function(url) {
    return cacheStorage[url].cachedAt;
  }).sort(function(a, b) {
    return b - a;
  })[cacheSize];

  cacheKeys.forEach(function(url) {
    if (cacheStorage[url].cachedAt < limitAt) {
      exports.emit('page:expire', cacheStorage[url]);
      delete cacheStorage[url];
    }
  });
}

/**
 * Remove hash on a URL.
 */
function removeHash(url) {
  var link = url;
  if (!url.href) {
    link = document.createElement('A');
    link.href = url;
  }
  return link.href.replace(link.hash, '');
}


/**
 * Validate content type of a response.
 */
function validContentType(ct) {
  return ct.match(/^(?:text\/html|application\/xhtml\+xml|application\/xml)(?:;|$)/);
}

/**
 * Validate response status code.
 */
function validStatus(code) {
  return code < 400;
}

function executeScripts(doc) {
  var scripts = doc.querySelectorAll('script:not([data-turbolinks-eval="false"])');
  for (var i = 0; i < scripts.length; i++) {
    execute(scripts[i]);
  }
}

function updateHead(head) {
  var nodes = head.querySelectorAll('meta');
  for (var i = 0; i < nodes.length; i++) {
    (function(meta) {
      var property = meta.getAttribute('property');
      if (!meta.name && !property) return;
      var selector;
      if (meta.name) {
        selector = 'meta[name="' + meta.name + '"]';
      } else {
        selector = 'meta[property="' + property + '"]';
      }
      var original = document.head.querySelector(selector);
      if (original) {
        original.content = meta.content;
      } else {
        document.head.appendChild(meta);
      }
    })(nodes[i]);
  }
}

// initialize for event
if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', function() {
    exports.emit('page:change');
    exports.emit('page:update');
  }, true);
}

// initialize for click
if (isSupported) {
  // remember current url
  history.replaceState({turbolinks: true, url: location.href}, '', location.href);
  // remember current state
  currentState = history.state;
  delegate.bind(document, 'a', 'click', handleClick, true);

  // state change
  setTimeout(function() {
    window.addEventListener('popstate', function(e) {
      if (e.state && e.state.turbolinks) {
        var cachedPage = cacheStorage[e.state.url];
        if (cachedPage) {
          cacheCurrentPage();
          fetchHistory(cachedPage);
        } else {
          visit(e.target.location.href);
        }
      }
    }, false);
  }, 500);
}

function handleClick(e) {
  if (!e.defaultPrevented) {
    var node = e.delegateTarget;

    // ignore cross origin link
    var crossOriginLink = location.protocol !== node.protocol || location.host !== node.host;

    // ignore anchors
    var anchoredLink = (node.hash && removeHash(node)) === removeHash(location) || node.href === location.href + '#';

    var url = removeHash(node);
    var nonHtmlLink = url.match(/\.[a-z]+(\?.*)?$/g) && !url.match(/\.(?:htm|html)?(\?.*)?$/g);

    var targetLink = node.target.length !== 0;

    var nonStandardClick = e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

    var ignoreClick = crossOriginLink || anchoredLink || nonHtmlLink || targetLink || nonStandardClick;

    if (!ignoreClick) {
      visit(node.href);
      return e.preventDefault();
    }
  }
}

exports.cacheSize = cacheSize;
exports.isSupported = isSupported;
exports.visit = visit;
