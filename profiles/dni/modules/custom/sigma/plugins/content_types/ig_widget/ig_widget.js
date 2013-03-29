(function($) {

  function WidgetController() {
    var self = this;
    this.widgets = {};
    $('.sigma-widget').each(function() {
      var id = $(this).attr('sigma-subsid');
      if (!(id in self.widgets)) {
        self.widgets[id] = [];
      }
      var config = {
        target: $(this),
        size: $(this).attr('sigma-size'),
        columns: $(this).attr('sigma-columns'),
        rows: $(this).attr('sigma-rows'),
        animation: $(this).attr('sigma-animation'),
      };
      config.pos = config.columns;
      self.widgets[id].push(config);
      $('.sigma-content', this).css({
        borderColor: $(this).attr('sigma-color'),
        height: config.size * config.rows,
        width: config.size * config.columns
      });
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
        },
        aUpdate: {
          success: function(data) {
            object.update(data);
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
    //console.log(data);
    data.id in this.widgets && this.widgets[data.id].forEach(function(widget) {
      widget.html('Bad Subscription');
    });
    delete this.widgets[data.id];
    //console.log(this.widgets);
  };

  WidgetController.prototype.update = function(data) {
    var widgets = this.widgets[data.id];
    widgets.forEach(function(config) {
      data.data.forEach(function(item) {
        !config.pos-- && (config.pos = config.columns - 1);
        var x = config.pos * config.size;
        var y = -config.size;
        var items = $('.sigma-content a', config.target);
        var count = items.length;
        var newItem = $('<a href="' + item.link + '" class="sigma-image" target="_blank">'
            + '<img width="' + config.size + '" height="' + config.size + '" src="' + item.images.thumbnail + '"/>'
            + '<span class="sigma-user">' + item.user + '</span></a>')
          .css({ left: x, top: y });
        config.target.find('.sigma-content').append(newItem);
        !x && items.add(newItem).stop(true, true).animate({ top: '+=' + config.size }, 'slow');
        (config.rows + 1) * config.columns + 1 === count && items.eq(0).remove();
      });
    });
  };


  $(function() {
    var self = new WidgetController();
    self.init(self);
  });

})(jQuery);
