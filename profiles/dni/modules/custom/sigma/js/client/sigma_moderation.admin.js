(function($) {

  function AdminModerationController() {
    //this.groups = {
    //  adminSettings: Drupal.t('Settings Admin'),
    //  adminClients: Drupal.t('Client Admin'),
    //  widgetSettings: Drupal.t('Widget Admin'),
    //  client: Drupal.t('Client')
    //};
    this.el = {
      subsList: $('#subscription-list'),
      row: null
    };
  }


  AdminModerationController.prototype.init = function(self) {
    this.sigma = new Sigma({
      group: 'moderator',
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
        aGetSubscription: {
          success: function(data) {
            self.refreshList(data);
          }
        },
        aUpdate: {
          success: function(data) {
            self.update(data);
          }
        }
      }
    }).init();
    this.sigma && this.start();
  };


  AdminModerationController.prototype.start = function() {
    this.sigma.status.show();
    this.el.row = $('tr:last', this.el.subsList).attr('class', '').detach();
  };


  AdminModerationController.prototype.isOnline = function() {
    this.sigma.online();
  };


  AdminModerationController.prototype.isOffline = function() {
    this.sigma.offline();
    this.el.subsList.hide();
  };


  AdminModerationController.prototype.refreshList = function(data) {
    this.buildList(data);
    this.el.subsList.show();
  };


  AdminModerationController.prototype.update = function(data) {
    console.log(data);
  };


  AdminModerationController.prototype.buildList = function(data) {
    var self = this;
    $('tr:gt(0)', self.el.subsList).remove();
    var i = 0;
    Object.keys(data).forEach(function(id) {
      var item = data[id];
      var row = self.el.row.clone();
      $('td:eq(0)', row).text(id);
      $('td:eq(1)', row).text(item.object.charAt(0).toUpperCase() + item.object.slice(1));
      $('td:eq(2)', row).text('#' + item.object_id);
      $('td:eq(3)', row).text(item.moderated ? Drupal.t('Yes') : Drupal.t('No'));
      $('td:eq(4) a', row).click(function() {
        self.sigma.moderateSubscription(id);
        return false;
      });
      row.addClass(i++ % 2 ? 'even' : 'odd').appendTo(self.el.subsList);
    });
  };


  $(function() {
    var self = new AdminModerationController();
    self.init(self);
  });

})(jQuery);
