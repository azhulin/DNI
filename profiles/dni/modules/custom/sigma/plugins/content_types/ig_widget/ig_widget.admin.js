(function($) {

  function WidgetAdminController() {
    this.context = $('#modalContent');
    this.el = {
      id: $('#edit-id', this.context),
      type: $('#edit-type', this.context),
      object: $('#edit-object', this.context),
      subsContainer: $('#subscription-list-container', this.context),
      subsList: $('#subscription-list', this.context),
      submit: $('input.form-submit', this.context),
      modal: $('#modal-content', this.context),
      row: null
    };
  }


  WidgetAdminController.prototype.init = function(object) {
    this.sigma = new Sigma({
      group: 'widget_settings',
      callbacks: {
        aOnline: {
          success: function(data) {
            object.isOnline(data);
          }
        },
        aExit: {
          success: function(data) {
            object.isOffline(data);
          }
        },
        aGetSubscription: {
          success: function(data) {
            object.refreshSubsList(data);
          }
        }
      }
    }).init();
    this.sigma && this.start();
  };


  WidgetAdminController.prototype.start = function() {
    var self = this;
    this.el.submit.click(function() {
      var radio = $('input[name=subscription_id]:checked', self.el.subsList);
      var id = radio.val();
      var row = $('tr', self.el.subsList).eq(radio.attr('row'));
      var type = $('td:eq(2)', row).text();
      var object = $('td:eq(3)', row).text();
      self.el.id.val(id);
      self.el.type.val(type);
      self.el.object.val(object);
    });
    this.el.row = $('tr:last', this.subsList).attr('class', '').detach();
  };


  WidgetAdminController.prototype.isOnline = function() {
    this.sigma.online();
    this.sigma.getSubscription();
  };


  WidgetAdminController.prototype.isOffline = function() {
    this.sigma.offline();
    this.el.subsContainer.hide();
  };


  WidgetAdminController.prototype.refreshSubsList = function(data) {
    this.buildSubsList(data);
    this.el.subsContainer.show();
  };


  WidgetAdminController.prototype.buildSubsList = function(data) {
    console.log(data);
    var self = this;
    $('tr:gt(0)', self.el.subsList).remove();
    var id = this.el.id.val();
    var ids = [];
    data.data.forEach(function(item) {
      ids.push(item.id);
    });
    if (0 > ids.indexOf(id)) {
      id && this.setMessage(Drupal.t('Original subscription "@id" wad removed.'
        + ' Please select another one for this widget.', { '@id': id }), 'warning');
      id = ids[0];
    }
    $.each(data.data, function(i, item) {
      var row = self.el.row.clone();
      var col = $('td:eq(0) input', row).val(item.id).attr('row', 1 + i);
      item.id === id && col.attr('checked', 'checked');
      $('td:eq(1)', row).text(item.id);
      $('td:eq(2)', row).text(item.type.charAt(0).toUpperCase() + item.type.slice(1));
      $('td:eq(3)', row).text('#' + item.object);
      row.addClass(i % 2 ? 'even' : 'odd').appendTo(self.el.subsList);
    });
  };


  WidgetAdminController.prototype.setMessage = function(message, type) {
    $('div.messages', this.el.modal).remove();
    type = type || 'status';
    $('<div class="messages ' + type + '">' + message + '</div>')
      .prependTo(this.el.modal);
  };


  $(function() {
    initWidgetAdminController = function() {
      var self = new WidgetAdminController();
      self.init(self);
    };
    setTimeout(initWidgetAdminController, 1000);
  });

})(jQuery);
