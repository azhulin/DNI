var express = require('express')
  , querystring = require('querystring')
  , http = require('http')
  , https = require('https')
  , url = require('url')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , Subscription = require('./subscription')
  , subscription = new Subscription()
  , settings = require('./settings')
  , $ = require('./$')
  //, AccessCard = require('./access_card')
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

//log(settings);

global.subscriptions = {};
var storageLimit = 20;
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
var rooms = {
  //getSubscription: [ 'adminSettings', 'widgetSettings' ]

};


function checkAccess(event, group) {
  if (group in groupPermissions && groupPermissions[group].contains(event)) {
    return true;
  }
  return false;
}


io.sockets.on('connection', function(socket) {

  socket.on('disconnect', function() {
    log(socket.group);
    if ('group' in socket) {
      clients[socket.group].splice(clients[socket.group].indexOf(socket), 1);
      // UPDATE CLIENT LIST
    }
  });

  socket.emit('aOnline', { status: 'OK' });

  socket.on('qOnline', function(group, subs) {
    if (!(group in groupPermissions)) {
      socket.disconnect();
    }
    else {
      subs = subs || [];
      if ('client' === group) {
        subs = subscription.filter(subs, socket);
        !subs.length && socket.disconnect();
        subs.forEach(function(id) {
          socket.join(id);
        });
      }

      socket.group = group;
      groups.pushU(group);
      //socket.join(group);
      if (!(group in clients)) {
        clients[group] = [];
      }
      clients[group].push({
        subscriptions: subs,
        info: socket.handshake
      });
      subs.forEach(function(id) {
        io.sockets.in(id).emit('aUpdate', storage[id]);
      });

    }
    //log(clients);
    //log(groups);
    //log(subscriptions);
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
    //log(clients);
  });

  socket.on('qPostSubscription', function(data) {
    if (checkAccess('postSubscription', socket.group)) {
      subscription.post(data.object, data.object_id, function() {
        subscription.get(function(data) {
          io.sockets.emit('aGetSubscription', data);
          //io.sockets.in('adminSettings').emit('aGetSubscription', data);
          //io.sockets.in('widgetSettings').emit('aGetSubscription', data);
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
          //io.sockets.in('adminSettings').emit('aGetSubscription', data);
          //io.sockets.in('widgetSettings').emit('aGetSubscription', data);
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
  log('have update');
  var data = '';
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    data = JSON.parse(data);
    log(data);
    data.forEach(function(params) {
      log('updating');
      log(params);
      getUpdates(params, function(data) {
        log('received update');
        log(params);
        var id = params.subscription_id;
        log(id);
        log(storage);
        io.sockets.in(id).emit('aUpdate', data);
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
        io.sockets.in(id).emit('aUpdate', storage[id]);
      }
    });
  });
  log(subscriptions);
});


var min_tag_ids = {};






function getUpdates(params, callback) {
  var min_tag_id = params.subscription_id in min_tag_ids ? min_tag_ids[params.subscription_id] : false;
  var query = {
    client_id: settings.client_id
  };
  min_tag_id && (query.min_tag_id = min_tag_id);
  var query = '?' + querystring.stringify(query);

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
      data = JSON.parse(data);
log(data.data, 3);
      'min_tag_id' in data.pagination && (min_tag_ids[params.subscription_id] = data.pagination.min_tag_id);
      log(min_tag_ids);
      log(options.path);
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
  item.caption = item.caption.text;
  item.comments = item.comments.count;
  item.images.low_resolution = item.images.low_resolution.url;
  item.images.standard_resolution = item.images.standard_resolution.url;
  item.images.thumbnail = item.images.thumbnail.url;
  item.likes = item.likes.count;
  item.user = item.user.username;
  return item;
}


function storagePush(params, data, callback) {
  data = data.splice(-storageLimit, storageLimit);
  var id = params.subscription_id;
  !(id in storage) && (storage[id] = []);

  data.forEach(function(item) {
    item = storageProcessItem(item);
    storageLimit < storage[id].length && storage[id].shift();
    storage[id].push(item);
  });
  callback && callback(data);
}

