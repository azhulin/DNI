var fs = require('fs')
  , util = require('util')
  , path = require('path')
  , $ = require('./$')
  ;


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
    return __stack[3].getLineNumber();
  }
});


Object.defineProperty(global, '__file', {
  get: function(){
    return __stack[2].getFileName();
  }
});


module.exports = Logger;


function Logger(file) {
  this.file = file;
}


Logger.prototype.log = function(message) {
  var date = new Date().toISOString();
  var file = path.basename(__file);
  if (['Array', 'Object'].contains($.type(message))) {
    message = util.inspect(message, false, 4);
  }
  message = '>>>> ' + date + ' ' + file + ':' + __line + '>\n' + message + '\n';
  fs.appendFile(this.file, message);
  console.log(message);
};
