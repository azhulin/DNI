exports.type = function(target) {
  return Object.prototype.toString.call(target).slice(8, -1);
};


exports.in = function(needle, haystack) {
  if (-1 !== haystack.indexOf(needle)) {
    return true;
  }
  return false;
};
