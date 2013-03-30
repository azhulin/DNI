var express = require('express')
  , querystring = require('querystring')
  , http = require('http')
  , https = require('https')
  , url = require('url')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, { log: false })
  , Subscription = require('./subscription')
  , subscription = new Subscription()
  , settings = require('./settings')
  , $ = require('./$')
  ;

http.globalAgent.maxSockets = 1000;

if (settings.debug) {
  var Logger = require('./logger');
  var logger = new Logger(settings.log_file);
  var log = function(message) {
    logger.log(message);
  };
}
else {
  log = function() {};
}

global.subscriptions = {};
var storageLimit = 64;
var groups = [];
var channels = {};
var clients = {};
var storage = {};
var groupPermissions = {
  adminSettings: [ 'exit', 'getSubscription', 'postSubscription', 'deleteSubscription' ],
  widgetSettings: [ 'getSubscription' ],
  adminClient: [],
  client: []
};


function checkAccess(event, group) {
  if (group in groupPermissions && groupPermissions[group].contains(event)) {
    return true;
  }
  return false;
}


io.sockets.on('connection', function(socket) {

  socket.on('disconnect', function() {
    if ('group' in socket) {
      clients[socket.group].splice(clients[socket.group].indexOf(socket), 1);
      // UPDATE CLIENT LIST
    }
  });

  socket.emit('aOnline', { status: 'OK' });

  socket.on('qOnline', function(group, data) {
    if (!(group in groupPermissions)) {
      socket.disconnect();
    }
    else {
      if ('client' === group) {
        var subs = subscription.filter(Object.keys(data), socket);
        !subs.length && socket.disconnect();
        subs.forEach(function(id) {
          socket.join(id);
          socket.emit('aUpdate', {
            id: id,
            data: storage[id].slice(-data[id])
          });
        });
      }

      socket.group = group;
      groups.pushU(group);
      if (!(group in clients)) {
        clients[group] = [];
      }
      clients[group].push({
        subscriptions: subs,
        info: socket.handshake
      });
    }
  });

  socket.on('qExit', function() {
    if (checkAccess('exit', socket.group)) {
      io.sockets.emit('aExit', { status: 'OK' });
      process.exit();
    }
  });

  socket.on('qGetSubscription', function() {
    if (checkAccess('getSubscription', socket.group)) {
      subscription.get(function(data) {
        socket.emit('aGetSubscription', data);
      });
    }
  });

  socket.on('qPostSubscription', function(data) {
    if (checkAccess('postSubscription', socket.group)) {
      subscription.post(data.object, data.object_id, function() {
        subscription.get(function(data) {
          io.sockets.emit('aGetSubscription', data);
        });
        socket.emit('aPostSubscription', { status: 'OK' });
      });
    }
  });

  socket.on('qDeleteSubscription', function(data) {
    if (checkAccess('deleteSubscription', socket.group)) {
      subscription.delete(data.type, data.param, function() {
        subscription.get(function(data) {
          io.sockets.emit('aGetSubscription', data);
        });
        io.sockets.emit('aDeleteSubscription', { id: data.param });
      });
    }
  });
});

process.on('SIGINT', function() {
  io.sockets.emit('aExit', { status: 'OK' });
});


app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', settings.drupal_url);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  'options' === req.method.toLowerCase() ? res.send(200) : next();
});


app.get('/listen', function(req, res) {
  subscription.confirm(req, res);
});


app.post('/listen', function(req, res) {
  var data = '';
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
//log(req.headers['x-hub-signature']);
//log(req.headers);
    data = JSON.parse(data);
    data.forEach(function(params) {
      getUpdates(params, function(data) {
        if (data) {
          var id = params.subscription_id;
          io.sockets.in(id).emit('aUpdate', {
            id: id,
            data: data
          });
        }
      });
    });
  });

  res.end();
});



subscription.get(function() {
  var ids = Object.keys(subscriptions);
  var count = ids.length;
  ids.forEach(function(id) {
    var data = subscriptions[id];
    var params = {
      subscription_id: id,
      object: data.object,
      object_id: data.object_id
    };
    getUpdates(params, function(data) {
      if (!--count) {
        server.listen(settings.port);
        io.sockets.in(id).emit('aUpdate', {
          id: id,
          data: storage[id]
        });
      }
    });
  });
});


var updateInfo = {};

function getUpdates(params, callback) {
  var id = params.subscription_id;
  if (id in updateInfo) {
    var time = +new Date;
    if (updateInfo[id].time + 2000 > time) {
      //log('Skip ' + id);
      return updateInfo[id].min_tag_id = false;
    }
    //log('Pass ' + id);
    updateInfo[id].time = time;
  }
  else {
    //log('New sub ' + id);
    updateInfo[id] = {
      time: +new Date,
      min_tag_id: false
    };
  }

  var query = {
    client_id: settings.client_id
  };
  updateInfo[id].min_tag_id && (query.min_tag_id = updateInfo[id].min_tag_id);
  var query = '?' + querystring.stringify(query);
//https://api.instagram.com/v1/tags/drupaltest/media/recent?client_id=375c57455b054f8f9f349af431ca5a45
  var options = {
    host: 'api.instagram.com',
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
      log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ' + res.headers['x-ratelimit-remaining'] + '/5000');
      try {
        data = JSON.parse(data);
      }
      catch(e) {
        log('Parse error');
        //log(data);
        return false;
      }
      'min_tag_id' in data.pagination && (updateInfo[id].min_tag_id = data.pagination.min_tag_id);
      storagePush(params, data.data, callback);
    });
  });
  req.end();
}


var toDelete = [
  'attribution', 'filter', 'location', 'type'
];


function storageProcessItem(item) {
  toDelete.forEach(function(prop) {
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
}


function storagePush(params, data, callback) {
  //data = data.splice(-storageLimit, storageLimit);
  var id = params.subscription_id;
  !(id in storage) && (storage[id] = []);

  data.reverse().forEach(function(item) {
    item = storageProcessItem(item);
    storageLimit < storage[id].length && storage[id].shift();
    storage[id].push(item);
  });
  10 < data.length && (data = data.splice(-2, 2));
  callback && callback(data);
}
