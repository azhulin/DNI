function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

var allowed = [
  'drupal_url', 'port', 'client_id', 'client_secret', 'access_key', 'debug', 'log_file'
];

process.argv.forEach(function(value, index, array) {
  if (index < 2) {
    return;
  }
  value = value.split('=');
  if (2 === value.length && 0 <= allowed.indexOf(value[0]) && value[1]) {
    define(value[0], value[1]);
  }
});
