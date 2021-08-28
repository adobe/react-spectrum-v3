// this is a VERY slow shim. We're talking O(elementsInDocument)
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.webkitMatchesSelector ||
    function (s) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(s),
        i = matches.length;
      while (--i >= 0 && matches.item(i) !== this) {
        continue;
      }
      return i > -1;
    };
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;

    do {
      if (Element.prototype.matches.call(el, s)) {
        return el;
      }
      el = el.parentElement || el.parentNode;
    }
    while (el !== null && el.nodeType === 1);

    return null;
  };
}

export default true;
