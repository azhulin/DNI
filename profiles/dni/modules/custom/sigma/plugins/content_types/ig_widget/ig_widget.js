(function($) {

  function WidgetController() {
    /*this.context = $('#modalContent');
    this.el = {
      id: $('#edit-id', this.context),
      type: $('#edit-type', this.context),
      object: $('#edit-object', this.context),
      subsContainer: $('#subscription-list-container', this.context),
      subsList: $('#subscription-list', this.context),
      submit: $('input.form-submit', this.context),
      modal: $('#modal-content', this.context),
      row: null
    };*/

    var self = this;
    this.widgets = {};
    $('.sigma-widget').each(function() {
      var id = $(this).attr('subscription');
      !(id in self.widgets) && (self.widgets[id] = []);
      self.widgets[id].push($(this));
    });
    console.log(this.widgets);
  }


  WidgetController.prototype.init = function(object) {
    var group = 'client';
    this.sigma = new Sigma({
      group: group,
      subscriptions: Object.keys(this.widgets),
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
        aBadSubscription: {
          success: function(data) {
            object.badSubscription(data);
          }
        }
      }
    }).init();
    this.sigma && this.start();
  };


  WidgetController.prototype.start = function() {
    /*var self = this;
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
    this.el.row = $('tr:last', this.subsList).attr('class', '').detach();*/
  };


  WidgetController.prototype.isOnline = function() {
    console.log('IN ONLINE CALLBACK');
    //this.sigma.online();
    //this.sigma.getSubscription();
  };


  WidgetController.prototype.isOffline = function() {
    console.log('IN OFFLINE CALLBACK');
    //this.sigma.offline();
    //this.el.subsContainer.hide();
  };


  WidgetController.prototype.badSubscription = function(data) {
    console.log(data);
    this.widgets[data.id].forEach(function(widget) {
      widget.html('Bad Subscription');
    });
    delete this.widgets[data.id];
    console.log(this.widgets);
  };


  /*WidgetController.prototype.buildSubsList = function(data) {
    console.log(data);
    var self = this;
    $('tr:gt(0)', self.el.subsList).remove();
    var id = this.el.id.val();
    var ids = [];
    data.data.forEach(function(item) {
      ids.push(item.id);
    });
    0 > ids.indexOf(id) && (id = ids[0]);
    $.each(data.data, function(i, item) {
      var row = self.el.row.clone();
      var col = $('td:eq(0) input', row).val(item.id).attr('row', 1 + i);
      item.id === id && col.attr('checked', 'checked');
      $('td:eq(1)', row).text(item.id);
      $('td:eq(2)', row).text(item.type.charAt(0).toUpperCase() + item.type.slice(1));
      $('td:eq(3)', row).text('#' + item.object);
      row.addClass(i % 2 ? 'even' : 'odd').appendTo(self.el.subsList);
    });
  };*/


  $(function() {
    var self = new WidgetController();
    self.init(self);
  });

})(jQuery);
