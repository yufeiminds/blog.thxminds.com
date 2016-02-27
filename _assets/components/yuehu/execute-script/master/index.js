/**
 * Execute a script node.
 *
 * Copyright (c) 2014 by Hsiaoming Yang.
 */

module.exports = function(node) {
  var type = node.type;
  // not javascript
  if (type !== '' && type !== 'text/javascript') return;

  var script = document.createElement('script');
  var attrs = node.attributes || [];

  for (var i = 0; i < attrs.length; i++) {
    (function(attr) {
      script.setAttribute(attr.name, attr.value);
    })(attrs[i]);
  }

  // <script>var foo = 'foo';</script>
  script.appendChild(document.createTextNode(node.innerHTML));

  var parentNode = node.parentNode;
  var nextSibling = node.nextSibling;
  parentNode.removeChild(node);
  parentNode.insertBefore(script, nextSibling);
};
