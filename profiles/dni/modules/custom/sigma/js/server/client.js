var url = require('url');

module.exports = Client;


function Client() {
  this.data = {};
}


Client.prototype.format = function(info, subscriptions) {
  data = {
    ip: null,
    path: null,
    userAgent: null,
    subscriptions: null
  };
  'address' in info && 'address' in info.address && (data.ip = info.address.address);
  if ('headers' in info) {
    'referer' in info.headers && (data.path = url.parse(info.headers.referer, true).path);
    'user-agent' in info.headers && (data.userAgent = info.headers['user-agent']);
  }
  data.subscriptions = Object.keys(subscriptions);
  return data;
};


Client.prototype.add = function(id, group, info, subscriptions, callback) {
  if (!(group in this.data)) {
    this.data[group] = {};
  }
  this.data[group][id] = this.format(info, subscriptions);
  callback && callback();
};


Client.prototype.get = function(group) {
  var data = {};
  if (group) {
    if (group in this.data) {
      data = this.data[group];
    }
  }
  else {
    data = this.data;
  }
  return data;
};


Client.prototype.delete = function(id, group) {
  if (group in this.data && id in this.data[group]) {
    delete this.data[group][id];
  }
};
