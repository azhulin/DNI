var express = require('express')
  , querystring = require('querystring')
  , http = require('http')
  , https = require('https')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, { log: false })
  , settings = require('./settings')
  , $ = require('./$')
  , Storage = require('./storage')
  , storage = new Storage({ limit: 64 })
  , Subscription = require('./subscription')
  , subscription = new Subscription(storage)
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
var groups = [];
var clients = {};
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

  socket.on('qOnline', function(group, data) {
    if (group in groupPermissions) {
      if ('client' === group) {
        var subs = subscription.filter(Object.keys(data), function(item) {
          socket.emit('aBadSubscription', { id: item });
        });
        !subs.length && socket.disconnect();
        subs.forEach(function(id) {
          socket.join(id);
          socket.emit('aUpdate', {
            id: id,
            data: storage.pop(id, data[id])
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
    else {
      socket.disconnect();
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

  socket.emit('aOnline', { status: 'OK' });
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
  subscription.update(req, res, function(id, data) {
    io.sockets.in(id).emit('aUpdate', {
      id: id,
      data: data
    });
  });
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
    subscription.getUpdate(params, function(data) {
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
