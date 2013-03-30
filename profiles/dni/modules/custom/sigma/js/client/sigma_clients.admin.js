(function($) {

  function AdminClientController() {
    this.groups = {
      adminSettings: Drupal.t('Settings Admin'),
      adminClients: Drupal.t('Client Admin'),
      widgetSettings: Drupal.t('Widget Admin'),
      client: Drupal.t('Client')
    };
    this.list = $('#client-list');
    this.row = null;
  }


  AdminClientController.prototype.init = function(self) {
    this.sigma = new Sigma({
      group: 'adminClients',
      callbacks: {
        aOnline: {
          success: function(data) {
            self.isOnline(data);
          }
        },
        aExit: {
          success: function(data) {
            self.isOffline(data);
          }
        },
        aGetClient: {
          success: function(data) {
            self.refreshList(data);
          }
        }
      }
    }).init();
    this.sigma && this.start();
  };


  AdminClientController.prototype.start = function() {
    console.log('START');
    this.sigma.status.show();
    this.row = $('tr:last', this.list).attr('class', '').detach();
  };


  AdminClientController.prototype.isOnline = function() {
    this.sigma.online();
  };


  AdminClientController.prototype.isOffline = function() {
    this.sigma.offline();
    this.list.hide();
  };


  AdminClientController.prototype.refreshList = function(data) {
    this.buildList(data);
    this.list.show();
  };


  AdminClientController.prototype.groupName = function(group) {
    var name = group in this.groups ? this.groups[group] : group;
    return name;
  };


  AdminClientController.prototype.buildList = function(data) {
    console.log(data);
    var self = this;
    $('tr:gt(0)', self.list).remove();

    var i = 0;
    Object.keys(data).forEach(function(group) {
      Object.keys(data[group]).forEach(function(id) {
        var item = data[group][id];
        var row = self.row.clone();
        $('td:eq(0)', row).text(item.ip);
        $('td:eq(1)', row).text(self.groupName(group));
        $('td:eq(2)', row).text(item.path);
        $('td:eq(3)', row).text(item.userAgent);
        $('td:eq(4)', row).text(item.subscriptions.join(', '));
        row.addClass(i++ % 2 ? 'even' : 'odd');
        'client' === group ? row.appendTo(self.list) : row.prependTo(self.list);
      });
    });
  };


  $(function() {
    var self = new AdminClientController();
    self.init(self);
  });

})(jQuery);
