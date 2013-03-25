function Sigma() {
  if ('sigma' in Drupal.settings && 'host' in Drupal.settings.sigma) {
    this.host = Drupal.settings.sigma.host;
  }
}


Sigma.prototype.ping = function(success, error) {
  var $ = jQuery;

  $.ajax({
    url: this.host + 'ping',
    method: 'GET',
    timeout: 4000,
    success: function(data) {
      success && success(data);
    },
    error: function(xhr) {
      error && error(xhr.status);
    }
  });
};
