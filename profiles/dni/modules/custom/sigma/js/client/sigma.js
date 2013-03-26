function Sigma() {
  if ('sigma' in Drupal.settings && 'host' in Drupal.settings.sigma) {
    this.host = Drupal.settings.sigma.host;
  }
}


Sigma.prototype.ping = function(success, error, complete) {
  var $ = jQuery;

  $.ajax({
    url: this.host + 'ping',
    method: 'GET',
    timeout: 2000,
    success: function(data) {
      success && success(data);
    },
    error: function(xhr) {
      error && error(xhr.status);
    },
    complete: function() {
      complete && complete();
    }
  });
};


Sigma.prototype.exit = function(success, error, complete) {
  var $ = jQuery;

  $.ajax({
    url: this.host + 'exit',
    method: 'GET',
    timeout: 2000,
    success: function(data) {
      success && success(data);
    },
    error: function(xhr) {
      error && error(xhr.status);
    },
    complete: function() {
      complete && complete();
    }
  });
};
