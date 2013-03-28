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
  , utils = require('./utils')
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

log(settings);

function getHeaders(type) {
  type = type || 'json';
  var headers = {};
  switch (type) {
    case 'json':
      headers['Content-Type'] = 'text/json; charset=utf-8';
      break;

    case 'html':
      headers['Content-Type'] = 'text/html; charset=utf-8';
      break;

  }
  return headers;
}

var clients = {};

server.listen(settings.port);
io.sockets.on('connection', function(socket) {

  socket.on('disconnect', function() {
    log(socket.group);
    if ('group' in socket) {
      clients[socket.group].splice(clients[socket.group].indexOf(socket), 1);
      // UPDATE CLIENT LIST
    }
  });

  socket.emit('aOnline', { status: 'OK' });

  socket.on('qOnline', function(group) {
    if (group) {
      socket.group = group;
      socket.join(group);
      if (!(group in clients)) {
        clients[group] = [];
      }
      clients[group].push(socket.handshake);
    }
    else {
      socket.disconnect();
    }
    log(clients);
  });

  socket.on('qExit', function() {
    io.sockets.emit('aExit', { status: 'OK' });
    process.exit();
  });

  socket.on('qGetSubscription', function() {
    if ('settings' === socket.group || 'widget_settings' === socket.group) {
      subscription.get(function(data) {
        socket.emit('aGetSubscription', data);
      });
    }
    //log(clients);
  });

  socket.on('qPostSubscription', function(data) {
    if ('settings' === socket.group) {
      subscription.post(data.object, data.object_id, function() {
        subscription.get(function(data) {
          io.sockets.emit('aGetSubscription', data);
        });
        socket.emit('aPostSubscription', { status: 'OK' });
      });
    }
  });

  socket.on('qDeleteSubscription', function(data) {
    if ('settings' === socket.group) {
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
    data = JSON.parse(data);
    log(data);
    data.forEach(function(item) {
      getUpdates(item);
    });
  });

  res.end();
});





var min_tag_ids = {};


function getUpdates(params) {
  var min_tag_id = params.subscription_id in min_tag_ids ? min_tag_ids[params.subscription_id] : false;
  var query = {
    client_id: settings.client_id
  };
  min_tag_id && (query.min_tag_id = min_tag_id);
  //https://api.instagram.com/v1/tags/test/media/recent?client_id=375c57455b054f8f9f349af431ca5a45
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
//log(data);
      var result = [];
      data.data.forEach(function(item) {
        result.push(item.id);
      });
'min_tag_id' in data.pagination && (min_tag_ids[params.subscription_id] = data.pagination.min_tag_id);
log(result);
log(min_tag_ids);
log(options.path);
      //callback && callback(response);
    });
  });
  req.end();
}
