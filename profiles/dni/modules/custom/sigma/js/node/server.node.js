var express = require('express')
  , querystring = require('querystring')
  , https = require('https')
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , util = require('util')
  , path = require('path')
  ;

// Need to receive this from Drupal
var DrupalHost = 'http://109.104.174.224:8082';

Object.defineProperty(global, '__stack', {
  get: function() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[2].getLineNumber();
  }
});

Object.defineProperty(global, '__file', {
  get: function(){
    return __stack[1].getFileName();
  }
});

function typeOf(target) {
  return Object.prototype.toString.call(target).slice(8, -1);
}

function log(message) {
  var logFile = 'D:/node.log';
  var date = new Date().toISOString();
  var file = path.basename(__file);
  if (0 <= ['Array', 'Object'].indexOf(typeOf(message))) {
    message = util.inspect(message);
  }
  message = '>>>> ' + date + ' ' + file + ':' + __line + '>\n' + message + '\n';
  fs.appendFile(logFile, message);
  console.log(message);
}


var app = express();

app.use(express.bodyParser());

app.get('/test', function(req, res) {
  log(req.headers);
  log(req.url);
  log('GET /');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  if ('hub.challenge' in query && 'hub.mode' in query && 'subscribe' === query['hub.mode']) {
    var response = query['hub.challenge'];
  }
  else if (DrupalHost === req.headers.origin) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': DrupalHost
    });
    response = 'test';
  }
  else {
    res.writeHead(403, {
      'Content-Type': 'text/html; charset=utf-8'
    });
  }

  res.end(response);
});

app.post('/test', function(req, res) {
  //log('POST /');
  //log(req.body);
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
  });

  res.end('thanks!');
});

app.listen(8081);



app.get('/exit', function(req, res) {
  log('Before exit');
  res.end('Exit');
  log('Exit');
  process.exit();
});


/*
var data = querystring.stringify({
  client_id: '375c57455b054f8f9f349af431ca5a45',
  client_secret: 'b3a2aac60f494f849db5cc66dc6406d5',
  object: 'tag',
  aspect: 'media',
  object_id: 'fun', // 2990822
  //callback_url: 'http://dni-node.no-ip.org/test'
  callback_url: 'http://109.104.174.224:8081/test'
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
  log('STATUS: ' + res.statusCode);
  log(res.headers);
  res.setEncoding('utf8');
  res.on('data', function(chunk) {
    log('Response: ' + chunk);
  });
});

req.on('error', function(e) {
  log('Problem with request: ' + e.message);
});

req.write(data);
req.end();
*/
