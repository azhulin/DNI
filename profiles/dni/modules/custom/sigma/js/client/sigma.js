function Sigma() {
  if ('sigma' in Drupal.settings && 'host' in Drupal.settings.sigma) {
    this.host = Drupal.settings.sigma.host;
    this.socket = io.connect(this.host);
  }
}


Sigma.prototype.ping = function(success, error, complete) {
  var $ = jQuery;
  $.ajax({
    url: this.host + 'ping',
    type: 'GET',
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


Sigma.prototype.exit = function(success, error) {
  this.socket.emit('qExit');
  this.socket.on('aExit', function(data) {
    if (data) {
      console.log('EXIT OK');
      success && success();
    }
    else {
      console.log('EXIT ERROR');
      error && error();
    }
  });
};


Sigma.prototype.getSubscription = function(success, error) {
  this.socket.emit('qGetSubscription');
  this.socket.on('aGetSubscription', function(data) {
    if (data) {
      console.log('GET SUBSCRIPTION OK');
      success && success(data);
    }
    else {
      console.log('GET SUBSCRIPTION ERROR');
      error && error();
    }
  });
};


Sigma.prototype.postSubscription = function(object, object_id, success, error) {
  this.socket.emit('qPostSubscription', { object: object, object_id: object_id });
  this.socket.on('aPostSubscription', function(data) {
    if (data) {
      console.log('POST SUBSCRIPTION OK');
      success && success(data);
    }
    else {
      console.log('POST SUBSCRIPTION ERROR');
      error && error();
    }
  });
};


Sigma.prototype.deleteSubscription = function(id, success, error) {
  this.socket.emit('qDeleteSubscription', { type: 'id', param: id });
  this.socket.on('aDeleteSubscription', function(data) {
    if (data) {
      console.log('DELETE SUBSCRIPTION OK');
      success && success(data);
    }
    else {
      console.log('DELETE SUBSCRIPTION ERROR');
      error && error();
    }
  });
};
