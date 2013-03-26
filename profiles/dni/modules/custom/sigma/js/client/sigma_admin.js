(function($) {

  function AdminController() {
    this.el = {
      status: $('#edit-status'),
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
      self.sigma.exit(function() {
        self.checkStatus();
      });
      return false;
    }).show();
    this.initSubsSection();
  };


  AdminController.prototype.isOffline = function() {
    $('.server-status', this.el.status).hide();
    $('.server-status.server-status-off', this.el.status).show();
    this.el.subs.hide();
    this.el.stop.hide();
    this.el.start.show();
  };


  AdminController.prototype.initSubsSection = function() {
    var self = this;
    this.el.row = $('tr:last', this.subsList).attr('class', '').detach();
    this.sigma.getSubscription(function(data) {
      self.buildSubsList(data);
      self.el.subsAdd.click(function() {
        $('#console').remove();
        $(this).hide();
        self.el.subsNew.show();
        return false;
      });
      self.el.subsNewCancel.click(function() {
        $('#console').remove();
        self.el.subsNew.hide();
        self.el.subsAdd.show();
        return false;
      });
      self.el.subsNewCreate.click(function() {
        var type = 'tag';
        var object = self.getSubsObject();
        if (object) {
          self.sigma.postSubscription(type, object, function() {
            self.el.subsNewCancel.click();
            self.el.subsNewObject.val('');
            self.setMessage(Drupal.t('Subscription was successfully created.'));
          });
        }
        return false;
      });
      self.el.subs.show();
    });
  };


  AdminController.prototype.buildSubsList = function(data) {
    console.log(data);
    var self = this;
    $('tr:gt(0)', self.el.subsList).remove();
    $.each(data.data, function(i, item) {
      var row = self.el.row.clone();
      $('td:eq(0)', row).text(item.id);
      $('td:eq(1)', row).text(item.type.charAt(0).toUpperCase() + item.type.slice(1));
      $('td:eq(2)', row).text('#' + item.object);
      $('td:eq(3) a', row).click(function() {
        self.sigma.deleteSubscription(item.id, function() {
          self.setMessage(Drupal.t('Subscription "' + item.id + '" was deleted.'));
        });
        console.log('DELETE');
        return false;
      });
      row.addClass(i % 2 ? 'even' : 'odd').appendTo(self.el.subsList);
    });
  };


  AdminController.prototype.getSubsObject = function() {
    var value = $.trim(this.el.subsNewObject.val());
    if (!value) {
      this.setMessage(Drupal.t('Invalid tag.'), 'error');
      return false;
    }
    return value;
  };


  AdminController.prototype.setMessage = function(message, type) {
    $('#console').remove();
    type = type || 'status';
    $('<div class="clearfix" id="console"><div class="messages ' + type + '">'
      + message + '</div></div>').insertBefore('#content .region.region-content');
  };


  $(function() {
    new AdminController().init();
  });

})(jQuery);
