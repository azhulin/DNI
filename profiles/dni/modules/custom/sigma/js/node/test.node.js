var path = require('path')
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
  //var logFile = 'D:/node.log';
  var date = new Date().toISOString();
  var file = path.basename(__file);
  if (0 <= ['Array', 'Object'].indexOf(typeOf(message))) {
    message = util.inspect(message);
  }
  message = '>>>> ' + date + ' ' + file + ':' + __line + '>\n' + message + '\n';
  //fs.appendFile(logFile, message);
  console.log(message);
}


log('asd');