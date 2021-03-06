var settings = require('./settings')
  , querystring = require('querystring')
  , https = require('https')
  , url = require('url')
  , $ = require('./$')
  ;


module.exports = Subscription;


function Subscription(storage) {
  this.updateInfo = {};
  this.storage = storage;
  this.host = 'api.instagram.com';
  this.subsPath = '/v1/subscriptions';
  this.subscriptions = false;
  this.moderated = [];
}


Subscription.prototype.post = function(object, object_id, callback) {
  var data = querystring.stringify({
    client_id: settings.client_id,
    client_secret: settings.client_secret,
    object: object,
    aspect: 'media',
    object_id: object_id,
    callback_url: 'http://' + settings.host + ':' + settings.port + '/listen'
  });
  var options = {
    host: this.host,
    port: 443,
    path: this.subsPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length
    }
  };
  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function() {});
    res.on('end', function() {
      callback && callback();
    });
  });
  req.end(data);
};


Subscription.prototype.get = function(callback) {
  var self = this;
  var query = '?' + querystring.stringify({
    client_secret: settings.client_secret,
    client_id: settings.client_id
  });
  var options = {
    host: this.host,
    port: 443,
    path: this.subsPath + query,
    method: 'GET'
  };
  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      try {
        data = JSON.parse(data);
        console.log(res.headers['x-ratelimit-remaining'] + '/5000');
      }
      catch(e) {
        console.log('Parse error');
        return false;
      }
      var subs = false;
      if (200 === data.meta.code) {
        subs = {};
        data.data.forEach(function(item) {
          subs[item.id] = {
            object: item.object,
            object_id: item.object_id,
            moderated: self.isModerated(item.id)
          };
        });
        self.subscriptions = subs;
      }
      callback && callback(subs);
    });
  });
  req.end();
};


Subscription.prototype.delete = function(type, param, callback) {
  query = {
    client_secret: settings.client_secret,
    client_id: settings.client_id
  };
  query[type] = param;
  var query = '?' + querystring.stringify(query);
  var options = {
    host: this.host,
    port: 443,
    path: this.subsPath + query,
    method: 'DELETE'
  };
  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function() {});
    res.on('end', function() {
      callback && callback();
    });
  });
  req.end();
};


Subscription.prototype.confirm = function(req, res) {
  var query = url.parse(req.url, true).query;
  if ('hub.challenge' in query && 'hub.mode' in query && 'subscribe' === query['hub.mode']) {
    var response = query['hub.challenge'];
  }
  res.end(response);
};


Subscription.prototype.update = function(req, res, callback) {
  var self = this;
  var data = '';
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    data = JSON.parse(data);
    data.forEach(function(params) {
      self.getUpdate(params, function(data) {
        if (data) {
          var id = params.subscription_id;
          callback && callback(id, data);
        }
      });
    });
  });
  res.end();
};


Subscription.prototype.getUpdate = function(params, callback) {
  var self = this;
  var id = params.subscription_id;
  if (id in this.updateInfo) {
    var time = +new Date;
    if (this.updateInfo[id].time + 2000 > time) {
      return this.updateInfo[id].min_tag_id = false;
    }
    this.updateInfo[id].time = time;
  }
  else {
    this.updateInfo[id] = {
      time: +new Date,
      min_tag_id: false
    };
  }
  var query = {
    client_id: settings.client_id
  };
  this.updateInfo[id].min_tag_id && (query.min_tag_id = this.updateInfo[id].min_tag_id);
  var query = '?' + querystring.stringify(query);
  var options = {
    host: this.host,
    port: 443,
    path: '/v1/tags/' + params.object_id + '/media/recent' + query,
    method: 'GET'
  };
  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      try {
        data = JSON.parse(data);
        console.log(res.headers['x-ratelimit-remaining'] + '/5000');
      }
      catch(e) {
        console.log('Parse error');
        return false;
      }
      'min_tag_id' in data.pagination && (self.updateInfo[id].min_tag_id = data.pagination.min_tag_id);
      self.storage.push(params, data.data, callback);
    });
  });
  req.end();
};


Subscription.prototype.getAll = function(callback) {
  if (!this.subscriptions) {
    this.get(callback);
  }
  else {
    callback && callback(this.subscriptions);
  }
};


Subscription.prototype.getIds = function() {
  return Object.keys(this.subscriptions);
};


Subscription.prototype.getById = function(id) {
  if (id in this.subscriptions) {
    return this.subscriptions[id];
  }
  else {
    return null;
  }
};


Subscription.prototype.filter = function(subs, callback) {
  var self = this;
  var filteredSubs = [];
  subs.forEach(function(item) {
    if (item in self.subscriptions) {
      filteredSubs.pushU(item);
    }
    else {
      callback && callback(item);
    }
  });
  return filteredSubs;
};


Subscription.prototype.moderate = function(id, callback) {
  if (!this.moderated.contains(id)) {
    this.moderated.push(id);
    id in this.subscriptions && (this.subscriptions[id].moderated = true);
    this.getAll(callback);
  }
};


Subscription.prototype.release = function(id, callback) {
  id = '' + id;
  if (this.moderated.contains(id)) {
    this.moderated.splice(this.moderated.indexOf(id), 1);
    id in this.subscriptions && (this.subscriptions[id].moderated = false);
    this.getAll(callback);
  }
};


Subscription.prototype.isModerated = function(id) {
  return this.moderated.contains('' + id);
};
