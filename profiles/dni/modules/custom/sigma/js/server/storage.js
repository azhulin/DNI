module.exports = Storage;


function Storage(params) {
  this.data = {};
  this.toDelete = [
    'attribution', 'filter', 'location', 'type'
  ];
  this.limit = 'limit' in params ? params.limit : 64;
}


Storage.prototype.processItem = function(item) {
  this.toDelete.forEach(function(prop) {
    delete item[prop];
  });
  item.caption = item.caption ? item.caption.text : '';
  item.comments = item.comments.count;
  item.images.low_resolution = item.images.low_resolution.url;
  item.images.standard_resolution = item.images.standard_resolution.url;
  item.images.thumbnail = item.images.thumbnail.url;
  item.likes = item.likes.count;
  item.user = item.user.username;
  return item;
};


Storage.prototype.push = function(params, data, callback) {
  var self = this;
  var id = params.subscription_id;
  !(id in this.data) && (this.data[id] = []);
  data.reverse().forEach(function(item) {
    item = self.processItem(item);
    self.limit < self.data[id].length && self.data[id].shift();
    self.data[id].push(item);
  });
  10 < data.length && (data = data.splice(-2, 2));
  callback && callback(data);
};


Storage.prototype.pop = function(id, count) {
  count = count || 0;
  if (id in this.data) {
    return this.data[id].slice(-count);
  }
  else {
    return [];
  }
};
