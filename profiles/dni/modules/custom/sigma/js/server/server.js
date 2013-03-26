var express = require('express')
  , app = express()
  , querystring = require('querystring')
  , https = require('https')
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , url = require('url')
  //, path = require('path')

  , settings = require('./settings')
  , utils = require('./utils')
  //, AccessCard = require('./access_card')
  ;


//var card = new AccessCard({ salt: 'asd' });
//log(a = card.create(a));
//log(card.validate(a));


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


function validateHost(host) {
  var response;
  if (settings.drupal_url !== host) {
    response = {
      code: 403,
      headers: getHeaders('html')
    };
  }
  else {
    response = true;
  }
  return response;
}


server.listen(8081);


io.sockets.on('connection', function (socket) {
  socket.on('qExit', function() {
    socket.emit('aExit', { status: 'OK' });
    process.exit();
  });

  socket.on('qGetSubscription', function() {
    getSubscription(function(data) {
      socket.emit('aGetSubscription', data);
    });
  });

  socket.on('qPostSubscription', function(data) {
    postSubscription(data.object, data.object_id, function() {
      getSubscription(function(data) {
        socket.emit('aGetSubscription', data);
      });
      socket.emit('aPostSubscription', { status: 'OK' });
    });
  });

  socket.on('qDeleteSubscription', function(data) {
    deleteSubscription(data.type, data.param, function() {
      getSubscription(function(data) {
        socket.emit('aGetSubscription', data);
      });
      socket.emit('aDeleteSubscription', { status: 'OK' });
    });
  });
});


app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', settings.drupal_url);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  'options' === req.method.toLowerCase() ? res.send(200) : next();
});

app.use(express.bodyParser());

app.get('/ping', function(req, res) {
  var validation = validateHost(req.headers.origin);
  if (true === validation) {
    res.writeHead(200, getHeaders());
    var response = JSON.stringify({ status: 'OK' });
  }
  else {
    res.writeHead(validation.code, validation.headers);
  }
  res.end(response);
});


function confirmSubscription(req, res) {
  log('GET ' + req.url);
  var query = url.parse(req.url, true).query;
  if ('hub.challenge' in query && 'hub.mode' in query && 'subscribe' === query['hub.mode']) {
    var response = query['hub.challenge'];
  }
  else {
    var validation = validateHost(req.headers.origin);
    res.writeHead(validation.code, validation.headers);
  }
  res.end(response);
}


app.get('/listen', function(req, res) {
  confirmSubscription(req, res);
});


app.post('/listen', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end();
});


function postSubscription(object, object_id, callback) {
  log('>> SUBSCRIBE');
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
    res.on('end', function() {
      callback && callback();
    });
  });
  req.on('error', function(e) {
    log('Problem with request: ' + e.message);
  });
  req.end(data);
}


function getSubscription(callback) {
  log('>> GET SUBSCRIPTIONS');
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
  req.on('error', function(e) {
    log('Problem with request: ' + e.message);
  });
  req.end();
}


function deleteSubscription(type, param, callback) {
  log('>> DELETE SUBSCRIPTIONS');
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
    res.on('end', function() {
      callback && callback();
    });
  });
  req.on('error', function(e) {
    log('Problem with request: ' + e.message);
  });
  req.end();
}
