var query = require('query');

var el = query('meta[name="google-analytics"]');
var id;
if (el) {
  id = el.getAttribute('content');
}

(function(i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  i[r] = i[r] || function() {
    (i[r].q = i[r].q || []).push(arguments);
  };
  i[r].l = new Date();
  a = s.createElement(o);
  m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  if (id) {
    m.parentNode.insertBefore(a, m);
  }
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', id);

module.exports = ga;
