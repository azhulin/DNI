var settings = require('./settings')
  , querystring = require('querystring')
  , https = require('https')
  , url = require('url')
  ;


module.exports = Subscription;


function Subscription() {}


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
    host: 'api.instagram.com',
    port: 443,
    path: '/v1/subscriptions',
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
  var query = '?' + querystring.stringify({
    client_secret: settings.client_secret,
    client_id: settings.client_id
  });
  var options = {
    host: 'api.instagram.com',
    port: 443,
    path: '/v1/subscriptions' + query,
    method: 'GET'
  };
  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      data = JSON.parse(data);
      var response = {};
      if (200 !== data.meta.code) {
        response.status = 'error';
        response.meta = data.meta;
      }
      else {
        response.status = 'OK';
        response.data = [];
        data.data.forEach(function(item) {
          response.data.push({
            type: item.object,
            object: item.object_id,
            id: item.id
          });
        });
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
    host: 'api.instagram.com',
    port: 443,
    path: '/v1/subscriptions' + query,
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


Subscription.prototype.getList = function(data) {
  var result = [];
  if (data && 'data' in data) {
    data.data.forEach(function(item) {
      result.push(item.id);
    });
  }
  return result;
};


Subscription.prototype.filter = function(subs, socket) {
  global.subscriptions;
  var filteredSubs = [];
  subs.forEach(function(item) {
    if (subscriptions.contains(item)) {
      filteredSubs.pushU(item);
    }
    else {
      socket.emit('aBadSubscription', { id: item });
    }
  });
  return filteredSubs;
};
