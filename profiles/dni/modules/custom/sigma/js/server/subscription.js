var settings = require('./settings')
  , querystring = require('querystring')
  , https = require('https')
  , url = require('url')
  ;


module.exports = Subscription;


function Subscription(storage) {
  this.updateInfo = {};
  this.storage = storage;
  this.host = 'api.instagram.com';
  this.subsPath = '/v1/subscriptions';
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
  global.subscriptions;
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
      console.log('@@@@@@@@ ' + res.headers['x-ratelimit-remaining'] + '/5000');
      try {
        data = JSON.parse(data);
      }
      catch(e) {
        log('Parse error');
        return false;
      }
      var response = {};
      if (200 !== data.meta.code) {
        response.status = 'error';
        response.meta = data.meta;
      }
      else {
        response.status = 'OK';
        response.data = [];
        var subs = {};
        data.data.forEach(function(item) {
          subs[item.id] = {
            object: item.object,
            object_id: item.object_id
          };
          response.data.push({
            type: item.object,
            object: item.object_id,
            id: item.id
          });
        });
        subscriptions = subs;
      }
      callback && callback(response);
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
      console.log('@@@@@@@@ ' + res.headers['x-ratelimit-remaining'] + '/5000');
      try {
        data = JSON.parse(data);
      }
      catch(e) {
        log('Parse error');
        return false;
      }
      'min_tag_id' in data.pagination && (self.updateInfo[id].min_tag_id = data.pagination.min_tag_id);
      self.storage.push(params, data.data, callback);
    });
  });
  req.end();
};


Subscription.prototype.filter = function(subs, callback) {
  global.subscriptions;
  var filteredSubs = [];
  subs.forEach(function(item) {
    if (item in subscriptions) {
      filteredSubs.pushU(item);
    }
    else {
      callback && callback(item);
    }
  });
  return filteredSubs;
};
