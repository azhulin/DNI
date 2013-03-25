var express = require('express')
  , querystring = require('querystring')
  , https = require('https')
  , http = require('http')
  , url = require('url')
  //, path = require('path')

  , utils = require('./utils')
  //, AccessCard = require('./access_card')
  ;


// Need to receive this from Drupal///////////////////////
var DrupalHost = 'http://109.104.174.224:8082';
var debug = 0;
var logFile = 'D:/node.log';
var port = 8081;
/////////////////////////////////////////////////////////

//var card = new AccessCard({ salt: 'asd' });
//log(a = card.create(a));
//log(card.validate(a));


if (debug) {
  var Logger = require('./logger');
  var logger = new Logger();
  var log = function(message) {
    logger.log(message);
  };
}
else {
  log = function() {};
}


function getHeaders(type) {
  type = type || 'json';

  var headers = {
    'Access-Control-Allow-Origin': DrupalHost
  };
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

  if (DrupalHost !== host) {
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


var app = express();

app.use(express.bodyParser());

app.get('/ping', function(req, res) {
  log('GET /' + req.url);
  log(req.headers);

  var validation = validateHost(req.headers.origin);
  if (true === validation) {
    res.writeHead(200, getHeaders());
    response = JSON.stringify({ status: 'OK' });
  }
  else {
    res.writeHead(validation.code, validation.headers);
  }

  res.end(response);
});

app.get('/test', function(req, res) {
  log('GET /' + req.url);
  log(req.headers);

  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  var validation = validateHost(req.headers.origin);
  if ('hub.challenge' in query && 'hub.mode' in query && 'subscribe' === query['hub.mode']) {
    var response = query['hub.challenge'];
  }
  else if (true === validation) {
    res.writeHead(200, getHeaders('html'));
    response = 'test';
  }
  else {
    res.writeHead(validation.code, validation.headers);
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

app.listen(port);



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
