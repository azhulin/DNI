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
  , Client = require('./client')
  , client = new Client()
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

var groups = [];
var groupPermissions = {
  adminSettings: [ 'exit', 'getSubscription', 'postSubscription', 'deleteSubscription' ],
  adminClients: [ 'getClient' ],
  widgetSettings: [ 'getSubscription' ],
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
      client.delete(socket.id, socket.group);
      io.sockets.in('adminClients').emit('aGetClient', client.get());
    }
  });

  socket.on('qOnline', function(group, data) {
    if (group in groupPermissions) {
      socket.group = group;
      groups.pushU(group);
      client.add(socket.id, group, socket.handshake, data, function() {
        io.sockets.in('adminClients').emit('aGetClient', client.get());
      });
      switch (group) {
        case 'adminSettings':
        case 'widgetSettings':
          subscription.get(function(data) {
            socket.emit('aGetSubscription', data);
          });
          break;

        case 'adminClients':
          socket.join(group);
          socket.emit('aGetClient', client.get());
          break;

        case 'client':
          var subs = subscription.filter(Object.keys(data), function(item) {
            socket.emit('aBadSubscription', { id: item });
          });
          if (!subs.length) {
            client.delete(socket.id, socket.group);
            socket.disconnect();
          }
          subs.forEach(function(id) {
            socket.join(id);
            socket.emit('aUpdate', {
              id: id,
              data: storage.pop(id, data[id])
            });
          });
          break;
      }
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
  var ids = subscription.getIds();
  var count = ids.length;
  ids.forEach(function(id) {
    var data = subscription.getById(id);
    var params = {
      subscription_id: id,
      object: data.object,
      object_id: data.object_id
    };
    subscription.getUpdate(params, function(data) {
      if (!--count) {
        server.listen(settings.port);
      }
    });
  });
});
