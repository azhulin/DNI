function Sigma(params) {
  var callbacks = params.callbacks;
  var group = params.group;
  var subscriptions = 'subscriptions' in params ? params.subscriptions : [];

  if (!('sigma' in Drupal.settings) || !('host' in Drupal.settings.sigma)) {
    return;
  }
  this.socket = io.connect(Drupal.settings.sigma.host);

  var self = this;

  this.socket.on('aOnline', function() {
    self.socket.emit('qOnline', group, subscriptions);
  });

  var events = {
    adminSettings: [
      'aOnline', 'aExit', 'aGetSubscription', 'aPostSubscription', 'aDeleteSubscription'
    ],
    widgetSettings: [
      'aOnline', 'aExit', 'aGetSubscription'
    ],
    client: [
      'aOnline', 'aExit', 'aBadSubscription', 'aUpdate'
    ]
  };

  events[group].forEach(function(event) {
    self.socket.on(event, function(data) {
      if (data) {
        console.log(event + ' OK');
        event in callbacks && 'success' in callbacks[event] && callbacks[event].success(data);
      }
      else {
        console.log(event + ' ERROR');
        event in callbacks && 'error' in callbacks[event] && callbacks[event].error();
      }
    });
  });
}


Sigma.prototype.init = function() {
  if ('socket' in this) {
    this.status = jQuery('#edit-status');
    return this;
   }
   else {
     return false;
   }
};


Sigma.prototype.exit = function() {
  this.socket.emit('qExit');
};


Sigma.prototype.getSubscription = function() {
  this.socket.emit('qGetSubscription');
};


Sigma.prototype.postSubscription = function(object, object_id) {
  this.socket.emit('qPostSubscription', { object: object, object_id: object_id });
};


Sigma.prototype.deleteSubscription = function(id) {
  this.socket.emit('qDeleteSubscription', { type: 'id', param: id });
};


Sigma.prototype.online = function() {
  jQuery('.server-status', this.status).hide();
  jQuery('.server-status.server-status-on', this.status).show();
};


Sigma.prototype.offline = function() {
  jQuery('.server-status', this.status).hide();
  jQuery('.server-status.server-status-off', this.status).show();
};
