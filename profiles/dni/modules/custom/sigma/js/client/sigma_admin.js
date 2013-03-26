(function($) {

  function AdminController() {
    this.el = {
      status: $('#edit-status'),
      start: $('#edit-node-start'),
      stop: $('#edit-node-stop')
    };
  }


  AdminController.prototype.init = function() {
    this.sigma = new Sigma();
    'host' in this.sigma && this.start();
  };


  AdminController.prototype.start = function() {
    if (this.el.status.length) {
      this.el.status.show();
      this.checkStatus();
    }
  };


  AdminController.prototype.checkStatus = function() {
    var self = this;
    this.sigma.ping(
      function() {
        self.isOnline();
      },
      function() {
        self.isOffline();
      }
    );
  };


  AdminController.prototype.isOnline = function() {
    var self = this;
    $('.server-status', this.el.status).hide();
    $('.server-status.server-status-on', this.el.status).show();
    this.el.stop.unbind().click(function() {
       self.sigma.exit(null, null, function() {
         self.checkStatus();
       });
       return false;
    }).show();
  };


  AdminController.prototype.isOffline = function() {
    $('.server-status', this.el.status).hide();
    $('.server-status.server-status-off', this.el.status).show();
    this.el.stop.hide();
    this.el.start.show();
  };


  $(function() {
    new AdminController().init();
  });

})(jQuery);
