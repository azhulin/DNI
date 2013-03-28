exports.type = function(target) {
  return Object.prototype.toString.call(target).slice(8, -1);
};


Array.prototype.contains = function(item) {
  return -1 !== this.indexOf(item);
};


Array.prototype.pushU = function(item) {
  !this.contains(item) && this.push(item);
};
