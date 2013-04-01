(function($) {

  function AdminSettingsController() {
    this.el = {
      start: $('#edit-server-start'),
      stop: $('#edit-server-stop'),
      subs: $('#edit-subs'),
      subsList: $('#subscription-list'),
      subsAdd: $('#edit-subs-add'),
      subsNew: $('#edit-subs-new'),
      subsNewCancel: $('#edit-subs-new-cancel'),
      subsNewCreate: $('#edit-subs-new-create'),
      subsNewObject: $('#edit-subs-new-object'),
      row: null
    };
  }


  AdminSettingsController.prototype.init = function(self) {
    this.sigma = new Sigma({
      group: 'adminSettings',
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
            self.refreshSubsList(data);
          }
        },
        aPostSubscription: {
          success: function(data) {
            self.subsWasAdded(data);
          }
        },
        aDeleteSubscription: {
          success: function(data) {
            self.informDeletion(data);
          }
        }
      }
    }).init();
    this.sigma && this.start();
  };


  AdminSettingsController.prototype.start = function() {
    var self = this;
    this.sigma.status.show();
    this.el.row = $('tr:last', this.subsList).attr('class', '').detach();
    this.el.stop.click(function() {
      self.sigma.exit();
      return false;
    });
    this.el.subsAdd.click(function() {
      $('#console').remove();
      $(this).hide();
      self.el.subsNew.show();
      return false;
    });
    this.el.subsNewCancel.click(function() {
      $('#console').remove();
      self.el.subsNew.hide();
      self.el.subsAdd.show();
      return false;
    });
    this.el.subsNewCreate.click(function() {
      var type = 'tag';
      var object = self.getSubsObject();
      if (object) {
        self.sigma.postSubscription(type, object);
      }
      return false;
    });
  };


  AdminSettingsController.prototype.subsWasAdded = function() {
    this.el.subsNewCancel.click();
    this.el.subsNewObject.val('');
    this.setMessage(Drupal.t('Subscription was successfully created.'));
  };


  AdminSettingsController.prototype.isOnline = function() {
    this.sigma.online();
    this.el.start.hide();
    this.el.stop.show();
  };


  AdminSettingsController.prototype.isOffline = function() {
    this.sigma.offline();
    this.el.subs.add(this.el.stop).hide();
    this.el.start.show();
  };


  AdminSettingsController.prototype.refreshSubsList = function(data) {
    this.buildSubsList(data);
    this.el.subs.show();
  };


  AdminSettingsController.prototype.buildSubsList = function(data) {
    var self = this;
    $('tr:gt(0)', self.el.subsList).remove();
    var i = 0;
    Object.keys(data).forEach(function(id) {
      var item = data[id];
      var row = self.el.row.clone();
      $('td:eq(0)', row).text(id);
      $('td:eq(1)', row).text(item.object.charAt(0).toUpperCase() + item.object.slice(1));
      $('td:eq(2)', row).text('#' + item.object_id);
      $('td:eq(3)', row).text(Drupal.t(item.moderated ? 'Yes' : 'No'));
      $('td:eq(4) a', row).click(function() {
        self.sigma.deleteSubscription(item.id);
        return false;
      });
      row.addClass(i++ % 2 ? 'even' : 'odd').appendTo(self.el.subsList);
    });
  };


  AdminSettingsController.prototype.informDeletion = function(data) {
    this.setMessage(Drupal.t('Subscription "@id" was deleted.', { '@id': data.id }));
  };


  AdminSettingsController.prototype.getSubsObject = function() {
    var value = $.trim(this.el.subsNewObject.val());
    if (!value) {
      this.setMessage(Drupal.t('Invalid tag.'), 'error');
      return false;
    }
    return value;
  };


  AdminSettingsController.prototype.setMessage = function(message, type) {
    $('#console').remove();
    type = type || 'status';
    $('<div class="clearfix" id="console"><div class="messages ' + type + '">'
        + message + '</div></div>')
      .insertBefore('#content .region.region-content');
  };


  $(function() {
    var self = new AdminSettingsController();
    self.init(self);
  });

})(jQuery);
